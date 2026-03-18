import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { formatDZD, calculatePriceDZD } from '../../lib/pricing';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';

interface ProductCardProps {
  product: {
    id: string;
    name_ar: string;
    name_en: string;
    price_usd: number;
    price_dzd: number;
    images: string[];
    product_badge: 'brand' | 'choice' | null;
    avg_rating: number;
    stock_quantity: number;
  };
}

export const ProductCard = React.memo<ProductCardProps>(({ product }) => {
  const { i18n } = useTranslation();
  const { usd_to_dzd_rate, commission_rate } = useSettingsStore();
  const isAr = i18n.language === 'ar';
  const name = isAr ? product.name_ar : product.name_en;
  const priceDZD = calculatePriceDZD(product.price_usd, usd_to_dzd_rate, commission_rate, product.price_dzd);

  return (
    <Link to={`/products/${product.id}`} className="group block bg-white rounded-xl border hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={product.images?.[0] || 'https://picsum.photos/seed/sahla/400/400'} 
          alt={name}
          loading="lazy"
          decoding="async"
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {/* Removed AliExpress product badge */}
        {product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-1.5 rounded-full font-bold shadow-lg transform -rotate-12 pointer-events-none">
              نفدت الكمية
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 h-10">{name}</h3>
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm text-gray-600">{product.avg_rating.toFixed(1)}</span>
        </div>
        <div className="text-lg font-bold text-blue-600">
          {formatDZD(priceDZD)}
        </div>
      </div>
    </Link>
  );
});
