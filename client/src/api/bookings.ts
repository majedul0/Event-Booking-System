import { apiClient } from './client';
import type {
  CreateBookingRequest,
  CreateBookingResponse,
  GetBookingsResponse,
} from './types';

interface GetBookingsParams {
  page?: number;
  limit?: number;
  eventId?: number;
  status?: string;
}

export async function getBookings(
  params: GetBookingsParams = {},
): Promise<GetBookingsResponse> {
  const queryParams = new URLSearchParams();
  if (params.page !== undefined) queryParams.append('page', String(params.page));
  if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
  if (params.eventId !== undefined)
    queryParams.append('eventId', String(params.eventId));
  if (params.status) queryParams.append('status', params.status);

  const queryString = queryParams.toString();
  const path = `/bookings${queryString ? `?${queryString}` : ''}`;
  return apiClient.get(path);
}

export async function createBooking(
  request: CreateBookingRequest,
): Promise<CreateBookingResponse> {
  return apiClient.post('/bookings', request);
}

export async function deleteBooking(bookingId: string): Promise<{ message: string }> {
  return apiClient.delete(`/bookings/${bookingId}`);
}
