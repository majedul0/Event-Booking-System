import type { Event } from '../api/types';

interface BookingFiltersProps {
  events: Event[];
  eventFilter: number | undefined;
  setEventFilter: (eventId: number | undefined) => void;
  statusFilter: string | undefined;
  setStatusFilter: (status: string | undefined) => void;
  onRefresh: () => void;
}

export function BookingFilters({
  events,
  eventFilter,
  setEventFilter,
  statusFilter,
  setStatusFilter,
  onRefresh,
}: BookingFiltersProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '20px',
      }}
    >
      <label>
        Event:
        <select
          value={eventFilter || ''}
          onChange={(e) =>
            setEventFilter(e.target.value ? parseInt(e.target.value) : undefined)
          }
          style={{
            marginLeft: '8px',
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <option value="">All Events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Status:
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value || undefined)}
          style={{
            marginLeft: '8px',
            padding: '6px',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="FAILED">Failed</option>
        </select>
      </label>

      <button
        onClick={onRefresh}
        style={{
          padding: '6px 12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Refresh
      </button>
    </div>
  );
}
