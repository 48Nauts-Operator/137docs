import { useState, useEffect } from 'react';
import axios from 'axios';
import { docDb, CachedDocument } from '../lib/db';

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
// Configure API base URL – compatible with Vite
// ---------------------------------------------------------------------------
// 1. Prefer Vite env vars:  VITE_API_URL or VITE_API_BASE_URL
// 2. Fallback to any old CRA vars if running in Node (tests)
// 3. Default to local backend on port 8808

const RAW_API_BASE =
  // Vite-style env
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  // Legacy CRA env (will only be defined in Node/test context)
  (typeof process !== 'undefined' ? (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL) : undefined) ||
  // Default
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
if ((import.meta as any).env?.DEV) {
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
      (import.meta as any).env?.DEV &&
      error.response &&
      error.response.status === 401
    ) {
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  },
);

// Re-export so other modules (AuthContext) can reuse the configured instance
export { http };

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
    let cancel = false;

    const loadCache = async () => {
      try {
        const cached = await docDb.documents.toArray();
        if (!cancel) setDocuments(cached.map((c: CachedDocument) => c.data));
      } catch {}
    };

    const fetchRemote = async () => {
      try {
        const fresh = await documentApi.getAllDocuments(filters);
        if (cancel) return;
        setDocuments(fresh);
        // Upsert cache
        await docDb.transaction('rw', docDb.documents, async () => {
          for (const d of fresh) {
            await docDb.documents.put({ id: d.id, data: d, updated_at: d.updated_at || new Date().toISOString() });
          }

          // Remove stale documents no longer on server
          const idsOnServer = new Set(fresh.map((d: any) => d.id));
          const toDelete: number[] = [];
          await docDb.documents.each((doc: CachedDocument) => {
            if (!idsOnServer.has(doc.id)) {
              toDelete.push(doc.id);
            }
          });
          if (toDelete.length) await docDb.documents.bulkDelete(toDelete);
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    loadCache().then(fetchRemote);

    // Online event listener to sync when connection is restored
    const handleOnline = () => fetchRemote();
    window.addEventListener('online', handleOnline);

    return () => {
      cancel = true;
      window.removeEventListener('online', handleOnline);
    };
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
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await http.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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

/* -------------------------------------------------------------------------- */
/*                                Users API                                   */
/* -------------------------------------------------------------------------- */

type User = {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  disabled: boolean;
  created_at?: string;
};

export const userApi = {
  async getAll(): Promise<User[]> {
    const res = await http.get<User[]>('/users');
    return res.data as User[];
  },
  async create(data: Record<string, any>): Promise<User> {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && form.append(k, v as any));
    const res = await http.post<User>('/users', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data as User;
  },
  async update(id: number, data: Record<string, any>): Promise<User> {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && form.append(k, v as any));
    const res = await http.put<User>(`/users/${id}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data as User;
  },
  async delete(id: number): Promise<void> {
    await http.delete(`/users/${id}`);
  },
  async resetPassword(id: number, newPassword: string): Promise<void> {
    const form = new FormData();
    form.append('new_password', newPassword);
    await http.post(`/users/${id}/reset-password`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRemote = async () => {
    try {
      const fresh = await userApi.getAll();
      setUsers(fresh);
      // cache
      await docDb.transaction('rw', docDb.users, async () => {
        for (const u of fresh) {
          await (docDb.users as any).put({ id: u.id, data: u, updated_at: u.created_at || new Date().toISOString() });
        }
        // Remove stale
        const idsOnServer = new Set(fresh.map((u) => u.id));
        const toDelete: number[] = [];
        await (docDb.users as any).each((rec: any) => {
          if (!idsOnServer.has(rec.id)) toDelete.push(rec.id);
        });
        if (toDelete.length) await (docDb.users as any).bulkDelete(toDelete);
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    const loadCache = async () => {
      try {
        const cached = await (docDb.users as any).toArray();
        if (!cancel) setUsers(cached.map((c: any) => c.data));
      } catch {}
    };
    loadCache().then(fetchRemote);
    return () => {
      cancel = true;
    };
  }, []);

  return { users, loading, error, refresh: fetchRemote, setUsers };
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
  async update(id:number, entry: Record<string, any>): Promise<any> {
    const form = new FormData();
    Object.entries(entry).forEach(([k,v])=>{if(v!==undefined&&v!==null) form.append(k,v as any);});
    const res = await http.put(`/address-book/${id}`, form, { headers: { 'Content-Type':'multipart/form-data' }});
    return res.data;
  },
  async delete(id:number): Promise<void> {
    await http.delete(`/address-book/${id}`);
  },
};

export const useAddressBook = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRemote = async () => {
    try {
      const fresh = await addressBookApi.getAll();
      setEntries(fresh);
      await docDb.transaction('rw', (docDb as any).address_book, async () => {
        for (const e of fresh) {
          await (docDb as any).address_book.put({ id: e.id, data: e, updated_at: e.updated_at || new Date().toISOString() });
        }
        const idsOnServer = new Set(fresh.map((e: any) => e.id));
        const toDelete: number[] = [];
        await (docDb as any).address_book.each((rec: any) => {
          if (!idsOnServer.has(rec.id)) toDelete.push(rec.id);
        });
        if (toDelete.length) await (docDb as any).address_book.bulkDelete(toDelete);
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancel = false;
    const loadCache = async () => {
      try {
        const cached = await (docDb as any).address_book.toArray();
        if (!cancel) setEntries(cached.map((c: any) => c.data));
      } catch {}
    };

    loadCache().then(fetchRemote);
    const handleOnline = () => fetchRemote();
    window.addEventListener('online', handleOnline);
    return () => {
      cancel = true;
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return { entries, loading, error, refresh: fetchRemote, setEntries };
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

/* -------------------------------------------------------------------------- */
/*                               Settings API                                */
/* -------------------------------------------------------------------------- */

export const settingsApi = {
  async getSettings(): Promise<Record<string, any>> {
    try {
      const res = await http.get('/settings');
      return res.data as Record<string, any>;
    } catch (err) {
      console.error(err);
      return {};
    }
  },

  async updateSettings(data: Record<string, any>): Promise<Record<string, any>> {
    try {
      const formData = new FormData();
      const fieldMap: Record<string, string> = {
        defaultCurrency: 'default_currency',
      };
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(fieldMap[k] || k, v as any);
        }
      });
      const res = await http.put('/settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data as Record<string, any>;
    } catch (err) {
      console.error(err);
      return {};
    }
  },

  async validateFolders(inboxPath: string, storageRoot: string): Promise<any> {
    const form = new FormData();
    form.append('inbox_path', inboxPath);
    form.append('storage_root', storageRoot);
    const res = await http.post('/settings/validate-folders', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async migrateStorage(newRoot: string, force = false): Promise<any> {
    const form = new FormData();
    form.append('new_root', newRoot);
    if (force) form.append('force', 'true');
    const res = await http.post(`/settings/migrate-storage${force ? '?force=true' : ''}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getMigrationStatus(): Promise<any> {
    const res = await http.get('/settings/migration-status');
    return res.data;
  },
};

/* ----------------------------- Auth API ------------------------------ */

export const authApi = {
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const form = new FormData();
    form.append('old_password', oldPassword);
    form.append('new_password', newPassword);
    await http.post('/auth/change-password', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

/* --------------------------- Vision Search API --------------------------- */

export const visionSearchApi = {
  async search(query: string): Promise<any[]> {
    try {
      const res = await http.get('/search/vision', { params: { query } });
      return res.data as any[];
    } catch (err) {
      console.error(err);
      return [];
    }
  },
};

/* -------------------------------------------------------------------------- */
/*                               File-System API                              */
/* -------------------------------------------------------------------------- */

type FsEntry = {
  name: string;
  type: 'file' | 'dir' | 'symlink';
  size: number | null;
  modified: string;
};

export type FsListResponse = {
  version: number;
  path: string;
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
  files: FsEntry[];
};

export const fsApi = {
  async listDirectory(path = '/hostfs', offset = 0, limit = 100): Promise<FsListResponse> {
    try {
      const res = await http.get<FsListResponse>('/fs', {
        params: { path, offset, limit },
      });
      return res.data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};

// ---------------------------------------------------------------------------
// Cache busting – bump CACHE_VERSION whenever the server-side DB is reset so
// that stale IndexedDB entries are purged automatically.
// ---------------------------------------------------------------------------

(() => {
  try {
    const CACHE_VERSION = 2; // <-- increment to force-clear client cache
    const LS_KEY = 'cache_version';
    if (globalThis.localStorage?.getItem(LS_KEY) !== String(CACHE_VERSION)) {
      // Delete Dexie database (defined in lib/db.ts)
      indexedDB.deleteDatabase('docai_local');
      globalThis.localStorage?.setItem(LS_KEY, String(CACHE_VERSION));
    }
  } catch {
    /* non-browser environment */
  }
})();

/* ---------------------------- Health API ---------------------------- */

type HealthResponse = {
  backend: string;
  db: string;
  llm_model: string;
};

export const useHealth = () => {
  const [health, setHealth] = useState<HealthResponse|null>(null);
  useEffect(()=>{
    http.get<HealthResponse>('/health').then(res=> setHealth(res.data as any)).catch(()=>{});
  },[]);
  return health;
}; 