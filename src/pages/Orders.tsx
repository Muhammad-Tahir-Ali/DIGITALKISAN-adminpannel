import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, User, ExternalLink } from 'lucide-react';
import api from '../lib/api';
import { Order } from '../types';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  bidding: 'bg-violet-100 text-violet-700',
  in_transit: 'bg-orange-100 text-orange-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  disputed: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-zinc-100 text-zinc-500'
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/orders', { params: { status } });
      setOrders(res.data.data.orders);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(), 0);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const updateStatus = async (id: string, newStatus: string) => {
    const confirmed = window.confirm(`Change order status to "${newStatus}"?`);
    if (!confirmed) return;
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to update order status');
    }
  };

  if (loading && orders.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Order Management</h2>
          <p className="text-zinc-500 font-medium mt-1">Monitor and manage all platform sales and logistics</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm overflow-x-auto">
        {['', 'pending', 'paid', 'bidding', 'in_transit', 'delivered', 'disputed', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              status === s ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-50'
            }`}
          >
            {s || 'All Orders'}
          </button>
        ))}
      </div>

      {error ? (
        <div className="p-12 text-center bg-rose-50 rounded-[32px]">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
          <p className="text-rose-800 font-bold">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                <th className="px-8 py-5">Order ID</th>
                <th className="px-8 py-5">Buyer & Farmer</th>
                <th className="px-8 py-5">Product</th>
                <th className="px-8 py-5">Total</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-zinc-400">No orders found</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order._id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-xs font-black text-zinc-400 italic">#{order._id.slice(-6)}</p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                          <User className="w-3 h-3 text-blue-500" /> {order.buyer?.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                          <User className="w-3 h-3 text-emerald-500" /> {order.farmer?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-zinc-700">{order.product?.title}</p>
                      <p className="text-[10px] font-medium text-zinc-400">{order.quantity} units</p>
                    </td>
                    <td className="px-8 py-5 font-black text-zinc-900 text-sm">₨ {order.totalPrice?.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order._id, e.target.value)}
                        className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg outline-none border-none cursor-pointer ${statusColors[order.status] || 'bg-zinc-100 text-zinc-500'}`}
                      >
                        {Object.keys(statusColors).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-zinc-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
