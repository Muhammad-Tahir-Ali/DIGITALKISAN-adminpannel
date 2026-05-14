import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Download, Search, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';
import api from '../lib/api';

type TabFilter = 'All' | 'held_in_escrow' | 'released' | 'disputed' | 'refunded';

export default function Transactions() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('All');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/transactions');
      setOrders(res.data.data.transactions);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch transaction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchOrders(), 0);
  }, []);

  const filtered = useMemo(() => {
    return orders.filter(tx => {
      const q = search.toLowerCase();
      const matchesSearch =
        tx._id.toLowerCase().includes(q) ||
        tx.payer?.name.toLowerCase().includes(q) ||
        tx.payees?.some((p: { user?: { name: string } }) => p.user?.name.toLowerCase().includes(q));
      const matchesTab = activeTab === 'All' || tx.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [orders, search, activeTab]);


  const totalRevenue = orders.filter(t => t.status === 'released').reduce((s, t) => s + t.totalAmount, 0);
  const totalEscrow = orders.filter(t => ['held_in_escrow'].includes(t.status)).reduce((s, t) => s + t.totalAmount, 0);

  const tabs: {id: TabFilter, label: string}[] = [
    { id: 'All', label: 'All' },
    { id: 'held_in_escrow', label: 'Escrow' },
    { id: 'released', label: 'Released' },
    { id: 'disputed', label: 'Disputed' },
    { id: 'refunded', label: 'Refunded' }
  ];

  const handleExport = () => {
    const csv = [
      ['ID', 'Farmer', 'Buyer', 'Product', 'Amount', 'Status', 'Date'],
      ...orders.map(t => [t._id, t.farmer?.name, t.buyer?.name, t.product?.title, t.totalPrice, t.status, new Date(t.createdAt).toLocaleDateString()])
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
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
        <button onClick={fetchOrders} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold"><RefreshCcw className="w-4 h-4" /> Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Financial Monitoring</h2>
          <p className="text-zinc-500 font-medium mt-1">Real-time audit of ecosystem trades and escrow funds</p>
        </div>
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-emerald-600 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-600/20">
          <p className="text-emerald-200 text-xs font-black uppercase tracking-widest">Total Released</p>
          <h3 className="text-3xl font-black mt-2">₨ {totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-zinc-900 p-8 rounded-[32px] text-white shadow-xl shadow-zinc-900/20">
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Locked in Escrow</p>
          <h3 className="text-3xl font-black mt-2">₨ {totalEscrow.toLocaleString()}</h3>
        </div>
        <div className="bg-white border border-zinc-100 p-8 rounded-[32px] shadow-sm">
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Total Trade Volume</p>
          <h3 className="text-3xl font-black mt-2 text-zinc-900">{orders.length} <span className="text-sm font-medium text-zinc-400 italic">orders</span></h3>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === tab.id ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 min-w-[280px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by product, user, or ID..."
              className="bg-transparent text-xs outline-none w-full font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50/50">
                <th className="px-8 py-5">Tx ID</th>
                <th className="px-8 py-5">Participants</th>
                <th className="px-8 py-5">Product</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-zinc-400 text-sm font-medium">No transactions found</td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx._id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-8 py-6 text-xs font-black text-zinc-400 italic">#{tx._id.slice(-6)}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-zinc-900">
                        {tx.payer?.name || 'Unknown'}
                        <ArrowRight className="w-3 h-3 text-zinc-300" />
                        {tx.payees?.[0]?.user?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-zinc-700">{tx.order?.product?.title || 'System Tx'}</span>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-zinc-900">₨ {tx.totalAmount.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                        tx.status === 'released' ? 'bg-emerald-100 text-emerald-700' :
                        tx.status === 'held_in_escrow' ? 'bg-blue-100 text-blue-700' :
                        tx.status === 'disputed'  ? 'bg-rose-100 text-rose-700' :
                        'bg-zinc-100 text-zinc-500'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-zinc-400 text-right">
                      {new Date(tx.createdAt).toLocaleDateString('en-PK')}
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
