import React, { useState } from 'react';
import { http } from '../../../services/api';

const RegisterStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const submit = async () => {
    if (form.password !== form.confirm) return setError('Passwords do not match');
    try {
      const fd = new FormData();
      fd.append('username', form.username);
      fd.append('email', form.email);
      fd.append('password', form.password);
      await http.post('/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onNext();
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Registration failed');
    }
  };

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Create Admin Account</h2>
      <div className="space-y-3">
        <input className="form-input" placeholder="Username" value={form.username} onChange={e=>update('username',e.target.value)} />
        <input className="form-input" placeholder="Email" value={form.email} onChange={e=>update('email',e.target.value)} />
        <input type="password" className="form-input" placeholder="Password" value={form.password} onChange={e=>update('password',e.target.value)} />
        <input type="password" className="form-input" placeholder="Confirm Password" value={form.confirm} onChange={e=>update('confirm',e.target.value)} />
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <div className="mt-6 text-right">
        <button className="btn-primary" disabled={!form.username||!form.password||form.password!==form.confirm} onClick={submit}>Create & Continue</button>
      </div>
    </div>
  );
};
export default RegisterStep; 