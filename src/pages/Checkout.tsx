import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, Phone, MessageSquare, Mail, Send } from "lucide-react";
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

const checkoutSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب"),
  wilaya: z.string().min(1, "يرجى اختيار الولاية"),
  commune: z.string().min(2, "اسم البلدية مطلوب"),
  phone: z
    .string()
    .regex(/^(0)(5|6|7)[0-9]{8}$/, "رقم هاتف غير صالح (مثال: 0550123456)"),
  address: z.string().min(5, "العنوان بالتفصيل مطلوب"),
  paymentMethod: z.enum(["cod", "chargily"], {
    message: "يرجى اختيار طريقة الدفع",
  }),
  contactPreference: z.enum(["phone", "whatsapp", "telegram"], {
    message: "يرجى اختيار طريقة التواصل المفضلة",
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "يجب الموافقة على الشروط والأحكام",
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();

  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingFeesConfig, setShippingFeesConfig] = useState<any[]>([]);
  const [storeSettings, setStoreSettings] = useState({ free_shipping_threshold: 800 });

  React.useEffect(() => {
    const fetchData = async () => {
      const [feesRes, settingsRes] = await Promise.all([
        supabase.from("shipping_fees").select("*"),
        supabase.from("settings").select("*").single()
      ]);

      if (feesRes.data) setShippingFeesConfig(feesRes.data);
      if (settingsRes.data) {
        const s = settingsRes.data as any;
        const pm = s.payment_methods || {};
        setStoreSettings({
          free_shipping_threshold: pm.free_shipping_threshold ?? 800
        });
      }
    };
    fetchData();
  }, []);

  // Track begin_checkout for GA4
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
  }, []);

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
      paymentMethod: "cod",
      contactPreference: "phone",
      termsAccepted: false,
      wilaya: "",
      commune: "",
    },
  });


  React.useEffect(() => {
    if (items.length === 0) {
      navigate("/cart");
    }
  }, [items.length, navigate]);

  if (items.length === 0) {
    return null;
  }

  const calculateShippingFee = (wilayaName?: string) => {
    if (!wilayaName) return 0;

    // Check dynamic fees from database first
    const feeConfig = shippingFeesConfig.find(
      (f) => f.wilaya_name === wilayaName,
    );
    if (feeConfig) {
      return feeConfig.desk_fee;
    }

    // Default fallback fees
    return wilayaName === "الجزائر" || wilayaName === "Alger" ? 200 : 400;
  };

  const paymentMethod = watch("paymentMethod");
  const wilayaName = watch("wilaya");
  const normalBaseShipping = calculateShippingFee(wilayaName);
  const isEligibleForFreeShipping = normalBaseShipping <= storeSettings.free_shipping_threshold;

  React.useEffect(() => {
    if (wilayaName && normalBaseShipping > storeSettings.free_shipping_threshold && paymentMethod === 'chargily') {
      setValue("paymentMethod", "cod");
      toast.info(`الدفع الإلكتروني والشحن المجاني غير متاح لهذه الولاية حالياً بسبب تكاليف الشحن التي تتجاوز ${storeSettings.free_shipping_threshold} دج.`);
    }
  }, [wilayaName, normalBaseShipping, paymentMethod, setValue, storeSettings.free_shipping_threshold]);

  const baseShipping = paymentMethod === 'chargily' && isEligibleForFreeShipping ? 0 : normalBaseShipping;

  // Final total is Product Price (Inclusive) + Shipping, rounded to nearest 10
  const rawTotal = getTotal(paymentMethod) + baseShipping;
  const finalTotal = Math.round(rawTotal / 10) * 10;
  // Adjust shipping display to include the minor rounding difference so total matches
  const displayShippingFee = finalTotal - getTotal(paymentMethod);

  const onSubmit: SubmitHandler<CheckoutFormValues> = async (data) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // 1. Create Order
      const baseShipping = data.paymentMethod === 'chargily' && isEligibleForFreeShipping ? 0 : calculateShippingFee(data.wilaya);
      const roundedTotal = Math.round((getTotal(data.paymentMethod) + baseShipping) / 10) * 10;
      const actualShippingForDB = roundedTotal - getTotal(data.paymentMethod);

      const { data: orderData, error: orderError } = await (
        supabase.from("orders" as any) as any
      )
        .insert({
          user_id: user.id,
          total_dzd: roundedTotal,
          full_name: data.fullName,
          address: data.address || "",
          wilaya: data.wilaya,
          commune: data.commune,
          phone: data.phone,
          payment_method: data.paymentMethod,
          contact_preference: data.contactPreference,
          shipping_method: "desk",
          shipping_fee: actualShippingForDB,
          terms_accepted: data.termsAccepted,
          status: data.paymentMethod === "cod" ? "processing" : "pending",
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;
      const order = orderData as any;

      // 2. Create Order Items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_dzd: (data.paymentMethod === 'chargily' && item.price_chargily && item.price_chargily > 0)
          ? item.price_chargily
          : item.price_dzd,
        variant: item.variant || {},
      }));

      const { error: itemsError } = await (
        supabase.from("order_items" as any) as any
      ).insert(orderItems as any);

      if (itemsError) throw itemsError;

      // 3. Handle Payment Method
      if (data.paymentMethod === "chargily") {
        const { data: checkoutData, error: checkoutError } =
          await supabase.functions.invoke("create-checkout", {
            body: {
              order_id: order.id,
              total_dzd: roundedTotal, // Rounded total for Chargily
              customer_name: data.fullName,
              customer_email: user.email,
              locale: i18n.language,
              site_url: window.location.origin,
            },
          });

        if (checkoutError) {
          console.error("Function error details:", checkoutError);
          throw new Error(`Payment error: ${checkoutError.message}`);
        }

        if (checkoutData?.checkout_url) {
          window.location.href = checkoutData.checkout_url;
        } else {
          console.error("No checkout URL returned:", checkoutData);
          throw new Error("لم يتم إرجاع رابط الدفع");
        }
      } else {
        // COD - Direct success
        // Note: clearCart() is called in OrderSuccess component to prevent unwanted early redirects
        navigate(`/order/success?order_id=${order.id}`);
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "حدث خطأ أثناء إنشاء الطلب");
      setIsSubmitting(false);
    }
  };

  const termsAccepted = watch("termsAccepted");

  return (
    <>
      <SEOMeta title={t("checkout.title")} />
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Minimalist Progress Header */}
        <div className="max-w-4xl mx-auto mb-16 md:mb-24">
          <div className="flex justify-between items-end border-b border-surface-high pb-8">
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-gray-900">
              {t("checkout.title")}
            </h1>
            <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
              <div className="flex items-center gap-3 text-gray-400">
                <span>01</span>
                <span className="hidden sm:inline">Cart</span>
              </div>
              <div className="flex items-center gap-3 text-primary">
                <span>02</span>
                <span className="underline underline-offset-8 decoration-2 italic">Delivery</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <span>03</span>
                <span className="hidden sm:inline">Payment</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Form */}
          <div className="flex-1">
            <div className="bg-white border border-surface-high p-8 md:p-14">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-10 tracking-tighter uppercase tracking-widest flex items-center gap-6">
                Shipping Info
                <div className="h-px bg-surface-high flex-grow" />
              </h2>

              <form
                id="checkout-form"
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                      {t("checkout.fullName")} *
                    </label>
                    <input
                      {...register("fullName")}
                      className={`w-full px-5 py-4 border transition-all font-medium text-gray-900 ${errors.fullName ? "border-red-500 bg-red-50" : "border-surface-high bg-surface-low focus:bg-white focus:border-primary"}`}
                      placeholder={t("checkout.fullNamePlaceholder") || "Jane Doe"}
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 px-1">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                      {t("checkout.phone")} *
                    </label>
                    <input
                      {...register("phone")}
                      className={`w-full px-5 py-4 border transition-all font-medium text-gray-900 ${errors.phone ? "border-red-500 bg-red-50" : "border-surface-high bg-surface-low focus:bg-white focus:border-primary"}`}
                      placeholder={t("checkout.phonePlaceholder") || "0550123456"}
                      dir="ltr"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 px-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                      {t("checkout.wilaya")} *
                    </label>
                    <select
                      {...register("wilaya")}
                      className={`w-full px-5 py-4 border transition-all font-medium text-gray-900 appearance-none bg-no-repeat ${isAr ? "bg-[left_1.25rem_center]" : "bg-[right_1.25rem_center]"} ${errors.wilaya ? "border-red-500 bg-red-50" : "border-surface-high bg-surface-low focus:bg-white focus:border-primary"}`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
                    >
                      <option value="">{t("checkout.wilayaPlaceholder")}</option>
                      {WILAYAS.map((w) => (
                        <option
                          key={w.code}
                          value={isAr ? w.name_ar : w.name_en}
                        >
                          {w.code} - {isAr ? w.name_ar : w.name_en}
                        </option>
                      ))}
                    </select>
                    {errors.wilaya && (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 px-1">
                        {errors.wilaya.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                      {t("checkout.commune")} *
                    </label>
                    <input
                      {...register("commune")}
                      className={`w-full px-5 py-4 border transition-all font-medium text-gray-900 ${errors.commune ? "border-red-500 bg-red-50" : "border-surface-high bg-surface-low focus:bg-white focus:border-primary"}`}
                      placeholder={t("checkout.communePlaceholder")}
                    />
                    {errors.commune && (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 px-1">
                        {errors.commune.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                      {t("checkout.address")} *
                    </label>
                    <textarea
                      {...register("address")}
                      className={`w-full px-5 py-4 border transition-all resize-none font-medium text-gray-900 ${errors.address ? "border-red-500 bg-red-50" : "border-surface-high bg-surface-low focus:bg-white focus:border-primary"}`}
                      placeholder={t("checkout.addressPlaceholder")}
                      rows={2}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 px-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6 mt-8 pt-8 border-t border-gray-100">
                  <div className="space-y-12 mt-12 pt-12 border-t border-surface-high">
                    {/* Payment Method Selection */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary" />
                        {t("checkout.paymentMethod")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label
                          className={`flex items-center gap-6 p-6 border transition-all cursor-pointer ${watch("paymentMethod") === "cod" ? "border-primary bg-primary/5 shadow-inner" : "border-surface-high bg-white hover:border-gray-300"}`}
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
                          className={`flex flex-col md:flex-row items-center gap-6 p-6 border transition-all ${!isEligibleForFreeShipping && wilayaName
                              ? "opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed"
                              : watch("paymentMethod") === "chargily"
                                ? "border-primary bg-primary/5 shadow-inner cursor-pointer"
                                : "border-surface-high bg-white hover:border-gray-300 cursor-pointer"
                            }`}
                        >
                          <input
                            type="radio"
                            {...register("paymentMethod")}
                            value="chargily"
                            disabled={!isEligibleForFreeShipping && !!wilayaName}
                            className="w-5 h-5 accent-primary"
                          />
                          <div className="flex-1">
                            <div className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-1 flex items-center gap-2">
                              {t("checkout.online")}
                              {!isEligibleForFreeShipping && wilayaName && (
                                <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 font-bold uppercase tracking-[0.2em]">COD Only</span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                              {!isEligibleForFreeShipping && wilayaName
                                ? "عذراً، الدفع الإلكتروني غير متاح لولايتكم"
                                : t("checkout.onlineDescription")}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Contact Preference */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary" />
                        {t("checkout.contactPreference")} *
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-surface-high border border-surface-high">
                        {[
                          { id: "phone", icon: Phone, label: t("checkout.phoneCall") },
                          { id: "whatsapp", icon: MessageSquare, label: t("checkout.whatsapp") },
                          { id: "telegram", icon: Send, label: t("checkout.telegram") },
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

                {/* Terms and Conditions Checkbox */}
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
                      في غضون 2-7 أيام عمل.
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
          </div>

          {/* Order Summary */}
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
                        src={
                          item.image ||
                          (item as any).images?.[0] ||
                          "https://picsum.photos/seed/sahla/100/100"
                        }
                        alt=""
                        className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest line-clamp-1 mb-1">
                        {isAr ? item.name_ar : item.name_en}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {item.variant
                          ? `${item.variant.group}: ${item.variant.option}`
                          : ""}
                      </p>
                      <div className="text-sm font-display font-bold text-primary mt-2 flex items-center gap-2">
                        {item.quantity} × {formatDZD(paymentMethod === 'chargily' && item.price_chargily && item.price_chargily > 0 ? item.price_chargily : item.price_dzd)}
                        {paymentMethod === 'chargily' && item.price_chargily && item.price_chargily > 0 && item.price_chargily < item.price_dzd && (
                          <span className="text-[10px] text-gray-300 line-through">
                            {formatDZD(item.price_dzd)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-10 pt-10 border-t border-surface-high">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Items ({getItemCount()})</span>
                  <span className="text-sm font-bold text-gray-900">{formatDZD(getTotal(paymentMethod))}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Shipping
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {paymentMethod === 'chargily'
                      ? t("checkout.freeShipping")
                      : (displayShippingFee === 0 && !wilayaName
                        ? t("إختر الولاية")
                        : formatDZD(displayShippingFee))}
                  </span>
                </div>
                <div className="pt-10 border-t border-surface-high flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                    Total DZD
                  </span>
                  <span className="text-4xl font-display font-bold text-primary tracking-tighter">
                    {formatDZD(finalTotal)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                className="w-full h-20 text-lg font-display font-bold tracking-tight bg-primary hover:bg-primary-dim uppercase tracking-widest"
                disabled={!isValid || !termsAccepted || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  `${t("checkout.pay")}`
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-6">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>
                  {watch("paymentMethod") === "cod"
                    ? "Verify Order on Delivery"
                    : "Secure SSL encrypted Payment"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
