import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Clock,
  Users,
  Package,
  TrendingUp,
  Activity,
  Award,
  Download,
  CheckCircle,
  XCircle,
  ArrowDownRight,
  Truck,
} from "lucide-react";
import { SEOMeta } from "../../components/shared/SEOMeta";
import { supabaseAdmin } from "../../lib/supabase";
import { formatDZD } from "../../lib/pricing";
import { Button } from "../../components/ui/button";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    purchaseCost: 0,
    totalProfit: 0,
    totalCustomers: 0,
    pendingCount: 0,
    confirmedCount: 0,
    processingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
  });

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Basic Stats
        const [
          { count: todayCount },
          { count: customersCount },
          { count: pendingCount },
          { count: confirmedCount },
          { count: processingCount },
          { count: shippedCount },
          { count: deliveredCount },
          { count: cancelledCount },
          { count: returnedCount },
        ] = await Promise.all([
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .gte("created_at", today.toISOString()),
          supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true }),
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "confirmed"),
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "processing"),
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "shipped"),
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "delivered"),
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "cancelled"),
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "not_received"),
        ]);

        // 1.1 Calculate Costs and Profits from Order Items (for confirmed/processing/shipped/delivered)
        const { data: itemsData } = await (supabaseAdmin as any)
          .from("order_items")
          .select("quantity, unit_price_dzd, products(price_usd), orders!inner(status)")
          .in("orders.status", ["confirmed", "processing", "shipped", "delivered"]);

        let totalProfit = 0;
        let purchaseCost = 0;

        (itemsData as any[])?.forEach((item: any) => {
          const sellingPrice = item.unit_price_dzd || 0;
          const costPrice = item.products?.price_usd || 0;
          const qty = item.quantity || 0;
          
          totalProfit += qty * (sellingPrice - costPrice);
          purchaseCost += qty * costPrice;
        });

        setStats({
          todayOrders: todayCount || 0,
          purchaseCost: purchaseCost,
          totalProfit: totalProfit,
          totalCustomers: customersCount || 0,
          pendingCount: pendingCount || 0,
          confirmedCount: confirmedCount || 0,
          processingCount: processingCount || 0,
          shippedCount: shippedCount || 0,
          deliveredCount: deliveredCount || 0,
          cancelledOrders: cancelledCount || 0,
          returnedOrders: returnedCount || 0,
        });

        // 2. Top Products
        const { data: topProds } = await (supabaseAdmin as any)
          .from("order_items")
          .select("product_id, quantity, products(name_ar, stock_quantity)")
          .limit(20);

        const productStats: any = {};
        topProds?.forEach((item: any) => {
          const name = item.products?.name_ar || "منتج غير معروف";
          if (!productStats[name]) {
            productStats[name] = {
              name,
              sales: 0,
              stock: item.products?.stock_quantity ?? 0,
            };
          }
          productStats[name].sales += item.quantity;
        });

        setTopProducts(
          Object.values(productStats)
            .sort((a: any, b: any) => b.sales - a.sales)
            .slice(0, 5),
        );
      } catch (err) {
        console.error("Dashboard data error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleExportExcel = async () => {
    try {
      toast.loading("جاري تحضير التقرير...");

      const { data: settingsData } = await supabaseAdmin
        .from("settings")
        .select("profit_per_usd, usd_to_dzd_rate")
        .single();

      // Note: All prices are treated as DZD. price_usd field stores the cost price in DZD.

      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select(`
          id,
          created_at,
          full_name,
          phone,
          wilaya,
          status,
          total_dzd,
          order_items (
            quantity,
            unit_price_dzd,
            products (
              name_ar,
              price_usd
            )
          )
        `)
        .in("status", ["confirmed", "processing", "shipped", "delivered"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!orders || orders.length === 0) {
        toast.dismiss();
        toast.error("لا توجد بيانات للتصدير");
        return;
      }

      const reportData = orders.flatMap((order: any) =>
        order.order_items.map((item: any) => {
          const costDZD = item.products?.price_usd || 0;
          const sellingPrice = item.unit_price_dzd || 0;
          const profitDZD = sellingPrice - costDZD;

          return {
            "رقم الطلب": order.id.split("-")[0],
            التاريخ: new Date(order.created_at).toLocaleDateString("ar-DZ"),
            "اسم العميل": order.full_name,
            الهاتف: order.phone,
            الولاية: order.wilaya,
            المنتج: item.products?.name_ar || "غير معروف",
            الكمية: item.quantity,
            "سعر البيع للوحدة (دج)": sellingPrice,
            "تكلفة الشراء للوحدة (دج)": costDZD,
            "الربح للوحدة (دج)": profitDZD,
            "إجمالي الربح (دج)": profitDZD * item.quantity,
            الحالة: order.status,
          };
        })
      );

      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "الطلبات والمبيعات");

      const fileName = `Sahla_Report_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.dismiss();
      toast.success("تم تحميل التقرير بنجاح");
    } catch (err: any) {
      toast.dismiss();
      toast.error("فشل تصدير التقرير: " + err.message);
    }
  };

  const statCards = [
    {
      label: "طلبات اليوم الجديد",
      value: stats.todayOrders,
      icon: ShoppingCart,
      color: "blue",
    },
    {
      label: "بانتظار التأكيد",
      value: stats.pendingCount,
      icon: Clock,
      color: "amber",
    },
    {
      label: "الطلبات المؤكدة",
      value: stats.confirmedCount,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "قيد التنفيذ",
      value: stats.processingCount,
      icon: Activity,
      color: "indigo",
    },
    {
      label: "في الشحن",
      value: stats.shippedCount,
      icon: Truck,
      color: "blue",
    },
    {
      label: "الطلبيات المستلمة",
      value: stats.deliveredCount,
      icon: Package,
      color: "green",
    },
    {
      label: "الأرباح المتوقعة",
      value: stats.totalProfit,
      icon: TrendingUp,
      color: "emerald",
      isPrice: true,
    },
    {
      label: "طلبات ملغاة",
      value: stats.cancelledOrders,
      icon: XCircle,
      color: "red",
    },
    {
      label: "غير مستلمة (Retour)",
      value: stats.returnedOrders,
      icon: ArrowDownRight,
      color: "gray",
    },
  ];

  return (
    <>
      <SEOMeta title="لوحة التحكم | الإدارة" />

      <AdminPageHeader
        title="نظرة عامة / Dashboard"
        subtitle="متابعة سريعة لأداء Sahla DZ اليوم"
        kicker="DAILY BUSINESS SNAPSHOT"
        actions={
          <>
            <Button
              variant="outline"
              className="bg-white border-surface-high gap-2"
              onClick={handleExportExcel}
            >
              <Download className="w-4 h-4" />
              تصدير البيانات / Export
            </Button>
            <Link to="/admin/orders">
              <Button className="bg-blue-600 hover:bg-blue-700 px-6">
                إدارة الطلبات / Orders
              </Button>
            </Link>
          </>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {statCards.map((card, i) => {
          const colorClasses: Record<string, string> = {
            blue: "bg-blue-50 text-blue-600",
            amber: "bg-amber-50 text-amber-600",
            green: "bg-green-50 text-green-600",
            red: "bg-red-50 text-red-600",
            gray: "bg-gray-50 text-gray-600",
            emerald: "bg-emerald-50 text-emerald-600",
            indigo: "bg-indigo-50 text-indigo-600",
          };
          const itemColorClass = colorClasses[card.color] || "bg-gray-50 text-gray-600";

          return (
            <div
              key={i}
              className="bg-white p-6 border border-surface-high transition-all hover:border-blue-100 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${itemColorClass}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="text-sm font-bold text-gray-400 mb-1">
                {card.label}
              </div>
              <div className="text-2xl font-black text-gray-900">
                {loading ? (
                  <div className="h-8 w-20 bg-gray-50 animate-pulse rounded-lg" />
                ) : (
                  card.isPrice ? formatDZD(card.value as number) : card.value
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Top Products */}
        <div className="bg-white p-8 border border-surface-high">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              المنتجات الأكثر مبيعاً
            </h3>
          </div>
          <div className="space-y-6">
            {topProducts.length === 0 ? (
              <div className="text-center py-10">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">لا توجد بيانات حركة بيع حالياً</p>
              </div>
            ) : (
              topProducts.map((prod, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400 text-sm">
                    0{i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900 truncate">
                      {prod.name}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500">
                        {prod.sales} مبيعة
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${prod.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        المخزون: {prod.stock}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (prod.sales / topProducts[0].sales) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
