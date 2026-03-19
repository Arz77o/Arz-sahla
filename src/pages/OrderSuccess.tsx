import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Package, ArrowRight, Loader2 } from "lucide-react";
import { SEOMeta } from "../components/shared/SEOMeta";
import { useCartStore } from "../store/cartStore";
import { supabase } from "../lib/supabase";
import { formatDZD } from "../lib/pricing";
import { Button } from "../components/ui/button";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const { data } = await supabase
          .from("orders")
          .select("*, order_items(count)")
          .eq("id", orderId)
          .single();
        if (data) setOrder(data);
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
      <SEOMeta title="تم تأكيد طلبك" />
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          تم تأكيد طلبك! 🎉
        </h1>

        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
          شكراً لتسوقك من Sahla. سنقوم بمعالجة طلبك وشراء المنتجات من AliExpress
          قريباً.
        </p>

        {loading ? (
          <div className="flex justify-center mb-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : order ? (
          <div className="bg-white border border-gray-100 rounded-xl p-6 max-w-md mx-auto mb-8 space-y-4 shadow-sm">
            <div>
              <div className="text-sm text-gray-500 mb-1">
                رقم الطلب الخاص بك
              </div>
              <div className="text-xl font-mono font-bold text-gray-900">
                {orderId}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-500 mb-1">طريقة الدفع</div>
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm ${
                  order.payment_method === "cod"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {order.payment_method === "cod"
                  ? "💵 الدفع عند الاستلام (COD)"
                  : "🏦 دفع إلكتروني (Chargily)"}
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <div className="text-sm text-gray-500 mb-1">الإجمالي</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatDZD(order.total_dzd)}
              </div>
            </div>
            {order.payment_method === "cod" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                ✓ سيتم استقطاع المبلغ عند استقبال طلبك
              </div>
            )}
          </div>
        ) : (
          orderId && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 max-w-md mx-auto mb-10">
              <div className="text-sm text-gray-500 mb-2">
                رقم الطلب الخاص بك
              </div>
              <div className="text-xl font-mono font-bold text-gray-900">
                {orderId}
              </div>
            </div>
          )
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/order/track">
            <Button
              size="lg"
              className="w-full sm:w-auto h-14 px-8 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-700"
            >
              <Package className="w-5 h-5 ml-2" />
              تتبع طلبي
            </Button>
          </Link>
          <Link to="/products">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 px-8 rounded-xl font-bold text-lg"
            >
              متابعة التسوق
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
