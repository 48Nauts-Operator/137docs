import { useState, useEffect } from 'react';
import axios from 'axios';

/***************************************************************************
 * NOTE: These are lightweight placeholder implementations so that the
 * TypeScript compiler can successfully build the frontend while the real
 * backend API is still under development / integration. Replace the stubbed
 * endpoints with real ones once they are available on the backend.
 ***************************************************************************/

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

/*
 * We allow either env var name: REACT_APP_API_URL (preferred) or the older
 * REACT_APP_API_BASE_URL.  If neither is supplied we default to the local
 * dev backend on port 8808.
 */

// ---------------------------------------------------------------------------
// Configure API base URL
// ---------------------------------------------------------------------------
// We expect the backend to expose its REST endpoints under the "/api" prefix.
// Developers may provide either the *exact* base path (e.g. "http://localhost:8808/api")
// or just the server root (e.g. "http://localhost:8808").  To avoid subtle 404 errors
// when the "/api" segment is forgotten – or duplicated – we normalise the value here.

const RAW_API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:8808';

// Ensure we have exactly one trailing "/api" segment – nothing more, nothing less.
export const API_BASE_URL = (() => {
  // Strip any trailing slash for easier handling
  let url = RAW_API_BASE.replace(/\/$/, '');

  // If url already ends with '/api' (case-sensitive), keep as is, otherwise append
  if (!url.endsWith('/api')) {
    url += '/api';
  }

  return url;
})();

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Development convenience: always send the default API key so that an expired
// JWT doesn't break the app during local testing. Remove this in production.
if (process.env.NODE_ENV === 'development') {
  http.defaults.headers.common['X-API-Key'] = 'test-api-key';
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// If backend responds 401 and we are in dev mode, clear the stored token so
// that subsequent requests rely solely on the API key.
http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (
      process.env.NODE_ENV === 'development' &&
      error.response &&
      error.response.status === 401
    ) {
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  },
);

/* -------------------------------------------------------------------------- */
/*                               Document API                                 */
/* -------------------------------------------------------------------------- */

type Document = any; // TODO: replace with real type definition when available

export const documentApi = {
  async getAllDocuments(filters: Record<string, any> = {}): Promise<Document[]> {
    try {
      const res = await http.get<Document[]>('/documents', { params: filters });
      return res.data as Document[];
    } catch (err) {
      console.error(err);
      return [];
    }
  },
  async getDocumentById(id: number): Promise<Document | null> {
    try {
      const res = await http.get<Document>(`/documents/${id}`);
      return res.data as Document;
    } catch (err) {
      console.error(err);
      return null;
    }
  },
  async addTagToDocument(id: number, tag: string): Promise<void> {
    try {
      await http.post(`/documents/${id}/tags`, { tag });
    } catch (err) {
      console.error(err);
    }
  },
  async removeTagFromDocument(id: number, tag: string): Promise<void> {
    try {
      await http.delete(`/documents/${id}/tags/${encodeURIComponent(tag)}`);
    } catch (err) {
      console.error(err);
    }
  },
  async getDocumentTags(id: number): Promise<string[]> {
    try {
      const res = await http.get<string[]>(`/documents/${id}/tags`);
      return (res.data as string[]) || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  },
  async deleteDocument(id: number): Promise<void> {
    try {
      await http.delete(`/documents/${id}`);
    } catch (err) {
      console.error(err);
    }
  },
  async updateDocumentStatus(id: number, status: string): Promise<void> {
    try {
      await http.patch(`/documents/${id}`, { status });
    } catch (err) {
      console.error(err);
    }
  },
  async updateDocument(id: number, data: Record<string, any>): Promise<Document | null> {
    try {
      // Backend expects multipart/form-data with snake_case fields
      const formData = new FormData();
      const fieldMap: Record<string, string> = {
        title: 'title',
        documentType: 'document_type',
        documentDate: 'document_date',
        dueDate: 'due_date',
        amount: 'amount',
        status: 'status',
        sender: 'sender',
        recipient: 'recipient',
        currency: 'currency',
      };

      Object.keys(data).forEach((key) => {
        const backendKey = fieldMap[key] || key;
        const value = data[key];
        if (value !== undefined && value !== null && value !== '') {
          formData.append(backendKey, value as any);
        }
      });

      const res = await http.put<Document>(`/documents/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data as Document;
    } catch (err) {
      console.error(err);
      return null;
    }
  },
};

export const useDocuments = (filters: Record<string, any> = {}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    documentApi
      .getAllDocuments(filters)
      .then(setDocuments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return { documents, loading, error };
};

export const useDocument = (id: number | null) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    documentApi
      .getDocumentById(id)
      .then(setDocument)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { document, loading, error };
};

/* -------------------------------------------------------------------------- */
/*                               Analytics API                                */
/* -------------------------------------------------------------------------- */

type AnalyticsResponse = {
  documentTypes: any[];
  paymentStatus: any[];
  monthlyDocuments: any[];
  monthlyInvoices: any[];
  summary: Record<string, any>;
};

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse>({
    documentTypes: [],
    paymentStatus: [],
    monthlyDocuments: [],
    monthlyInvoices: [],
    summary: {},
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await http.get<AnalyticsResponse>('/analytics/summary');
        setAnalytics(res.data as AnalyticsResponse);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { analytics, loading, error };
};

/* -------------------------------------------------------------------------- */
/*                            Notifications API                               */
/* -------------------------------------------------------------------------- */

type Notification = any; // TODO: Define more specific type

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await http.get<Notification[]>('/notifications');
      setNotifications(res.data as Notification[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await http.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await http.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await http.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return {
    notifications,
    loading,
    error: error || '',
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchData,
  };
};

/* --------------------------- Address Book API ---------------------------- */

export const addressBookApi = {
  async getAll(): Promise<any[]> {
    const res = await http.get('/address-book');
    return res.data as any[];
  },
  async create(entry: Record<string, any>): Promise<any> {
    const form = new FormData();
    Object.entries(entry).forEach(([k,v])=>{if(v!==undefined&&v!==null) form.append(k,v as any);});
    const res = await http.post('/address-book', form);
    return res.data;
  },
};

export const useAddressBook = () => {
  const [entries,setEntries]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{ addressBookApi.getAll().then(setEntries).catch(e=>setError(e.message)).finally(()=>setLoading(false)); },[]);
  return {entries,loading,error};
};

/* -------------------------------------------------------------------------- */
/*                              Calendar API                                  */
/* -------------------------------------------------------------------------- */

type CalendarEvent = {
  id: number;
  title: string;
  due_date: string | null;
  status: string;
};

export const calendarApi = {
  async getEvents(month: number, year: number): Promise<CalendarEvent[]> {
    try {
      const res = await http.get<CalendarEvent[]>('/calendar/events', {
        params: { month, year },
      });
      return res.data as CalendarEvent[];
    } catch (err) {
      console.error(err);
      return [];
    }
  },
  async createOrGetApiKey(): Promise<string | null> {
    try {
      const res = await http.post<{ api_key: string }>('/calendar/api-key');
      return res.data.api_key;
    } catch (err) {
      console.error(err);
      return null;
    }
  },
};

export const useCalendarEvents = (month: number, year: number) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    calendarApi
      .getEvents(month, year)
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [month, year]);

  return { events, loading, error };
}; 