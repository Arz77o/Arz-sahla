import React, { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { SEOMeta } from "../components/shared/SEOMeta";
import { useCartStore } from "../store/cartStore";
import { supabase } from "../lib/supabase";
import { formatDZD } from "../lib/pricing";
import { Button } from "../components/ui/button";
import { gtm } from "../lib/gtm";
import { metaPixel } from "../lib/metaPixel";
import { sendServerEvent } from "../lib/metaCapi";
import { useAuthStore } from "../store/authStore";
import { UserPlus, Sparkles } from "lucide-react";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
  }, [clearCart]);

  const lastTrackedOrderId = useRef<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || lastTrackedOrderId.current === orderId) return;
      try {
        const { data } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", orderId)
          .single();
        if (data) {
          setOrder(data);

          // Track purchase for GA4
          const shouldTrack = Boolean(data);

          if (shouldTrack && lastTrackedOrderId.current !== orderId) {
            gtm.ecommerce("purchase", {
              transaction_id: data.id,
              value: data.total_dzd,
              currency: "DZD",
              shipping: data.shipping_fee ?? 0,
              items:
                (data as any).order_items?.map((item: any) => ({
                  item_id: item.product_id,
                  quantity: item.quantity || 1,
                  price: item.unit_price_dzd || 0,
                })) || [],
            });

            const normalizedValue = Number(data.total_dzd || 0);

            // Track a Lead for the order-completion step (customer has submitted the order, but not yet confirmed as purchased)
            const metaEventId = metaPixel.lead({
              content_ids:
                (data as any).order_items?.map(
                  (item: any) => item.product_id,
                ) || [],
              content_type: "product",
              value: normalizedValue,
              currency: "DZD",
              num_items:
                (data as any).order_items?.reduce(
                  (acc: number, item: any) => acc + (item.quantity || 1),
                  0,
                ) || 1,
            });

            // Forward to Conversions API
            if (metaEventId) {
              sendServerEvent(
                "Lead",
                metaEventId,
                {
                  content_ids:
                    (data as any).order_items?.map(
                      (item: any) => item.product_id,
                    ) || [],
                  content_type: "product",
                  value: normalizedValue,
                  currency: "DZD",
                  num_items:
                    (data as any).order_items?.reduce(
                      (acc: number, item: any) => acc + (item.quantity || 1),
                      0,
                    ) || 1,
                },
                {
                  fullName: data.full_name || undefined,
                  phone: data.phone || undefined,
                },
              );
            }

            lastTrackedOrderId.current = orderId;
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  return (
    <>
      <SEOMeta title="تأكيد الطلب — SAHLA DZ." />
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-16 md:py-32 max-w-5xl">
          {/* Header Section */}
          <div className="mb-20 md:mb-32 border-b border-surface-high pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-6xl md:text-9xl font-display font-bold text-gray-900 tracking-tighter leading-none mb-6">
                  Success
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary italic">
                  ORDER CONFIRMED & READY FOR DELIVERY
                </p>
              </div>
              <div className="w-20 h-20 bg-surface-low border border-surface-high flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-10 h-10 stroke-1" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-12">
              <div className="space-y-6">
                <h2 className="text-3xl font-display font-bold text-gray-900 tracking-tight leading-tight">
                  شكراً لتسوقك من SAHLA DZ. <br /> تم تأكيد استلام طلبك بنجاح.
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-md uppercase tracking-widest font-bold">
                  Your order has been received. Our team will verify the details
                  and contact you within 24 hours via WhatsApp or Phone for
                  final confirmation and delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/order/track" className="group">
                  <div className="border border-surface-high p-8 hover:bg-primary transition-all group-hover:border-primary">
                    <Package className="w-6 h-6 mb-6 text-primary group-hover:text-white stroke-1" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900 group-hover:text-white mb-2">
                      تتبع الشحنة
                    </h3>
                    <p className="text-[10px] text-gray-400 group-hover:text-white/60">
                      Follow the journey of your order.
                    </p>
                  </div>
                </Link>
                <Link to="/products" className="group">
                  <div className="border border-surface-high p-8 hover:bg-surface-low transition-all">
                    <ArrowRight className="w-6 h-6 mb-6 text-gray-400 stroke-1" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900 mb-2">
                      مواصلة التسوق
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Discover more innovative products.
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Registration Nudge for Guests */}
            {!user && (
              <div className="lg:col-span-12 mt-8">
                <div className="relative overflow-hidden bg-primary p-8 md:p-12 border border-primary">
                  {/* Decorative Sparkles */}
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-32 h-32 text-white" />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl text-center md:text-right">
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
                        أنشئ حساباً وتابع طلبك بسهولة!
                      </h3>
                      <p className="text-white/80 text-xs font-bold uppercase tracking-widest leading-relaxed">
                        بمجرد إنشاء حسابك، ستتمكن من تقييم المنتجات ومشاركة
                        تجربتك، تتبع حالة شحنتك في الوقت الحقيقي، والاطلاع على
                        سجل طلباتك.
                      </p>
                    </div>
                    <Link
                      to={`/register?returnTo=/account&phone=${order?.phone || ""}`}
                      className="w-full md:w-auto"
                    >
                      <Button
                        size="lg"
                        variant="secondary"
                        className="w-full h-16 px-10 bg-white text-primary hover:bg-gray-100 font-display font-bold uppercase tracking-widest gap-3"
                      >
                        <UserPlus className="w-5 h-5" />
                        إنشاء حساب الآن
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <aside className="lg:col-span-5">
              <div className="bg-surface-low p-8 md:p-12 border border-surface-high sticky top-24">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
                  Order Summary
                </h3>

                {loading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary stroke-1" />
                  </div>
                ) : order ? (
                  <div className="space-y-10">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                        Reference ID
                      </span>
                      <span className="font-mono text-xl font-bold text-gray-900 tracking-tighter">
                        {orderId?.substring(0, 12).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                        Payment Protocol
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500" />
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-900 italic">
                          Cash on Delivery
                        </span>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-surface-high">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                        Total Value
                      </span>
                      <span className="text-4xl font-display font-bold text-primary tracking-tighter">
                        {formatDZD(order.total_dzd)}
                      </span>
                    </div>

                    <div className="p-6 bg-white border border-surface-high text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose italic">
                      Notice: Items will be delivered to the selected 'Stop
                      Desk' office in your province. Please bring your ID for
                      verification.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                      Order Details Unavailable
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
