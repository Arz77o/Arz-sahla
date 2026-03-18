import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">Sahla</h3>
          <p className="text-sm">
            منصة الشراء بالوكالة من AliExpress — ندفع بالنيابة عنك وتستلم في بيتك بالجزائر.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">روابط سريعة</h4>
          <ul className="space-y-2">
            <li><Link to="/products" className="hover:text-white">{t('nav.products')}</Link></li>
            <li><Link to="/order/track" className="hover:text-white">{t('nav.track')}</Link></li>
            <li><Link to="/faq" className="hover:text-white">{t('nav.faq')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">قانوني</h4>
          <ul className="space-y-2">
            <li><Link to="/terms" className="hover:text-white">الشروط والأحكام</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">تواصل معنا</h4>
          <a 
            href="https://www.facebook.com/profile.php?id=61583335271001" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
          >
            <Facebook className="w-5 h-5 text-blue-500" />
            <span>صفحتنا على فيسبوك</span>
          </a>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-sm">
        &copy; {new Date().getFullYear()} Sahla. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
};
