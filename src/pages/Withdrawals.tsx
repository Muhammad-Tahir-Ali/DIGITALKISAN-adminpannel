import React, { useState, useEffect } from 'react';
import { Check, X, Search, Clock, ExternalLink, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';
import type { Withdrawal } from '../types';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/withdrawals');
      setWithdrawals(res.data.data.withdrawals);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch withdrawals');
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to update status');
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
                  <React.Fragment key={w._id}>
                    <tr className="hover:bg-zinc-50/70 transition-colors">
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
                          <button
                            onClick={() => setExpandedId(expandedId === w._id ? null : w._id)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors ml-auto"
                          >
                            View
                            {expandedId === w._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === w._id && (
                      <tr className="bg-zinc-50/80">
                        <td colSpan={6} className="px-8 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-1">User</p>
                              <p className="text-sm font-bold text-zinc-900">{w.user?.name}</p>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase">{w.user?.role}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-1">Amount</p>
                              <p className="text-sm font-black text-rose-600">₨ {w.amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-1">Date</p>
                              <p className="text-sm font-bold text-zinc-700">{new Date(w.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-1">Method</p>
                              <p className="text-sm font-bold text-zinc-700 uppercase">{w.method.replace('_', ' ')}</p>
                            </div>
                            {w.accountDetails && (
                              <div className="col-span-2">
                                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-1">Account Details</p>
                                <p className="text-sm font-bold text-zinc-900">{w.accountDetails.accountTitle}</p>
                                <p className="text-xs font-mono text-zinc-500">{w.accountDetails.accountNumber}</p>
                                {w.accountDetails.bankName && (
                                  <p className="text-[10px] text-zinc-400 font-bold italic">{w.accountDetails.bankName}</p>
                                )}
                              </div>
                            )}
                            {w.adminNotes && (
                              <div className="col-span-2">
                                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-1">Admin Notes</p>
                                <p className="text-sm text-zinc-700">{w.adminNotes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
