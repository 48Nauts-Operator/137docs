import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { http } from '../services/api';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [preset, setPreset] = useState<'custom' | 'admin' | 'viewer'>('custom');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [noUsers, setNoUsers] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const storedRedirect = sessionStorage.getItem('redirectTo');
  const fromPath = (location.state as any)?.from?.pathname || storedRedirect || '/';

  useEffect(() => {
    http.get('/users')
      .then(res => setNoUsers((res.data as any[]).length === 0))
      .catch((err) => {
        // If we get a 403, it means we're not admin but users exist
        if (err.response && err.response.status === 403) {
          setNoUsers(false);
        } else {
          setNoUsers(true);
        }
      });
  }, []);

  const applyPreset = (role: 'admin' | 'viewer') => {
    setPreset(role);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin');
    } else {
      setUsername('viewer');
      setPassword('viewer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate(fromPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <form
        onSubmit={handleSubmit}
        className={`bg-white dark:bg-secondary-800 p-8 rounded shadow-md w-80 ${shake ? 'animate-shake' : ''}`}
      >
        <h2 className="text-2xl mb-6 text-center font-semibold text-primary-700 dark:text-primary-400">Sign in</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {/* Quick presets for dev */}
        <div className="mb-4 flex space-x-2">
          <button type="button" onClick={() => applyPreset('admin')} className={`px-2 py-1 text-xs rounded ${preset==='admin'?'bg-primary-600 text-white':'bg-secondary-200 dark:bg-secondary-700'}`}>admin</button>
          <button type="button" onClick={() => applyPreset('viewer')} className={`px-2 py-1 text-xs rounded ${preset==='viewer'?'bg-primary-600 text-white':'bg-secondary-200 dark:bg-secondary-700'}`}>viewer</button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600 focus:outline-none"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-secondary-700 dark:border-secondary-600 focus:outline-none"
            required
          />
        </div>
        {noUsers && (
          <button type="button" onClick={()=>navigate('/onboarding')}
            className="w-full bg-secondary-300 hover:bg-secondary-400 text-secondary-900 dark:text-secondary-100 py-2 rounded-md mb-3">
            Create Admin Account
          </button>
        )}
        <button
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-md transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage; 