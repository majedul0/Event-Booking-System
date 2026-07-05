import type { Booking } from '../api/types';

interface BookingsTableProps {
  bookings: Booking[];
  loading: boolean;
}

export function BookingsTable({ bookings, loading }: BookingsTableProps) {
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No bookings found
      </div>
    );
  }

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
      }}
    >
      <thead>
        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
          <th style={{ padding: '12px', textAlign: 'left' }}>Reference</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Event</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Seats</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
          <th style={{ padding: '12px', textAlign: 'left' }}>Failure Reason</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id} style={{ borderBottom: '1px solid #eee' }}>
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
                  backgroundColor:
                    booking.status === 'CONFIRMED'
                      ? '#d4edda'
                      : booking.status === 'FAILED'
                        ? '#f8d7da'
                        : '#d1ecf1',
                  color:
                    booking.status === 'CONFIRMED'
                      ? '#155724'
                      : booking.status === 'FAILED'
                        ? '#721c24'
                        : '#0c5460',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {booking.status}
              </span>
            </td>
            <td style={{ padding: '12px', color: '#d32f2f' }}>
              {booking.failureReason || '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
