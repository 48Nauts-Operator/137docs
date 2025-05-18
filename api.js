import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API service for backend communication
const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Document API
export const documentApi = {
  // Get all documents
  getAllDocuments: async (filters = {}) => {
    try {
      const response = await api.get('/documents', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },
  
  // Get document by ID
  getDocumentById: async (id) => {
    try {
      const response = await api.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching document ${id}:`, error);
      throw error;
    }
  },
  
  // Update document
  updateDocument: async (id, data) => {
    try {
      const response = await api.put(`/documents/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating document ${id}:`, error);
      throw error;
    }
  },
  
  // Delete document
  deleteDocument: async (id) => {
    try {
      const response = await api.delete(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  },
  
  // Upload document
  uploadDocument: async (formData) => {
    try {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },
  
  // Get document tags
  getDocumentTags: async (id) => {
    try {
      const response = await api.get(`/documents/${id}/tags`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching tags for document ${id}:`, error);
      throw error;
    }
  },
  
  // Add tag to document
  addTagToDocument: async (id, tag) => {
    try {
      const response = await api.post(`/documents/${id}/tags`, { tag });
      return response.data;
    } catch (error) {
      console.error(`Error adding tag to document ${id}:`, error);
      throw error;
    }
  },
  
  // Remove tag from document
  removeTagFromDocument: async (id, tag) => {
    try {
      const response = await api.delete(`/documents/${id}/tags/${tag}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing tag from document ${id}:`, error);
      throw error;
    }
  },
};

// Analytics API
export const analyticsApi = {
  // Get document type distribution
  getDocumentTypeDistribution: async () => {
    try {
      const response = await api.get('/analytics/document-types');
      return response.data;
    } catch (error) {
      console.error('Error fetching document type distribution:', error);
      throw error;
    }
  },
  
  // Get payment status distribution
  getPaymentStatusDistribution: async () => {
    try {
      const response = await api.get('/analytics/payment-status');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment status distribution:', error);
      throw error;
    }
  },
  
  // Get monthly document count
  getMonthlyDocumentCount: async (year = new Date().getFullYear()) => {
    try {
      const response = await api.get('/analytics/monthly-documents', { params: { year } });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly document count:', error);
      throw error;
    }
  },
  
  // Get monthly invoice amount
  getMonthlyInvoiceAmount: async (year = new Date().getFullYear()) => {
    try {
      const response = await api.get('/analytics/monthly-invoices', { params: { year } });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly invoice amount:', error);
      throw error;
    }
  },
  
  // Get summary metrics
  getSummaryMetrics: async () => {
    try {
      const response = await api.get('/analytics/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching summary metrics:', error);
      throw error;
    }
  },
};

// Notification API
export const notificationApi = {
  // Get all notifications
  getAllNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },
  
  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      throw error;
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },
  
  // Delete notification
  deleteNotification: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${id}:`, error);
      throw error;
    }
  },
};

// Calendar API
export const calendarApi = {
  // Get calendar events
  getCalendarEvents: async (month, year) => {
    try {
      const response = await api.get('/calendar/events', { params: { month, year } });
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  },
  
  // Get events for specific date
  getEventsForDate: async (date) => {
    try {
      const response = await api.get('/calendar/events/date', { params: { date } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching events for date ${date}:`, error);
      throw error;
    }
  },
  
  // Export calendar as ICS
  exportCalendarICS: async () => {
    try {
      const response = await api.get('/calendar/export', { responseType: 'blob' });
      return response.data;
    } catch (error) {
      console.error('Error exporting calendar:', error);
      throw error;
    }
  },
};

// Search API
export const searchApi = {
  // Basic search
  basicSearch: async (query) => {
    try {
      const response = await api.get('/search', { params: { query } });
      return response.data;
    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  },
  
  // Advanced search
  advancedSearch: async (params) => {
    try {
      const response = await api.post('/search/advanced', params);
      return response.data;
    } catch (error) {
      console.error('Error performing advanced search:', error);
      throw error;
    }
  },
  
  // Semantic search
  semanticSearch: async (query) => {
    try {
      const response = await api.get('/search/semantic', { params: { query } });
      return response.data;
    } catch (error) {
      console.error('Error performing semantic search:', error);
      throw error;
    }
  },
  
  // Get related documents
  getRelatedDocuments: async (id) => {
    try {
      const response = await api.get(`/search/related/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching related documents for ${id}:`, error);
      throw error;
    }
  },
};

// Auth API
export const authApi = {
  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('auth_token', response.data.token);
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },
  
  // Logout
  logout: async () => {
    try {
      localStorage.removeItem('auth_token');
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
};

// Settings API
export const settingsApi = {
  // Get settings
  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },
  
  // Update settings
  updateSettings: async (settings) => {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },
};

// Custom hook for document list
export const useDocuments = (filters = {}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const data = await documentApi.getAllDocuments(filters);
        setDocuments(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error fetching documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [JSON.stringify(filters)]);
  
  return { documents, loading, error };
};

// Custom hook for document details
export const useDocument = (id) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) {
        setDocument(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await documentApi.getDocumentById(id);
        setDocument(data);
        setError(null);
      } catch (err) {
        setError(err.message || `Error fetching document ${id}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [id]);
  
  return { document, loading, error };
};

// Custom hook for analytics
export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    documentTypes: [],
    paymentStatus: [],
    monthlyDocuments: [],
    monthlyInvoices: [],
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [documentTypes, paymentStatus, monthlyDocuments, monthlyInvoices, summary] = await Promise.all([
          analyticsApi.getDocumentTypeDistribution(),
          analyticsApi.getPaymentStatusDistribution(),
          analyticsApi.getMonthlyDocumentCount(),
          analyticsApi.getMonthlyInvoiceAmount(),
          analyticsApi.getSummaryMetrics()
        ]);
        
        setAnalytics({
          documentTypes,
          paymentStatus,
          monthlyDocuments,
          monthlyInvoices,
          summary
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Error fetching analytics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);
  
  return { analytics, loading, error };
};

// Custom hook for notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getAllNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const markAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      ));
    } catch (err) {
      console.error(`Error marking notification ${id} as read:`, err);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  const deleteNotification = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (err) {
      console.error(`Error deleting notification ${id}:`, err);
    }
  };
  
  return { 
    notifications, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refresh: fetchNotifications
  };
};

// Export all APIs
export default {
  documentApi,
  analyticsApi,
  notificationApi,
  calendarApi,
  searchApi,
  authApi,
  settingsApi,
  useDocuments,
  useDocument,
  useAnalytics,
  useNotifications
};
