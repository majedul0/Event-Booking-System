import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BookingsService } from './bookings.service';
import { BOOKINGS_QUEUE } from './bookings.constants';

@Processor(BOOKINGS_QUEUE, { concurrency: 5 })
export class BookingsProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingsProcessor.name);

  constructor(private bookingsService: BookingsService) {
    super();
  }

  async process(job: Job<{ bookingId: string }>) {
    try {
      await this.bookingsService.processBooking(job.data.bookingId);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to process booking ${job.data.bookingId}:`,
        error,
      );
      throw error;
    }
  }
}
