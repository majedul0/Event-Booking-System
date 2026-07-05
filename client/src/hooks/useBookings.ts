import { useState, useEffect } from 'react';
import { getBookings, createBooking } from '../api/bookings';
import type {
  CreateBookingRequest,
  CreateBookingResponse,
  GetBookingsResponse,
} from '../api/types';

export function useBookings() {
  const [bookings, setBookings] = useState<GetBookingsResponse>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookings({
        page,
        limit: 10,
        eventId: eventFilter,
        status: statusFilter,
      });
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [page, eventFilter, statusFilter]);

  const handleCreateBooking = async (
    request: CreateBookingRequest,
  ): Promise<CreateBookingResponse> => {
    try {
      setError(null);
      const response = await createBooking(request);
      // Refetch to show the new booking
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay
      refetch();
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMsg);
      throw err;
    }
  };

  return {
    bookings,
    loading,
    error,
    page,
    setPage,
    eventFilter,
    setEventFilter,
    statusFilter,
    setStatusFilter,
    refetch,
    createBooking: handleCreateBooking,
  };
}
