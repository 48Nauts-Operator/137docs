import React, { useState } from 'react';
import { Clock, FileText, AlertTriangle, Calendar, ChevronRight } from 'lucide-react';

// Mock timeline data
const mockTimelineData = [
  {
    id: 1,
    date: '2023-05-15',
    title: 'Invoice #2023-001 Received',
    description: 'Invoice from Acme Corporation for $1,250.00',
    documentType: 'invoice',
    documentId: 1,
    status: 'received'
  },
  {
    id: 2,
    date: '2023-05-20',
    title: 'Electricity Bill Received',
    description: 'Monthly electricity bill from Power Company for $142.50',
    documentType: 'invoice',
    documentId: 2,
    status: 'received'
  },
  {
    id: 3,
    date: '2023-05-22',
    title: 'Invoice #2023-001 Paid',
    description: 'Payment of $1,250.00 to Acme Corporation',
    documentType: 'payment',
    relatedDocumentId: 1,
    status: 'completed'
  },
  {
    id: 4,
    date: '2023-05-25',
    title: 'Internet Service Invoice Received',
    description: 'Monthly internet bill from FastNet Provider for $89.99',
    documentType: 'invoice',
    documentId: 4,
    status: 'received'
  },
  {
    id: 5,
    date: '2023-06-05',
    title: 'Internet Service Invoice Due',
    description: 'Payment of $89.99 due to FastNet Provider',
    documentType: 'reminder',
    relatedDocumentId: 4,
    status: 'pending'
  },
  {
    id: 6,
    date: '2023-06-10',
    title: 'Electricity Bill Due',
    description: 'Payment of $142.50 due to Power Company',
    documentType: 'reminder',
    relatedDocumentId: 2,
    status: 'pending'
  }
];

const Timeline: React.FC = () => {
  const [filter, setFilter] = useState<string | null>(null);
  
  // Filter timeline items based on selected filter
  const filteredTimelineItems = filter 
    ? mockTimelineData.filter(item => item.documentType === filter)
    : mockTimelineData;
  
  // Sort timeline items by date (newest first)
  const sortedTimelineItems = [...filteredTimelineItems].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Get icon based on document type
  const getIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return <FileText size={20} className="text-primary-500" />;
      case 'payment':
        return <FileText size={20} className="text-success-500" />;
      case 'reminder':
        return <AlertTriangle size={20} className="text-warning-500" />;
      default:
        return <Clock size={20} className="text-secondary-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="status-paid">Completed</span>;
      case 'pending':
        return <span className="status-pending">Pending</span>;
      case 'overdue':
        return <span className="status-overdue">Overdue</span>;
      default:
        return <span className="status-unpaid">Received</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Timeline</h1>
        
        <div className="flex space-x-2">
          <button 
            className={`btn ${filter === null ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(null)}
          >
            All
          </button>
          <button 
            className={`btn ${filter === 'invoice' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('invoice')}
          >
            Invoices
          </button>
          <button 
            className={`btn ${filter === 'payment' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('payment')}
          >
            Payments
          </button>
          <button 
            className={`btn ${filter === 'reminder' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('reminder')}
          >
            Reminders
          </button>
        </div>
      </div>
      
      <div className="timeline">
        {sortedTimelineItems.map((item) => (
          <div key={item.id} className="timeline-item">
            <div className="timeline-dot">{getIcon(item.documentType)}</div>
            <div className="timeline-content">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-secondary-500" />
                  <span className="text-sm text-secondary-500">{formatDate(item.date)}</span>
                </div>
                {getStatusBadge(item.status)}
              </div>
              
              <h3 className="text-lg font-medium mb-1">{item.title}</h3>
              <p className="text-secondary-600 dark:text-secondary-400 mb-3">{item.description}</p>
              
              <button className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline">
                View Document <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
        
        {sortedTimelineItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Clock />
            </div>
            <p className="empty-state-text">No timeline events found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
