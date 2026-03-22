import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-surface-high text-gray-600 py-16 mt-20">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <h3 className="text-xl font-display font-bold text-gray-900 tracking-tighter">Sahla DZ</h3>
          <p className="text-sm leading-relaxed">
            متجركم الأول للإلكترونيات والإكسسوارات في الجزائر — جودة، سرعة، وأمان في التوصيل.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">روابط سريعة</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/products" className="hover:text-primary transition-colors">{t('nav.products')}</Link></li>
            <li><Link to="/order/track" className="hover:text-primary transition-colors">{t('nav.track')}</Link></li>
            <li><Link to="/faq" className="hover:text-primary transition-colors">{t('nav.faq')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">قانوني</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/terms" className="hover:text-primary transition-colors">الشروط والأحكام</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">تواصل معنا</h4>
          <a
            href="https://www.facebook.com/profile.php?id=61579502319748"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 hover:text-primary transition-colors"
          >
            <div className="p-2 bg-white/50">
              <Facebook className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium">صفحتنا على فيسبوك</span>
          </a>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-gray-200/50 text-center text-xs tracking-wide">
        &copy; {new Date().getFullYear()} Sahla DZ. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
};
