import React from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { formatDZD } from "../../lib/pricing";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../store/settingsStore";
import { Reveal } from "../shared/Reveal";

import { useCartStore } from "../../store/cartStore";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";

interface ProductCardProps {
  product: {
    id: string;
    name_ar: string;
    name_en: string;
    price_dzd: number;
    price_chargily: number;
    images: string[];
    avg_rating: number;
    stock_quantity: number;
  };
  showQuickAdd?: boolean;
}

export const ProductCard = React.memo<ProductCardProps>(({ product, showQuickAdd = false }) => {
  const { i18n, t } = useTranslation();
  const { usd_to_dzd_rate, commission_rate } = useSettingsStore();
  const { addItem } = useCartStore();
  const isAr = i18n.language === "ar";
  const name = product.name_ar;
  
  const priceDZD = product.price_dzd ?? 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      product_id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price_dzd: priceDZD,
      price_chargily: product.price_chargily,
      image: product.images?.[0] || "",
      variant: null,
      quantity: 1,
      stock_limit: product.stock_quantity
    });
  };

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
            width={400}
            height={400}
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

          {/* Quick Add Button Overlay */}
          {showQuickAdd && product.stock_quantity > 0 && (
            <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-300 z-10 hidden md:block">
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-white text-gray-900 hover:bg-primary hover:text-white border border-surface-high shadow-lg flex items-center justify-center gap-2 h-10 px-0"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t('product.addToCart')}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 flex flex-col h-44">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-display font-semibold text-gray-900 line-clamp-2 mb-2 text-sm leading-snug flex-grow">
              {name}
            </h3>
            {showQuickAdd && product.stock_quantity > 0 && (
              <button
                onClick={handleAddToCart}
                className="md:hidden w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 hover:bg-primary hover:text-white transition-colors"
                title={t('product.addToCart')}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

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
