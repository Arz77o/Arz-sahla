import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Copy,
  ExternalLink,
  Save,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { SEOMeta } from "../../components/shared/SEOMeta";
import { supabaseAdmin } from "../../lib/supabase";
import { formatDZD } from "../../lib/pricing";
import { Button } from "../../components/ui/button";

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [status, setStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select(
          "*, users(email), order_items(*, products(name_ar, name_en, images, price_usd, price_dzd))",
        )
        .eq("id", id)
        .single();

      const { data: settingsData } = await supabaseAdmin
        .from("settings")
        .select("*")
        .single();

      if (settingsData) setSettings(settingsData);

      if (!error && data) {
        const orderData = data as any;
        setOrder(orderData);
        setStatus(orderData.status);
        setTrackingNumber(orderData.tracking_number || "");
        setAdminNote(orderData.admin_note || "");
      }
      setLoading(false);
    };

    fetchOrder();
  }, [id]);

  const handleCopyAddress = () => {
    if (!order) return;

    const addressText = `الاسم: ${order.full_name}
الهاتف: ${order.phone}
طريقة التواصل: ${order.contact_preference === "whatsapp" ? "واتساب" : order.contact_preference === "email" ? "إيميل" : "إتصال هاتف"}
العنوان: ${order.address}، ${order.commune}، ${order.wilaya}
الرمز البريدي: ${order.zip_code}
${order.yalidine_desk ? `مكتب ياليدين: ${order.yalidine_desk}` : ""}`;

    navigator.clipboard
      .writeText(addressText)
      .then(() => toast.success("تم نسخ العنوان ✓"))
      .catch(() => toast.error("فشل نسخ العنوان"));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = {
        status,
        tracking_number: trackingNumber || null,
        admin_note: adminNote || null,
      };

      const { error } = await (supabaseAdmin as any)
        .from("orders")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حفظ التغييرات بنجاح");
      setOrder({ ...order, ...updates });
    } catch (error: any) {
      toast.error(error.message || "فشل حفظ التغييرات");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.",
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      // Supabase should handle order_items via CASCADE if configured,
      // but we use select('*') in fetch so we know the project structure.
      const { error } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("تم حذف الطلب بنجاح");
      navigate("/admin/orders");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("فشل حذف الطلب: " + error.message);
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">الطلب غير موجود</h2>
        <Link
          to="/admin/orders"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          &larr; العودة للطلبات
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOMeta title={`تفاصيل الطلب #${order.id.split("-")[0]} | الإدارة`} />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              to="/admin/orders"
              className="text-gray-500 hover:text-gray-900"
            >
              الطلبات
            </Link>
            <span className="text-gray-400">/</span>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              #{order.id.split("-")[0]}
            </h1>
          </div>
          <p className="text-gray-500">
            {new Date(order.created_at).toLocaleString("ar-DZ")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold ${order.status === "delivered"
                ? "bg-green-100 text-green-800"
                : order.status === "shipped"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "not_received" ||
                    order.status === "cancelled"
                    ? "bg-red-100 text-red-800"
                    : order.status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : order.status === "processing"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-gray-100 text-gray-800"
              }`}
          >
            {order.status === "pending"
              ? "⭐ إنتظار التأكيد"
              : order.status === "paid"
                ? "✅ مدفوع"
                : order.status === "processing"
                  ? "⏳ قيد التنفيذ"
                  : order.status === "shipped"
                    ? "🚚 تم الشحن"
                    : order.status === "delivered"
                      ? "🎁 تم التسليم"
                      : order.status === "not_received"
                        ? "❌ غير مستلم"
                        : order.status === "cancelled"
                          ? "❌ ملغى"
                          : order.status}
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold ${order.payment_method === "cod"
                ? "bg-amber-100 text-amber-800"
                : "bg-blue-100 text-blue-800"
              }`}
          >
            {order.payment_method === "cod"
              ? "الدفع عند الاستلام (COD)"
              : "دفع إلكتروني (Chargily)"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Customer & Order Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                معلومات العميل والشحن
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                نسخ معلومات العميل ⧉
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">الاسم الكامل</div>
                <div className="font-medium text-gray-900">
                  {order.full_name}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">رقم الهاتف</div>
                <div className="font-medium text-gray-900" dir="ltr">
                  {order.phone}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">
                  البريد الإلكتروني
                </div>
                <div className="font-medium text-gray-900">
                  {order.users?.email}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">طريقة التأكيد المفضلة</div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold ${order.contact_preference === 'whatsapp' ? 'bg-green-100 text-green-800' :
                    order.contact_preference === 'email' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                  }`}>
                  {order.contact_preference === 'whatsapp' ? '✅ واتساب (WhatsApp)' :
                    order.contact_preference === 'email' ? '✉️ إيميل (Email)' :
                      '📞 إتصال هاتفي (Phone Call)'}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-500 mb-1">
                  العنوان التفصيلي
                </div>
                <div className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {order.address ? `${order.address}، ` : ""}{order.commune}، {order.wilaya}
                  <br />
                  {order.zip_code && `الرمز البريدي: ${order.zip_code}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">طريقة التوصيل</div>
                <div className="flex flex-col gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-800 self-start">
                    استلام من المكتب (Stop Desk)
                  </div>
                  {order.yalidine_desk && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="text-xs text-amber-700 mb-1 font-bold">
                        مكتب Yalidine المحدد:
                      </div>
                      <div className="text-amber-900 font-bold">
                        {order.yalidine_desk}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              🛒 المنتجات المطلوبة
              <span className="text-sm font-normal text-gray-400">
                ({order.order_items.length} منتج)
              </span>
            </h2>

            <div className="space-y-4">
              {order.order_items.map((item: any) => {
                const sellPrice = item.unit_price_dzd || 0;
                const buyPrice = item.products?.price_usd || 0;
                const qty = item.quantity || 1;
                const subtotal = sellPrice * qty;
                const profit =
                  buyPrice > 0 ? (sellPrice - buyPrice) * qty : null;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-100 overflow-hidden"
                  >
                    {/* Product header row */}
                    <div className="flex gap-4 items-center p-4 bg-gray-50">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                        <img
                          src={
                            item.products?.images?.[0] ||
                            "https://picsum.photos/seed/sahla/80/80"
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-base">
                          {item.products?.name_ar}
                        </h4>
                        {item.variant && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {item.variant.group}: {item.variant.option}
                          </span>
                        )}
                      </div>
                      {/* Subtotal badge */}
                      <div className="text-left shrink-0">
                        <div className="text-xs text-gray-400 mb-1">
                          الإجمالي
                        </div>
                        <div className="text-lg font-black text-blue-600">
                          {formatDZD(subtotal)}
                        </div>
                      </div>
                    </div>

                    {/* Pricing details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-gray-100 border-t border-gray-100">
                      <div className="p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">
                          سعر البيع / وحدة
                        </div>
                        <div className="font-bold text-gray-900">
                          {formatDZD(sellPrice)}
                        </div>
                      </div>
                      {buyPrice > 0 && (
                        <div className="p-3 text-center">
                          <div className="text-xs text-gray-400 mb-1">
                            سعر الشراء / وحدة
                          </div>
                          <div className="font-bold text-orange-600">
                            {formatDZD(buyPrice)}
                          </div>
                        </div>
                      )}
                      <div className="p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">الكمية</div>
                        <div className="font-bold text-gray-900">× {qty}</div>
                      </div>
                      {profit !== null && (
                        <div className="p-3 text-center">
                          <div className="text-xs text-gray-400 mb-1">
                            الربح المتوقع
                          </div>
                          <div
                            className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatDZD(profit)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Financial Summary */}
            <div className="mt-6 pt-6 border-t-2 border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">مجموع المنتجات</span>
                <span className="font-bold text-gray-900">
                  {formatDZD(order.total_dzd - (order.shipping_fee || 0))}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  🚚 رسوم الشحن
                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                    استلام من المكتب
                  </span>
                </span>
                <span className="font-bold text-gray-900">
                  {formatDZD(order.shipping_fee || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">
                  الإجمالي{" "}
                  {order.payment_method === "cod"
                    ? "(عند الاستلام)"
                    : "(مدفوع)"}
                </span>
                <span className="text-2xl font-black text-blue-600">
                  {formatDZD(order.total_dzd)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Status */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              إدارة الطلب
            </h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  حالة الطلب
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="pending">إنتظار التأكيد (confirmation)</option>
                  <option value="paid">مدفوع (Paid)</option>
                  <option value="processing">قيد التنفيذ (Processing)</option>
                  <option value="shipped">تم الشحن (Shipped)</option>
                  <option value="delivered">تم التسليم (Delivered)</option>
                  <option value="not_received">غير مستلم (Not Received)</option>
                  <option value="cancelled">ملغى (Cancelled)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  🚚 رقم تتبع ياليدين
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="مثال: YAL123456789"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  dir="ltr"
                />
                {trackingNumber ? (
                  <a
                    href="https://yalidine-express.com.dz/suivre-un-colis/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                  >
                    ↗️ تتبع الطرد على موقع Yalidine
                  </a>
                ) : (
                  <p className="text-xs text-gray-400">
                    أضف رقم التتبع المقدم من ياليدين ليتمكن الزبون من التتبع.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  ملاحظات إدارية (داخلية فقط)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="ملاحظات خاصة بالطلب..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {order.chargily_ref && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">
                    مرجع Chargily
                  </div>
                  <div className="font-mono text-sm text-gray-900 break-all">
                    {order.chargily_ref}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-12 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </Button>

              <div className="pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-medium"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف الطلب نهائياً
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
