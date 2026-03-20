import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, ShoppingBag, ShieldCheck } from 'lucide-react';
import { SEOMeta } from '../components/shared/SEOMeta';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatDZD } from '../lib/pricing';
import { Button } from '../components/ui/button';

export default function Cart() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const { user } = useAuthStore();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?returnTo=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <>
        <SEOMeta title={t('cart.title')} />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('cart.empty')}</h1>
          <Link to="/products">
            <Button size="lg" className="rounded-full px-8">
              تصفح المنتجات
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOMeta title={t('cart.title')} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('cart.title')}</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="flex-1 space-y-4">
            {items.map((item) => (
              <div key={item.product_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 items-center">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                  <img 
                    src={item.image || (item as any).images?.[0] || 'https://picsum.photos/seed/sahla/200/200'} 
                    alt={isAr ? item.name_ar : item.name_en} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                    {isAr ? item.name_ar : item.name_en}
                  </h3>
                  {item.variant && (
                    <p className="text-sm text-gray-500 mb-2">
                      {item.variant.group}: {item.variant.option}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                    <span className="text-[10px] text-gray-400 mr-2">
                      (المتوفر: {item.stock_limit})
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between h-24">
                  <div className="text-lg font-bold text-blue-600 whitespace-nowrap">
                    {formatDZD(item.price_dzd)}
                  </div>
                  <button 
                    onClick={() => removeItem(item.product_id)}
                    className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('cart.remove')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>المنتجات ({getItemCount()} قطع)</span>
                  <span>{formatDZD(getTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>الشحن</span>
                  <span className="text-gray-400 font-medium">يُحسب عند الدفع</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">{t('cart.total')}</span>
                  <span className="text-2xl font-black text-blue-600">{formatDZD(getTotal())}</span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold rounded-xl mb-4"
                onClick={handleCheckout}
              >
                {t('cart.checkout')}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>{t('cart.secure')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
