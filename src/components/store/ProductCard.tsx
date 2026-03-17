import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { formatDZD, calculatePriceDZD } from '../../lib/pricing';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: {
    id: string;
    name_ar: string;
    name_en: string;
    price_usd: number;
    images: string[];
    product_badge: 'brand' | 'choice' | null;
    avg_rating: number;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const name = isAr ? product.name_ar : product.name_en;
  const priceDZD = calculatePriceDZD(product.price_usd);

  return (
    <Link to={`/products/${product.id}`} className="group block bg-white rounded-xl border hover:shadow-md transition-shadow overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={product.images?.[0] || 'https://picsum.photos/seed/sahla/400/400'} 
          alt={name}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        {product.product_badge && (
          <div className={`absolute top-2 ${isAr ? 'right-2' : 'left-2'} px-2 py-1 text-xs font-bold text-white rounded-md ${
            product.product_badge === 'brand' ? 'bg-blue-600' : 'bg-emerald-500'
          }`}>
            {product.product_badge === 'brand' ? 'Brand' : 'Choice'}
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
};
