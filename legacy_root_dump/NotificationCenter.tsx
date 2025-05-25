import React, { useState } from 'react';
import { Bell, Check, Trash2, Clock, FileText, AlertTriangle } from 'lucide-react';

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    title: 'Invoice #2023-004 is overdue',
    message: 'Internet Service Invoice from FastNet Provider is 3 days overdue.',
    type: 'overdue',
    documentId: 4,
    isRead: false,
    createdAt: '2023-06-08T10:30:00Z'
  },
  {
    id: 2,
    title: 'Electricity Bill due soon',
    message: 'Electricity Bill from Power Company is due in 2 days.',
    type: 'reminder',
    documentId: 2,
    isRead: false,
    createdAt: '2023-06-08T09:15:00Z'
  },
  {
    id: 3,
    title: 'Invoice #2023-001 marked as paid',
    message: 'Invoice from Acme Corporation has been marked as paid.',
    type: 'system',
    documentId: 1,
    isRead: true,
    createdAt: '2023-05-22T14:45:00Z'
  },
  {
    id: 4,
    title: 'New document processed',
    message: 'Insurance Policy from Secure Insurance Co. has been processed.',
    type: 'system',
    documentId: 5,
    isRead: true,
    createdAt: '2023-05-01T11:20:00Z'
  }
];

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<string | null>(null);
  
  // Filter notifications based on selected filter
  const filteredNotifications = filter 
    ? notifications.filter(notification => notification.type === filter)
    : notifications;
  
  // Sort notifications by date (newest first) and unread first
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    // Sort by read status first
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    // Then sort by date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week
      return `${diffDays} days ago`;
    } else {
      // More than a week
      return date.toLocaleDateString();
    }
  };

  // Get icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle size={18} className="text-danger-500" />;
      case 'reminder':
        return <Clock size={18} className="text-warning-500" />;
      default:
        return <FileText size={18} className="text-primary-500" />;
    }
  };

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
  };

  // Delete notification
  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Bell size={20} className="mr-2" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 text-xs font-medium rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="btn btn-outline py-1 px-3 text-sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check size={16} className="mr-1" />
            Mark all as read
          </button>
        </div>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <button 
          className={`btn ${filter === null ? 'btn-primary' : 'btn-outline'} py-1 px-3 text-sm`}
          onClick={() => setFilter(null)}
        >
          All
        </button>
        <button 
          className={`btn ${filter === 'overdue' ? 'btn-primary' : 'btn-outline'} py-1 px-3 text-sm`}
          onClick={() => setFilter('overdue')}
        >
          Overdue
        </button>
        <button 
          className={`btn ${filter === 'reminder' ? 'btn-primary' : 'btn-outline'} py-1 px-3 text-sm`}
          onClick={() => setFilter('reminder')}
        >
          Reminders
        </button>
        <button 
          className={`btn ${filter === 'system' ? 'btn-primary' : 'btn-outline'} py-1 px-3 text-sm`}
          onClick={() => setFilter('system')}
        >
          System
        </button>
      </div>
      
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm overflow-hidden">
        {sortedNotifications.length > 0 ? (
          sortedNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.isRead ? 'notification-unread' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{notification.title}</h3>
                    <span className="text-xs text-secondary-500">{formatDate(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-1">
                    {notification.message}
                  </p>
                </div>
                <button 
                  className="ml-2 p-1 text-secondary-400 hover:text-danger-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <Bell />
            </div>
            <p className="empty-state-text">No notifications found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
