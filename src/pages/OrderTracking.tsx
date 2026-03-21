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
import { Copy, ExternalLink } from "lucide-react";

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
      case "paid":
        return 1;
      case "processing":
        return 2;
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      case "not_received":
        return -1;
      case "cancelled":
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStatusStep(order.status) : 0;

  return (
    <>
      <SEOMeta title="تتبع الطلب" />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">تتبع طلبك</h1>
          <p className="text-gray-600">
            أدخل رقم الطلب الخاص بك لمعرفة حالة الشحنة ومسارها.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="block w-full pl-4 pr-12 py-4 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-lg"
                placeholder="رقم الطلب (مثال: 123e4567)"
                dir="ltr"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-16 px-8 rounded-xl text-lg font-bold bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "جاري البحث..." : "تتبع الآن"}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </form>

        {order && currentStep >= 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-6">
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  تفاصيل حالة الطلب
                </h3>
                <span className="text-[10px] text-gray-400 mt-1 font-mono uppercase">
                  ID: {order.id.substring(0, 8)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`inline-flex items-center px-4 py-1.5 rounded-full text-base font-black shadow-sm ${order.status === "delivered"
                    ? "bg-green-500 text-white"
                    : order.status === "shipped"
                      ? "bg-blue-600 text-white"
                      : order.status === "not_received" ||
                        order.status === "cancelled"
                        ? "bg-red-500 text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                >
                  {order.status === "paid" && "تَمَّ الدَّفْعُ"}
                  {order.status === "processing" && "جَارِي التَّنْفِيذُ"}
                  {order.status === "shipped" && "تَمَّ الشَّحْنُ"}
                  {order.status === "delivered" && "تَمَّ التَّسْلِيمُ"}
                  {order.status === "pending" && "إنتظار التأكيد"}
                  {order.status === "not_received" && "غير مستلم"}
                  {order.status === "cancelled" && "ملغى"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-10">
              {/* Yalidine Tracking Number Box */}
              <div
                className={`p-6 rounded-2xl border flex flex-col justify-between group transition-all text-center ${order.tracking_number
                  ? "bg-blue-50/50 border-blue-100 hover:border-blue-300"
                  : "bg-gray-50 border-gray-100 italic"
                  }`}
              >
                <div className="flex items-center justify-between mb-3 border-b border-blue-100/50 pb-3">
                  <span
                    className={`text-xs font-black uppercase tracking-widest ${order.tracking_number ? "text-blue-600" : "text-gray-400"}`}
                  >
                    🚚 رقم تتبع الطرد - Yalidine
                  </span>
                  <Truck
                    className={`w-5 h-5 ${order.tracking_number ? "text-blue-400" : "text-gray-300"}`}
                  />
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <code
                    className={`text-3xl font-black font-mono tracking-tighter ${order.tracking_number ? "text-blue-900" : "text-gray-400"}`}
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
                        className="p-3 bg-white shadow-sm border border-blue-100 hover:bg-blue-100 rounded-xl text-blue-500 transition-all hover:scale-105 active:scale-95"
                        title="نسخ الرقم"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <a
                        href="https://yalidine-express.com.dz/suivre-un-colis/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                      >
                        <ExternalLink className="w-5 h-5" />
                        تتبع على Yalidine
                      </a>
                    </div>
                  )}
                </div>
                {order.tracking_number && (
                  <p className="text-xs text-blue-600 mt-4 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ادخل هذا الرقم في موقع Yalidine لتتبع طردك
                  </p>
                )}
              </div>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Step 1: Received */}
              <div className="relative flex items-start gap-6 mb-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${currentStep >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400"
                    }`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="pt-3 text-right">
                  <h4
                    className={`text-lg font-bold ${currentStep >= 1 ? "text-gray-900" : "text-gray-400"}`}
                  >
                    تم استلام الطلب
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    لقد استلمنا طلبك بنجاح وهو قيد المراجعة الأولية.
                  </p>
                </div>
              </div>

              {/* Step 2: Confirmed */}
              <div className="relative flex items-start gap-6 mb-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${currentStep >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400"
                    }`}
                >
                  <Clock className="w-6 h-6" />
                </div>
                <div className="pt-3 text-right">
                  <h4
                    className={`text-lg font-bold ${currentStep >= 2 ? "text-gray-900" : "text-gray-400"}`}
                  >
                    تأكيد الطلب
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    تم تأكيد طلبك هاتفياً أو تلقائياً وجاري تحضيره للتغليف.
                  </p>
                </div>
              </div>

              {/* Step 3: Shipped */}
              <div className="relative flex items-start gap-6 mb-10">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${currentStep >= 3
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400"
                    }`}
                >
                  <Truck className="w-6 h-6" />
                </div>
                <div className="pt-3 text-right">
                  <h4
                    className={`text-lg font-bold ${currentStep >= 3 ? "text-gray-900" : "text-gray-400"}`}
                  >
                    تم الشحن (Yalidine)
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 mb-3">
                    طلبك الآن مع شركة الشحن وهو في طريقه إلى مكتب الولاية الخاصة بك.
                  </p>

                  {order.tracking_number && currentStep >= 3 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 inline-block text-right">
                      <div className="text-xs text-blue-600 font-medium mb-1">
                        🚚 رقم تتبع Yalidine:
                      </div>
                      <div className="font-mono font-bold text-gray-900 text-lg mb-3">
                        {order.tracking_number}
                      </div>
                      <a
                        href="https://yalidine-express.com.dz/suivre-un-colis/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        تتبع طردك على موقع Yalidine &larr;
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Ready for Pickup / Delivered */}
              <div className="relative flex items-start gap-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${currentStep >= 4
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                    }`}
                >
                  <Home className="w-6 h-6" />
                </div>
                <div className="pt-3 text-right">
                  <h4
                    className={`text-lg font-bold ${currentStep >= 4 ? "text-gray-900" : "text-gray-400"}`}
                  >
                    جاهز للاستلام / تم التسليم
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    الطلب وصل لمكتب الشحن (Stop Desk) أو تم استلامه بنجاح.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {order && currentStep === -1 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
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
