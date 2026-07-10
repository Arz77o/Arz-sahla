import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Star,
  Loader2,
  X,
  Send,
  ImagePlus,
  Trash2,
} from "lucide-react";
import { SEOMeta } from "../components/shared/SEOMeta";
import { StockProgressBar } from "../components/shared/ScarcityIndicators";
import { formatDZD } from "../lib/pricing";
import { useCartStore } from "../store/cartStore";
import { useSettingsStore } from "../store/settingsStore";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Reveal } from "../components/shared/Reveal";
import {
  useProduct,
  useCreateReview,
  useDeleteReview,
} from "../hooks/useProducts";
import { gtm } from "../lib/gtm";
import { metaPixel } from "../lib/metaPixel";
import { sendServerEvent } from "../lib/metaCapi";

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 lg:py-32 animate-pulse">
      {/* Main Product Info Card */}
      <div className="bg-white border border-surface-high overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-surface-high">
          {/* Gallery Column */}
          <div className="bg-white p-6 md:p-12 space-y-8">
            <div className="aspect-square bg-surface-low border border-surface-high" />
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-surface-low border border-surface-high" />
              <div className="w-24 h-24 bg-surface-low border border-surface-high" />
              <div className="w-24 h-24 bg-surface-low border border-surface-high" />
            </div>
          </div>

          {/* Content Column */}
          <div className="bg-white p-6 md:p-12 flex flex-col justify-between">
            <div className="space-y-8">
              {/* Product Meta */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-6 bg-surface-low" />
                <div className="w-12 h-4 bg-surface-low ml-auto" />
              </div>

              {/* Title */}
              <div className="space-y-3">
                <div className="w-3/4 h-10 md:h-14 bg-surface-low" />
                <div className="w-1/2 h-10 md:h-14 bg-surface-low" />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="w-32 h-4 bg-surface-low" />
                <div className="w-48 h-12 bg-surface-low" />
              </div>

              {/* Progress bar scarcity indicator */}
              <div className="space-y-2">
                <div className="w-full h-2 bg-surface-low rounded-full" />
                <div className="w-1/3 h-3 bg-surface-low" />
              </div>

              {/* Variants */}
              <div className="space-y-4">
                <div className="w-20 h-3 bg-surface-low" />
                <div className="flex gap-2">
                  <div className="w-24 h-10 bg-surface-low" />
                  <div className="w-24 h-10 bg-surface-low" />
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-12 pt-12 border-t border-surface-high">
              <div className="w-full h-20 bg-surface-low" />
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        {/* Left Block */}
        <div className="lg:col-span-8 space-y-12">
          <div className="bg-white border border-surface-high p-8 md:p-14 space-y-6">
            <div className="w-40 h-6 bg-surface-low" />
            <div className="space-y-3">
              <div className="w-full h-4 bg-surface-low" />
              <div className="w-full h-4 bg-surface-low" />
              <div className="w-5/6 h-4 bg-surface-low" />
              <div className="w-2/3 h-4 bg-surface-low" />
            </div>
          </div>
        </div>

        {/* Right Block */}
        <div className="lg:col-span-4">
          <div className="bg-surface-low p-10 h-80" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { usd_to_dzd_rate, commission_rate } = useSettingsStore();
  const { user } = useAuthStore();
  const isAr = i18n.language === "ar";

  const { data: product, isLoading: loading } = useProduct(slug || "");
  const createReview = useCreateReview();

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<{
    group: string;
    option: string;
  } | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // ✅ نموذج التقييم الجديد
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewImages, setReviewImages] = useState<string[]>([]); // 📸 صور التقييم

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
  const priceDZD = product?.price_dzd ?? 0;
  const inCart = product ? isInCart(product.id) : false;
  const outOfStock = product ? (product.stock_quantity ?? 0) <= 0 : false;

  // Memoize original price calculation
  const priceInfo = useMemo(() => {
    const originalPrice = Math.round((priceDZD * 1.3) / 100) * 100;
    const discountPercent = Math.round(
      ((originalPrice - priceDZD) / originalPrice) * 100,
    );
    return { originalPrice, discountPercent };
  }, [priceDZD]);

  // Memoize image URL builder for performance
  const getOptimizedImageUrl = useMemo(
    () =>
      (imgUrl: string, width: number = 800) => {
        if (!imgUrl) return imgUrl;
        try {
          if (imgUrl.includes("supabase.co/storage")) {
            const url = new URL(imgUrl);
            url.searchParams.set("width", String(width));
            url.searchParams.set("quality", "80");
            url.searchParams.set("format", "webp");
            return url.toString();
          }
        } catch {
          return imgUrl;
        }
        return imgUrl;
      },
    [],
  );

  const lastTrackedProductId = useRef<string | null>(null);

  // Track view_item via GTM dataLayer
  useEffect(() => {
    if (product && lastTrackedProductId.current !== product.id) {
      gtm.ecommerce("view_item", {
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

      const eventId = `view_${product.id}`;

      // Meta Pixel ViewContent via GTM dataLayer
      metaPixel.viewContent({
        content_ids: [product.id],
        content_name: name,
        content_type: "product",
        value: priceDZD,
        currency: "DZD",
      }, eventId);

      // CAPI server-side
      sendServerEvent({
        event_name: "ViewContent",
        event_id: eventId,
        custom_data: {
          content_ids: [product.id],
          content_name: name,
          content_type: "product",
          value: priceDZD,
          currency: "DZD",
        },
      });

      lastTrackedProductId.current = product.id;
    }
  }, [product, name, priceDZD]);

  if (loading || !product) {
    return <ProductDetailSkeleton />;
  }

  const handleAddToCart = () => {
    const imageUrl = product.images?.[0] || "";
    const absoluteImageUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/products/${imageUrl}`;

    const cartItemNameEn = product.name_en ?? product.name_ar ?? "";
    const stockLimit = product.stock_quantity ?? 0;

    addItem({
      product_id: product.id,
      name_ar: product.name_ar,
      name_en: cartItemNameEn,
      price_dzd: priceDZD,

      image: absoluteImageUrl,
      variant: selectedVariant,
      quantity: quantity,
      stock_limit: stockLimit,
    });

    // Track add_to_cart via GTM dataLayer
    gtm.ecommerce("add_to_cart", {
      currency: "DZD",
      value: priceDZD * quantity,
      items: [
        {
          item_id: product.id,
          item_name: name,
          price: priceDZD,
          quantity,
        },
      ],
    });

    const eventId = `atc_${product.id}_${Date.now()}`;

    // Meta Pixel AddToCart via GTM dataLayer
    metaPixel.addToCart({
      content_ids: [product.id],
      content_name: name,
      content_type: "product",
      value: priceDZD * quantity,
      currency: "DZD",
    }, eventId);

    // CAPI server-side
    sendServerEvent({
      event_name: "AddToCart",
      event_id: eventId,
      custom_data: {
        content_ids: [product.id],
        content_name: name,
        content_type: "product",
        value: priceDZD * quantity,
        currency: "DZD",
      },
    });
  };

  const handleCreateReview = () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("اكتب تعليقاً من فضلك");
      return;
    }

    // جلب اسم العميل من user_metadata
    const customerName = user.user_metadata?.full_name || user.email || "عميل";

    createReview.mutate({
      product_id: product.id,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment,
      order_id: null, // يمكن تحسين هذا لاحقاً
      full_name: customerName, // ✅ إضافة اسم العميل
      images: reviewImages.length > 0 ? reviewImages : null, // 📸 إضافة الصور
    });

    // Reset form
    setReviewRating(5);
    setReviewComment("");
    setReviewImages([]);
    setShowReviewForm(false);
  };

  // 📸 معالجة رفع الصور
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const remainingSlots = 3 - reviewImages.length;

    if (files.length > remainingSlots) {
      toast.error(`يمكنك إضافة ${remainingSlots} صور فقط`);
      return;
    }

    files.forEach((file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("يجب اختيار صور فقط");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("حجم الصورة يجب أن لا يتجاوز 5 MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setReviewImages((prev) => {
          if (prev.length < 3) {
            return [...prev, base64];
          }
          return prev;
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = "";
  };

  // حذف صورة من القائمة
  const removeImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const currentImage = selectedImage || product.images?.[0] || "";

  return (
    <>
      <SEOMeta
        title={name}
        description={description?.substring(0, 155)}
        image={currentImage}
        ogType="product"
        schemas={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            description: description?.substring(0, 500),
            image: currentImage ? [currentImage] : undefined,
            sku: product.id,
            offers: {
              "@type": "Offer",
              url: typeof window !== "undefined" ? window.location.href : "",
              priceCurrency: "DZD",
              price: priceDZD,
              availability:
                (product.stock_quantity ?? 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: "SAHLA DZ." },
            },
            aggregateRating:
              product.avg_rating > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: product.avg_rating.toFixed(1),
                    reviewCount: product.reviews?.length ?? 1,
                    bestRating: "5",
                    worstRating: "1",
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
                  onClick={() => setZoomedImage(currentImage)}
                >
                  <img
                    src={getOptimizedImageUrl(currentImage, 800)}
                    alt={name}
                    width={800}
                    height={800}
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    srcSet={`
                      ${getOptimizedImageUrl(currentImage, 400)} 400w,
                      ${getOptimizedImageUrl(currentImage, 800)} 800w,
                      ${getOptimizedImageUrl(currentImage, 1200)} 1200w
                    `}
                    className="w-full h-full object-cover grayscale-10"
                  />
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                    {product.images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={`w-24 h-24 border shrink-0 ${
                          currentImage === img
                            ? "border-primary ring-1 ring-primary"
                            : "border-surface-high"
                        }`}
                      >
                        <img
                          src={getOptimizedImageUrl(img, 96)}
                          alt=""
                          width={96}
                          height={96}
                          loading="lazy"
                          decoding="async"
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
                      className={`inline-block px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${
                        outOfStock
                          ? "bg-red-50 text-red-700"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {outOfStock
                        ? t("product.outOfStock")
                        : t("product.available")}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 ml-auto uppercase tracking-widest">
                      <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                      <span>{product.avg_rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <h1 className="text-4xl md:text-6xl font-display font-bold text-gray-900 mb-8 leading-[1.05] tracking-tighter">
                    {name}
                  </h1>

                  {/* ─── Price Comparison Block ─── */}
                  {priceDZD > 0 && (
                    <div className="mb-8 space-y-3">
                      {/* Badge + Original Price row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest">
                          {t("product.saveAmount").replace(
                            "{percent}",
                            priceInfo.discountPercent.toString(),
                          )}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {t("product.wasPrice")}
                          </span>
                          <span className="line-through font-display font-bold text-gray-400 text-xl">
                            {formatDZD(priceInfo.originalPrice)}
                          </span>
                        </div>
                      </div>
                      {/* Current price — big and bold */}
                      <div className="text-5xl font-display font-bold text-primary tracking-tighter">
                        {formatDZD(priceDZD)}
                      </div>
                    </div>
                  )}

                  {/* ScarcityUrgency Suite */}
                  {!outOfStock && (
                    <div className="mb-10">
                      <StockProgressBar stock={product.stock_quantity ?? 0} />
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
                                  className={`grow px-6 py-3 text-xs font-bold uppercase tracking-widest ${
                                    active
                                      ? "bg-primary text-white"
                                      : "bg-white text-gray-500"
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
                          className="w-14 h-14 bg-white font-bold text-lg"
                        >
                          -
                        </button>
                        <div className="w-14 h-14 bg-white flex items-center justify-center font-display font-bold text-xl">
                          {quantity}
                        </div>
                        <button
                          onClick={() =>
                            setQuantity(
                              Math.min(
                                product.stock_quantity ?? quantity + 1,
                                quantity + 1,
                              ),
                            )
                          }
                          className="w-14 h-14 bg-white font-bold text-lg"
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
                    className={`w-full h-20 text-xl font-display font-bold tracking-tighter ${
                      inCart
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
                  <div
                    className="prose max-w-none text-gray-500 leading-relaxed text-base md:text-lg whitespace-pre-line overflow-hidden"
                    dir="auto"
                  >
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
                    <div
                      className="prose max-w-none text-gray-900 leading-relaxed text-base md:text-lg whitespace-pre-line overflow-hidden"
                      dir="auto"
                    >
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

                {/* ✅ نموذج التقييم الجديد */}
                {!user ? (
                  <div className="py-12 text-center border border-surface-high rounded-[1.75rem] bg-surface-low/50">
                    <p className="text-gray-500 font-semibold mb-4">
                      {isAr
                        ? "يجب تسجيل الدخول لإضافة تقييم"
                        : "You must log in to add a review"}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/login")}
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      {isAr
                        ? "تسجيل الدخول / فتح حساب"
                        : "Login / Create Account"}
                    </Button>
                    <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest">
                      {isAr
                        ? "انضم إلينا لتتمكن من مشاركة تجربتك"
                        : "Join us to share your experience"}
                    </p>
                  </div>
                ) : !showReviewForm ? (
                  <div
                    className="py-12 text-center border border-surface-high rounded-[1.75rem] bg-surface-low cursor-pointer"
                    onClick={() => setShowReviewForm(true)}
                  >
                    <p className="text-gray-500 font-semibold mb-3">
                      هل جربت هذا المنتج؟
                    </p>
                    <Button size="sm" variant="outline">
                      اكتب تقييمك
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white border border-surface-high rounded-[2rem] p-8 md:p-10 shadow-sm">
                    <div className="flex flex-col gap-2 mb-6">
                      <h3 className="text-2xl font-display font-bold text-gray-900">
                        اكتب تقييمك
                      </h3>
                      <p className="text-sm text-gray-500">
                        شارك تجربتك مع المنتج وساعد غيرك على الاختيار الأفضل.
                      </p>
                    </div>

                    {/* النجوم للتقييم */}
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        كم نجمة تعطيه؟
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                            aria-label={`${star} نجوم`}
                          >
                            <Star
                              className={`w-6 h-6 cursor-pointer ${
                                star <= reviewRating
                                  ? "fill-primary text-primary"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {reviewRating} من 5 نجوم
                      </p>
                    </div>

                    {/* حقل التعليق */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-gray-900 block mb-3">
                        ما رأيك في المنتج؟
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="مثال: المنتج جودته عالية جداً والتغليف رائع..."
                        className="w-full min-h-[140px] rounded-[1.5rem] border border-surface-high px-4 py-4 text-base text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white resize-vertical"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-3">
                        {reviewComment.length} / 500 حرف
                      </p>
                    </div>

                    {/* إضافة صور */}
                    <div className="mb-6">
                      <label className="text-sm font-semibold text-gray-900 block mb-3">
                        📸 أضف صور (اختياري - حد أقصى 3)
                      </label>
                      <div className="border border-dashed border-surface-high rounded-[1.5rem] p-4 bg-surface-low">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={reviewImages.length >= 3}
                          className="hidden"
                          id="review-images-input"
                        />
                        <label
                          htmlFor="review-images-input"
                          className={`flex items-center justify-center gap-2 py-4 px-3 rounded-[1.5rem] cursor-pointer ${
                            reviewImages.length >= 3
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-surface-high"
                          }`}
                        >
                          <ImagePlus className="w-5 h-5 text-primary" />
                          <span className="text-sm text-gray-600 font-medium">
                            اختر صور أو اسحبها هنا ({reviewImages.length}/3)
                          </span>
                        </label>
                      </div>

                      {reviewImages.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          {reviewImages.map((image, index) => (
                            <div
                              key={index}
                              className="relative group rounded-3xl overflow-hidden border border-surface-high"
                            >
                              <img
                                src={image}
                                alt={`صورة ${index + 1}`}
                                className="w-full h-24 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-white/90 text-gray-800 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100\"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <p className="text-[11px] text-gray-500 text-center p-2">
                                صورة {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* الأزرار */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full sm:flex-1"
                        onClick={handleCreateReview}
                        disabled={createReview.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {createReview.isPending
                          ? "جاري الإرسال..."
                          : "إرسال التقييم"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full sm:flex-1"
                        onClick={() => {
                          setShowReviewForm(false);
                          setReviewComment("");
                          setReviewRating(5);
                          setReviewImages([]);
                        }}
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-16 pt-12 border-t border-surface-high space-y-16">
                  {product.reviews &&
                  product.reviews.filter((r: any) => r.status === "approved")
                    .length > 0 ? (
                    product.reviews
                      .filter((r: any) => r.status === "approved")
                      .map((r: any) => (
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
                                    className="w-full h-full object-cover grayscale\"
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
                          Expedia Chrono
                        </p>
                        <p className="text-xs text-white/60 leading-relaxed">
                          توصيل سريع ومضمون بواسطة Expedia Chrono
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
                          دفع آمن بالدينار الجزائري عبر الدفع عند الإستلام{" "}
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
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-10 right-10 text-white/50 hover:text-white">
            <X className="w-10 h-10 stroke-1" />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full shadow-2xl shadow-white/5"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
