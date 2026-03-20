import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Search, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SEOMeta } from "../../components/shared/SEOMeta";
import { supabaseAdmin } from "../../lib/supabase";
import { formatDZD } from "../../lib/pricing";
import { Button } from "../../components/ui/button";

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabaseAdmin
      .from("orders")
      .select("*, order_items(count)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (searchQuery) {
      query = query.or(
        `id.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`,
      );
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      setOrders(orders.filter((o) => o.id !== orderId));
      toast.success("تم حذف الطلب بنجاح");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("فشل حذف الطلب: " + error.message);
    }
  };

  const tabs = [
    { id: "all", label: "الكل" },
    { id: "pending", label: "⏳ إنتظار التأكيد" },
    { id: "paid", label: "💳 مدفوع" },
    { id: "processing", label: "📦 تنفيذ" },
    { id: "shipped", label: "🚚 شحن" },
    { id: "delivered", label: "🤝 مستلم" },
    { id: "not_received", label: "🚨 غير مستلم" },
    { id: "cancelled", label: "❌ ملغى" },
  ];

  const statusColor: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    paid: "bg-emerald-100 text-emerald-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    not_received: "bg-red-100 text-red-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <>
      <SEOMeta title="إدارة الطلبات | الإدارة" />

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الطلبات</h1>
          <p className="text-gray-500 mt-1">إدارة وتتبع طلبات العملاء</p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="بحث برقم الطلب، الاسم، الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الطلب
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المنتجات
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدفع
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التوصيل
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجمالي
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الولاية
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    لا توجد طلبات تطابق بحثك
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {order.id.split("-")[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.full_name}
                      </div>
                      <div className="text-sm text-gray-500" dir="ltr">
                        {order.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.order_items[0]?.count || 0} منتج
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${order.payment_method === "cod" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {order.payment_method === "cod" ? "COD" : "Online"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      مكتب
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatDZD(order.total_dzd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.wilaya}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColor[order.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {tabs.find((t) => t.id === order.status)?.label ||
                          order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("ar-DZ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                      <Link to={`/admin/orders/${order.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-900 px-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="mr-1">عرض</span>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="mr-1">حذف</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
