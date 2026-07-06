import type { Booking } from '../api/types';
import { deleteBooking } from '../api/bookings';

interface BookingsTableProps {
  bookings: Booking[];
  loading: boolean;
  onBookingDeleted?: () => void;
}

export function BookingsTable({ bookings, loading, onBookingDeleted }: BookingsTableProps) {
  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      await deleteBooking(bookingId);
      onBookingDeleted?.();
    } catch (error) {
      alert('Failed to delete booking: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#333333' }}>
        No bookings found
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .bookings-table {
            display: none;
          }
          .bookings-cards {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
          }
          .booking-card {
            border: 1px solid #cccccc;
            border-radius: 4px;
            padding: 12px;
            background-color: #ffffff;
          }
          .booking-card-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .booking-card-label {
            font-weight: bold;
            min-width: 100px;
          }
          .booking-card-value {
            text-align: right;
            flex: 1;
            word-break: break-word;
          }
        }
        @media (min-width: 769px) {
          .bookings-cards {
            display: none;
          }
        }
      `}</style>
      <table
        className="bookings-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '20px',
          backgroundColor: '#ffffff',
        }}
      >
      <thead>
        <tr style={{ backgroundColor: '#e8e8e8', borderBottom: '2px solid #cccccc', color: '#000000' }}>
          <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Event</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Seats</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Failure Reason</th>
          <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id} style={{ borderBottom: '1px solid #e0e0e0', backgroundColor: '#ffffff', color: '#000000' }}>
            <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>
              {booking.id.slice(0, 8)}...
            </td>
            <td style={{ padding: '12px' }}>{booking.event.name}</td>
            <td style={{ padding: '12px' }}>{booking.customerName}</td>
            <td style={{ padding: '12px' }}>{booking.customerEmail}</td>
            <td style={{ padding: '12px', textAlign: 'center' }}>{booking.seats}</td>
            <td style={{ padding: '12px' }}>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#d9d9d9',
                  color: '#000000',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: '1px solid #999999',
                }}
              >
                {booking.status}
              </span>
            </td>
            <td style={{ padding: '12px', color: '#333333' }}>
              {booking.failureReason || '-'}
            </td>
            <td style={{ padding: '12px', textAlign: 'center' }}>
              <button
                onClick={() => handleDelete(booking.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#333333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
      </table>

      <div className="bookings-cards">
        {bookings.map((booking) => (
          <div key={booking.id} className="booking-card">
            <div className="booking-card-row">
              <span className="booking-card-label">Reference:</span>
              <span className="booking-card-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {booking.id.slice(0, 8)}...
              </span>
            </div>
            <div className="booking-card-row">
              <span className="booking-card-label">Event:</span>
              <span className="booking-card-value">{booking.event.name}</span>
            </div>
            <div className="booking-card-row">
              <span className="booking-card-label">Customer:</span>
              <span className="booking-card-value">{booking.customerName}</span>
            </div>
            <div className="booking-card-row">
              <span className="booking-card-label">Email:</span>
              <span className="booking-card-value" style={{ fontSize: '12px', wordBreak: 'break-word' }}>{booking.customerEmail}</span>
            </div>
            <div className="booking-card-row">
              <span className="booking-card-label">Seats:</span>
              <span className="booking-card-value" style={{ textAlign: 'right' }}>{booking.seats}</span>
            </div>
            <div className="booking-card-row">
              <span className="booking-card-label">Status:</span>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#d9d9d9',
                  color: '#000000',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: '1px solid #999999',
                }}
              >
                {booking.status}
              </span>
            </div>
            <div className="booking-card-row">
              <span className="booking-card-label">Failure:</span>
              <span className="booking-card-value" style={{ color: '#333333' }}>
                {booking.failureReason || '-'}
              </span>
            </div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => handleDelete(booking.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#333333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
