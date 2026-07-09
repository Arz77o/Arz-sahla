import React from "react";
import { Link } from "react-router-dom";
import { formatDZD } from "../../lib/pricing";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../store/settingsStore";
import { Reveal } from "../shared/Reveal";
import { useCartStore } from "../../store/cartStore";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Product } from "../../hooks/useProducts";

function getOptimizedImageUrl(src: string, width: number): string {
  if (!src) return src;
  try {
    if (src.includes("supabase.co/storage")) {
      const url = new URL(src);
      url.searchParams.set("width", String(width));
      url.searchParams.set("quality", "75");
      url.searchParams.set("format", "webp");
      return url.toString();
    }
    if (src.includes("unsplash.com")) {
      const url = new URL(src);
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", "75");
      url.searchParams.set("auto", "format");
      return url.toString();
    }
    return src;
  } catch {
    return src;
  }
}

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
  // priority=true on first 4 cards: eager load + fetchpriority=high for LCP
  priority?: boolean;
}

export const ProductCard = React.memo<ProductCardProps>(
  ({ product, showQuickAdd = false, priority = false }) => {
    const { i18n, t } = useTranslation();
    const { addItem } = useCartStore();
    const name = product.name_ar;
    const priceDZD = product.price_dzd ?? 0;
    const displayNameEn = product.name_en ?? product.name_ar;
    const stockQuantity = product.stock_quantity ?? 0;

    const handleAddToCart = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem({
        product_id: product.id,
        name_ar: product.name_ar,
        name_en: displayNameEn,
        price_dzd: priceDZD,
        image: product.images?.[0] || "",
        variant: null,
        quantity: 1,
        stock_limit: stockQuantity,
      });
    };

    const imgSrc = getOptimizedImageUrl(
      product.images?.[0] || "https://picsum.photos/seed/sahla/400/400",
      400,
    );

    return (
      <Reveal
        width="100%"
        y={priority ? 0 : 10}
        delay={priority ? 0 : 0.1}
        priority={priority}
      >
        <Link
          to={`/products/${product.id}`}
          className="group block tonal-card hover:bg-surface-low transition-all duration-300 overflow-hidden"
        >
          {/* Image — explicit width/height prevents CLS */}
          <div className="relative aspect-square overflow-hidden bg-surface-high">
            <img
              src={imgSrc}
              alt={name}
              width={400}
              height={400}
              loading={priority ? "eager" : "lazy"}
              decoding={priority ? "sync" : "async"}
              // fetchpriority tells browser to fetch above-fold images first
              {...(priority ? { fetchPriority: "high" } : {})}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover w-full h-full"
            />
            {stockQuantity <= 0 && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
                <span className="bg-gray-900 text-white px-6 py-2 font-bold text-xs uppercase tracking-widest">
                  نفدت الكمية
                </span>
              </div>
            )}

            {showQuickAdd && stockQuantity > 0 && (
              <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 transition-transform duration-300 z-10 hidden md:block">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-white text-gray-900 hover:bg-primary hover:text-white border border-surface-high shadow-lg flex items-center justify-center gap-2 h-10 px-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {t("product.addToCart")}
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* Product Info — fixed height h-44 prevents CLS */}
          <div className="p-5 flex flex-col h-44">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-display font-semibold text-gray-900 line-clamp-2 mb-2 text-sm leading-snug flex-grow">
                {name}
              </h3>
              {showQuickAdd && stockQuantity > 0 && (
                <button
                  onClick={handleAddToCart}
                  className="md:hidden w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 hover:bg-primary hover:text-white transition-colors"
                  title={t("product.addToCart")}
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-surface-high">
              <p className="text-xl font-display font-bold text-primary tracking-tight">
                {formatDZD(priceDZD)}
              </p>
            </div>
          </div>
        </Link>
      </Reveal>
    );
  },
);
