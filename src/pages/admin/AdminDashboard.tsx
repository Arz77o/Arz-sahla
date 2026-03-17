import React, { useEffect, useState } from 'react';
import { ShoppingCart, DollarSign, Clock, LifeBuoy, AlertTriangle } from 'lucide-react';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { supabaseAdmin } from '../../lib/supabase';
import { formatDZD } from '../../lib/pricing';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    monthRevenue: 0,
    pendingFulfillment: 0,
    openTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Today's orders
      const { count: todayCount } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Month revenue (paid or higher)
      const { data: monthOrders } = await supabaseAdmin
        .from('orders')
        .select('total_dzd')
        .gte('created_at', firstDayOfMonth.toISOString())
        .in('status', ['paid', 'processing', 'shipped', 'delivered']);
        
      const revenue = monthOrders?.reduce((sum, order) => sum + order.total_dzd, 0) || 0;

      // Pending fulfillment (paid status)
      const { count: pendingCount } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid');

      // Open tickets
      const { count: ticketsCount } = await supabaseAdmin
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setStats({
        todayOrders: todayCount || 0,
        monthRevenue: revenue,
        pendingFulfillment: pendingCount || 0,
        openTickets: ticketsCount || 0,
      });
      
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <>
      <SEOMeta title="لوحة التحكم | الإدارة" />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على أداء المتجر</p>
      </div>

      {stats.pendingFulfillment > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900">طلبات بانتظار التنفيذ</h3>
            <p className="text-amber-700 text-sm mt-1">
              يوجد {stats.pendingFulfillment} طلب مدفوع بانتظار الشراء من AliExpress. يرجى معالجتها في أقرب وقت.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-500">اليوم</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats.todayOrders}
          </div>
          <div className="text-sm text-gray-500">طلب جديد</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-500">هذا الشهر</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : formatDZD(stats.monthRevenue)}
          </div>
          <div className="text-sm text-gray-500">إيرادات مكتملة</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-500">الآن</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats.pendingFulfillment}
          </div>
          <div className="text-sm text-gray-500">في انتظار التنفيذ</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-500">الآن</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {loading ? '...' : stats.openTickets}
          </div>
          <div className="text-sm text-gray-500">تذكرة دعم مفتوحة</div>
        </div>
      </div>
    </>
  );
}
