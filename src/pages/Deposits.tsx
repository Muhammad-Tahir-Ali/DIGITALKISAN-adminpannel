import { useState, useEffect } from 'react';
import { Check, X, Search, Clock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { Deposit } from '../types';

export default function Deposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/deposits');
      setDeposits(res.data.data.deposits);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status} this deposit?`)) return;
    
    setProcessing(id);
    try {
      await api.patch(`/admin/deposits/${id}`, { status });
      setDeposits(prev => prev.map(d => d._id === id ? { ...d, status } : d));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = deposits.filter(d =>
    (d.user?.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    d._id.toLowerCase().includes(search.toLowerCase())
  );

  if (error && !deposits.length) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Fetch Error</h2>
      <p className="text-slate-500 mt-1">{error}</p>
      <button onClick={fetchDeposits} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold">Retry</button>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Deposit Requests</h2>
        <p className="text-zinc-500 font-medium mt-1">Review and approve manual wallet top-ups</p>
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
                <th className="px-8 py-5">Proof</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-zinc-400 text-sm font-medium">No deposit requests found</td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d._id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900">{d.user?.name}</span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">{d.user?.role}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-emerald-600">₨ {d.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-zinc-500 uppercase">{d.method.replace('_', ' ')}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                        {d.paymentProof}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        d.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        d.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {d.status === 'pending' && <Clock className="w-3 h-3" />}
                        {d.status === 'approved' && <ShieldCheck className="w-3 h-3" />}
                        {d.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                        {d.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {d.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            disabled={processing === d._id}
                            onClick={() => handleUpdateStatus(d._id, 'approved')}
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            disabled={processing === d._id}
                            onClick={() => handleUpdateStatus(d._id, 'rejected')}
                            className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-300 italic">Processed</span>
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
