import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  welcome() {
    return {
      message: 'Event Booking System API',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: {
          method: 'GET',
          path: '/health',
          description: 'Health check endpoint',
        },
        events: {
          method: 'GET',
          path: '/events',
          description: 'List all events with seat availability',
        },
        createBooking: {
          method: 'POST',
          path: '/bookings',
          description: 'Create a new booking (returns 202 Accepted)',
          body: {
            requestId: 'UUID (client-generated)',
            eventId: 'number',
            customerName: 'string',
            customerEmail: 'string',
            seats: 'number',
          },
        },
        listBookings: {
          method: 'GET',
          path: '/bookings?page=1&limit=10&eventId=1&status=CONFIRMED',
          description: 'List bookings with pagination and filtering',
          queryParams: {
            page: 'number (default 1)',
            limit: 'number (default 10)',
            eventId: 'number (optional)',
            status: 'PENDING | CONFIRMED | FAILED (optional)',
          },
        },
      },
    };
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
