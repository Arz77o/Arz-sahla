import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, Phone, MessageSquare, Mail, Send, Play, Building2, Home } from "lucide-react";
import { toast } from "sonner";

import { SEOMeta } from "../components/shared/SEOMeta";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database.types";
import { WILAYAS } from "../lib/algeria";
import { formatDZD } from "../lib/pricing";
import { Button } from "../components/ui/button";
import { gtag } from "../lib/gtag";
import { VideoModal } from "../components/shared/VideoModal";

// ─── Schema ──────────────────────────────────────────────────────────────────
const checkoutSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب"),
  wilaya: z.string().min(1, "يرجى اختيار الولاية").refine((val) => {
    const w = WILAYAS.find(wil => wil.code.toString() === val);
    return w && !w.unsupported;
  }, { message: "نأسف، هذه الولاية غير مدعومة للتوصيل حالياً" }),
  commune: z.string().min(2, "اسم البلدية مطلوب"),
  phone: z
    .string()
    .regex(/^(0)(5|6|7)[0-9]{8}$/, "رقم هاتف غير صالح (مثال: 0550123456)"),
  address: z.string().min(5, "يرجى كتابة العنوان بالتفصيل لضمان وصول الطلبية"),
  deliveryType: z.enum(["desk", "home"], {
    message: "يرجى اختيار نوع التوصيل",
  }),
  paymentMethod: z.enum(["cod", "chargily"], {
    message: "يرجى اختيار طريقة الدفع",
  }),
  contactPreference: z.enum(["phone", "whatsapp"], {
    message: "يرجى اختيار طريقة التواصل المفضلة",
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "يجب الموافقة على الشروط والأحكام",
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

// ─── Component ───────────────────────────────────────────────────────────────
export default function Checkout() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();

  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShowingVideo, setIsShowingVideo] = useState(false);
  const [shippingFeesConfig, setShippingFeesConfig] = useState<any[]>([]);

  const PAYMENT_GUIDE_VIDEO_URL = "/e-dahabia-tutorial.webm";

  React.useEffect(() => {
    const fetchData = async () => {
      const feesRes = await supabase.from("shipping_fees").select("*");
      if (feesRes.data) setShippingFeesConfig(feesRes.data);
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    if (items.length > 0) {
      gtag.trackEcommerce('begin_checkout', {
        currency: 'DZD',
        value: getTotal(),
        items: items.map(i => ({
          item_id: i.product_id,
          item_name: isAr ? i.name_ar : i.name_en,
          price: i.price_dzd,
          quantity: i.quantity
        }))
      });
    }
  }, [items, isAr, getTotal]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onChange",
    defaultValues: {
      fullName: user?.user_metadata?.full_name || "",
      phone: user?.user_metadata?.phone || "",
      address: "",
      wilaya: "",
      commune: "",
      deliveryType: "desk",
      paymentMethod: "cod",
      contactPreference: "phone",
      termsAccepted: false,
    },
  });

  const wilayaCode = watch("wilaya");
  const deliveryType = watch("deliveryType");
  const wilaya = WILAYAS.find((w) => w.code.toString() === wilayaCode);
  const wilayaName = wilaya ? (isAr ? wilaya.name_ar : wilaya.name_en) : "";
  const paymentMethod = watch("paymentMethod");
  const termsAccepted = watch("termsAccepted");

  // ── حساب سعر الشحن ──
  const subtotal = getTotal(paymentMethod);
  const getShippingFee = () => {
    if (!wilayaCode) return deliveryType === "home" ? 1000 : 800;
    const feeConfig = shippingFeesConfig.find(f => f.wilaya_code.toString() === wilayaCode);
    if (!feeConfig) return deliveryType === "home" ? 1000 : 800;
    // إذا كان home_fee موجوداً استخدمه، وإلا أضف 200 دج على desk_fee
    if (deliveryType === "home") {
      return feeConfig.home_fee ?? (feeConfig.desk_fee + 200);
    }
    return feeConfig.desk_fee;
  };

  const displayShippingFee = getShippingFee();
  const finalTotal = subtotal + (paymentMethod === 'chargily' ? 0 : displayShippingFee);

  // ── onSubmit ──
  const onSubmit: SubmitHandler<CheckoutFormValues> = async (data) => {
    if (!user) {
      toast.error("يجب تسجيل الدخول لإتمام الطلب");
      return;
    }

    setIsSubmitting(true);
    const selectedWilaya = WILAYAS.find(w => w.code.toString() === data.wilaya);
    if (selectedWilaya?.unsupported) {
      toast.error("نأسف، هذه الولاية غير مدعومة حالياً");
      setIsSubmitting(false);
      return;
    }
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          full_name: data.fullName,
          phone: data.phone,
          wilaya: wilayaName,
          commune: data.commune,
          address: data.address,
          shipping_fee: displayShippingFee,
          total_dzd: finalTotal,
          payment_method: data.paymentMethod,
          contact_preference: data.contactPreference,
          status: "pending",
          admin_note: data.paymentMethod === "chargily" ? "⏳ في انتظار الدفع عبر شارجيلي" : null,
          terms_accepted: data.termsAccepted,
          delivery_type: data.deliveryType,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error("لم يتم إنشاء الطلب");
      
      const orderId = order.id;

      const orderItems = items.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_dzd: (data.paymentMethod === 'chargily' && item.price_chargily && item.price_chargily > 0)
          ? item.price_chargily
          : item.price_dzd,
        variant: item.variant ? (item.variant as any) : null,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems as any);

      if (itemsError) throw itemsError;

      gtag.trackEcommerce('begin_checkout', {
        currency: 'DZD',
        value: finalTotal,
        items: items.map(i => ({
          item_id: i.product_id,
          item_name: isAr ? i.name_ar : i.name_en,
          price: (data.paymentMethod === 'chargily' && i.price_chargily && i.price_chargily > 0) ? i.price_chargily : i.price_dzd,
          quantity: i.quantity
        }))
      });

      if (data.paymentMethod === "chargily") {
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
          body: {
            order_id: orderId,
            total_dzd: finalTotal,
            site_url: window.location.origin
          }
        });

        if (checkoutError) throw checkoutError;
        if (checkoutData?.checkout_url) {
          window.location.href = checkoutData.checkout_url;
          return;
        }
      }

      navigate(`/order/success?order_id=${orderId}`);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ ما");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (!isSubmitting && items.length === 0) {
      navigate("/cart");
    }
  }, [items.length, navigate, isSubmitting]);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <SEOMeta title={t("checkout.title")} />
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-16 md:py-32">
          {/* Header */}
          <div className="max-w-7xl mx-auto mb-20 md:mb-32 flex flex-col md:flex-row md:items-end justify-between border-b border-surface-high pb-12">
            <div>
              <h1 className="text-6xl md:text-9xl font-display font-bold text-gray-900 tracking-tighter leading-none mb-6">
                Fulfillment
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                ARCHIVAL ACQUISITION PROTOCOL
              </p>
            </div>
            <div className="text-right hidden md:block">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">Items for collection</span>
              <span className="text-4xl font-display font-bold text-gray-900 tracking-tighter">{getItemCount()}</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-20 max-w-7xl mx-auto items-start">
            <div className="flex-1 w-full lg:max-w-2xl">
              <form id="checkout-form" onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-16 md:space-y-24">
                <div className="space-y-12">
                  <div className="space-y-16">

                    {/* ── قسم البيانات الشخصية ── */}
                    <div className="space-y-8">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary" />
                        البيانات الشخصية
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("checkout.fullName")}</label>
                          <input
                            {...register("fullName")}
                            className="w-full bg-surface-low border border-surface-high p-4 text-sm font-medium focus:border-primary outline-none transition-all"
                            placeholder="John Doe"
                          />
                          {errors.fullName && <p className="text-red-500 text-[9px] uppercase font-bold tracking-widest">{errors.fullName.message}</p>}
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("checkout.phone")}</label>
                          <input
                            {...register("phone")}
                            className="w-full bg-surface-low border border-surface-high p-4 text-sm font-medium focus:border-primary outline-none transition-all tracking-tighter"
                            placeholder="0550 12 34 56"
                          />
                          <p className="text-[10px] text-amber-600 font-medium leading-relaxed">
                            الرقم الهاتفي الذي تدخله هو الذي سوف نتصل بك به ونرسل إليك رسالة في الواتساب، لذا يرجى التأكد.
                          </p>
                          {errors.phone && <p className="text-red-500 text-[9px] uppercase font-bold tracking-widest">{errors.phone.message}</p>}
                        </div>
                      </div>
                    </div>

                    {/* ── قسم خيار نوع التوصيل ── */}
                    <div className="space-y-8">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary" />
                        نوع التوصيل
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Stop Desk */}
                        <label
                          className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                            deliveryType === "desk"
                              ? "border-primary bg-primary/5"
                              : "border-surface-high bg-white hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            {...register("deliveryType")}
                            value="desk"
                            className="w-4 h-4 accent-primary mt-1 shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className={`w-4 h-4 ${deliveryType === "desk" ? "text-primary" : "text-gray-400"}`} />
                              <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                                توصيل إلى المكتب
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                              الاستلام من أقرب مكتب Expedia Chrono في ولايتك (Stop Desk)
                            </p>
                            {wilayaCode && (
                              <span className="mt-2 inline-block text-[10px] font-black text-primary">
                                {formatDZD(shippingFeesConfig.find(f => f.wilaya_code.toString() === wilayaCode)?.desk_fee ?? 800)}
                              </span>
                            )}
                          </div>
                        </label>

                        {/* Home Delivery */}
                        <label
                          className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                            deliveryType === "home"
                              ? "border-primary bg-primary/5"
                              : "border-surface-high bg-white hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            {...register("deliveryType")}
                            value="home"
                            className="w-4 h-4 accent-primary mt-1 shrink-0"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Home className={`w-4 h-4 ${deliveryType === "home" ? "text-primary" : "text-gray-400"}`} />
                              <span className="text-xs font-bold uppercase tracking-widest text-gray-900">
                                توصيل إلى المنزل
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                              التوصيل مباشرةً إلى عنوان منزلك عبر Expedia Chrono
                            </p>
                            {wilayaCode && (
                              <span className="mt-2 inline-block text-[10px] font-black text-primary">
                                {(() => {
                                  const fee = shippingFeesConfig.find(f => f.wilaya_code.toString() === wilayaCode);
                                  return formatDZD(fee?.home_fee ?? (fee?.desk_fee ? fee.desk_fee + 200 : 1000));
                                })()}
                              </span>
                            )}
                          </div>
                        </label>
                      </div>
                      {errors.deliveryType && <p className="text-red-500 text-[9px] uppercase font-bold tracking-widest">{errors.deliveryType.message}</p>}
                    </div>

                    {/* ── قسم عنوان التوصيل ── */}
                    <div className="space-y-8">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary" />
                        {deliveryType === "home"
                          ? "عنوان المنزل — Expedia Chrono"
                          : "عنوان التوصيل (مكتب Expedia Chrono)"}
                      </h3>
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Wilaya */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("checkout.wilaya")}</label>
                            <select
                              {...register("wilaya")}
                              onChange={(e) => {
                                register("wilaya").onChange(e);
                                // إعادة تعيين البلدية عند تغيير الولاية
                                setValue("commune", "");
                              }}
                              className="w-full bg-surface-low border border-surface-high p-4 text-sm font-medium focus:border-primary outline-none transition-all"
                            >
                              <option value="">{t("checkout.wilayaPlaceholder")}</option>
                              {WILAYAS.filter(w => !w.unsupported).map((w) => (
                                <option key={w.code} value={w.code}>{isAr ? w.name_ar : w.name_en}</option>
                              ))}
                            </select>
                            {!wilayaCode && (
                              <p className="text-[10px] text-gray-500 font-medium mt-2 leading-relaxed italic opacity-80">
                                * {isAr ? "نعتذر، التوصيل متاح حالياً لولايات الشمال فقط (30 ولاية)." : "Notice: Delivery currently restricted to Northern regions only."}
                              </p>
                            )}
                            {errors.wilaya && <p className="text-red-500 text-[9px] uppercase font-bold tracking-widest">{errors.wilaya.message}</p>}
                          </div>

                          {/* Commune — Text Input */}
                          <div className="space-y-3 relative">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("checkout.commune")}</label>
                            <input
                              {...register("commune")}
                              disabled={!wilayaCode}
                              className={`w-full bg-surface-low border border-surface-high p-4 text-sm font-medium focus:border-primary outline-none transition-all ${
                                !wilayaCode ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              placeholder={wilayaCode ? "اكتب اسم بلديتك هنا..." : "اختر الولاية أولاً"}
                            />
                            {errors.commune && <p className="text-red-500 text-[9px] uppercase font-bold tracking-widest">{errors.commune.message}</p>}
                          </div>
                        </div>

                        {/* Address — shown only for home delivery */}
                        {deliveryType === "home" && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t("checkout.address")}</label>
                            <textarea
                              {...register("address")}
                              rows={3}
                              className="w-full bg-surface-low border border-surface-high p-4 text-sm font-medium focus:border-primary outline-none transition-all resize-none"
                              placeholder={t("checkout.addressPlaceholder")}
                            />
                            {errors.address && <p className="text-red-500 text-[9px] uppercase font-bold tracking-widest">{errors.address.message}</p>}
                          </div>
                        )}

                        {/* للتوصيل المكتبي — عنوان / ملاحظة */}
                        {deliveryType === "desk" && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              {t("checkout.address")}
                            </label>
                            <textarea
                              {...register("address")}
                              rows={2}
                              className="w-full bg-surface-low border border-surface-high p-4 text-sm font-medium focus:border-primary outline-none transition-all resize-none"
                              placeholder="اكتب العنوان أو أي ملاحظة إضافية للطلب..."
                            />
                            {errors.address && <p className="text-red-500 text-[9px] uppercase font-bold tracking-widest">{errors.address.message}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── قسم طريقة الدفع ── */}
                    <div className="space-y-8">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary" />
                        {t("checkout.paymentMethod")}
                      </h3>
                      <div className="space-y-4">
                        <label
                          className={`flex flex-col md:flex-row items-center gap-6 p-6 border transition-all ${watch("paymentMethod") === "cod"
                            ? "border-primary bg-primary/5 shadow-inner"
                            : "border-surface-high bg-white hover:border-gray-300"
                            } cursor-pointer`}
                        >
                          <input
                            type="radio"
                            {...register("paymentMethod")}
                            value="cod"
                            className="w-5 h-5 accent-primary"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-1">
                              {t("checkout.cod")}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                              {t("checkout.codDescription")}
                            </div>
                          </div>
                        </label>
                        <label
                          className={`flex flex-col md:flex-row items-center gap-6 p-6 border transition-all ${watch("paymentMethod") === "chargily"
                            ? "border-primary bg-primary/5 shadow-inner cursor-pointer"
                            : "border-surface-high bg-white hover:border-gray-300 cursor-pointer"
                            }`}
                        >
                          <input
                            type="radio"
                            {...register("paymentMethod")}
                            value="chargily"
                            className="w-5 h-5 accent-primary"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-1 flex items-center gap-2">
                              {t("checkout.online")}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                              {t("checkout.onlineDescription")}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsShowingVideo(true);
                              }}
                              className="mt-4 flex items-center gap-2 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest decoration-2 underline-offset-4"
                            >
                              <Play className="w-3 h-3 fill-primary" />
                              شاهد كيفية الدفع بالبطاقة؟
                            </button>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* ── قسم طريقة التواصل ── */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary" />
                        {t("checkout.contactPreference")} *
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-surface-high border border-surface-high">
                        {[
                          { id: "phone", icon: Phone, label: t("checkout.phoneCall") },
                          { id: "whatsapp", icon: MessageSquare, label: t("checkout.whatsapp") },
                        ].map((item) => (
                          <label
                            key={item.id}
                            className={`flex flex-col items-center gap-4 p-6 cursor-pointer transition-all ${watch("contactPreference") === item.id ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-surface-low hover:text-gray-900"}`}
                          >
                            <input
                              type="radio"
                              {...register("contactPreference")}
                              value={item.id}
                              className="sr-only"
                            />
                            <item.icon className={`w-5 h-5 ${watch("contactPreference") === item.id ? "text-white" : "text-gray-400"}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── الشروط والأحكام ── */}
                <div className="mt-12 bg-surface-low border border-surface-high p-8 flex items-start gap-6">
                  <div className="flex items-center mt-1">
                    <input
                      id="termsAccepted"
                      type="checkbox"
                      {...register("termsAccepted")}
                      className="w-6 h-6 border-surface-high text-primary focus:ring-primary accent-primary"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label
                      htmlFor="termsAccepted"
                      className="text-xs font-bold uppercase tracking-widest text-gray-900 cursor-pointer mb-2"
                    >
                      أوافق على{" "}
                      <Link
                        to="/terms"
                        target="_blank"
                        className="underline decoration-2 underline-offset-4 hover:text-primary transition-colors"
                      >
                        الشروط والأحكام
                      </Link>{" "}
                      الخاصة بمتجر Sahla
                    </label>
                    <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-wider font-medium">
                      أؤكد أن معلومات التواصل صحيحة وأنني مستعد لاستقبال المنتج
                      في غضون 2-5 أيام عمل.
                    </p>
                    {errors.termsAccepted && (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-3 px-1">
                        {errors.termsAccepted.message}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* ── ملخص الطلب ── */}
            <div className="w-full lg:w-[400px] shrink-0">
              <div className="bg-surface-low p-8 md:p-10 border border-surface-high sticky top-24">
                <h2 className="text-xl font-display font-bold text-gray-900 mb-10 uppercase tracking-widest">
                  Overview
                </h2>

                <div className="space-y-6 mb-10 max-h-[40vh] overflow-y-auto pr-4 scrollbar-thin">
                  {items.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex gap-5 items-center group"
                    >
                      <div className="w-20 h-20 overflow-hidden bg-white border border-surface-high shrink-0">
                        <img
                          src={item.image || "https://picsum.photos/seed/sahla/100/100"}
                          alt=""
                          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest line-clamp-1 mb-1">
                          {isAr ? item.name_ar : item.name_en}
                        </h4>
                        <div className="text-sm font-display font-bold text-primary mt-2">
                          {item.quantity} × {formatDZD(paymentMethod === 'chargily' && item.price_chargily && item.price_chargily > 0 ? item.price_chargily : item.price_dzd)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 mb-10 pt-10 border-t border-surface-high">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold uppercase tracking-widest text-gray-400 text-[10px]">{t("cart.total")} (Items)</span>
                    <span className="font-bold">{formatDZD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold uppercase tracking-widest text-primary text-[10px]">
                      الشحن — {deliveryType === "home" ? "🏠 منزل" : "🏢 مكتب"}
                    </span>
                    <span className="font-bold text-primary">{paymentMethod === 'chargily' ? formatDZD(0) : formatDZD(displayShippingFee)}</span>
                  </div>
                  <div className="pt-10 border-t border-surface-high flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">الإجمالي</span>
                    <span className="text-4xl font-display font-bold text-primary tracking-tighter">{formatDZD(finalTotal)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  form="checkout-form"
                  size="lg"
                  className="w-full h-20 text-lg font-display font-bold tracking-tight bg-primary hover:bg-primary-dim uppercase tracking-widest"
                  disabled={!isValid || !termsAccepted || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t("checkout.pay")}
                </Button>

                <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-6 md:mt-10">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Secure Protocol Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VideoModal
        isOpen={isShowingVideo}
        onClose={() => setIsShowingVideo(false)}
        videoUrl={PAYMENT_GUIDE_VIDEO_URL}
        title="شرح كيفية الدفع بالبطاقة الذهبية / CIB"
      />
    </>
  );
}
