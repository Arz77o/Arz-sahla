import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShoppingBag,
  Truck,
  Headset,
  ShieldCheck,
  Watch,
  Smartphone,
  Laptop,
  Headphones,
  CarFront,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SEOMeta } from "../components/shared/SEOMeta";
import { ProductCard } from "../components/store/ProductCard";
import { Button } from "../components/ui/button";
import { Reveal } from "../components/shared/Reveal";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

const slugIconMap: Record<string, string> = {
  watches: "Watch",
  watch: "Watch",
  phones: "Smartphone",
  phone: "Smartphone",
  laptop: "Laptop",
  laptops: "Laptop",
  computer: "Laptop",
  computers: "Laptop",
  headset: "Headphones",
  headsets: "Headphones",
  audio: "Headphones",
  car: "CarFront",
  cars: "CarFront",
  auto: "CarFront",
  automotive: "CarFront",
  accessories: "CarFront",
};

const toPascalCase = (value: string): string =>
  value
    .trim()
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (c) => c.toUpperCase());

const iconByName: Record<string, LucideIcon> = {
  ShoppingBag,
  Watch,
  Smartphone,
  Laptop,
  Headphones,
  CarFront,
};

const getCategoryIcon = (iconName?: string | null, slug?: string): LucideIcon => {
  const preferred = iconName?.trim() || (slug ? slugIconMap[slug.toLowerCase()] : undefined);
  if (!preferred) return ShoppingBag;

  const normalized = toPascalCase(preferred);
  return iconByName[normalized] || ShoppingBag;
};

export default function Home() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const { data: categories = [] } = useCategories();
  const { data: featuredProducts = [] } = useProducts();

  return (
    <>
      <SEOMeta />

      {/* Hero Section */}
      <section className="relative bg-surface overflow-hidden pt-12 md:pt-20 pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12">
            {/* Text Content */}
            <div className="md:w-1/2 text-right">
              <Reveal delay={0.1}>
                <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 mb-6">
                  .We don't sell you a product, we sell you comfort
                </span>
              </Reveal>
              <Reveal delay={0.2}>
                <h1 className="text-5xl md:text-7xl font-display font-bold text-gray-900 mb-8 leading-[1.1] tracking-tighter">
                  المتجر الذي يوفر لك <br /> الحل لمشكلاتك اليومية
                </h1>
              </Reveal>
              <Reveal delay={0.3}>
                <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed max-w-xl ml-auto">
                  نكتشف لك الحلول المبتكرة التي تحل مشاكلك اليومية وتوفر لك الراحة التي تستحقها، لتصلك أينما كنت بكل سهولة.
                </p>
              </Reveal>
              <Reveal delay={0.4}>
                <div className="flex flex-col sm:flex-row-reverse items-center gap-4">
                  <Link to="/products" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto px-10">
                      تصفح المنتجات
                    </Button>
                  </Link>
                  <Link to="/order/track" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto px-10"
                    >
                      تتبع طلبك
                    </Button>
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Product Image Component / Editorial Image */}
            <div className="md:w-1/2 relative">
              <div className="relative z-10 p-8 md:p-12">
                <img
                  src="/background.webp"
                  srcSet="/background-sm.webp 600w, /background.webp 1200w"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  alt="منتجات سهلة دي زد"
                  width="1200"
                  height="674"
                  fetchPriority="high"
                  loading="eager"
                  decoding="sync"
                  className="w-full h-auto object-cover shadow-2xl grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="absolute top-0 right-0 w-2/3 h-full bg-surface-low -z-0 translate-x-12 translate-y-12" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-surface-low">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-4">
            <div className="text-right">
              <h2 className="text-3xl font-display font-bold text-gray-900">
                تسوق حسب مشكلتك
              </h2>
              <div className="w-12 h-1 bg-primary mt-4 ml-auto" />
            </div>
          </div>
          <div className="flex flex-wrap justify-start border-t border-r border-gray-200">
            {categories.map((cat, i) => {
              const CategoryIcon = getCategoryIcon(cat.icon, cat.slug);
              return (
                <Reveal key={cat.id} delay={i * 0.05 + 0.1} width="auto">
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="group flex flex-col items-center justify-center p-8 md:p-12 bg-white hover:bg-surface-high transition-all duration-300 w-full min-w-[160px] md:min-w-[200px] border-l border-b border-gray-200"
                  >
                    <div className="w-12 h-12 text-gray-400 group-hover:text-primary transition-colors mb-4">
                      <CategoryIcon className="w-full h-full stroke-1" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-widest text-center">
                      {isAr ? cat.name_ar : cat.name_en}
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-row-reverse justify-between items-end mb-16">
            <div className="text-right">
              <h2 className="text-3xl font-display font-bold text-gray-900">
                Latest Solutions
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                مجموعتنا الجديدة وصلت لتوها
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
            >
              عرض الكل &larr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} priority={featuredProducts.indexOf(product) < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-surface-high">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Reveal delay={0.1}>
              <div className="text-right space-y-6">
                <div className="w-12 h-12 text-primary">
                  <ShieldCheck className="w-full h-full stroke-1" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">
                  الدفع عند الاستلام
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  ادفع بكل أمان عند استلام طلبيتك — لا حاجة لأي دفع مسبق.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="text-right space-y-6">
                <div className="w-12 h-12 text-primary">
                  <Truck className="w-full h-full stroke-1" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">
                  توصيل Stop Desk
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  نشحن طلبك إلى أقرب مكتب Expedia Chrono في ولايتك للتوصيل السريع
                  والمضمون في 48-72 ساعة.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="text-right space-y-6">
                <div className="w-12 h-12 text-primary">
                  <Headset className="w-full h-full stroke-1" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">
                  دعم متواصل
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  فريق دعم متخصص للرد على استفساراتك ومتابعة طلباتك عبر الهاتف
                  أو الواتساب.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
