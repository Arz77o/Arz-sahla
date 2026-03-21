import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { formatDZD, calculatePriceDZD } from "../../lib/pricing";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../store/settingsStore";

interface ProductCardProps {
  product: {
    id: string;
    name_ar: string;
    name_en: string;
    price_usd: number;
    price_dzd: number;
    price_chargily: number;
    images: string[];
    avg_rating: number;
    stock_quantity: number;
  };
}

export const ProductCard = React.memo<ProductCardProps>(({ product }) => {
  const { i18n } = useTranslation();
  const { usd_to_dzd_rate, commission_rate } = useSettingsStore();
  const isAr = i18n.language === "ar";
  const name = isAr ? product.name_ar : product.name_en;
  const priceDZD = calculatePriceDZD(
    product.price_usd,
    usd_to_dzd_rate,
    commission_rate,
    product.price_dzd,
  );

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden hover:border-blue-300"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={
            product.images?.[0] || "https://picsum.photos/seed/sahla/400/400"
          }
          alt={name}
          loading="lazy"
          decoding="async"
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
        />
        {product.stock_quantity <= 0 && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              نفدت الكمية
            </span>
          </div>
        )}
        {product.price_chargily > 0 && product.price_chargily < priceDZD && (
          <div className="absolute top-2 right-2 bg-green-600/90 text-white text-[10px] fold-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <span>خصم الدفع الإلكتروني ⚡</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col h-48">
        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 text-base leading-tight flex-grow">
          {name}
        </h3>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-gray-700">
              {product.avg_rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            ({product.avg_rating > 0 ? "تقييمات" : "بلا تقييمات"})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <p className="text-2xl font-bold text-blue-600">
            {formatDZD(priceDZD)}
          </p>
          {product.price_dzd && product.price_dzd !== priceDZD && (
            <p className="text-xs text-gray-400 line-through mt-1">
              {formatDZD(product.price_dzd)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
});
