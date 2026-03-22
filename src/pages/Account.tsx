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
  User as UserIcon
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
                  {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
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
                    You have securely documented {orders.length} acquisitions in your Sahla DZ archive.
                  </p>
                </div>
              </div>
            </aside>

            {/* Main Content / Orders */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary" />
                  Order Registry
                </h3>
              </div>

              {loading ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto stroke-1 mb-6" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300 italic">Synchronizing History...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-32 border border-surface-high bg-surface-low">
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-8 stroke-1" />
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">No Items Found in this Collection</p>
                  <Link to="/products">
                    <button className="text-xs font-bold uppercase tracking-widest text-primary underline underline-offset-8 decoration-2 italic hover:text-primary-dim">
                      Browse New Pieces
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-16">
                  {orders.map((order) => (
                    <div key={order.id} className="group border-b border-surface-high pb-12 last:border-0 hover:bg-surface-low/30 transition-all -mx-4 px-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-6">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Ref. No.</span>
                            <span className="font-mono text-sm font-bold text-gray-900">{order.id.split("-")[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Protocol</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 italic">
                              {order.payment_method === 'cod' ? 'COD' : 'Chargily'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Value</span>
                            <span className="text-sm font-display font-bold text-primary">{formatDZD(order.total_dzd)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Status</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-900 underline decoration-2 underline-offset-4 decoration-primary/30">
                              {t(`order.${order.status}`)}
                            </span>
                          </div>
                        </div>
                        <Link to={`/order/track?order_id=${order.id}`}>
                          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-900 border border-gray-900 px-6 py-3 hover:bg-gray-900 hover:text-white transition-all">
                            Track
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex gap-6 items-center bg-white p-4 border border-surface-high group-hover:border-primary/20 transition-all">
                            <div className="w-20 h-20 shrink-0 border border-surface-high overflow-hidden">
                              <img
                                src={item.products?.images?.[0] || "https://picsum.photos/seed/sahla/200/200"}
                                alt=""
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-[11px] font-display font-bold text-gray-900 uppercase tracking-tight mb-2 italic line-clamp-1">
                                {item.products?.name_ar}
                              </h4>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 tracking-widest">QTY: {item.quantity}</span>
                                <span className="text-[10px] font-bold text-primary">{formatDZD(item.unit_price_dzd)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
