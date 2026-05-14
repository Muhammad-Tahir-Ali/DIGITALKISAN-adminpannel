import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Users, Package, AlertTriangle,
  Clock, DollarSign, RefreshCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface RecentActivityOrder {
  _id: string;
  buyer?: { name: string };
  farmer?: { name: string };
  product?: { title: string };
  totalPrice?: number;
  status: string;
  createdAt: string;
}

interface DashboardData {
  recentActivity?: RecentActivityOrder[];
  totalRevenue?: number;
  platformFees?: number;
  totalOrders?: number;
  totalUsers?: number;
  ordersByStatus?: Record<string, number>;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [slowStart, setSlowStart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      setSlowStart(false);
      // Show "waking up" banner after 4s (before the retry kicks in at 5s)
      const wakeTimer = setTimeout(() => setSlowStart(true), 4000);
      const response = await api.get('/admin/stats');
      clearTimeout(wakeTimer);
      setSlowStart(false);
      setData(response.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to reach server. The backend may be starting up — please retry in a few seconds.');
    } finally {
      setLoading(false);
      setSlowStart(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => fetchDashboard(), 30000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Dashboard Error</h2>
        <p className="text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry Loading
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        {slowStart && (
          <div className="flex items-center gap-2 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-amber-700 text-sm font-medium">Server is waking up on Render free tier — this takes ~30 seconds on first load.</p>
          </div>
        )}
      </div>
    );
  }

  const stats = data;
  const recentActivity = stats.recentActivity || [];

  // Safe extraction with fallbacks
  const totalRevenue = stats.totalRevenue ?? 0;
  const platformFees = stats.platformFees ?? 0;
  const totalOrders = stats.totalOrders ?? 0;
  const totalUsers = stats.totalUsers ?? 0;
  const obs = stats.ordersByStatus || {};

  const kpiStats = [
    { label: 'Total Revenue', value: `₨ ${totalRevenue.toLocaleString()}`, color: 'emerald', icon: DollarSign },
    { label: 'Platform Fees', value: `₨ ${platformFees.toLocaleString()}`, color: 'blue', icon: TrendingUp },
    { label: 'Total Orders', value: totalOrders.toLocaleString(), color: 'violet', icon: Package },
    { label: 'Total Users', value: totalUsers.toLocaleString(), color: 'amber', icon: Users },
  ];

  const statusBadges = [
    { key: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700' },
    { key: 'paid', label: 'Paid', color: 'bg-blue-100 text-blue-700' },
    { key: 'bidding', label: 'Bidding', color: 'bg-violet-100 text-violet-700' },
    { key: 'in_transit', label: 'In Transit', color: 'bg-orange-100 text-orange-700' },
    { key: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
    { key: 'disputed', label: 'Disputed', color: 'bg-rose-100 text-rose-700' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-slate-100 text-slate-600' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', year: 'numeric' })}</p>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">Admin Overview</h1>
        </div>
        <button
          onClick={fetchDashboard}
          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCcw className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                    stat.color === 'violet' ? 'bg-violet-50 text-violet-600' :
                      'bg-amber-50 text-amber-600'
                }`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders By Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-500" />
          Orders by Status
        </h3>
        <div className="flex flex-wrap gap-3">
          {statusBadges.map(s => (
            <div key={s.key} className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${s.color}`}>
              <span>{s.label}</span>
              <span className="w-6 h-6 bg-white/50 rounded-lg flex items-center justify-center text-xs">{obs[s.key] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-black text-slate-900">Recent Transactions</h3>
          <Link to="/transactions" className="text-emerald-600 font-bold text-xs hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Farmer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">No recent activity found</td>
                </tr>
              ) : (
                recentActivity.map((order: RecentActivityOrder) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-slate-400 italic">#{order._id.slice(-6)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{order.buyer?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{order.farmer?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.product?.title || 'Deleted Product'}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-900">₨ {(order.totalPrice || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusBadges.find(b => b.key === order.status)?.color || 'bg-slate-100 text-slate-600'
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-400 text-right">
                      {new Date(order.createdAt).toLocaleDateString('en-PK')}
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