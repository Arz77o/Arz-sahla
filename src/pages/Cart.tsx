import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, ShoppingBag, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { SEOMeta } from '../components/shared/SEOMeta';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatDZD } from '../lib/pricing';
import { Button } from '../components/ui/button';
import { SuggestedProducts } from '../components/store/SuggestedProducts';

export default function Cart() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const { items, removeItem, updateQuantity, getTotal, getItemCount } = useCartStore();
  const { user } = useAuthStore();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <>
        <SEOMeta title={t('cart.title')} />
        <div className="container mx-auto px-4 py-24 md:py-40 text-center">
          <div className="w-32 h-32 bg-surface-low border border-surface-high flex items-center justify-center mx-auto mb-10 text-gray-300">
            <ShoppingBag className="w-14 h-14 stroke-1" />
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8 tracking-tighter uppercase tracking-[0.05em]">
            {t('cart.empty')}
          </h1>
          <p className="text-gray-400 mb-12 max-w-md mx-auto text-sm font-medium uppercase tracking-widest leading-relaxed">
            Your journey to a more comfortable life starts here.
          </p>
          <Link to="/products">
            <Button size="lg" className="h-16 px-12 text-lg font-bold tracking-tighter uppercase tracking-widest">
              {isAr ? <ArrowLeft className="mr-3 w-5 h-5" /> : <ArrowRight className="ml-3 w-5 h-5" />}
              Explore Products
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOMeta title={t('cart.title')} />
      <div className="container mx-auto px-4 py-12 md:py-24">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between border-b border-surface-high pb-10 gap-8">
          <div>
            <h1 className="text-5xl md:text-8xl font-display font-bold text-gray-900 tracking-tighter leading-none mb-4">
              {t('cart.title')}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
              Review your curated collection ({getItemCount()} items)
            </p>
          </div>
          <Link to="/products" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline underline-offset-8 decoration-2 italic">
            Continue Shopping
          </Link>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto items-start">
          {/* Cart Items List */}
          <div className="flex-1 space-y-6 w-full">
            {items.map((item) => (
              <div 
                key={item.product_id} 
                className="bg-white border border-surface-high p-6 md:p-8 flex flex-col sm:flex-row gap-8 items-start group transition-all hover:border-gray-300"
              >
                {/* Product Image */}
                <div className="w-full sm:w-40 aspect-square bg-surface-low border border-surface-high overflow-hidden shrink-0">
                  <img 
                    src={item.image || (item as any).images?.[0] || 'https://picsum.photos/seed/sahla/200/200'} 
                    alt={isAr ? item.name_ar : item.name_en} 
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" 
                  />
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg md:text-xl font-display font-bold text-gray-900 leading-tight tracking-tight">
                      {isAr ? item.name_ar : item.name_en}
                    </h3>
                    <div className="text-xl font-display font-bold text-primary">
                      {formatDZD(item.price_dzd)}
                    </div>
                  </div>
                  
                  {item.variant && (
                    <div className="inline-block px-3 py-1 bg-surface-low border border-surface-high text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 w-fit">
                      {item.variant.group}: {item.variant.option}
                    </div>
                  )}
                  
                  {/* Controls */}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-px bg-surface-high border border-surface-high">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:text-gray-900 hover:bg-surface-low transition-all font-bold"
                      >
                        -
                      </button>
                      <div className="w-12 h-10 flex items-center justify-center bg-white font-bold text-gray-900 text-sm">
                        {item.quantity}
                      </div>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:text-gray-900 hover:bg-surface-low transition-all font-bold"
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeItem(item.product_id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('cart.remove')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Summary */}
          <div className="w-full lg:w-[400px] shrink-0 sticky top-24">
            <div className="bg-surface-low p-8 md:p-12 border border-surface-high">
              <h2 className="text-xl font-display font-bold text-gray-900 mb-10 uppercase tracking-widest">
                Summary
              </h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  <span>Subtotal ({getItemCount()} items)</span>
                  <span className="text-gray-900">{formatDZD(getTotal())}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  <span>Shipping</span>
                  <span className="text-xs italic lowercase">At Checkout</span>
                </div>
                
                <div className="pt-10 border-t border-surface-high flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Total</span>
                  <span className="text-4xl font-display font-bold text-primary tracking-tighter leading-none">
                    {formatDZD(getTotal())}
                  </span>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-20 text-lg font-display font-bold tracking-tight bg-primary hover:bg-primary-dim uppercase tracking-widest"
                onClick={handleCheckout}
              >
                {t('cart.checkout')}
              </Button>

              <div className="mt-10 flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Curated & Guaranteed</span>
              </div>
              
              <p className="mt-8 text-[9px] text-gray-400 leading-relaxed uppercase tracking-wider text-center">
                Shipping options and exact delivery fees are determined during the delivery step based on your location.
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Products Section */}
        <div className="max-w-7xl mx-auto w-full">
          <SuggestedProducts />
        </div>
      </div>
    </>
  );
}
