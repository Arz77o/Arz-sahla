import React, { useState } from "react";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  Home,
  AlertCircle,
} from "lucide-react";
import { SEOMeta } from "../components/shared/SEOMeta";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2 } from "lucide-react";

export default function OrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const searchVal = orderId.trim();
      let foundOrder = null;

      // 1. Try exact UUID match
      if (searchVal.length === 36) {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("id", searchVal)
          .maybeSingle();
        foundOrder = data;
      }

      // 2. Try Global Tracking Number match
      if (!foundOrder) {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("tracking_number", searchVal)
          .maybeSingle();
        foundOrder = data;
      }

      // 3. Try partial ID match (prefix)
      // We use a broader approach for partials to overcome UUID casting issues
      if (!foundOrder && searchVal.length >= 4) {
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
          "search_order_by_short_id",
          { pref: searchVal },
        );
        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          foundOrder = rpcData[0];
        }
      }

      if (!foundOrder) {
        setError(
          "لم يتم العثور على طلب بهذا الرقم. يرجى التأكد من الرقم والمحاولة مرة أخرى.",
        );
      } else {
        setOrder(foundOrder);
      }
    } catch (err) {
      setError("حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case "pending":
        return 1;
      case "confirmed":
        return 2;
      case "processing":
        return 3;
      case "shipped":
        return 4;
      case "delivered":
        return 5;
      case "not_received":
        return -1;
      case "cancelled":
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStatusStep(order.status) : 0;
  const statusLabelMap: Record<string, string> = {
    pending: "إنتظار التأكيد",
    confirmed: "تم التأكيد",
    processing: "قيد التنفيذ",
    shipped: "تم الشحن",
    delivered: "جاهز للاستلام",
    not_received: "غير مستلم",
    cancelled: "ملغى",
  };

  return (
    <>
      <SEOMeta title="تتبع الطلب" />
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto mb-16 md:mb-24">
          <div className="border-b border-surface-high pb-8 text-right">
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-gray-900 mb-4">
              تتبع الطلب
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              أدخل رقم الطلب أو رقم التتبع لمعرفة حالة الشحنة
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="bg-white border border-surface-high p-6 md:p-10 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                بيانات التتبع
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="block w-full pl-4 pr-12 py-4 border border-surface-high bg-surface-low focus:bg-white focus:border-primary transition-all text-sm font-medium"
                  placeholder="رقم الطلب أو رقم التتبع"
                  dir="ltr"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 text-sm font-bold uppercase tracking-widest bg-primary hover:bg-primary-dim"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري البحث
                  </span>
                ) : (
                  "تتبع الآن"
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 flex items-center gap-2 text-sm">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </form>
        </div>

        {order && currentStep >= 0 && (
          <div className="max-w-4xl mx-auto bg-white border border-surface-high p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-surface-high gap-6">
              <div className="flex flex-col">
                <h3 className="text-lg font-display font-bold text-gray-900 tracking-tight">
                  تفاصيل حالة الطلب
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 font-mono uppercase">
                  ID: {order.id.substring(0, 8)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`inline-flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${order.status === "delivered"
                    ? "bg-green-500 text-white"
                    : order.status === "shipped"
                      ? "bg-primary text-white"
                      : order.status === "not_received" ||
                        order.status === "cancelled"
                        ? "bg-red-500 text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                >
                  {statusLabelMap[order.status] || "قيد المعالجة"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-10">
              <div
                className={`p-6 border flex flex-col justify-between group transition-all text-center ${order.tracking_number
                  ? "bg-primary/5 border-primary/20 hover:border-primary/40"
                  : "bg-surface-low border-surface-high italic"
                  }`}
              >
                <div className="flex items-center justify-between mb-3 border-b border-surface-high pb-3">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${order.tracking_number ? "text-primary" : "text-gray-400"}`}
                  >
                    🚚 رقم تتبع الطرد - DHD Express
                  </span>
                  <Truck
                    className={`w-5 h-5 ${order.tracking_number ? "text-primary" : "text-gray-300"}`}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <code
                    className={`text-2xl md:text-3xl font-black font-mono tracking-tighter ${order.tracking_number ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {order.tracking_number || "بانتظار رقم الشحن..."}
                  </code>
                  {order.tracking_number && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.tracking_number);
                          toast.success("تم نسخ رقم التتبع");
                        }}
                        className="p-3 bg-white border border-surface-high hover:bg-surface-low text-gray-600 transition-all"
                        title="نسخ الرقم"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <a
                        href="https://www.DHD Express-delivery.com/trackingSD.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-primary text-white font-bold hover:bg-primary-dim transition-all"
                      >
                        <ExternalLink className="w-5 h-5" />
                        تتبع على DHD Express
                      </a>
                    </div>
                  )}
                </div>
                {order.tracking_number && (
                  <p className="text-xs text-primary mt-4 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ادخل هذا الرقم في موقع DHD Express لتتبع طردك
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div
                className={`border p-5 md:p-6 flex items-start gap-4 ${currentStep >= 1
                  ? "border-primary/30 bg-primary/5"
                  : "border-surface-high bg-white"
                  }`}
              >
                <div
                  className={`w-11 h-11 flex items-center justify-center shrink-0 ${currentStep >= 1
                    ? "bg-primary text-white"
                    : "bg-surface-low text-gray-400"
                    }`}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                    إنتظار التأكيد
                  </h4>
                  <p className="text-sm text-gray-500 mt-2">
                    لقد استلمنا طلبك بنجاح وهو في قائمة الانتظار للمراجعة يرجى منك التأكيد أولا على الطلبية قبل شحنها .
                  </p>
                </div>
              </div>

              <div
                className={`border p-5 md:p-6 flex items-start gap-4 ${currentStep >= 2
                  ? "border-primary/30 bg-primary/5"
                  : "border-surface-high bg-white"
                  }`}
              >
                <div
                  className={`w-11 h-11 flex items-center justify-center shrink-0 ${currentStep >= 2
                    ? "bg-primary text-white"
                    : "bg-surface-low text-gray-400"
                    }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                    تم التأكيد
                  </h4>
                  <p className="text-sm text-gray-500 mt-2">
                    تم تأكيد بيانات طلبك بنجاح و تم التواصل معك للتأكد من إستلام الطلبية .
                  </p>
                </div>
              </div>

              <div
                className={`border p-5 md:p-6 flex items-start gap-4 ${currentStep >= 3
                  ? "border-primary/30 bg-primary/5"
                  : "border-surface-high bg-white"
                  }`}
              >
                <div
                  className={`w-11 h-11 flex items-center justify-center shrink-0 ${currentStep >= 3
                    ? "bg-primary text-white"
                    : "bg-surface-low text-gray-400"
                    }`}
                >
                  <Package className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                    قيد التنفيذ
                  </h4>
                  <p className="text-sm text-gray-500 mt-2">
                    جاري تحضير طلبك، تغليفه، وتجهيزه لتسليمه لشركة الشحن.
                  </p>
                </div>
              </div>

              <div
                className={`border p-5 md:p-6 ${currentStep >= 4
                  ? "border-primary/30 bg-primary/5"
                  : "border-surface-high bg-white"
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 flex items-center justify-center shrink-0 ${currentStep >= 4
                      ? "bg-primary text-white"
                      : "bg-surface-low text-gray-400"
                      }`}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                      تم الشحن
                    </h4>
                    <p className="text-sm text-gray-500 mt-2 mb-3">
                      طلبك الآن مع شركة الشحن وهو في طريقه إلى مكتب الولاية
                      الخاصة بك.
                    </p>
                  </div>
                </div>

                {order.tracking_number && currentStep >= 4 && (
                  <div className="mt-3 bg-white border border-surface-high p-4 text-right mr-[3.75rem]">
                    <div className="text-xs text-primary font-medium mb-1">
                      🚚 رقم تتبع DHD Express:
                    </div>
                    <div className="font-mono font-bold text-gray-900 text-lg mb-3">
                      {order.tracking_number}
                    </div>
                    <a
                      href="https://www.DHD Express-delivery.com/trackingSD.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary-dim font-medium underline"
                    >
                      تتبع طردك على موقع DHD Express &larr;
                    </a>
                  </div>
                )}
              </div>

              <div
                className={`border p-5 md:p-6 flex items-start gap-4 ${currentStep >= 5
                  ? "border-green-200 bg-green-50/60"
                  : "border-surface-high bg-white"
                  }`}
              >
                <div
                  className={`w-11 h-11 flex items-center justify-center shrink-0 ${currentStep >= 5
                    ? "bg-green-500 text-white"
                    : "bg-surface-low text-gray-400"
                    }`}
                >
                  <Home className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                    جاهز للاستلام
                  </h4>
                  <p className="text-sm text-gray-500 mt-2">
                    لقد وصل الطرد إلى مكتب الشحن (Stop Desk) في ولايتك، يمكنك استلامه الآن.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {order && currentStep === -1 && (
          <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-700 mb-2">
              تم رفض الطلب
            </h3>
            <p className="text-red-600">
              عذراً، لم نتمكن من معالجة طلبك. قد يكون ذلك بسبب فشل عملية الدفع
              أو نفاد الكمية. يرجى التواصل مع الدعم الفني للمزيد من المعلومات.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
