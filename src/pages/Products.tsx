import React, { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Edit3, Loader2, AlertTriangle, RefreshCcw, Package, Tag, User } from 'lucide-react';
import api from '../lib/api';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/products', { params: { search, category } });
      setProducts(res.data.data.products);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 500);
    return () => clearTimeout(timer);
  }, [search, category]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/products/${id}/status`, { status });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, status } : p));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  if (loading && products.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Product Catalog</h2>
          <p className="text-zinc-500 font-medium mt-1">Manage all listings and marketplace inventory</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none"
        >
          <option value="">All Categories</option>
          <option value="grains">Grains</option>
          <option value="vegetables">Vegetables</option>
          <option value="fruits">Fruits</option>
          <option value="pulses">Pulses</option>
        </select>
        <button onClick={fetchProducts} className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-400 hover:text-emerald-500"><RefreshCcw className="w-4 h-4" /></button>
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
                <th className="px-8 py-5">Product Info</th>
                <th className="px-8 py-5">Farmer</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Price</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {products.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-12 text-center text-zinc-400">No products found</td></tr>
              ) : (
                products.map(product => (
                  <tr key={product._id} className="hover:bg-zinc-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{product.title}</p>
                          <p className="text-[10px] font-medium text-zinc-400 capitalize">{product.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-zinc-700">{product.farmer?.name || 'Unknown'}</td>
                    <td className="px-8 py-5 text-xs font-black uppercase text-zinc-400 tracking-wider">{product.category}</td>
                    <td className="px-8 py-5 font-black text-zinc-900 text-sm">₨ {product.pricePerUnit?.toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <select
                        value={product.status}
                        onChange={e => updateStatus(product._id, e.target.value)}
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg outline-none border-none cursor-pointer ${
                          product.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          product.status === 'sold_out' ? 'bg-amber-100 text-amber-700' :
                          'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                        <option value="sold_out">Sold Out</option>
                      </select>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => deleteProduct(product._id)} className="p-2 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
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
