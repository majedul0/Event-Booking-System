import type { Event } from '../api/types';
import { CustomSelect } from './CustomSelect';

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
    <>
      <style>{`
        .booking-filters {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .booking-filters label {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
        }
        .booking-filters button {
          min-height: 36px;
          padding: 8px 10px;
          font-size: 14px;
        }
        @media (max-width: 768px) {
          .booking-filters {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
            margin-bottom: 16px;
          }
          .booking-filters label {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            white-space: normal;
          }
          .booking-filters button:not(.custom-select-button) {
            width: 100%;
            min-height: 36px;
            padding: 8px;
            font-size: 14px;
          }
        }
      `}</style>
      <div className="booking-filters">
        <label style={{ width: 'auto' }}>
          Event:
        </label>
        <CustomSelect
          value={eventFilter?.toString() || ''}
          onChange={(value) =>
            setEventFilter(value ? parseInt(value) : undefined)
          }
          options={[
            { value: '', label: 'All Events' },
            ...events.map((event) => ({
              value: event.id.toString(),
              label: event.name,
            })),
          ]}
        />

        <label style={{ width: 'auto', marginTop: '8px' }}>
          Status:
        </label>
        <CustomSelect
          value={statusFilter || ''}
          onChange={(value) => setStatusFilter(value || undefined)}
          options={[
            { value: '', label: 'All Status' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'CONFIRMED', label: 'Confirmed' },
            { value: 'FAILED', label: 'Failed' },
          ]}
        />

        <button
          onClick={onRefresh}
          style={{
            padding: '6px 12px',
            backgroundColor: '#333333',
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
    </>
  );
}
