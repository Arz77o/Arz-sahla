import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  DollarSign,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  TrendingUp,
  Activity,
  Award,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { SEOMeta } from "../../components/shared/SEOMeta";
import { supabaseAdmin } from "../../lib/supabase";
import { formatDZD } from "../../lib/pricing";
import { Button } from "../../components/ui/button";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    purchaseCost: 0,
    totalProfit: 0,
    totalCustomers: 0,
    pendingFulfillment: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        );
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );

        // 1. Basic Stats
        const [
          { count: todayCount },
          { data: monthOrdersData },
          { count: customersCount },
          { count: pendingCount },
          { data: settingsData },
        ] = await Promise.all([
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .gte("created_at", today.toISOString()),
          supabaseAdmin
            .from("orders")
            .select("total_dzd, created_at")
            .gte("created_at", firstDayOfMonth.toISOString())
            .in("status", ["paid", "processing", "shipped", "delivered"]),
          supabaseAdmin
            .from("users")
            .select("*", { count: "exact", head: true }),
          supabaseAdmin
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "paid"),
          supabaseAdmin
            .from("settings")
            .select("profit_per_usd, usd_to_dzd_rate")
            .single(),
        ]);

        const exchangeRate = (settingsData as any)?.usd_to_dzd_rate || 200;
        const profitFactor = (settingsData as any)?.profit_per_usd || 50;

        // 1.1 Calculate Costs and Profits from Order Items
        const { data: itemsData } = await (supabaseAdmin as any)
          .from("order_items")
          .select("quantity, products(price_usd), orders!inner(status)")
          .in("orders.status", ["paid", "processing", "shipped", "delivered"]);

        const totalProfit =
          (itemsData as any[])?.reduce((sum, item: any) => {
            const priceUsd = item.products?.price_usd || 0;
            return sum + item.quantity * priceUsd * profitFactor;
          }, 0) || 0;

        const purchaseCost =
          (itemsData as any[])?.reduce((sum, item: any) => {
            const priceUsd = item.products?.price_usd || 0;
            return sum + item.quantity * priceUsd * exchangeRate;
          }, 0) || 0;

        setStats({
          todayOrders: todayCount || 0,
          purchaseCost: purchaseCost,
          totalProfit: totalProfit,
          totalCustomers: customersCount || 0,
          pendingFulfillment: pendingCount || 0,
          revenueGrowth: 15.5,
          orderGrowth: 8.2,
        });

        // 2. Chart Data: Daily Revenue (Last 14 days)
        const last14Days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (13 - i));
          return d.toISOString().split("T")[0];
        });

        const { data: recentOrders } = await supabaseAdmin
          .from("orders")
          .select("total_dzd, created_at")
          .gte(
            "created_at",
            new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          )
          .in("status", ["paid", "processing", "shipped", "delivered"]);

        const dailyData = last14Days.map((dateStr) => ({
          name: new Date(dateStr).toLocaleDateString("ar-DZ", {
            day: "numeric",
            month: "short",
          }),
          revenue:
            (recentOrders as any[])
              ?.filter((o) => o.created_at.startsWith(dateStr))
              .reduce((sum, o) => sum + (o.total_dzd || 0), 0) || 0,
        }));
        setChartData(dailyData);

        // 3. Status Distribution
        const { data: statusCounts } = await (supabaseAdmin as any)
          .from("orders")
          .select("status");

        const statusMap: any = {};
        statusCounts?.forEach((o: any) => {
          statusMap[o.status] = (statusMap[o.status] || 0) + 1;
        });

        setStatusData(
          Object.entries(statusMap).map(([name, value]) => ({ name, value })),
        );

        // 4. Top Products
        const { data: topProds } = await (supabaseAdmin as any)
          .from("order_items")
          .select("product_id, quantity, products(name_ar)")
          .limit(5);

        const productStats: any = {};
        topProds?.forEach((item: any) => {
          const name = item.products?.name_ar || "منتج غير معروف";
          productStats[name] = (productStats[name] || 0) + item.quantity;
        });

        setTopProducts(
          Object.entries(productStats)
            .map(([name, value]: any) => ({ name, value }))
            .sort((a, b) => b.value - a.value),
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

      const exchangeRate = (settingsData as any)?.usd_to_dzd_rate || 200;
      const profitFactor = (settingsData as any)?.profit_per_usd || 50;

      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select(
          `
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
        `,
        )
        .in("status", ["paid", "processing", "shipped", "delivered"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!orders || orders.length === 0) {
        toast.dismiss();
        toast.error("لا توجد بيانات للتصدير");
        return;
      }

      const reportData = orders.flatMap((order: any) =>
        order.order_items.map((item: any) => {
          const costDZD = (item.products?.price_usd || 0) * exchangeRate;
          const profitDZD = (item.products?.price_usd || 0) * profitFactor;

          return {
            "رقم الطلب": order.id.split("-")[0],
            التاريخ: new Date(order.created_at).toLocaleDateString("ar-DZ"),
            "اسم العميل": order.full_name,
            الهاتف: order.phone,
            الولاية: order.wilaya,
            المنتج: item.products?.name_ar || "غير معروف",
            الكمية: item.quantity,
            "التكلفة ($)": item.products?.price_usd || 0,
            "تكلفة الشراء (دج)": costDZD,
            "سعر البيع (دج)": item.unit_price_dzd,
            "الربح الصافي (دج)": profitDZD,
            الحالة: order.status,
          };
        }),
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
      label: "مبيعات اليوم",
      value: stats.todayOrders,
      icon: ShoppingCart,
      color: "blue",
      growth: stats.orderGrowth,
      prefix: "",
    },
    {
      label: "تكلفة الشراء المتوقعة",
      value: stats.purchaseCost,
      icon: ShoppingCart,
      color: "amber",
      growth: stats.revenueGrowth,
      prefix: "دج",
    },
    {
      label: "الأرباح المتوقعة",
      value: stats.totalProfit,
      icon: TrendingUp,
      color: "green",
      growth: 12.4,
      prefix: "دج",
    },
    {
      label: "إجمالي العملاء",
      value: stats.totalCustomers,
      icon: Users,
      color: "indigo",
      growth: 2.1,
      prefix: "",
    },
    {
      label: "بانتظار التنفيذ",
      value: stats.pendingFulfillment,
      icon: Clock,
      color: "amber",
      growth: -3.5,
      prefix: "",
    },
  ];

  return (
    <>
      <SEOMeta title="لوحة التحكم | الإدارة" />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            إحصائيات المتجر
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            متابعة الأداء الحي لـ Sahla DZ
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-white border-gray-200 gap-2"
            onClick={handleExportExcel}
          >
            <Download className="w-4 h-4" />
            تحميل تقرير Excel
          </Button>
          <Link to="/admin/orders">
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
              عرض الطلبات
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-2xl bg-${card.color}-50 text-${card.color}-600`}
              >
                <card.icon className="w-6 h-6" />
              </div>
              <div
                className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${
                  card.growth >= 0
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {card.growth >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 ml-1" />
                )}
                {Math.abs(card.growth)}%
              </div>
            </div>
            <div className="text-sm font-bold text-gray-500 mb-1">
              {card.label}
            </div>
            <div className="text-2xl font-black text-gray-900 flex items-baseline gap-1">
              {loading ? (
                <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" />
              ) : (
                <>
                  {card.prefix === "دج"
                    ? formatDZD(card.value as number)
                    : card.value}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-black text-gray-900 text-lg">
                تحليل المبيعات
              </h3>
            </div>
            <select className="bg-gray-50 border-none rounded-lg text-sm font-bold px-3 py-1.5 outline-none">
              <option>آخر 14 يوم</option>
              <option>آخر 30 يوم</option>
            </select>
          </div>

          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(val: number) => [formatDZD(val), "الإيرادات"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-900 text-lg mb-8 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            حالة الطلبات
          </h3>
          <div className="h-62.5 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{ borderRadius: "16px", border: "none" }}
                />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={30}>
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {statusData.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  ></div>
                  <span className="text-gray-600 font-medium capitalize">
                    {item.name}
                  </span>
                </div>
                <span className="font-black text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-3 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-black text-gray-900 text-lg mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            الأكثر مبيعاً
          </h3>
          <div className="space-y-5">
            {topProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                لا توجد بيانات كافية
              </p>
            ) : (
              topProducts.map((prod, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">
                      {prod.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {prod.value} قطعة مباعة
                    </div>
                  </div>
                  <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(prod.value / topProducts[0].value) * 100}%`,
                      }}
                    ></div>
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
