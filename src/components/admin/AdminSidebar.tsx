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
  X,
  Calculator
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
    { name: 'لوحة التحكم / Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'الطلبات / Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'المنتجات / Products', path: '/admin/products', icon: Package },
    { name: 'الفئات / Categories', path: '/admin/categories', icon: Tags },
    { name: 'العملاء / Customers', path: '/admin/customers', icon: Users },
    { name: 'حاسبة التسعير / Pricing', path: '/admin/pricing-calculator', icon: Calculator },
    { name: 'الإعدادات / Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Toggle Button (Floating) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-60">
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
        "bg-gray-950 text-white flex flex-col min-h-screen transition-all duration-300 z-50 border-l border-gray-800/80",
        "fixed inset-y-0 right-0 lg:static lg:w-64 w-72 lg:translate-x-0",
        isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between shrink-0">
          <Link to="/" className="text-xl font-display font-bold text-blue-400 tracking-tight">Sahla Admin Panel</Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-800 flex items-center justify-between group relative shrink-0">
          <div className="flex-1 overflow-hidden">
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Welcome / مرحبا</div>
            <div className="font-medium truncate text-[11px]">{user?.user_metadata?.full_name || user?.email}</div>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAsRead();
              }}
              className="relative p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-lg group"
              title="التنبيهات"
            >
              <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse"></span>
              )}
            </button>

            {/* Notifications Dropdown - Positioned left of sidebar on desktop */}
            {showNotifications && (
              <div className="absolute top-full left-0 lg:left-auto lg:right-0 mt-4 w-80 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 text-gray-900 z-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-5 bg-gray-100/50 border-b border-gray-100 flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm">التنبيهات</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button onClick={() => markAsRead()} className="text-[10px] text-blue-600 hover:text-blue-700 font-bold transition-colors">تحديد الكل كـ مقروء</button>
                </div>
                <div className="max-h-[450px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-16 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-6 h-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">لا توجد تنبيهات</p>
                    </div>
                  ) : notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.link || '#'}
                      onClick={() => {
                        setShowNotifications(false);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "p-5 flex gap-4 hover:bg-blue-50/50 transition-all border-b border-gray-50 last:border-0 text-right group/item",
                        !n.read && "bg-blue-50/20"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-2xl h-fit shrink-0 transition-transform group-hover/item:scale-105",
                        n.type === 'order' ? 'bg-blue-50 text-blue-600' :
                          n.type === 'stock' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600'
                      )}>
                        {n.type === 'order' ? <ShoppingCart className="w-5 h-5" /> :
                          n.type === 'stock' ? <Package className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-gray-900 flex items-center justify-between gap-2">
                          <span className="truncate">{n.title}</span>
                          {!n.read && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 shadow-sm"></span>}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1.5 leading-relaxed font-medium">{n.message}</div>
                        <div className="text-[10px] text-gray-400 mt-3 font-black bg-gray-50 w-fit px-2 py-0.5 rounded-full">
                          {new Date(n.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {notifications.length > 0 && (
                  <div className="p-4 bg-gray-50/50 text-center border-t border-gray-100">
                    <button onClick={() => setShowNotifications(false)} className="text-[11px] text-gray-400 font-black hover:text-gray-900 transition-colors uppercase tracking-widest">إغلاق القائمة</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-1">
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

          <div className="p-4 border-t border-gray-800 logout-container">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
            className="flex items-center gap-3 px-3 py-2 w-full text-right rounded-md text-red-400 hover:bg-gray-800 transition-colors text-xs font-bold uppercase tracking-widest"
            >
              <LogOut className="w-5 h-5" />
              تسجيل الخروج / Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
