import { useState, useEffect } from 'react';
import type { Event } from '../api/types';

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
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
        border: '1px solid #e0e0e0',
      }}
    >
      <h2>Create New Booking</h2>

      {error && (
        <div
          style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        >
          Booking created! {polling && 'Waiting for confirmation...'}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Event:
          </label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value ? parseInt(e.target.value) : '')}
            disabled={loading}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              boxSizing: 'border-box',
            }}
          >
            <option value="">Select an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.availableSeats} seats available)
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '12px' }}>
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
              border: '1px solid #ddd',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
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
              border: '1px solid #ddd',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
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
              border: '1px solid #ddd',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#28a745',
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
