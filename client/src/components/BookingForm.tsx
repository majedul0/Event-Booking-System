import { useState, useEffect } from 'react';
import type { Event } from '../api/types';
import { CustomSelect } from './CustomSelect';
import { getBookings } from '../api/bookings';

interface BookingFormProps {
  events: Event[];
  onSubmit: (formData: {
    requestId: string;
    eventId: number;
    customerName: string;
    customerEmail: string;
    seats: number;
  }) => Promise<{ reference: string; status: string }>;
  onBookingCreated: (reference: string) => Promise<void>;
}

export function BookingForm({ events, onSubmit, onBookingCreated }: BookingFormProps) {
  const [eventId, setEventId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pollingReference, setPollingReference] = useState<string | null>(null);

  // Poll for booking status to change from PENDING
  useEffect(() => {
    if (!polling || !pollingReference) return;

    const pollInterval = setInterval(async () => {
      try {
        await onBookingCreated(pollingReference);
        setPolling(false);
        setPollingReference(null);
      } catch (err) {
        // Continue polling or stop after max attempts
        console.debug('Still waiting for booking confirmation...');
      }
    }, 1500);

    // Stop polling after 10 attempts (15 seconds)
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
      setPollingReference(null);
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [polling, pollingReference, onBookingCreated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!eventId || !customerName || !customerEmail || seats < 1) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      // Check for existing confirmed bookings with this email
      const existingBookings = await getBookings({ limit: 1000 });
      const hasConfirmedBooking = existingBookings.data.some(
        (booking) =>
          booking.customerEmail === customerEmail &&
          booking.status === 'CONFIRMED',
      );

      if (hasConfirmedBooking) {
        setError('A booking is already made with this email address');
        setLoading(false);
        return;
      }

      const requestId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      const response = await onSubmit({
        requestId,
        eventId: eventId as number,
        customerName,
        customerEmail,
        seats,
      });

      setSuccess(true);
      setPollingReference(response.reference);
      setPolling(true);

      // Reset form
      setEventId('');
      setCustomerName('');
      setCustomerEmail('');
      setSeats(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #cccccc',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .booking-form {
            padding: 16px !important;
            margin-bottom: 20px !important;
          }
          .form-group {
            margin-bottom: 12px !important;
          }
          .form-group select,
          .form-group input {
            width: 100% !important;
            box-sizing: border-box !important;
            min-height: 36px !important;
            padding: 6px 8px !important;
            font-size: 14px !important;
          }
          .form-button {
            padding: 12px !important;
            font-size: 16px !important;
            min-height: 44px !important;
          }
        }
      `}</style>
      <h2 style={{ marginTop: 0 }}>Create New Booking</h2>

      {error && (
        <div
          style={{
            backgroundColor: '#e8e8e8',
            color: '#000000',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
            border: '1px solid #999999',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: '#e8e8e8',
            color: '#000000',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
            border: '1px solid #999999',
          }}
        >
          Booking created! {polling && 'Waiting for confirmation...'}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }} className="form-group">
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Event:
          </label>
          <CustomSelect
            value={eventId.toString()}
            onChange={(value) => setEventId(value ? parseInt(value) : '')}
            options={events.map((event) => ({
              value: event.id.toString(),
              label: `${event.name} (${event.availableSeats} seats available)`,
            }))}
            placeholder="Select an event"
          />
        </div>

        <div style={{ marginBottom: '12px' }} className="form-group">
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Customer Name:
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={loading}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #999999',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#000000',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }} className="form-group">
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Email:
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            disabled={loading}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #999999',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#000000',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }} className="form-group">
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Number of Seats:
          </label>
          <input
            type="number"
            value={seats}
            onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={loading}
            min="1"
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #999999',
              boxSizing: 'border-box',
              backgroundColor: '#ffffff',
              color: '#000000',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="form-button"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#cccccc' : '#333333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
}
