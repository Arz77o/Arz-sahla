import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, User, LogOut, Globe } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { getItemCount } = useCartStore();
  const { user, logout } = useAuthStore();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="bg-blue-600 text-white text-center py-1 text-sm">
        شحن مجاني للطلبات التي تتجاوز 5,000 دج
      </div>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Sahla
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="hover:text-blue-600">{t('nav.home')}</Link>
          <Link to="/products" className="hover:text-blue-600">{t('nav.products')}</Link>
          <Link to="/order/track" className="hover:text-blue-600">{t('nav.track')}</Link>
          <Link to="/faq" className="hover:text-blue-600">{t('nav.faq')}</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleLanguage}>
            <Globe className="w-5 h-5" />
          </Button>
          
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="w-5 h-5" />
              {getItemCount() > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/account">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('nav.account')}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">{t('nav.login')}</Button>
              </Link>
              <Link to="/products">
                <Button size="sm">تسوق الآن</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
