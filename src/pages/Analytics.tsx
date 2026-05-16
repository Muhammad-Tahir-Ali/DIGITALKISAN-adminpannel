import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface AnalyticsData {
  dailyRevenue: { date: string; revenue: number }[];
  userGrowth: { date: string; count: number }[];
  topFarmers: { name: string; totalSales: number; rating: number }[];
  topProducts: { title: string; totalOrders: number; revenue: number }[];
  categoryBreakdown: { category: string; count: number; revenue: number }[];
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number | string;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xl text-sm">
        <p className="font-black text-zinc-900 mb-2">{label}</p>
        {payload.map((p: TooltipPayload, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-bold">
            {p.name}: {typeof p.value === 'number' ? `₨ ${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ['#f59e0b', '#10b981', '#f97316', '#6366f1', '#ec4899', '#8b5cf6'];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/analytics');
      setData(res.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Analytics Error</h2>
        <p className="text-slate-500 mt-1">{error}</p>
        <button onClick={fetchAnalytics} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold"><RefreshCcw className="w-4 h-4" /> Retry</button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const { dailyRevenue, topFarmers, topProducts, categoryBreakdown, userGrowth } = data;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Platform Analytics</h2>
          <p className="text-zinc-500 font-medium mt-1">Real-time performance and ecosystem growth</p>
        </div>
        <button onClick={fetchAnalytics} className="p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 shadow-sm"><RefreshCcw className="w-5 h-5 text-zinc-600" /></button>
      </div>

      {/* Chart Row 1: Daily Revenue & User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm">
          <h3 className="text-xl font-black text-zinc-900 mb-1">Daily Revenue</h3>
          <p className="text-zinc-400 text-sm font-medium mb-8">Revenue from released funds (Last 30 days)</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dailyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm">
          <h3 className="text-xl font-black text-zinc-900 mb-1">User Growth</h3>
          <p className="text-zinc-400 text-sm font-medium mb-8">New registrations (Last 30 days)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Bar dataKey="count" name="Users" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-50"><h3 className="text-xl font-black text-zinc-900">Top 5 Farmers</h3></div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                <th className="px-8 py-4">Name</th>
                <th className="px-8 py-4">Total Sales</th>
                <th className="px-8 py-4 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {topFarmers.map((f: { name: string; totalSales: number; rating: number }, i: number) => (
                <tr key={i} className="hover:bg-zinc-50/30">
                  <td className="px-8 py-4 font-bold text-zinc-900 text-sm">{f.name}</td>
                  <td className="px-8 py-4 font-black text-emerald-600 text-sm">₨ {f.totalSales.toLocaleString()}</td>
                  <td className="px-8 py-4 text-right text-sm font-bold text-amber-500">★ {f.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-50"><h3 className="text-xl font-black text-zinc-900">Top 5 Products</h3></div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                <th className="px-8 py-4">Title</th>
                <th className="px-8 py-4">Orders</th>
                <th className="px-8 py-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {topProducts.map((p: { title: string; totalOrders: number; revenue: number }, i: number) => (
                <tr key={i} className="hover:bg-zinc-50/30">
                  <td className="px-8 py-4 font-bold text-zinc-900 text-sm">{p.title}</td>
                  <td className="px-8 py-4 font-bold text-zinc-600 text-sm">{p.totalOrders}</td>
                  <td className="px-8 py-4 text-right font-black text-emerald-600 text-sm">₨ {p.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Category Mix */}
      <div className="bg-zinc-900 p-8 rounded-[32px] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <h3 className="text-xl font-black text-white relative z-10 mb-8">Category Breakdown</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="revenue" nameKey="category">
                  {categoryBreakdown.map((_: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | string) => [`₨ ${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {categoryBreakdown.map((item: { category: string; revenue: number; count: number }, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-zinc-400 font-bold capitalize">{item.category}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-sm">₨ {item.revenue.toLocaleString()}</p>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase">{item.count} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
