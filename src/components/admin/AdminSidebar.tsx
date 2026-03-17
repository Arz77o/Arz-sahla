import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Tags, 
  Users, 
  LifeBuoy, 
  Bell, 
  Settings, 
  LogOut,
  Dot
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, markAsRead } = useAdminNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { name: 'لوحة التحكم', path: '/admin', icon: LayoutDashboard },
    { name: 'الطلبات', path: '/admin/orders', icon: ShoppingCart },
    { name: 'المنتجات', path: '/admin/products', icon: Package },
    { name: 'الفئات', path: '/admin/categories', icon: Tags },
    { name: 'العملاء', path: '/admin/customers', icon: Users },
    { name: 'الإعدادات', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-800">
        <Link to="/" className="text-2xl font-bold text-blue-500">Sahla Admin</Link>
      </div>
      
      <div className="p-4 border-b border-gray-800 flex items-center justify-between group relative">
        <div className="flex-1 overflow-hidden">
          <div className="text-sm text-gray-400">مرحباً،</div>
          <div className="font-medium truncate">{user?.email}</div>
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
          <div className="absolute top-full left-4 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 text-gray-900 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold">التنبيهات الفورية</span>
              <button onClick={() => markAsRead()} className="text-[10px] text-blue-600 hover:underline">تحديد كـ مقروء</button>
            </div>
            <div className="max-h-[350px] overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs">لا توجد تنبيهات حالياً</div>
              ) : notifications.map((n) => (
                <Link 
                  key={n.id} 
                  to={n.link || '#'} 
                  onClick={() => setShowNotifications(false)}
                  className="p-4 flex gap-3 hover:bg-blue-50/50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className={`p-2 rounded-xl h-fit ${n.type === 'order' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-gray-900 flex items-center gap-1">
                      {n.title}
                      {!n.read && <Dot className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-gray-400 mt-2 font-medium">قليل من الوقت</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-2 border-t border-gray-100">
              <Link to="/admin/orders" onClick={() => setShowNotifications(false)} className="block py-2 text-center text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">عرض جميع الطلبات</Link>
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
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-blue-600 text-white" 
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
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-red-400 hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};
