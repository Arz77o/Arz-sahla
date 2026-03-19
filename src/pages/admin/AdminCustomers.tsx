import React, { useEffect, useState } from "react";
import {
  Loader2,
  Search,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  UserCheck,
  UserX,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOMeta } from "../../components/shared/SEOMeta";
import { supabaseAdmin } from "../../lib/supabase";
import { formatDZD } from "../../lib/pricing";
import { toast } from "sonner";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      // Fetch users and join with orders to get count and sum
      // Note: We use a join or multiple queries. For simplicity and performance with small datasets,
      // we'll fetch users then fetch order stats.
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) {
        toast.error("فشل تحميل بيانات العملاء");
        setLoading(false);
        return;
      }

      // Fetch order stats for these users
      const { data: ordersData, error: ordersError } = (await supabaseAdmin
        .from("orders")
        .select("user_id, total_dzd, status")) as {
        data: any[] | null;
        error: any;
      };

      if (!ordersError && ordersData) {
        const enhancedCustomers = usersData.map((user: any) => {
          const userOrders = ordersData.filter(
            (o: any) => o.user_id === user.id,
          );
          const totalSpent = userOrders
            .filter(
              (o: any) =>
                o.status !== "not_received" && o.status !== "cancelled",
            )
            .reduce((sum: number, o: any) => sum + (o.total_dzd || 0), 0);

          return {
            ...user,
            orders_count: userOrders.length,
            total_spent: totalSpent,
          };
        });
        setCustomers(enhancedCustomers);
      } else {
        setCustomers(
          usersData.map((u: any) => ({
            ...u,
            orders_count: 0,
            total_spent: 0,
          })),
        );
      }

      setLoading(false);
    };

    fetchCustomers();
  }, []);

  const toggleStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabaseAdmin as any)
        .from("users")
        .update({ is_active: !currentStatus })
        .eq("id", customerId);

      if (error) throw error;

      setCustomers(
        customers.map((c) =>
          c.id === customerId ? { ...c, is_active: !currentStatus } : c,
        ),
      );
      toast.success("تم تحديث حالة الحساب");
    } catch (error: any) {
      toast.error("فشل تحديث الحالة: " + error.message);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm),
  );

  return (
    <>
      <SEOMeta title="العملاء | الإدارة" />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العملاء</h1>
          <p className="text-gray-500 mt-1">إدارة حسابات العملاء</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الإيميل، الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  العميل
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right text-nowrap">
                  الطلبات
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right text-nowrap">
                  إجمالي الإنفاق
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right text-nowrap">
                  الحالة
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right text-nowrap">
                  التسجيل
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  إجراء
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    لا يوجد عملاء مطابقين للبحث
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                            customer.role === "admin"
                              ? "bg-purple-600"
                              : "bg-blue-600"
                          }`}
                        >
                          {customer.full_name?.charAt(0).toUpperCase() ||
                            customer.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-bold text-gray-900">
                            {customer.full_name || "بدون اسم"}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div
                              className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"
                              dir="ltr"
                            >
                              <Phone className="w-3 h-3 ml-1" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 font-medium">
                        <ShoppingBag className="w-4 h-4 ml-1.5 text-blue-500" />
                        {customer.orders_count || 0} طلب
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 ml-1 text-emerald-500" />
                        {formatDZD(customer.total_spent || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          customer.is_active !== false
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {customer.is_active !== false ? "نشط" : "محظور"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3.5 h-3.5 ml-1.5" />
                        {new Date(customer.created_at).toLocaleDateString(
                          "ar-DZ",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() =>
                          toggleStatus(
                            customer.id,
                            customer.is_active !== false,
                          )
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          customer.is_active !== false
                            ? "text-red-500 hover:bg-red-50"
                            : "text-green-500 hover:bg-green-50"
                        }`}
                        title={
                          customer.is_active !== false
                            ? "حظر الحساب"
                            : "تفعيل الحساب"
                        }
                      >
                        {customer.is_active !== false ? (
                          <UserX className="w-5 h-5" />
                        ) : (
                          <UserCheck className="w-5 h-5" />
                        )}
                      </button>
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
