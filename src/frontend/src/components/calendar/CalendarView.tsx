import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, FileText, AlertTriangle } from 'lucide-react';

// Mock calendar data
const mockEvents = [
  {
    id: 1,
    title: 'Invoice #2023-001 Due',
    date: '2023-06-15',
    documentId: 1,
    documentType: 'invoice',
    amount: 1250.00,
    status: 'paid'
  },
  {
    id: 2,
    title: 'Electricity Bill Due',
    date: '2023-06-10',
    documentId: 2,
    documentType: 'invoice',
    amount: 142.50,
    status: 'unpaid'
  },
  {
    id: 3,
    title: 'Contract Renewal Deadline',
    date: '2023-06-30',
    documentId: 3,
    documentType: 'contract',
    amount: null,
    status: 'pending'
  },
  {
    id: 4,
    title: 'Internet Service Invoice Due',
    date: '2023-06-05',
    documentId: 4,
    documentType: 'invoice',
    amount: 89.99,
    status: 'overdue'
  }
];

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');
  
  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get first day of the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Get number of days in the month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Get days for previous month to fill the calendar
  const daysFromPrevMonth = firstDayOfWeek;
  
  // Get days for next month to fill the calendar
  const totalDaysToShow = Math.ceil((daysInMonth + daysFromPrevMonth) / 7) * 7;
  const daysFromNextMonth = totalDaysToShow - daysInMonth - daysFromPrevMonth;
  
  // Generate days array
  const days = [];
  
  // Add days from previous month
  const prevMonthDate = new Date(currentYear, currentMonth, 0);
  const prevMonthDays = prevMonthDate.getDate();
  
  for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
    days.push({
      date: new Date(currentYear, currentMonth - 1, i),
      isCurrentMonth: false,
      events: []
    });
  }
  
  // Add days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear, currentMonth, i);
    const dateString = date.toISOString().split('T')[0];
    
    // Find events for this day
    const dayEvents = mockEvents.filter(event => event.date === dateString);
    
    days.push({
      date,
      isCurrentMonth: true,
      events: dayEvents
    });
  }
  
  // Add days from next month
  for (let i = 1; i <= daysFromNextMonth; i++) {
    days.push({
      date: new Date(currentYear, currentMonth + 1, i),
      isCurrentMonth: false,
      events: []
    });
  }
  
  // Navigate to previous month
  const goPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Check if a date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-500';
      case 'unpaid':
        return 'bg-secondary-500';
      case 'overdue':
        return 'bg-danger-500';
      default:
        return 'bg-warning-500';
    }
  };
  
  // Get events for selected date
  const selectedDateEvents = selectedDate 
    ? mockEvents.filter(event => event.date === selectedDate.toISOString().split('T')[0])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        
        <div className="flex items-center space-x-2">
          <button
            className={`btn ${view === 'month' ? 'btn-primary' : 'btn-outline'} py-1 px-3 text-sm`}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button
            className={`btn ${view === 'week' ? 'btn-primary' : 'btn-outline'} py-1 px-3 text-sm`}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button
            className="btn btn-outline py-1 px-3 text-sm"
            onClick={goToToday}
          >
            Today
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              className="p-1 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700"
              onClick={goPrevMonth}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="p-1 rounded-md hover:bg-secondary-100 dark:hover:bg-secondary-700"
              onClick={nextMonth}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={index} className="text-center text-sm font-medium text-secondary-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className={`min-h-[100px] p-1 border border-secondary-200 dark:border-secondary-700 rounded-md ${
                  day.isCurrentMonth
                    ? 'bg-white dark:bg-secondary-800'
                    : 'bg-secondary-50 dark:bg-secondary-900 text-secondary-400 dark:text-secondary-600'
                } ${
                  isToday(day.date)
                    ? 'ring-2 ring-primary-500'
                    : ''
                } ${
                  isSelected(day.date)
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : ''
                }`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className="text-right text-sm mb-1">
                  {day.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {day.events.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded truncate flex items-center"
                    >
                      <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(event.status)}`}></div>
                      {event.title}
                    </div>
                  ))}
                  
                  {day.events.length > 3 && (
                    <div className="text-xs text-secondary-500 pl-1">
                      +{day.events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Selected Date Events */}
      {selectedDate && (
        <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium mb-4">
            Events for {formatDate(selectedDate)}
          </h3>
          
          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 border border-secondary-200 dark:border-secondary-700 rounded-md hover:bg-secondary-50 dark:hover:bg-secondary-700 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {event.documentType === 'invoice' ? (
                        <FileText size={18} className="text-primary-500 mr-2" />
                      ) : event.status === 'overdue' ? (
                        <AlertTriangle size={18} className="text-danger-500 mr-2" />
                      ) : (
                        <Clock size={18} className="text-warning-500 mr-2" />
                      )}
                      <span className="font-medium">{event.title}</span>
                    </div>
                    
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'paid'
                        ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300'
                        : event.status === 'overdue'
                        ? 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-300'
                        : event.status === 'unpaid'
                        ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300'
                        : 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300'
                    }`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </div>
                  </div>
                  
                  {event.amount && (
                    <div className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">
                      Amount: ${event.amount.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary-500">
              No events scheduled for this day
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
