import { useState, useEffect } from 'react';
import { Check, X, Search, Clock, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/withdrawals');
      setWithdrawals(res.data.data.withdrawals);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchWithdrawals(), 0);
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected' | 'processed') => {
    const msg = status === 'processed' ? 'Mark this as PAID?' : `Are you sure you want to ${status} this request?`;
    if (!confirm(msg)) return;
    
    setProcessing(id);
    try {
      await api.patch(`/admin/withdrawals/${id}`, { status });
      setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status } : w));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = withdrawals.filter(w => 
    w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    w._id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Withdrawal Requests</h2>
        <p className="text-zinc-500 font-medium mt-1">Manage payouts for farmers and users</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm">
        <Search className="w-5 h-5 text-zinc-400" />
        <input 
          type="text" 
          placeholder="Search by user or ID..." 
          className="bg-transparent outline-none w-full font-medium text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50/50">
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Method</th>
                <th className="px-8 py-5">Account Details</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-zinc-400 text-sm font-medium">No withdrawal requests found</td>
                </tr>
              ) : (
                filtered.map((w) => (
                  <tr key={w._id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900">{w.user?.name}</span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">{w.user?.role}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-rose-600">₨ {w.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-zinc-500 uppercase">{w.method.replace('_', ' ')}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-black text-zinc-900">{w.accountDetails?.accountTitle}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{w.accountDetails?.accountNumber}</span>
                        {w.accountDetails?.bankName && (
                          <span className="text-[9px] text-zinc-300 font-bold italic">{w.accountDetails.bankName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        w.status === 'processed' ? 'bg-emerald-100 text-emerald-700' :
                        w.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {w.status === 'pending' && <Clock className="w-3 h-3" />}
                        {w.status === 'processed' && <Check className="w-3 h-3" />}
                        {w.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                        {w.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {w.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            disabled={processing === w._id}
                            onClick={() => handleUpdateStatus(w._id, 'processed')}
                            title="Mark as Paid"
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button 
                            disabled={processing === w._id}
                            onClick={() => handleUpdateStatus(w._id, 'rejected')}
                            title="Reject"
                            className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-300 italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
