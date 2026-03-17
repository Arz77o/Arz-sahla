import React from 'react';
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
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

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
      
      <div className="p-4 border-b border-gray-800">
        <div className="text-sm text-gray-400">مرحباً،</div>
        <div className="font-medium truncate">{user?.email}</div>
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
