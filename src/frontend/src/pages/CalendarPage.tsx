import React, { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isBefore,
  differenceInCalendarDays,
} from 'date-fns';
import { calendarApi, API_BASE_URL } from '../services/api';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Placeholder events – replace with real API later
// ---------------------------------------------------------------------------
const sampleEvents = [
  {
    id: 1,
    invoiceId: 'INV-2025-0520',
    dueDate: '2025-05-20',
    sender: 'AWS',
    amount: 450.25,
    currency: 'USD',
    status: 'Pending',
  },
  {
    id: 2,
    invoiceId: 'INV-2025-0524',
    dueDate: '2025-05-24',
    sender: 'Stripe',
    amount: 210.0,
    currency: 'USD',
    status: 'Scheduled',
  },
  {
    id: 3,
    invoiceId: 'INV-2025-0519',
    dueDate: '2025-05-19',
    sender: 'Google Cloud',
    amount: 380.4,
    currency: 'USD',
    status: 'Overdue',
  },
];

const statusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-500';
    case 'pending':
    case 'scheduled':
      return 'bg-yellow-500';
    case 'overdue':
      return 'bg-red-500';
    default:
      return 'bg-secondary-400';
  }
};

const CalendarPage: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(today);
  const [horizon, setHorizon] = useState<number>(14); // days ahead for upcoming list
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Events mapped by date (yyyy-MM-dd → [])
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof sampleEvents> = {};
    sampleEvents.forEach((e) => {
      map[e.dueDate] = [...(map[e.dueDate] ?? []), e];
    });
    return map;
  }, []);

  // Generate calendar grid (start on Monday)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dates: Date[] = [];
  for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
    dates.push(d);
  }

  // Upcoming payments list
  const upcoming = useMemo(() => {
    const arr = [...sampleEvents].filter((e) => {
      const diff = differenceInCalendarDays(new Date(e.dueDate), today);
      return diff >= 0 && diff <= horizon;
    });
    arr.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
    return arr;
  }, [horizon]);

  const kpis = useMemo(() => {
    const totalDue = sampleEvents.reduce(
      (sum, e) => (isSameMonth(new Date(e.dueDate), currentMonth) ? sum + e.amount : sum),
      0,
    );
    const overdue = sampleEvents.filter((e) => e.status.toLowerCase() === 'overdue').length;
    const next7 = upcoming.length;
    return { totalDue, overdue, next7 };
  }, [currentMonth, upcoming]);

  const renderDayCell = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayEvents = eventsByDate[dateKey] ?? [];
    return (
      <div
        key={dateKey}
        className={`p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors cursor-pointer ${
          !isSameMonth(day, currentMonth) ? 'text-secondary-400' : ''
        } ${isSameDay(day, today) ? 'ring-2 ring-primary-500' : ''}`}
      >
        <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>
        {dayEvents.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <div className="flex flex-wrap gap-0.5">
                {dayEvents.map((evt) => (
                  <span
                    key={evt.id}
                    className={`w-2 h-2 rounded-full ${statusColor(evt.status)}`}
                  />
                ))}
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-64" side="top">
              <h4 className="font-semibold text-sm mb-2">
                {format(day, 'PPP')} ({dayEvents.length} invoice
                {dayEvents.length > 1 ? 's' : ''})
              </h4>
              <Separator className="mb-2" />
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {dayEvents.map((evt) => (
                  <li key={evt.id} className="text-sm">
                    <span className="font-medium">{evt.invoiceId}</span> • #{evt.sender}{' '}
                    <span className="float-right">${evt.amount}</span>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-xl font-bold">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => subMonths(m, 1))}>
            <ChevronLeft size={18} />
          </Button>
          {format(currentMonth, 'MMMM yyyy')}
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>
            <ChevronRight size={18} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(today)} className="ml-2">
            Today
          </Button>
        </div>
        <Button
          variant="default"
          size="sm"
          className="gap-1"
          onClick={async () => {
            try {
              const key = apiKey ?? (await calendarApi.createOrGetApiKey());
              if (!apiKey) setApiKey(key);
              const url = `${API_BASE_URL}/calendar/export/ics?api_key=${key}`;
              window.open(url, '_blank');
              toast.success('ICS feed opened. Add it to Apple Calendar.');
            } catch (err) {
              toast.error('Could not export calendar');
              console.error(err);
            }
          }}
        >
          <DownloadCloud size={14} /> Export .ics
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm text-secondary-500">Total Due This Month</div>
            <div className="text-2xl font-bold">${kpis.totalDue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm text-secondary-500">Overdue</div>
            <div className="text-2xl font-bold text-red-500">{kpis.overdue}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="text-sm text-secondary-500">Next {horizon} Days</div>
            <div className="text-2xl font-bold">{kpis.next7}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Weekday labels */}
            <div className="grid grid-cols-7 text-center text-xs font-medium mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            {/* Dates grid */}
            <div className="grid grid-cols-7 gap-1">
              {dates.map((day) => renderDayCell(day))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card className="shadow-sm flex flex-col">
          <CardHeader className="flex-row justify-between items-center gap-4">
            <CardTitle>Upcoming Payments</CardTitle>
            <div className="flex gap-2">
              {[7, 14, 30].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={horizon === n ? 'default' : 'outline'}
                  onClick={() => setHorizon(n)}
                >
                  {n}d
                </Button>
              ))}
            </div>
          </CardHeader>
          <ScrollArea className="px-4 pb-4 flex-1">
            {upcoming.length === 0 && <p className="text-sm text-secondary-500">No payments in this range.</p>}
            {upcoming.map((evt, idx) => (
              <div key={evt.id} className="mb-3 last:mb-0">
                {(idx === 0 || upcoming[idx - 1].dueDate !== evt.dueDate) && (
                  <h4 className="text-xs font-semibold text-secondary-500 mb-1 mt-2">
                    {format(new Date(evt.dueDate), 'PPP')}
                  </h4>
                )}
                <Card className="p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{evt.invoiceId}</span>
                    <Badge variant={evt.status.toLowerCase() === 'overdue' ? 'destructive' : 'secondary'}>
                      {evt.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-secondary-500 flex justify-between">
                    <span>{evt.sender}</span>
                    <span>
                      {evt.amount} {evt.currency}
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage; 