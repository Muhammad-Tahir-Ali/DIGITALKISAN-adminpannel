import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, Clock, UserX, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../lib/api';

interface FarmerDocuments {
  cnicFront?: string;
  cnicBack?: string;
  landDoc?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  docReviewStatus: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  docReviewNote?: string;
  phone?: string;
  createdAt: string;
}

type StatusFilter = 'All' | 'Pending Docs' | 'Verified' | 'Pending';

export default function Verification() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [farmerDocs, setFarmerDocs] = useState<FarmerDocuments | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/users', { params: { role: 'farmer' } });
      setUsers(response.data.data.users);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to fetch verification list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(f => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Pending' && !f.isVerified) ||
        (activeFilter === 'Verified' && f.isVerified) ||
        (activeFilter === 'Pending Docs' && f.docReviewStatus === 'pending_review');
      return matchesSearch && matchesFilter;
    });
  }, [users, search, activeFilter]);

  const openModal = async (user: User) => {
    setSelectedUser(user);
    setFarmerDocs(null);
    setRejectNote('');
    setShowRejectInput(false);
    if (user.role !== 'farmer') return;
    setDocsLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}/documents`);
      setFarmerDocs(res.data.data.farmerDocuments);
    } catch {
      setFarmerDocs({});
    } finally {
      setDocsLoading(false);
    }
  };

  const submitReview = async (action: 'approve' | 'reject') => {
    if (!selectedUser) return;
    if (action === 'reject' && rejectNote.trim().length < 5) {
      alert('Please enter a rejection reason (at least 5 characters)');
      return;
    }
    setReviewLoading(true);
    try {
      const res = await api.patch(`/admin/users/${selectedUser._id}/doc-review`, {
        action,
        ...(action === 'reject' ? { note: rejectNote.trim() } : {}),
      });
      const updatedUser = res.data.data.user;
      setUsers(prev => prev.map(u => u._id === selectedUser._id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setShowRejectInput(false);
      setRejectNote('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || 'Action failed');
    } finally {
      setReviewLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Fetch Error</h2>
        <p className="text-slate-500 mt-1">{error}</p>
        <button onClick={fetchUsers} className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold">Retry</button>
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
      <div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Farmer Verification</h2>
        <p className="text-zinc-500 font-medium mt-1">Review and manage farmer credentials</p>
      </div>

      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-4 bg-zinc-50/50">
          <div className="flex gap-2">
            {(['All', 'Pending Docs', 'Verified', 'Pending'] as StatusFilter[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeFilter === tab ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search farmers..."
              className="text-xs outline-none w-full font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50/30">
                <th className="px-8 py-5">Farmer Info</th>
                <th className="px-8 py-5">Join Date</th>
                <th className="px-8 py-5">Doc Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-12 text-center text-zinc-400 text-sm font-medium">No farmers found</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-xs">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{user.name}</p>
                          <p className="text-[10px] font-bold text-zinc-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-zinc-600">{new Date(user.createdAt).toLocaleDateString('en-PK')}</td>
                    <td className="px-8 py-5">
                      {user.docReviewStatus === 'pending_review' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600">
                          <Clock className="w-3 h-3" /> Pending Docs
                        </div>
                      )}
                      {user.docReviewStatus === 'approved' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </div>
                      )}
                      {user.docReviewStatus === 'rejected' && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-600">
                          <UserX className="w-3 h-3" /> Rejected
                        </div>
                      )}
                      {(user.docReviewStatus === 'not_required' || !user.docReviewStatus) && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-zinc-100 text-zinc-400">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(user)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Farmer Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-xl">
                {selectedUser.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900">{selectedUser.name}</h3>
                <p className="text-zinc-500 font-medium text-sm">{selectedUser.email}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-6">
              {([
                { label: 'Phone', value: selectedUser.phone || 'Not provided' },
                { label: 'Joined', value: new Date(selectedUser.createdAt).toLocaleDateString('en-PK') },
                { label: 'Doc Status', value: (selectedUser.docReviewStatus || 'N/A').replace('_', ' ') },
                ...(selectedUser.docReviewNote ? [{ label: 'Reject Reason', value: selectedUser.docReviewNote }] : []),
              ] as { label: string; value: string }[]).map(row => (
                <div key={row.label} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                  <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">{row.label}</span>
                  <span className="text-sm font-bold text-zinc-900 capitalize">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Documents */}
            {selectedUser.role === 'farmer' && (
              <div className="mb-6">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Submitted Documents</h4>
                {docsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'CNIC Front', src: farmerDocs?.cnicFront },
                      { label: 'CNIC Back', src: farmerDocs?.cnicBack },
                      { label: 'Land Doc', src: farmerDocs?.landDoc },
                    ].map(doc => (
                      <div key={doc.label} className="text-center">
                        <p className="text-[10px] font-bold text-zinc-400 mb-1">{doc.label}</p>
                        {doc.src ? (
                          <img
                            src={doc.src}
                            alt={doc.label}
                            className="w-full h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity border border-zinc-200"
                            onClick={() => setLightboxSrc(doc.src!)}
                          />
                        ) : (
                          <div className="w-full h-20 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-300">
                            <Eye className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Decision Buttons */}
            {selectedUser.role === 'farmer' && selectedUser.docReviewStatus !== 'not_required' && (
              <div className="space-y-3">
                {showRejectInput && (
                  <textarea
                    value={rejectNote}
                    onChange={e => setRejectNote(e.target.value)}
                    placeholder="Rejection reason (required, min 5 chars)..."
                    className="w-full border border-zinc-200 rounded-xl p-3 text-sm outline-none resize-none h-20"
                  />
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => submitReview('approve')}
                    disabled={reviewLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    {reviewLoading ? '...' : 'Approve'}
                  </button>
                  {!showRejectInput ? (
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="flex-1 py-3 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors"
                    >
                      Reject
                    </button>
                  ) : (
                    <button
                      onClick={() => submitReview('reject')}
                      disabled={reviewLoading}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                    >
                      {reviewLoading ? '...' : 'Confirm Reject'}
                    </button>
                  )}
                </div>
              </div>
            )}

            <button onClick={() => setSelectedUser(null)} className="mt-4 w-full py-2.5 bg-zinc-100 text-zinc-700 rounded-xl font-bold text-sm">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="Document" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}
