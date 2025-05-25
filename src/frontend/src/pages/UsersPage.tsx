import React, { useState } from 'react';
import { useUsers, userApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Plus, Pencil, Trash2, Key } from 'lucide-react';

const UsersPage: React.FC = () => {
  const { users, loading, error, refresh, setUsers } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [form, setForm] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'viewer',
    password: '',
    disabled: false,
  });

  const resetForm = () => setForm({ username: '', email: '', full_name: '', role: 'viewer', password: '', disabled: false });

  const openCreate = () => {
    resetForm();
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditing(u);
    setForm({ ...u, password: '' });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        const updated = await userApi.update(editing.id, form);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const created = await userApi.create(form);
        setUsers((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch (e: any) {
      alert(e.message || 'Error');
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete user?')) return;
    await userApi.delete(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const resetPwd = async (id: number) => {
    const pwd = prompt('New password');
    if (!pwd) return;
    await userApi.resetPassword(id, pwd);
    alert('Password reset');
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Users</h1>
        <Button onClick={openCreate} size="sm" variant="outline" className="gap-1"><Plus size={14}/> New User</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-secondary-800 text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">ID</th><th className="p-2">Username</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-secondary-50 dark:hover:bg-secondary-700">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.disabled ? 'disabled' : 'active'}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => openEdit(u)}><Pencil size={16}/></button>
                  <button onClick={() => remove(u.id)}><Trash2 size={16}/></button>
                  <button onClick={() => resetPwd(u.id)}><Key size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 p-6 rounded w-96 space-y-3">
            <h2 className="text-lg font-semibold mb-2">{editing ? 'Edit User' : 'New User'}</h2>
            {['username','email','full_name','role','password'].map((field) => (
              <input key={field} type={field==='password'?'password':'text'} placeholder={field} value={(form as any)[field]||''} onChange={(e)=>setForm({...form,[field]:e.target.value})} className="w-full form-input"/>
            ))}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.disabled} onChange={(e)=>setForm({...form,disabled:e.target.checked})}/> Disabled</label>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={()=>setShowModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit}>{editing?'Save':'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage; 