import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsProcessor } from './bookings.processor';
import { BOOKINGS_QUEUE } from './bookings.constants';

@Module({
  imports: [BullModule.registerQueue({ name: BOOKINGS_QUEUE })],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsProcessor],
})
export class BookingsModule {}
