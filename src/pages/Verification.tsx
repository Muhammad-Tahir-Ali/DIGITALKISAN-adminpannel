import { useState, useEffect, useMemo } from 'react';
import {
  Search, CheckCircle, Clock, UserX, Eye, AlertTriangle,
  Loader2, X, ZoomIn, FileText, Shield, ShieldOff, Phone,
  Calendar, ChevronRight,
} from 'lucide-react';
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

type StatusFilter = 'All' | 'Pending Docs' | 'Approved' | 'Rejected';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: User['docReviewStatus'] }) {
  if (status === 'pending_review')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100">
        <Clock className="w-3 h-3" /> Pending Review
      </span>
    );
  if (status === 'approved')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
        <CheckCircle className="w-3 h-3" /> Approved
      </span>
    );
  if (status === 'rejected')
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">
        <UserX className="w-3 h-3" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-zinc-100 text-zinc-400">
      N/A
    </span>
  );
}

// ── Document card ─────────────────────────────────────────────────────────────
function DocCard({
  label,
  src,
  onZoom,
  required,
}: {
  label: string;
  src?: string;
  onZoom: (s: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5 text-zinc-400" />
        <span className="text-xs font-black text-zinc-500 uppercase tracking-wider">{label}</span>
        {required && <span className="text-[10px] text-rose-400 font-bold">(required)</span>}
      </div>
      {src ? (
        <div className="relative group rounded-2xl overflow-hidden border-2 border-zinc-100 bg-zinc-50 shadow-sm">
          <img
            src={src}
            alt={label}
            className="w-full h-52 object-cover"
          />
          <button
            onClick={() => onZoom(src)}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <div className="bg-white/90 rounded-xl px-3 py-2 flex items-center gap-2 text-zinc-800 text-xs font-bold shadow">
              <ZoomIn className="w-4 h-4" /> View Full Size
            </div>
          </button>
        </div>
      ) : (
        <div className="w-full h-52 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center gap-2 text-zinc-300">
          <FileText className="w-8 h-8" />
          <span className="text-xs font-bold text-zinc-400">Not provided</span>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Verification() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');

  // modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [farmerDocs, setFarmerDocs] = useState<FarmerDocuments | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);

  // lightbox
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // review
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/users', { params: { role: 'farmer' } });
      setUsers(res.data.data.users);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to fetch farmers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter(f => {
      const q = search.toLowerCase();
      const matchesSearch = f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q);
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Pending Docs' && f.docReviewStatus === 'pending_review') ||
        (activeFilter === 'Approved' && f.docReviewStatus === 'approved') ||
        (activeFilter === 'Rejected' && f.docReviewStatus === 'rejected');
      return matchesSearch && matchesFilter;
    });
  }, [users, search, activeFilter]);

  const pendingCount = users.filter(u => u.docReviewStatus === 'pending_review').length;

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openModal = async (user: User) => {
    setSelectedUser(user);
    setFarmerDocs(null);
    setRejectNote('');
    setShowRejectInput(false);
    setActionResult(null);
    if (user.role !== 'farmer') return;
    setDocsLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}/documents`);
      setFarmerDocs(res.data.data.farmerDocuments ?? {});
    } catch {
      setFarmerDocs({});
    } finally {
      setDocsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setFarmerDocs(null);
    setRejectNote('');
    setShowRejectInput(false);
    setActionResult(null);
  };

  // ── Submit review ───────────────────────────────────────────────────────────
  const submitReview = async (action: 'approve' | 'reject') => {
    if (!selectedUser) return;
    if (action === 'reject' && rejectNote.trim().length < 5) {
      setActionResult({ type: 'error', msg: 'Please enter a rejection reason (at least 5 characters).' });
      return;
    }
    setReviewLoading(true);
    setActionResult(null);
    try {
      const res = await api.patch(`/admin/users/${selectedUser._id}/doc-review`, {
        action,
        ...(action === 'reject' ? { note: rejectNote.trim() } : {}),
      });
      const updatedUser: User = res.data.data.user;
      // Update the list row
      setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
      // Show success briefly, then close
      setActionResult({
        type: 'success',
        msg: action === 'approve'
          ? `${updatedUser.name}'s account has been approved.`
          : `${updatedUser.name}'s documents have been rejected.`,
      });
      setTimeout(() => closeModal(), 1400);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setActionResult({ type: 'error', msg: e.response?.data?.message || 'Action failed. Please try again.' });
    } finally {
      setReviewLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Load Failed</h2>
        <p className="text-slate-500 mt-1">{error}</p>
        <button onClick={fetchUsers} className="mt-6 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-sm">
          Retry
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Farmer Verification</h2>
          <p className="text-zinc-500 font-medium mt-1">Review CNIC and land documents submitted by farmers</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-amber-700">{pendingCount} awaiting review</span>
          </div>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-[32px] border border-zinc-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between flex-wrap gap-3 bg-zinc-50/40">
          <div className="flex gap-1.5 flex-wrap">
            {(['All', 'Pending Docs', 'Approved', 'Rejected'] as StatusFilter[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeFilter === tab
                    ? 'bg-zinc-900 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {tab}
                {tab === 'Pending Docs' && pendingCount > 0 && (
                  <span className="ml-1.5 bg-amber-400 text-white text-[9px] font-black rounded-full px-1.5 py-0.5">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 min-w-[220px]">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search farmers..."
              className="text-xs outline-none w-full font-medium bg-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50/30">
                <th className="px-8 py-4">Farmer</th>
                <th className="px-8 py-4">Joined</th>
                <th className="px-8 py-4">Email Verified</th>
                <th className="px-8 py-4">Doc Status</th>
                <th className="px-8 py-4 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-14 text-center text-zinc-400 text-sm font-medium">
                    No farmers match this filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="hover:bg-zinc-50/60 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-sm">
                          {user.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 leading-tight">{user.name}</p>
                          <p className="text-[11px] text-zinc-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-zinc-500 font-medium">
                      {new Date(user.createdAt).toLocaleDateString('en-PK')}
                    </td>
                    <td className="px-8 py-4">
                      {user.isVerified
                        ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
                        : <span className="inline-flex items-center gap-1 text-zinc-400 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Pending</span>
                      }
                    </td>
                    <td className="px-8 py-4">
                      <StatusBadge status={user.docReviewStatus} />
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => openModal(user)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                          <ChevronRight className="w-3 h-3 opacity-60" />
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

      {/* ── Detail slide-in panel ────────────────────────────────────────────── */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm" />

          {/* Panel — slides in from right */}
          <div
            className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="sticky top-0 z-10 bg-white border-b border-zinc-100 px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg">
                  {selectedUser.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 leading-tight">{selectedUser.name}</h3>
                  <p className="text-xs text-zinc-400 font-medium">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-8 py-6 space-y-8">
              {/* Info row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Phone className="w-4 h-4" />, label: 'Phone', value: selectedUser.phone || 'Not provided' },
                  { icon: <Calendar className="w-4 h-4" />, label: 'Joined', value: new Date(selectedUser.createdAt).toLocaleDateString('en-PK') },
                  { icon: <Shield className="w-4 h-4" />, label: 'Email', value: selectedUser.isVerified ? 'Verified ✓' : 'Not verified' },
                  { icon: <FileText className="w-4 h-4" />, label: 'Doc Status', value: selectedUser.docReviewStatus.replace(/_/g, ' ') },
                ].map(row => (
                  <div key={row.label} className="bg-zinc-50 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-zinc-400 mt-0.5">{row.icon}</span>
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">{row.label}</p>
                      <p className="text-sm font-bold text-zinc-800 capitalize">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rejection note (if any) */}
              {selectedUser.docReviewNote && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3">
                  <ShieldOff className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Previous Rejection Reason</p>
                    <p className="text-sm text-rose-700 font-medium">{selectedUser.docReviewNote}</p>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <h4 className="text-sm font-black text-zinc-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  Submitted Documents
                </h4>

                {docsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <p className="text-sm text-zinc-400 font-medium">Loading documents…</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* CNIC front + back side by side */}
                    <div className="grid grid-cols-2 gap-4">
                      <DocCard
                        label="CNIC Front"
                        src={farmerDocs?.cnicFront}
                        onZoom={setLightboxSrc}
                        required
                      />
                      <DocCard
                        label="CNIC Back"
                        src={farmerDocs?.cnicBack}
                        onZoom={setLightboxSrc}
                        required
                      />
                    </div>
                    {/* Land doc full width */}
                    <DocCard
                      label="Land Ownership Document"
                      src={farmerDocs?.landDoc}
                      onZoom={setLightboxSrc}
                    />
                  </div>
                )}
              </div>

              {/* Action result banner */}
              {actionResult && (
                <div className={`rounded-2xl px-5 py-4 flex items-center gap-3 text-sm font-bold ${
                  actionResult.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                    : 'bg-rose-50 border border-rose-100 text-rose-700'
                }`}>
                  {actionResult.type === 'success'
                    ? <CheckCircle className="w-5 h-5 shrink-0" />
                    : <AlertTriangle className="w-5 h-5 shrink-0" />
                  }
                  {actionResult.msg}
                </div>
              )}

              {/* Review actions — only for farmers with non-N/A status */}
              {selectedUser.role === 'farmer' && selectedUser.docReviewStatus !== 'not_required' && !actionResult?.type?.includes('success') && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900">Review Decision</h4>

                  {/* Current status display for already-reviewed */}
                  {selectedUser.docReviewStatus === 'approved' && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <p className="text-sm font-bold text-emerald-700">This account is already approved.</p>
                    </div>
                  )}
                  {selectedUser.docReviewStatus === 'rejected' && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                      <p className="text-xs font-black text-zinc-400 uppercase tracking-wider mb-1">Previously rejected</p>
                      <p className="text-sm font-medium text-zinc-700">You can still approve this farmer if new documents look valid.</p>
                    </div>
                  )}

                  {/* Reject textarea */}
                  {showRejectInput && (
                    <textarea
                      value={rejectNote}
                      onChange={e => setRejectNote(e.target.value)}
                      placeholder="Explain why the documents are rejected (min. 5 characters)…"
                      rows={3}
                      className="w-full border border-zinc-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => submitReview('approve')}
                      disabled={reviewLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm transition-colors disabled:opacity-50"
                    >
                      {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      Approve
                    </button>

                    {!showRejectInput ? (
                      <button
                        onClick={() => setShowRejectInput(true)}
                        disabled={reviewLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl font-bold text-sm transition-colors border border-rose-200 disabled:opacity-50"
                      >
                        <ShieldOff className="w-4 h-4" />
                        Reject
                      </button>
                    ) : (
                      <button
                        onClick={() => submitReview('reject')}
                        disabled={reviewLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm transition-colors disabled:opacity-50"
                      >
                        {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                        Confirm Reject
                      </button>
                    )}
                  </div>
                  {showRejectInput && (
                    <button
                      onClick={() => { setShowRejectInput(false); setRejectNote(''); }}
                      className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-600 font-medium transition-colors"
                    >
                      Cancel rejection
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div className="sticky bottom-0 bg-white border-t border-zinc-100 px-8 py-4">
              <button
                onClick={closeModal}
                className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl font-bold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-6"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            onClick={() => setLightboxSrc(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSrc}
            alt="Document"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
