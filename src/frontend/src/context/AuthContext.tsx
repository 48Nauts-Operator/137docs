import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../services/api';

interface AuthContextValue {
  token: string | null;
  username: string | null;
  role: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  username: null,
  role: null,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [username, setUsername] = useState<string | null>(() => {
    const t = localStorage.getItem('auth_token');
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.sub || null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<string | null>(() => {
    const t = localStorage.getItem('auth_token');
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  const login = async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await http.post<{ access_token: string }>('/auth/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const t = res.data.access_token;
      if (t) {
        localStorage.setItem('auth_token', t);
        setToken(t);
        try {
          const payload = JSON.parse(atob(t.split('.')[1]));
          setUsername(payload.sub || null);
          setRole(payload.role || null);
        } catch {}
        // clear redirect path storage
        sessionStorage.removeItem('redirectTo');
        return true;
      }
      throw new Error('Unexpected response');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Incorrect username or password';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUsername(null);
    setRole(null);
    navigate('/login');
  };

  // Monitor token expiry
  useTokenExpiry(token, logout);

  return (
    <AuthContext.Provider value={{ token, username, role, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Utility: auto-logout when token expires
function useTokenExpiry(token: string | null, logoutFn: () => void) {
  React.useEffect(() => {
    if (!token) return;
    let timeoutId: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp) {
        const expiryMs = payload.exp * 1000 - Date.now();
        if (expiryMs <= 0) {
          logoutFn();
        } else {
          timeoutId = window.setTimeout(() => logoutFn(), expiryMs + 1000);
        }
      }
    } catch {}
    return () => clearTimeout(timeoutId);
  }, [token, logoutFn]);
} 