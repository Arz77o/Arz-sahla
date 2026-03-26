import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from './ProductCard';
import { useCartStore } from '../../store/cartStore';

export function SuggestedProducts() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { items } = useCartStore();
  const { data: allProducts = [], isLoading } = useProducts();

  // Filter out products already in cart and limit to 4
  const cartProductIds = new Set(items.map(item => item.product_id));
  const suggested = allProducts
    .filter(p => !cartProductIds.has(p.id))
    .slice(0, 4);

  if (isLoading || suggested.length === 0) return null;

  return (
    <div className="mt-24 border-t border-surface-high pt-16">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className={isAr ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
            {t('cart.suggestedTitle')}
          </h2>
          <div className={`w-12 h-1 bg-primary mt-4 ${isAr ? 'ml-auto' : 'mr-auto'}`} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {suggested.map((product) => (
          <ProductCard key={product.id} product={product} showQuickAdd={true} />
        ))}
      </div>
    </div>
  );
}
