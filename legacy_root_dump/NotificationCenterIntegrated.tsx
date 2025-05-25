import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../services/api';
import { Bell, Check, Trash2, Clock, FileText, AlertTriangle, Loader } from 'lucide-react';

const NotificationCenterIntegrated: React.FC = () => {
  const [filter, setFilter] = useState<string | null>(null);
  
  // Use the custom hook to fetch and manage notifications
  const { 
    notifications, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refresh 
  } = useNotifications();
  
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

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  // Handle notification click
  const handleNotificationClick = (id: number) => {
    markAsRead(id);
    // Additional logic to navigate to the related document could be added here
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size={32} className="animate-spin text-primary-500" />
        <span className="ml-2 text-secondary-600 dark:text-secondary-400">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-50 dark:bg-danger-900/20 text-danger-800 dark:text-danger-300 p-4 rounded-md">
        <p>Error loading notifications: {error}</p>
        <button 
          className="btn btn-outline text-danger-600 dark:text-danger-400 mt-2"
          onClick={refresh}
        >
          Retry
        </button>
      </div>
    );
  }

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
            className="btn btn-outline py-1.5 text-sm flex items-center"
            onClick={() => markAllAsRead()}
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
              onClick={() => handleNotificationClick(notification.id)}
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

export default NotificationCenterIntegrated;
