export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Event {
  id: number;
  name: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  requestId: string;
  eventId: number;
  event: {
    name: string;
  };
  customerName: string;
  customerEmail: string;
  seats: number;
  status: BookingStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  requestId: string;
  eventId: number;
  customerName: string;
  customerEmail: string;
  seats: number;
}

export interface CreateBookingResponse {
  reference: string;
  status: BookingStatus;
}

export interface GetBookingsResponse {
  data: Booking[];
  total: number;
  page: number;
  limit: number;
}
