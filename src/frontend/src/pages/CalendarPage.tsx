import React, { useMemo, useState, useCallback } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – we provide ambient module declarations for the library
import FullCalendar from '@fullcalendar/react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import interactionPlugin from '@fullcalendar/interaction';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import dayGridPlugin from '@fullcalendar/daygrid';
import { calendarApi, useCalendarEvents, API_BASE_URL } from '../services/api';
import { format } from 'date-fns';

const statusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return '#22c55e'; // green-500
    case 'pending':
    case 'unpaid':
      return '#eab308'; // yellow-500
    case 'scheduled':
      return '#3b82f6'; // blue-500
    case 'overdue':
    case 'delayed':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
};

const CalendarPage: React.FC = () => {
  // Track the calendar's visible range so we can load events for that month
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());

  const { events } = useCalendarEvents(currentMonth, currentYear);

  // Map backend events to FullCalendar format
  const fcEvents = useMemo(() => {
    return events.map((evt) => ({
      id: evt.id.toString(),
      title: evt.title,
      start: evt.due_date ?? undefined,
      allDay: true,
      backgroundColor: statusColor(evt.status),
      borderColor: statusColor(evt.status),
      extendedProps: { status: evt.status },
    }));
  }, [events]);

  const handleDatesSet = useCallback((arg: any) => {
    const start = arg.start;
    setCurrentMonth(start.getMonth() + 1);
    setCurrentYear(start.getFullYear());
  }, []);

  const handleEventClick = (clickInfo: any) => {
    const { title, start, extendedProps } = clickInfo.event;
    alert(
      `${title}\nDue: ${start ? format(start, 'yyyy-MM-dd') : '—'}\nStatus: ${extendedProps.status}`,
    );
  };

  const [apiKey, setApiKey] = useState<string | null>(null);

  const ensureApiKey = async () => {
    if (apiKey) return apiKey;
    const key = await calendarApi.createOrGetApiKey();
    setApiKey(key);
    return key;
  };

  const handleSyncClick = async () => {
    const key = await ensureApiKey();
    if (!key) return;
    const url = `${API_BASE_URL}/calendar/export/ics?api_key=${key}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <button
          className="btn btn-primary px-4 py-2 text-sm"
          onClick={handleSyncClick}
        >
          Sync / Export ICS
        </button>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={fcEvents}
        height="auto"
        datesSet={handleDatesSet}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: ''
        }}
      />

      {/* Legend */}
      <div className="flex space-x-4 mt-4 text-sm">
        {['paid', 'unpaid', 'scheduled', 'overdue'].map((status) => (
          <div key={status} className="flex items-center space-x-1">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: statusColor(status) }}
            />
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage; 