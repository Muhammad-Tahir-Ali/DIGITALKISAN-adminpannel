import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  ShieldCheck, 
  UserPlus,
  Loader2,
  X,
  Shield,
  Clock,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import api from '../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  isSuspended: boolean;
  phone: string;
  createdAt: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-zinc-900 text-emerald-400',
  farmer: 'bg-emerald-100 text-emerald-700',
  buyer: 'bg-blue-100 text-blue-700',
  logistics: 'bg-amber-100 text-amber-700',
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Create Admin Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/users', {
        params: {
          search: searchQuery,
          role: roleFilter
        }
      });
      setUsers(res.data.data.users);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const toggleVerify = async (id: string, current: boolean) => {
    const action = current ? 'unverify' : 'verify';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await api.patch(`/admin/users/${id}/verify`);
      setUsers(prev => prev.map(u => u._id === id ? res.data.data.user : u));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to update verification');
    }
  };

  const toggleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to change this user\'s access status?')) return;
    try {
      const res = await api.patch(`/admin/users/${id}/suspend`);
      setUsers(prev => prev.map(u => u._id === id ? res.data.data.user : u));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to update suspension');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('PERMANENT ACTION: Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/users/create-admin', formData);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 font-medium text-sm">Monitor all platform accounts and administration</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Create New Admin
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all appearance-none pr-10 relative cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="farmer">Farmers</option>
            <option value="logistics">Logistics</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <button onClick={fetchUsers} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-500 transition-colors">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {error ? (
        <div className="bg-rose-50 p-12 rounded-2xl border border-rose-100 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <p className="text-rose-800 font-bold">{error}</p>
          <button onClick={fetchUsers} className="mt-4 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm">Retry</button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">User</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">Access</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-medium">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{user.name}</p>
                          <p className="text-[10px] font-medium text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-zinc-900 text-white' :
                        user.role === 'farmer' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleVerify(user._id, user.isVerified)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors ${user.isVerified ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-500 hover:text-amber-600'}`}
                      >
                        {user.isVerified ? <ShieldCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleSuspend(user._id)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}
                      >
                        {user.isSuspended ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        {user.isSuspended ? 'Suspended' : 'Active'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => deleteUser(user._id)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">Create Administrator</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Full Name"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 transition-all"
              />
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Email Address"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 transition-all"
              />
              <input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Password"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 transition-all"
              />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">Cancel</button>
                <button disabled={creating} type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
