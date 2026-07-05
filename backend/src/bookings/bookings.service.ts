import { Injectable, BadRequestException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { BOOKINGS_QUEUE } from './bookings.constants';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(BOOKINGS_QUEUE) private bookingsQueue: Queue,
  ) {}

  async create(createBookingDto: CreateBookingDto) {
    try {
      const booking = await this.prisma.booking.create({
        data: {
          requestId: createBookingDto.requestId,
          eventId: createBookingDto.eventId,
          customerName: createBookingDto.customerName,
          customerEmail: createBookingDto.customerEmail,
          seats: createBookingDto.seats,
          status: 'PENDING',
        },
      });

      // Enqueue the booking for processing
      await this.bookingsQueue.add(
        'process',
        { bookingId: booking.id },
        { jobId: booking.id },
      );

      return {
        reference: booking.id,
        status: booking.status,
      };
    } catch (error) {
      // Handle duplicate requestId
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingBooking = await this.prisma.booking.findUnique({
          where: { requestId: createBookingDto.requestId },
        });

        if (existingBooking) {
          return {
            reference: existingBooking.id,
            status: existingBooking.status,
          };
        }
      }

      throw error;
    }
  }

  async findAll(query: QueryBookingsDto) {
    const { page, limit, eventId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { event: { select: { name: true } } },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async processBooking(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.status !== 'PENDING') return;

    await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: booking.eventId },
      });

      if (!event) {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'FAILED',
            failureReason: 'Event not found',
          },
        });
        return;
      }

      const affected: number = await tx.$executeRaw`
        UPDATE "Event" SET "availableSeats" = "availableSeats" - ${booking.seats}
        WHERE id = ${booking.eventId} AND "availableSeats" >= ${booking.seats}
      `;

      if (affected === 0) {
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: 'FAILED',
            failureReason: 'Not enough seats available',
          },
        });
        return;
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
        },
      });
    });
  }
}
