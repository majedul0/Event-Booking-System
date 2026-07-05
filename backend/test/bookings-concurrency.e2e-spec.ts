import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

describe('Bookings Concurrency (e2e)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany();
    await prisma.event.deleteMany();
  });

  it('should prevent overbooking under concurrent seat deduction', async () => {
    // Create an event with 5 seats
    const event = await prisma.event.create({
      data: {
        name: 'Test Event',
        date: new Date(),
        totalSeats: 5,
        availableSeats: 5,
        pricePerSeat: '10.00',
      },
    });

    // Create 10 bookings, each requesting 1 seat
    const bookingPromises = Array.from({ length: 10 }, (_, i) =>
      prisma.booking.create({
        data: {
          requestId: uuidv4(),
          eventId: event.id,
          customerName: `Customer ${i}`,
          customerEmail: `customer${i}@example.com`,
          seats: 1,
          status: 'PENDING',
        },
      }),
    );

    const bookings = await Promise.all(bookingPromises);

    // Process all bookings concurrently
    const processPromises = bookings.map((booking) =>
      processBookingAtomic(prisma, booking.id),
    );

    await Promise.all(processPromises);

    // Verify results
    const updatedEvent = await prisma.event.findUnique({
      where: { id: event.id },
    });

    const confirmedBookings = await prisma.booking.count({
      where: { status: 'CONFIRMED', eventId: event.id },
    });

    const failedBookings = await prisma.booking.count({
      where: { status: 'FAILED', eventId: event.id },
    });

    // Exactly 5 should be confirmed, 5 should be failed
    expect(confirmedBookings).toBe(5);
    expect(failedBookings).toBe(5);
    // Available seats should be exactly 0
    expect(updatedEvent.availableSeats).toBe(0);
  });

  it('should handle idempotent duplicate requestId correctly', async () => {
    const event = await prisma.event.create({
      data: {
        name: 'Test Event',
        date: new Date(),
        totalSeats: 10,
        availableSeats: 10,
        pricePerSeat: '10.00',
      },
    });

    const requestId = uuidv4();

    // Create first booking
    const booking1 = await prisma.booking.create({
      data: {
        requestId,
        eventId: event.id,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        seats: 2,
        status: 'PENDING',
      },
    });

    // Try to create a duplicate booking with the same requestId
    let errorThrown = false;
    try {
      await prisma.booking.create({
        data: {
          requestId,
          eventId: event.id,
          customerName: 'Jane Doe',
          customerEmail: 'jane@example.com',
          seats: 3,
          status: 'PENDING',
        },
      });
    } catch (error) {
      errorThrown = true;
      // Should be a unique constraint error
      expect(error.code).toBe('P2002');
    }

    expect(errorThrown).toBe(true);

    // Verify only one booking exists
    const allBookings = await prisma.booking.findMany({
      where: { requestId },
    });
    expect(allBookings.length).toBe(1);
    expect(allBookings[0].id).toBe(booking1.id);
  });

  it('should mark bookings as FAILED when event does not exist', async () => {
    const booking = await prisma.booking.create({
      data: {
        requestId: uuidv4(),
        eventId: 99999, // Non-existent event
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        seats: 2,
        status: 'PENDING',
      },
    });

    await processBookingAtomic(prisma, booking.id);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(updatedBooking.status).toBe('FAILED');
    expect(updatedBooking.failureReason).toBe('Event not found');
  });

  it('should mark bookings as FAILED when insufficient seats', async () => {
    const event = await prisma.event.create({
      data: {
        name: 'Test Event',
        date: new Date(),
        totalSeats: 5,
        availableSeats: 2, // Only 2 seats available
        pricePerSeat: '10.00',
      },
    });

    const booking = await prisma.booking.create({
      data: {
        requestId: uuidv4(),
        eventId: event.id,
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        seats: 5, // Request more seats than available
        status: 'PENDING',
      },
    });

    await processBookingAtomic(prisma, booking.id);

    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    expect(updatedBooking.status).toBe('FAILED');
    expect(updatedBooking.failureReason).toBe('Not enough seats available');
  });
});

// Helper function that replicates the atomic booking processing logic
async function processBookingAtomic(
  prisma: PrismaClient,
  bookingId: string,
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking || booking.status !== 'PENDING') return;

  await prisma.$transaction(async (tx: any) => {
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
