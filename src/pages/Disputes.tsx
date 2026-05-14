import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Search, ExternalLink, RefreshCcw } from 'lucide-react';
import api from '../lib/api';
import type { Dispute } from '../types';

export default function Disputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Dispute | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/disputes');
      setDisputes(response.data.data.disputes);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchDisputes(), 0);
  }, []);

  const filtered = useMemo(() => {
    return disputes.filter(d => {
      const q = search.toLowerCase();
      const matchesSearch =
        d._id.toLowerCase().includes(q) ||
        (d.buyer?.name?.toLowerCase().includes(q) ?? false) ||
        (d.farmer?.name?.toLowerCase().includes(q) ?? false) ||
        (d.product?.title?.toLowerCase().includes(q) ?? false);
      return matchesSearch;
    });
  }, [disputes, search]);

  const resolve = async (id: string, resolution: 'release_farmer' | 'refund_buyer') => {
    if (!confirm(`Confirm dispute resolution: ${resolution.replace('_', ' ')}?`)) return;
    try {
      await api.post(`/admin/disputes/${id}/resolve`, { resolution });
      setDisputes(prev => prev.filter(d => d._id !== id));
      setSelected(null);
      alert('Dispute resolved successfully.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to resolve dispute');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Fetch Error</h2>
        <p className="text-slate-500 mt-1">{error}</p>
        <button onClick={fetchDisputes} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold"><RefreshCcw className="w-4 h-4" /> Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Dispute Resolution</h2>
          <p className="text-zinc-500 font-medium mt-1">
            Manage trade disputes and platform arbitration
            {disputes.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs font-black">
                {disputes.length} active
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-4 bg-zinc-50/50">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search disputes..."
              className="text-xs outline-none w-full font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50/30">
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Buyer</th>
                <th className="px-8 py-5">Farmer</th>
                <th className="px-8 py-5">Product</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-zinc-400 text-sm font-medium">No active disputes found</td>
                </tr>
              ) : (
                filtered.map((dispute) => (
                  <tr key={dispute._id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-5 text-xs font-black text-zinc-400 italic">#{dispute._id.slice(-6)}</td>
                    <td className="px-8 py-5 text-sm font-bold text-zinc-900">{dispute.buyer?.name || 'Unknown'}</td>
                    <td className="px-8 py-5 text-sm font-bold text-zinc-900">{dispute.farmer?.name || 'Unknown'}</td>
                    <td className="px-8 py-5 text-sm text-zinc-600">{dispute.product?.title || 'Deleted Product'}</td>
                    <td className="px-8 py-5 text-sm font-black text-emerald-600">₨ {dispute.totalPrice.toLocaleString()}</td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => setSelected(dispute)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900">Resolve Dispute</h3>
                <p className="text-zinc-400 text-sm">Order #{selected._id.slice(-6)}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-zinc-50 rounded-2xl space-y-2 text-sm">
                <div className="flex justify-between font-bold"><span className="text-zinc-500 font-medium">Buyer</span><span>{selected.buyer?.name}</span></div>
                <div className="flex justify-between font-bold"><span className="text-zinc-500 font-medium">Farmer</span><span>{selected.farmer?.name}</span></div>
                <div className="flex justify-between font-bold"><span className="text-zinc-500 font-medium">Amount</span><span className="text-emerald-600">₨ {selected.totalPrice.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => resolve(selected._id, 'release_farmer')}
                className="py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
              >
                Release to Farmer
              </button>
              <button 
                onClick={() => resolve(selected._id, 'refund_buyer')}
                className="py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors"
              >
                Refund Buyer
              </button>
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-3 py-3 bg-zinc-100 text-zinc-700 rounded-xl font-bold text-sm hover:bg-zinc-200">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
