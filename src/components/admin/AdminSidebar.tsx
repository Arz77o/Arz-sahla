import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Users, 
  Bell, 
  Settings, 
  LogOut,
  Dot,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead } = useAdminNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'لوحة التحكم', path: '/admin', icon: LayoutDashboard },
    { name: 'الطلبات', path: '/admin/orders', icon: ShoppingCart },
    { name: 'المنتجات', path: '/admin/products', icon: Package },
    { name: 'الفئات', path: '/admin/categories', icon: Tags },
    { name: 'العملاء', path: '/admin/customers', icon: Users },
    { name: 'الإعدادات', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Toggle Button (Floating) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "bg-gray-900 text-white flex flex-col min-h-screen transition-all duration-300 z-50",
        "fixed inset-y-0 right-0 lg:static lg:w-64 w-72 lg:translate-x-0 overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-blue-500">Sahla Admin</Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-800 flex items-center justify-between group relative">
          <div className="flex-1 overflow-hidden">
            <div className="text-sm text-gray-400">مرحباً،</div>
            <div className="font-medium truncate text-[11px]">{user?.email}</div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              if (!showNotifications) markAsRead();
            }}
            className="relative p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-lg"
            title="التنبيهات"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 text-gray-900 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold">التنبيهات</span>
                <button onClick={() => markAsRead()} className="text-[10px] text-blue-600 hover:underline">تحديد كـ مقروء</button>
              </div>
              <div className="max-h-[350px] overflow-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">لا توجد تنبيهات</div>
                ) : notifications.map((n) => (
                  <Link 
                    key={n.id} 
                    to={n.link || '#'} 
                    onClick={() => {
                      setShowNotifications(false);
                      setIsOpen(false);
                    }}
                    className="p-4 flex gap-3 hover:bg-blue-50/50 transition-colors border-b border-gray-50 last:border-0 text-right"
                  >
                    <div className={`p-2 rounded-xl h-fit ${n.type === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-gray-900 flex items-center gap-1">
                        {n.title}
                        {!n.read && <Dot className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 px-3 py-2 w-full text-right rounded-md text-red-400 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
};
