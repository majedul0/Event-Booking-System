import { useEvents } from './hooks/useEvents';
import { useBookings } from './hooks/useBookings';
import { BookingForm } from './components/BookingForm';
import { BookingFilters } from './components/BookingFilters';
import { BookingsTable } from './components/BookingsTable';
import { Pagination } from './components/Pagination';
import { getBookings } from './api/bookings';

function App() {
  const { events } = useEvents();
  const {
    bookings,
    loading: bookingsLoading,
    error,
    page,
    setPage,
    eventFilter,
    setEventFilter,
    statusFilter,
    setStatusFilter,
    refetch,
    createBooking,
  } = useBookings();

  const handleBookingCreated = async (reference: string) => {
    const response = await getBookings({
      page,
      limit: 10,
      eventId: eventFilter,
      status: statusFilter,
    });

    const booking = response.data.find((b) => b.id === reference);
    if (booking && booking.status !== 'PENDING') {
      refetch();
    } else {
      throw new Error('Still pending...');
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', backgroundColor: '#ffffff', color: '#000000', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          body {
            margin: 0;
            padding: 0;
          }
          #root {
            padding: 0;
          }
          .app-container {
            padding: 12px !important;
            margin: 0 !important;
          }
        }
      `}</style>
      <h1>Event Booking System</h1>

      {error && (
        <div
          style={{
            backgroundColor: '#e8e8e8',
            color: '#000000',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #999999',
          }}
        >
          {error}
        </div>
      )}

      <BookingForm
        events={events}
        onSubmit={createBooking}
        onBookingCreated={handleBookingCreated}
      />

      <h2>Bookings</h2>

      <BookingFilters
        events={events}
        eventFilter={eventFilter}
        setEventFilter={setEventFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onRefresh={refetch}
      />

      <BookingsTable bookings={bookings.data} loading={bookingsLoading} onBookingDeleted={refetch} />

      <Pagination
        page={page}
        limit={bookings.limit}
        total={bookings.total}
        onPageChange={setPage}
      />
    </div>
  );
}

export default App;
