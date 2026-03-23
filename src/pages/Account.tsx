import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Package,
  LogOut,
  Loader2,
  Settings,
  Copy,
  Check,
  Globe,
  ExternalLink,
  ArrowRight,
  User as UserIcon,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Wallet,
  CheckCircle2,
  Truck,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { SEOMeta } from "../components/shared/SEOMeta";
import { useAuthStore } from "../store/authStore";
import { supabase } from "../lib/supabase";
import { formatDZD } from "../lib/pricing";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function Account() {
  const { t } = useTranslation();
  const { user, logout, isAdmin } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name_ar, name_en, images))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  const getOrderStep = (status: string) => {
    switch (status) {
      case "delivered":
        return 3;
      case "shipped":
        return 2;
      default:
        return 1;
    }
  };

  const getStatusProgressLabel = (status: string) => {
    if (status === "delivered") return "Delivered";
    if (status === "shipped") return "Shipped";
    return "Processing";
  };

  const totalOrders = orders.length;
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.total_dzd || 0),
    0,
  );
  const deliveredCount = orders.filter(
    (order) => order.status === "delivered",
  ).length;
  const latestOrderDate = orders[0]?.created_at;

  const filteredOrders = React.useMemo(() => {
    const now = new Date();
    const q = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const refNo = order.id?.split("-")[0]?.toLowerCase() || "";
      const fullId = order.id?.toLowerCase() || "";
      const trackNo = (order.tracking_number || "").toLowerCase();
      const qMatch =
        !q || refNo.includes(q) || fullId.includes(q) || trackNo.includes(q);

      const statusMatch =
        statusFilter === "all" || order.status === statusFilter;
      const paymentMatch =
        paymentFilter === "all" ||
        (order.payment_method || "cod") === paymentFilter;

      let dateMatch = true;
      if (dateFilter !== "all" && order.created_at) {
        const created = new Date(order.created_at);
        const diffDays =
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        if (dateFilter === "7d") dateMatch = diffDays <= 7;
        if (dateFilter === "30d") dateMatch = diffDays <= 30;
        if (dateFilter === "90d") dateMatch = diffDays <= 90;
      }

      return qMatch && statusMatch && paymentMatch && dateMatch;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFilter]);

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Copy failed");
    }
  };

  const supportMessage = (orderId: string) =>
    encodeURIComponent(
      `Hello Sahla Support,\nI need help with Order ID: ${orderId}\nThanks.`,
    );

  return (
    <>
      <SEOMeta title={t("nav.account")} />
      <div className="bg-white min-h-screen pt-12 md:pt-24">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Section */}
          <div className="mb-16 md:mb-24 border-b border-surface-high pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-6xl md:text-9xl font-display font-bold text-gray-900 tracking-tighter leading-none mb-6">
                  Account
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary italic">
                  PERSONAL ARCHIVE & ORDER HISTORY
                </p>
              </div>
              <div className="flex gap-4">
                {isAdmin && (
                  <Link to="/admin">
                    <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary px-6 py-3 hover:bg-primary hover:text-white transition-all">
                      <Settings className="w-3 h-3" />
                      Admin Dashboard
                    </button>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-600 border border-red-100 px-6 py-3 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Sidebar / Profile Card */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <div className="bg-surface-low p-8 md:p-12 border border-surface-high">
                <div className="w-20 h-20 bg-white border border-surface-high flex items-center justify-center text-3xl font-display font-bold text-gray-900 mb-8 tracking-tighter shadow-sm">
                  {user?.user_metadata?.full_name?.charAt(0) ||
                    user?.email?.charAt(0).toUpperCase()}
                </div>

                <div className="space-y-2 mb-12">
                  <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight">
                    {user?.user_metadata?.full_name || "مستخدم"}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">
                    {user?.email}
                  </p>
                </div>

                <div className="space-y-4 pt-8 border-t border-surface-high">
                  <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-primary">
                    <Package className="w-4 h-4 stroke-1" />
                    Collections Acquired
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed italic">
                    You have securely documented {orders.length} acquisitions in
                    your Sahla DZ archive.
                  </p>
                </div>
              </div>
            </aside>

            {/* Main Content / Orders */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-surface-low border border-surface-high p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Total Orders
                    </span>
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-display font-bold text-gray-900">
                    {totalOrders}
                  </p>
                </div>

                <div className="bg-surface-low border border-surface-high p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Total Spent
                    </span>
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-base md:text-lg font-display font-bold text-primary">
                    {formatDZD(totalSpent)}
                  </p>
                </div>

                <div className="bg-surface-low border border-surface-high p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Last Order
                    </span>
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[11px] font-bold text-gray-900 tracking-wide">
                    {latestOrderDate
                      ? new Date(latestOrderDate).toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                </div>

                <div className="bg-surface-low border border-surface-high p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Delivered
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-display font-bold text-gray-900">
                    {deliveredCount}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-surface-high p-4 md:p-6 mb-10 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <Filter className="w-4 h-4 text-primary" />
                  Search & Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="relative md:col-span-2">
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Ref / ID / Tracking"
                      className="w-full border border-surface-high bg-surface-low focus:bg-white focus:border-primary transition-all pr-10 pl-3 py-2.5 text-sm"
                      dir="ltr"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-surface-high bg-surface-low focus:bg-white focus:border-primary transition-all px-3 py-2.5 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="not_received">Not Received</option>
                  </select>

                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full border border-surface-high bg-surface-low focus:bg-white focus:border-primary transition-all px-3 py-2.5 text-sm"
                  >
                    <option value="all">All Payment</option>
                    <option value="cod">COD</option>
                    <option value="chargily">Chargily</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full border border-surface-high bg-surface-low focus:bg-white focus:border-primary transition-all px-3 py-2.5 text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 text-xs font-bold uppercase tracking-widest"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setPaymentFilter("all");
                      setDateFilter("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-12">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary" />
                  Order Registry
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {filteredOrders.length} Results
                </span>
              </div>

              {loading ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto stroke-1 mb-6" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300 italic">
                    Synchronizing History...
                  </p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-32 border border-surface-high bg-surface-low">
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-8 stroke-1" />
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">
                    No Orders Match Current Filters
                  </p>
                  <Link to="/products">
                    <button className="text-xs font-bold uppercase tracking-widest text-primary underline underline-offset-8 decoration-2 italic hover:text-primary-dim">
                      Browse New Pieces
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-16">
                  {filteredOrders.map((order) => {
                    const isExpanded = !!expandedOrders[order.id];
                    const orderStep = getOrderStep(order.status);
                    return (
                      <div
                        key={order.id}
                        className="group border-b border-surface-high pb-12 last:border-0 hover:bg-surface-low/30 transition-all -mx-4 px-4"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-6">
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                                Ref. No.
                              </span>
                              <span className="font-mono text-sm font-bold text-gray-900">
                                {order.id.split("-")[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                                Protocol
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 italic">
                                {order.payment_method === "cod"
                                  ? "COD"
                                  : "Chargily"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                                Value
                              </span>
                              <span className="text-sm font-display font-bold text-primary">
                                {formatDZD(order.total_dzd)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                                Status
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900 underline decoration-2 underline-offset-4 decoration-primary/30">
                                {t(`order.${order.status}`)}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() =>
                                copyText(order.id, "Order ID copied")
                              }
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-700 border border-surface-high px-4 py-2.5 hover:bg-surface-low transition-all"
                            >
                              <Copy className="w-3 h-3" />
                              Copy ID
                            </button>

                            <Link to={`/order/track?order_id=${order.id}`}>
                              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-900 border border-gray-900 px-4 py-2.5 hover:bg-gray-900 hover:text-white transition-all">
                                Track
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </Link>

                            {order.tracking_number && (
                              <button
                                onClick={() =>
                                  copyText(
                                    order.tracking_number,
                                    "Tracking number copied",
                                  )
                                }
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/30 px-4 py-2.5 hover:bg-primary/5 transition-all"
                              >
                                <Truck className="w-3 h-3" />
                                Copy Tracking
                              </button>
                            )}

                            <a
                              href={`https://wa.me/213000000000?text=${supportMessage(order.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-700 border border-green-200 px-4 py-2.5 hover:bg-green-50 transition-all"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Support
                            </a>

                            <button
                              onClick={() => toggleOrder(order.id)}
                              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-700 border border-surface-high px-4 py-2.5 hover:bg-surface-low transition-all"
                            >
                              {isExpanded ? "Hide Details" : "View Details"}
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <>
                            <div className="border border-surface-high bg-surface-low/40 p-5 mb-8">
                              <div className="flex flex-wrap items-center gap-8 text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-gray-400">Progress:</span>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full ${orderStep >= 1 ? "bg-primary" : "bg-gray-300"}`}
                                  />
                                  <span
                                    className={
                                      orderStep >= 1
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }
                                  >
                                    Processing
                                  </span>
                                </div>
                                <div className="w-8 h-px bg-surface-high" />
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full ${orderStep >= 2 ? "bg-primary" : "bg-gray-300"}`}
                                  />
                                  <span
                                    className={
                                      orderStep >= 2
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }
                                  >
                                    Shipped
                                  </span>
                                </div>
                                <div className="w-8 h-px bg-surface-high" />
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full ${orderStep >= 3 ? "bg-green-500" : "bg-gray-300"}`}
                                  />
                                  <span
                                    className={
                                      orderStep >= 3
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }
                                  >
                                    Delivered
                                  </span>
                                </div>
                                <span className="text-primary">
                                  {getStatusProgressLabel(order.status)}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                              <div className="bg-white p-4 border border-surface-high">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                  Shipping - Wilaya
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                  {order.wilaya || "—"}
                                </p>
                              </div>
                              <div className="bg-white p-4 border border-surface-high">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                  Shipping - Commune
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                  {order.commune || "—"}
                                </p>
                              </div>
                              <div className="bg-white p-4 border border-surface-high">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                  Maystro Desk
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                  {order.Maystro_desk || "—"}
                                </p>
                              </div>
                              <div className="bg-white p-4 border border-surface-high">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                                  Tracking Number
                                </p>
                                <p className="text-sm font-mono font-bold text-gray-900">
                                  {order.tracking_number || "Pending"}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {order.order_items?.map((item: any) => (
                                <div
                                  key={item.id}
                                  className="flex gap-6 items-center bg-white p-4 border border-surface-high group-hover:border-primary/20 transition-all"
                                >
                                  <div className="w-20 h-20 shrink-0 border border-surface-high overflow-hidden">
                                    <img
                                      src={
                                        item.products?.images?.[0] ||
                                        "https://picsum.photos/seed/sahla/200/200"
                                      }
                                      alt=""
                                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-[11px] font-display font-bold text-gray-900 uppercase tracking-tight mb-2 italic line-clamp-1">
                                      {item.products?.name_ar}
                                    </h4>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-gray-400 tracking-widest">
                                        QTY: {item.quantity}
                                      </span>
                                      <span className="text-[10px] font-bold text-primary">
                                        {formatDZD(item.unit_price_dzd)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
