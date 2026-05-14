import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  AlertCircle,
  BarChart3,
  LogOut,
  Leaf,
  Bell,
  Search,
  ChevronRight,
  Settings,
  X,
  Package,
  ShoppingBag,
  ShieldCheck,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react';
import { authService } from '../../lib/auth';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', description: 'Overview & metrics' },
  { name: 'Users', icon: Users, path: '/users', description: 'Manage accounts' },
  { name: 'Products', icon: Package, path: '/products', description: 'Inventory management' },
  { name: 'Orders', icon: ShoppingBag, path: '/orders', description: 'Customer purchases' },
  { name: 'Verification', icon: ShieldCheck, path: '/verification', description: 'Farmer approvals' },
  { name: 'Transactions', icon: ArrowLeftRight, path: '/transactions', description: 'Financial monitoring' },
  { name: 'Deposits', icon: PlusCircle, path: '/deposits', description: 'Top-up approvals' },
  { name: 'Withdrawals', icon: ArrowUpRight, path: '/withdrawals', description: 'Payout management' },
  { name: 'Disputes', icon: AlertCircle, path: '/disputes', description: 'Conflict resolution' },
  { name: 'Analytics', icon: BarChart3, path: '/analytics', description: 'Performance insights' },
];

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/users':        'User Management',
  '/products':     'Product Inventory',
  '/orders':       'Order Monitoring',
  '/verification': 'Farmer Verification',
  '/transactions': 'Financial Monitoring',
  '/deposits':     'Wallet Deposits',
  '/withdrawals':  'Payout Management',
  '/disputes':     'Dispute Resolution',
  '/analytics':    'Platform Analytics',
};

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminLayout({ children }: LayoutProps) {
  const location = useLocation();
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const currentTitle = ROUTE_TITLES[location.pathname] || 'Admin';

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      setNotifications(res.data.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchNotifications(), 0);
    const interval = setInterval(fetchNotifications, 60000); // Polling every minute
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar and Main Content structure... */}
      {/* (omitting sidebar code for brevity in this replace block, focusing on the header changes) */}
      <aside className="w-64 bg-zinc-950 flex flex-col border-r border-zinc-900 flex-shrink-0">
        <div className="px-6 py-7 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-[15px] tracking-tight">DigitalKisan</p>
              <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.15em] px-3 mb-3">Main Menu</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 rounded-r-full" />
                  )}
                  <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} style={{ width: 18, height: 18 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className={`text-[10px] font-medium truncate mt-0.5 ${isActive ? 'text-emerald-500/70' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800/60 transition-colors group mb-2 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-300 text-sm font-semibold truncate leading-tight">Admin User</p>
              <p className="text-zinc-600 text-[10px] font-medium truncate">Super Administrator</p>
            </div>
            <Settings className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 transition-colors" />
          </div>
          <button
            onClick={() => authService.logout()}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200/70 px-8 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">Console</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-900 font-bold">{currentTitle}</span>
          </div>

          <div className="flex items-center gap-3">
            {!searching ? (
              <button
                onClick={() => setSearching(true)}
                className="flex items-center gap-2 px-4 py-2 text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium transition-all"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:block">Quick search...</span>
                <kbd className="hidden sm:flex h-5 items-center gap-0.5 rounded border border-slate-300 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-500">⌘K</kbd>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-400 rounded-xl shadow-sm shadow-emerald-500/10 w-72 animate-fade-in">
                <Search className="w-4 h-4 text-emerald-500" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search farmers, transactions..."
                  className="flex-1 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none bg-transparent"
                />
                <button onClick={() => { setSearching(false); setSearchQuery(''); }}>
                  <X className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors" />
                </button>
              </div>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all relative ${
                  showNotifications ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-[pulse-dot_2s_ease_infinite]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between">
                    <p className="text-sm font-black text-slate-900">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{unreadCount} NEW</span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-xs font-bold text-slate-400 italic">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n._id} 
                          onClick={() => !n.isRead && markAsRead(n._id)}
                          className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${!n.isRead ? 'bg-emerald-50/30' : ''}`}
                        >
                          <p className={`text-xs leading-relaxed ${!n.isRead ? 'font-black text-slate-900' : 'font-semibold text-slate-500'}`}>{n.message}</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 pt-2 pb-1 text-center">
                    <button className="text-[11px] font-black text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">View all alerts</button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200" />

            {/* Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">Admin</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Super Admin</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-emerald-500/20">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8 animate-fade-in">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
