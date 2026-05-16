import { useState, useEffect, useMemo } from 'react';
import { ArrowDown, ArrowUp, Download, Search, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { WalletTransaction } from '../types';

type TabFilter = 'All' | 'credit' | 'debit';

const TYPE_LABELS: Record<string, string> = {
  escrow_lock: 'Escrow Lock',
  escrow_release: 'Escrow Release',
  order_refund: 'Order Refund',
  withdrawal: 'Withdrawal',
  deposit: 'Deposit',
  stripe_topup: 'Stripe Top-up',
};

export default function Transactions() {
  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('All');

  const fetchTxs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/transactions');
      setTxs(res.data.data.transactions);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to fetch transaction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, []);

  const filtered = useMemo(() => {
    return txs.filter(tx => {
      const q = search.toLowerCase();
      const matchesSearch =
        tx._id.toLowerCase().includes(q) ||
        (tx.user?.name?.toLowerCase().includes(q) ?? false) ||
        (tx.description?.toLowerCase().includes(q) ?? false) ||
        tx.type.toLowerCase().includes(q);
      const matchesTab = activeTab === 'All' || tx.direction === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [txs, search, activeTab]);

  const totalCredits = txs.filter(t => t.direction === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebits = txs.filter(t => t.direction === 'debit').reduce((s, t) => s + t.amount, 0);

  const tabs: { id: TabFilter; label: string }[] = [
    { id: 'All', label: 'All' },
    { id: 'credit', label: 'Credits' },
    { id: 'debit', label: 'Debits' },
  ];

  const escapeCSV = (val: unknown): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'User', 'Type', 'Description', 'Direction', 'Amount', 'Balance After', 'Status', 'Date'],
      ...txs.map(t => [
        t._id,
        t.user?.name || '',
        t.type,
        t.description || '',
        t.direction,
        t.amount,
        t.balanceAfter ?? '',
        t.status,
        new Date(t.createdAt).toLocaleDateString(),
      ]),
    ].map(r => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wallet-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Fetch Error</h2>
        <p className="text-slate-500 mt-1">{error}</p>
        <button onClick={fetchTxs} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold">
          <RefreshCcw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Wallet Ledger</h2>
          <p className="text-zinc-500 font-medium mt-1">All platform wallet movements and escrow activity</p>
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
          <p className="text-emerald-200 text-xs font-black uppercase tracking-widest">Total Credits</p>
          <h3 className="text-3xl font-black mt-2">₨ {totalCredits.toLocaleString()}</h3>
        </div>
        <div className="bg-rose-600 p-8 rounded-[32px] text-white shadow-xl shadow-rose-600/20">
          <p className="text-rose-200 text-xs font-black uppercase tracking-widest">Total Debits</p>
          <h3 className="text-3xl font-black mt-2">₨ {totalDebits.toLocaleString()}</h3>
        </div>
        <div className="bg-white border border-zinc-100 p-8 rounded-[32px] shadow-sm">
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Total Entries</p>
          <h3 className="text-3xl font-black mt-2 text-zinc-900">
            {txs.length} <span className="text-sm font-medium text-zinc-400 italic">records</span>
          </h3>
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
              placeholder="Search by user, type, or description..."
              className="bg-transparent text-xs outline-none w-full font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50/50">
                <th className="px-8 py-5">Tx ID</th>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Description</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Balance After</th>
                <th className="px-8 py-5 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-zinc-400 text-sm font-medium">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx._id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-8 py-6 text-xs font-black text-zinc-400 italic">#{tx._id.slice(-6)}</td>
                    <td className="px-8 py-6 text-sm font-bold text-zinc-900">{tx.user?.name || 'System'}</td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                        {TYPE_LABELS[tx.type] || tx.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs text-zinc-500 max-w-[240px] truncate">{tx.description || '—'}</td>
                    <td className="px-8 py-6">
                      <span className={`flex items-center gap-1 text-sm font-black ${tx.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.direction === 'credit'
                          ? <ArrowDown className="w-3.5 h-3.5" />
                          : <ArrowUp className="w-3.5 h-3.5" />}
                        ₨ {tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-zinc-700">
                      {tx.balanceAfter != null ? `₨ ${tx.balanceAfter.toLocaleString()}` : '—'}
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
