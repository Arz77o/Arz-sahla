import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  UserCheck,
  UserX,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";
import { SEOMeta } from "../../components/shared/SEOMeta";
import { supabaseAdmin } from "../../lib/supabase";
import { formatDZD } from "../../lib/pricing";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        // 1. Fetch user profile
        const { data: userData, error: userError } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", id)
          .single();

        if (userError) throw userError;

        // 2. Fetch user orders
        const { data: ordersData, error: ordersError } = await supabaseAdmin
          .from("orders")
          .select("*, order_items(count)")
          .eq("user_id", id)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        setCustomer(userData);
        setOrders(ordersData || []);
      } catch (error: any) {
        console.error("Fetch error:", error);
        toast.error("فشل تحميل بيانات العميل");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCustomerData();
  }, [id]);

  const toggleStatus = async () => {
    if (!customer) return;
    setIsUpdating(true);
    try {
      const newStatus = !customer.is_active;
      const { error } = await (supabaseAdmin as any)
        .from("users")
        .update({ is_active: newStatus })
        .eq("id", customer.id);

      if (error) throw error;

      setCustomer({ ...customer, is_active: newStatus });
      toast.success(
        newStatus ? "تم تفعيل الحساب بنجاح" : "تم حظر الحساب بنجاح",
      );
    } catch (error: any) {
      toast.error("فشل تحديث الحالة: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900">العميل غير موجود</h2>
        <Link
          to="/admin/customers"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          &larr; العودة لقائمة العملاء
        </Link>
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.status !== "not_received" && o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total_dzd || 0), 0);

  return (
    <>
      <SEOMeta
        title={`تفاصيل العميل: ${customer.full_name || customer.email} | الإدارة`}
      />

      <AdminPageHeader
        title={`${customer.full_name || "عميل جوّال"} / Customer Profile`}
        subtitle={
          `معرّف العميل: ${customer.id}`
        }
        kicker="CUSTOMER DETAIL"
        breadcrumb={
          <span className="inline-flex items-center gap-2">
            <Link to="/admin/customers" className="text-gray-500 hover:text-gray-900">
              العملاء / Customers
            </Link>
            <span>/</span>
            <span className="font-mono text-gray-500 text-xs">{customer.id}</span>
          </span>
        }
        actions={
          <div className="flex gap-3">
          <Button
            variant={customer.is_active !== false ? "outline" : "default"}
            onClick={toggleStatus}
            disabled={isUpdating}
            className={
              customer.is_active !== false
                ? "text-red-600 border-red-200 hover:bg-red-50"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : customer.is_active !== false ? (
              <UserX className="w-4 h-4 ml-2" />
            ) : (
              <UserCheck className="w-4 h-4 ml-2" />
            )}
            {customer.is_active !== false ? "حظر الحساب" : "تفعيل الحساب"}
          </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-4xl font-black mb-4 shadow-lg shadow-blue-100">
                {customer.full_name?.charAt(0).toUpperCase() ||
                  customer.email?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {customer.full_name}
              </h2>
              <span
                className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                  customer.is_active !== false
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {customer.is_active !== false ? "حساب نشط" : "حساب محظور"}
              </span>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-sm" dir="ltr">
                    {customer.phone}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm">
                  انضم في:{" "}
                  {new Date(customer.created_at).toLocaleDateString("ar-DZ")}
                </span>
              </div>
            </div>
          </div>

          {/* Last Address */}
          {orders.length > 0 && orders[0].address && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-8">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                آخر عنوان شحن مستخدم
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                <div className="text-sm font-bold text-gray-900">
                  {orders[0].full_name}
                </div>
                <div className="text-sm text-gray-600">{orders[0].address}</div>
                <div className="text-sm text-gray-600">
                  {orders[0].commune}، {orders[0].wilaya}
                </div>
                <div className="pt-2 flex items-center gap-2 text-blue-600 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  تم استخدامه في الطلب #{orders[0].id.split("-")[0]}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-8">
            <h3 className="font-bold text-gray-900 mb-4">إحصائيات العميل</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <ShoppingBag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-black text-blue-900">
                  {orders.length}
                </div>
                <div className="text-xs text-blue-600">إجمالي الطلبات</div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl text-center">
                <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-xl font-black text-emerald-900">
                  {formatDZD(totalSpent)}
                </div>
                <div className="text-xs text-emerald-600">إجمالي الإنفاق</div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">سجل طلبات العميل</h3>
              <span className="text-sm text-gray-500">{orders.length} طلب</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">
                      رقم الطلب
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">
                      التاريخ
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">
                      المبلغ
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 text-right">
                      الإجراء
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        لا توجد طلبات سابقة لهذا العميل
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-bold text-gray-900">
                            #{order.id.split("-")[0]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5 ml-1.5" />
                            {new Date(order.created_at).toLocaleDateString(
                              "ar-DZ",
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {formatDZD(order.total_dzd)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              order.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : order.status === "shipped"
                                  ? "bg-blue-100 text-blue-700"
                                  : order.status === "not_received" ||
                                      order.status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : order.status === "confirmed"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            التفاصيل
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
