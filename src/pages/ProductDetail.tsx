import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Star, Loader2, X } from "lucide-react";
import { SEOMeta } from "../components/shared/SEOMeta";
import { formatDZD, calculatePriceDZD } from "../lib/pricing";
import { useCartStore } from "../store/cartStore";
import { useSettingsStore } from "../store/settingsStore";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Reveal } from "../components/shared/Reveal";
import {
  useProduct,
  useCreateReview,
  useDeleteReview,
} from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { gtag } from "../lib/gtag";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { usd_to_dzd_rate, commission_rate } = useSettingsStore();
  const isAr = i18n.language === "ar";

  const { data: product, isLoading: loading } = useProduct(slug || "");

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<{
    group: string;
    option: string;
  } | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { addItem, isInCart } = useCartStore();

  useEffect(() => {
    if (product) {
      setSelectedImage(product.images?.[0] || "");
      if (product.variants && product.variants.length > 0) {
        setSelectedVariant({
          group: product.variants[0].group,
          option: product.variants[0].options[0],
        });
      }
    }
  }, [product]);

  useEffect(() => {
    if (!loading && !product) {
      toast.error("المنتج غير موجود");
      navigate("/products");
    }
  }, [loading, product, navigate]);
  const name = product ? product.name_ar : "";
  const description = product ? product.description_ar : "";
  const problemSolved = product ? product.problem_solved_ar : "";
  const priceDZD = product
    ? calculatePriceDZD(
      product.price_usd,
      usd_to_dzd_rate,
      commission_rate,
      product.price_dzd,
    )
    : 0;
  const inCart = product ? isInCart(product.id) : false;
  const outOfStock = product ? product.stock_quantity <= 0 : false;

  // Track view_item for GA4 (All hooks must be before early returns)
  useEffect(() => {
    if (product) {
      gtag.trackEcommerce("view_item", {
        currency: "DZD",
        value: priceDZD,
        items: [
          {
            item_id: product.id,
            item_name: name,
            price: priceDZD,
            quantity: 1,
          },
        ],
      });
    }
  }, [product, name, priceDZD]);

  if (!product) return null;

  const handleAddToCart = () => {
    const imageUrl = product.images?.[0] || "";
    const absoluteImageUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${imageUrl}`;

    addItem({
      product_id: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      price_dzd: priceDZD,
      price_chargily: product.price_chargily,
      image: absoluteImageUrl,
      variant: selectedVariant,
      quantity: quantity,
      stock_limit: product.stock_quantity,
    });

    // Track add_to_cart in GA4
    gtag.trackEcommerce('add_to_cart', {
      currency: 'DZD',
      value: priceDZD * quantity,
      items: [{
        item_id: product.id,
        item_name: name,
        price: priceDZD,
        quantity,
      }],
    });
  };


  return (
    <>
      <SEOMeta
        title={name}
        description={description?.substring(0, 155)}
        image={selectedImage}
        ogType="product"
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            description: description?.substring(0, 500),
            image: selectedImage ? [selectedImage] : undefined,
            sku: product.id,
            offers: {
              '@type': 'Offer',
              url: typeof window !== 'undefined' ? window.location.href : '',
              priceCurrency: 'DZD',
              price: priceDZD,
              availability:
                product.stock_quantity > 0
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              seller: { '@type': 'Organization', name: 'SAHLA DZ.' },
            },
            aggregateRating:
              product.avg_rating > 0
                ? {
                  '@type': 'AggregateRating',
                  ratingValue: product.avg_rating.toFixed(1),
                  reviewCount: product.reviews?.length ?? 1,
                  bestRating: '5',
                  worstRating: '1',
                }
                : undefined,
          },
        ]}
      />


      <div className="container mx-auto px-4 py-12 md:py-20 lg:py-32">
        {/* Main Product Info Card */}
        <div className="bg-white border border-surface-high overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-surface-high">
            {/* Gallery Column */}
            <Reveal width="100%" delay={0.1} y={30} fullHeight>
              <div className="bg-white p-6 md:p-12 space-y-8 h-full">
                <div
                  className="aspect-square bg-surface-low border border-surface-high overflow-hidden cursor-zoom-in"
                  onClick={() => setZoomedImage(selectedImage)}
                >
                  <img
                    src={
                      selectedImage ||
                      "https://picsum.photos/seed/sahla/800/800"
                    }
                    alt={name}
                    width={800}
                    height={800}
                    fetchPriority="high"
                    loading="eager"
                    className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                    {product.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`w-24 h-24 border transition-all flex-shrink-0 ${selectedImage === img
                          ? "border-primary ring-1 ring-primary"
                          : "border-surface-high hover:border-gray-400"
                          }`}
                      >
                        <img
                          src={img}
                          alt=""
                          width={96}
                          height={96}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            {/* Content Column */}
            <Reveal width="100%" delay={0.2} y={30} fullHeight>
              <div className="bg-white p-6 md:p-12 flex flex-col h-full">
                <div className="flex-grow">
                  {/* Product Meta */}
                  <div className="flex items-center gap-6 mb-10">
                    <span
                      className={`inline-block px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${outOfStock
                        ? "bg-red-50 text-red-700"
                        : "bg-primary/10 text-primary"
                        }`}
                    >
                      {outOfStock
                        ? t("product.outOfStock")
                        : t("product.available")}
                    </span>
                    {!outOfStock && product.stock_quantity < 10 && (
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">
                        Low Stock: {product.stock_quantity}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 ml-auto uppercase tracking-widest">
                      <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                      <span>{product.avg_rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8 leading-[1.05] tracking-tighter">
                    {name}
                  </h1>

                  <div className="text-5xl font-display font-bold text-primary mb-6 tracking-tighter">
                    {formatDZD(priceDZD)}
                  </div>

                  {product.price_chargily > 0 &&
                    product.price_chargily < priceDZD && (
                      <div className="bg-surface-high border border-surface-high p-4 mb-10">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                          Prix Électronique:{" "}
                          <span className="text-lg ml-2">
                            {formatDZD(product.price_chargily)}
                          </span>{" "}
                          ⚡
                        </span>
                      </div>
                    )}

                  {/* Variants Selector */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="space-y-8 mb-12">
                      {product.variants.map((v: any, i: number) => (
                        <div key={i} className="space-y-4">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                            {v.group}
                          </label>
                          <div className="flex flex-wrap gap-px bg-surface-high border border-surface-high">
                            {v.options.map((opt: string, oi: number) => {
                              const active =
                                selectedVariant?.group === v.group &&
                                selectedVariant?.option === opt;
                              return (
                                <button
                                  key={oi}
                                  onClick={() =>
                                    setSelectedVariant({
                                      group: v.group,
                                      option: opt,
                                    })
                                  }
                                  className={`flex-grow px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${active
                                    ? "bg-primary text-white"
                                    : "bg-white text-gray-500 hover:text-gray-900 hover:bg-surface-low"
                                    }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quantity */}
                  {!outOfStock && (
                    <div className="space-y-4 mb-12">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                        {t("cart.quantity")}
                      </label>
                      <div className="flex items-center gap-px bg-surface-high border border-surface-high w-fit">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-14 h-14 bg-white hover:bg-surface-low transition-colors font-bold text-lg"
                        >
                          -
                        </button>
                        <div className="w-14 h-14 bg-white flex items-center justify-center font-display font-bold text-xl">
                          {quantity}
                        </div>
                        <button
                          onClick={() =>
                            setQuantity(
                              Math.min(product.stock_quantity, quantity + 1),
                            )
                          }
                          className="w-14 h-14 bg-white hover:bg-surface-low transition-colors font-bold text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="mt-12 pt-12 border-t border-surface-high">
                  <Button
                    size="lg"
                    className={`w-full h-20 text-xl font-display font-bold tracking-tighter ${inCart
                      ? "bg-gray-900 hover:bg-black"
                      : "bg-primary hover:bg-primary-dim"
                      }`}
                    onClick={handleAddToCart}
                    disabled={outOfStock}
                  >
                    <ShoppingCart className="w-6 h-6 mr-4" />
                    {outOfStock
                      ? t("product.outOfStock")
                      : inCart
                        ? "تحديث السلة"
                        : t("product.addToCart")}
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          {/* Left Block (Description & Problem Solved & Reviews) */}
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-12">
              {/* Description Box */}
              <Reveal width="100%" delay={0.1}>
                <div className="bg-white border border-surface-high p-8 md:p-14">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-10 tracking-tighter flex items-center gap-4">
                    {t("product.description")}
                    <div className="h-px bg-surface-high flex-grow" />
                  </h2>
                  <div className="prose max-w-none text-gray-500 leading-relaxed text-base md:text-lg whitespace-pre-line overflow-hidden" dir="auto">
                    {description || t("no_description")}
                  </div>
                </div>
              </Reveal>

              {/* Problem Solved Box */}
              {problemSolved && (
                <Reveal width="100%" delay={0.15}>
                  <div className="bg-white border border-surface-high p-8 md:p-14 border-l-4 border-l-primary">
                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-10 tracking-tighter flex items-center gap-4">
                      {t("product.problemSolved")}
                      <div className="h-px bg-surface-high flex-grow" />
                    </h2>
                    <div className="prose max-w-none text-gray-900 leading-relaxed text-base md:text-lg whitespace-pre-line overflow-hidden" dir="auto">
                      {problemSolved}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Reviews Box */}
            <Reveal width="100%" delay={0.2}>
              <div className="bg-white border border-surface-high p-8 md:p-14">
                <div className="flex items-center justify-between mb-16">
                  <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tighter uppercase tracking-[0.1em]">
                    Reviews
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s <= Math.round(product.avg_rating) ? "fill-gray-900" : "fill-none stroke-gray-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-3xl font-display font-bold">
                      {product.avg_rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-16">
                  {product.reviews && product.reviews.length > 0 ? (
                    product.reviews.map((r: any) => (
                      <div key={r.id} className="group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-surface-low flex items-center justify-center font-bold text-gray-900 text-lg">
                              {r.full_name?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 mb-1 uppercase tracking-widest text-xs">
                                {r.full_name || "User"}
                              </div>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${i < r.rating ? "fill-primary" : "fill-none stroke-gray-200"}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            {new Date(r.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-gray-500 leading-relaxed mb-8 max-w-2xl">
                          {r.comment}
                        </p>
                        {r.images && r.images.length > 0 && (
                          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {r.images.map((img: string, i: number) => (
                              <div
                                key={i}
                                className="w-32 h-32 border border-surface-high cursor-zoom-in overflow-hidden"
                                onClick={() => setZoomedImage(img)}
                              >
                                <img
                                  src={img}
                                  alt=""
                                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-surface-high">
                      <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">
                        Waiting for your review
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Block (Sidebar) */}
          <div className="lg:col-span-4">
            <Reveal width="100%" delay={0.3} y={40}>
              <div className="bg-primary p-10 text-white sticky top-32 overflow-hidden shadow-2xl">
                <div className="relative z-10 space-y-12">
                  <h3 className="text-2xl font-display font-bold uppercase tracking-wider border-b border-white/20 pb-6">
                    Experience
                  </h3>
                  <ul className="space-y-10">
                    <li className="flex gap-6 items-start">
                      <span className="text-lg font-display font-bold opacity-30 leading-none">
                        01.
                      </span>
                      <div className="space-y-2">
                        <p className="font-bold uppercase tracking-widest text-[11px] leading-tight">
                          DHD Express
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed">
                          توصيل سريع ومضمون إلى أقرب مكتب DHD Express في ولايتك.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-6 items-start">
                      <span className="text-lg font-display font-bold opacity-30 leading-none">
                        02.
                      </span>
                      <div className="space-y-2">
                        <p className="font-bold uppercase tracking-widest text-[11px] leading-tight">
                          Secure Payment
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed">
                          دفع آمن بالدينار الجزائري عبر البطاقة الذهبية أو CIB.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-6 items-start">
                      <span className="text-lg font-display font-bold opacity-30 leading-none">
                        03.
                      </span>
                      <div className="space-y-2">
                        <p className="font-bold uppercase tracking-widest text-[11px] leading-tight">
                          Local Support
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed">
                          فريق دعم متواجد لمساندتكم في كل مراحل الطلب.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rotate-45 translate-x-12 translate-y-12" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-300"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">
            <X className="w-10 h-10 stroke-1" />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full shadow-2xl animate-in zoom-in-95 duration-500 shadow-white/5"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
