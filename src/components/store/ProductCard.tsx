import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { formatDZD, calculatePriceDZD } from "../../lib/pricing";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../store/settingsStore";
import { Reveal } from "../shared/Reveal";

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
    <Reveal width="100%" y={10} delay={0.1}>
      <Link
        to={`/products/${product.id}`}
        className="group block tonal-card hover:bg-surface-low transition-all duration-300 overflow-hidden"
      >
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-surface-high">
          <img
            src={
              product.images?.[0] || "https://picsum.photos/seed/sahla/400/400"
            }
            alt={name}
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
          />
          {product.stock_quantity <= 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
              <span className="bg-gray-900 text-white px-6 py-2 font-bold text-xs uppercase tracking-widest">
                نفدت الكمية
              </span>
            </div>
          )}
          {product.price_chargily > 0 && product.price_chargily < priceDZD && (
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 flex items-center gap-1">
              <span>OFFRE ÉLEC ⚡</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 flex flex-col h-44">
          {/* Product Name */}
          <h3 className="font-display font-semibold text-gray-900 line-clamp-2 mb-2 text-sm leading-snug flex-grow">
            {name}
          </h3>

          {/* Price */}
          <div className="mt-auto pt-4 border-t border-surface-high">
            <p className="text-xl font-display font-bold text-primary tracking-tight">
              {formatDZD(priceDZD)}
            </p>
            {product.price_dzd && product.price_dzd !== priceDZD && (
              <p className="text-[10px] text-gray-400 line-through mt-0.5 uppercase tracking-tighter">
                {formatDZD(product.price_dzd)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </Reveal>
  );
});
