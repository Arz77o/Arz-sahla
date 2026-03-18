import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, User, LogOut, Globe, Menu, X } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { getItemCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="bg-blue-600 text-white text-center py-1 text-sm">
        نوفرلك منتجات مقتنات بعناية بأسعار ممتازة و رحلة شراء سلسة
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
          <Button variant="ghost" size="icon" onClick={toggleLanguage} className="hidden sm:flex">
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
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/account">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">{t('nav.account')}</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">{t('nav.login')}</Button>
              </Link>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-4 gap-2">
            <Link 
              to="/" 
              className="px-4 py-3 hover:bg-gray-50 rounded-xl"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link 
              to="/products" 
              className="px-4 py-3 hover:bg-gray-50 rounded-xl"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.products')}
            </Link>
            <Link 
              to="/order/track" 
              className="px-4 py-3 hover:bg-gray-50 rounded-xl"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.track')}
            </Link>
            <Link 
              to="/faq" 
              className="px-4 py-3 hover:bg-gray-50 rounded-xl text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.faq')}
            </Link>
            <hr className="my-2 border-gray-50" />
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <span className="text-sm font-medium">اللغة / Language</span>
              <Button size="sm" variant="outline" onClick={toggleLanguage} className="gap-2">
                <Globe className="w-4 h-4" />
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </Button>
            </div>
            {user ? (
              <div className="flex flex-col gap-2 mt-2">
                <Link 
                  to="/account" 
                  className="px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {t('nav.account')}
                </Link>
                <Button 
                  variant="ghost" 
                  className="justify-start gap-2 text-red-600"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-xl">{t('nav.login')}</Button>
                </Link>
                <Link to="/products" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full rounded-xl">تسوق الآن</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
