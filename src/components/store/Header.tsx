import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { getItemCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="glass-header w-full">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-baseline gap-0 select-none" dir="ltr" aria-label="SAHLA DZ. — الصفحة الرئيسية">
          <span className="font-display font-black text-gray-900 text-2xl tracking-tight uppercase leading-none">
            SAHLA
          </span>
          <span className="font-display font-light text-gray-900 text-lg tracking-tight uppercase leading-none">
            dz.
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.home')}</Link>
          <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.products')}</Link>
          <Link to="/order/track" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.track')}</Link>
          <Link to="/faq" className="text-sm font-medium hover:text-primary transition-colors">{t('nav.faq')}</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="w-5 h-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 flex items-center justify-center font-bold">
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
              className="px-4 py-4 hover:bg-surface-low transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/products"
              className="px-4 py-4 hover:bg-surface-low transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.products')}
            </Link>
            <Link
              to="/order/track"
              className="px-4 py-4 hover:bg-surface-low transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.track')}
            </Link>
            <Link
              to="/faq"
              className="px-4 py-4 hover:bg-surface-low transition-colors text-sm"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('nav.faq')}
            </Link>
            {user ? (
              <div className="flex flex-col gap-2 mt-2">
                <Link
                  to="/account"
                  className="px-4 py-4 bg-primary/5 text-primary font-bold flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {t('nav.account')}
                </Link>
                <Button
                  variant="ghost"
                  className="justify-start gap-2 text-red-600 px-4 py-4"
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
              <div className="grid grid-cols-2 gap-px bg-surface-high mt-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full bg-white">{t('nav.login')}</Button>
                </Link>
                <Link to="/products" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">تسوق الآن</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
