import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, Clock, UserCheck, UserX, Eye, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';
import api from '../lib/api';

type StatusFilter = 'All' | 'Pending' | 'Verified';

export default function Verification() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch farmers specifically
      const response = await api.get('/admin/users', { params: { role: 'farmer' } });
      setUsers(response.data.data.users);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch verification list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchUsers(), 0);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(f => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = 
        activeFilter === 'All' || 
        (activeFilter === 'Pending' && !f.isVerified) ||
        (activeFilter === 'Verified' && f.isVerified);
      return matchesSearch && matchesFilter;
    });
  }, [users, search, activeFilter]);

  const updateStatus = async (id: string) => {
    try {
      const res = await api.patch(`/admin/users/${id}/verify`);
      const updatedUser = res.data.data.user;
      setUsers(prev => prev.map(u => u._id === id ? updatedUser : u));
      if (selectedUser?._id === id) setSelectedUser(updatedUser);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Fetch Error</h2>
        <p className="text-slate-500 mt-1">{error}</p>
        <button onClick={fetchUsers} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Farmer Verification</h2>
        <p className="text-zinc-500 font-medium mt-1">Review and manage farmer credentials</p>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-4 bg-zinc-50/50">
          <div className="flex gap-2">
            {(['All', 'Pending', 'Verified'] as StatusFilter[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeFilter === tab ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search farmers..."
              className="text-xs outline-none w-full font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50/30">
                <th className="px-8 py-5">Farmer Info</th>
                <th className="px-8 py-5">Join Date</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-zinc-400 text-sm font-medium">No farmers found</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-xs">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{user.name}</p>
                          <p className="text-[10px] font-bold text-zinc-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-zinc-600">{new Date(user.createdAt).toLocaleDateString('en-PK')}</td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        user.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {user.isVerified ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedUser(user)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(user._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                            user.isVerified ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {user.isVerified ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          {user.isVerified ? 'Revoke' : 'Approve'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-xl">
                {selectedUser.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900">{selectedUser.name}</h3>
                <p className="text-zinc-500 font-medium text-sm">{selectedUser.email}</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Role', value: selectedUser.role },
                { label: 'Phone', value: selectedUser.phone || 'Not provided' },
                { label: 'Verified', value: selectedUser.isVerified ? 'Yes' : 'No' },
                { label: 'Joined', value: new Date(selectedUser.createdAt).toLocaleDateString('en-PK') },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">{row.label}</span>
                  <span className="text-sm font-bold text-zinc-900 capitalize">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => updateStatus(selectedUser._id)}
                className={`flex-1 py-3 text-white rounded-xl font-bold text-sm transition-colors ${
                  selectedUser.isVerified ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedUser.isVerified ? 'Revoke Verification' : 'Approve Farmer'}
              </button>
              <button onClick={() => setSelectedUser(null)} className="py-3 px-5 bg-zinc-100 text-zinc-700 rounded-xl font-bold text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

