import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'support' | 'system' | 'stock';
  created_at: string;
  read: boolean;
  link?: string;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 1. Initial fetch of recent unread items
    const fetchRecentAlerts = async () => {
      try {
        const [
          { data: recentOrders },
          { data: lowStockProds }
        ] = await Promise.all([
          supabaseAdmin
            .from('orders')
            .select('id, full_name, total_dzd, created_at')
            .order('created_at', { ascending: false })
            .limit(5),
          supabaseAdmin
            .from('products')
            .select('id, name_ar, stock_quantity')
            .lte('stock_quantity', 5)
            .limit(5)
        ]);

        const orderAlerts: Notification[] = (recentOrders || []).map(order => ({
          id: order.id,
          title: 'طلب جديد مستلم',
          message: `طلب من ${order.full_name} بقيمة ${order.total_dzd} دج`,
          type: 'order',
          created_at: order.created_at,
          read: true,
          link: `/admin/orders/${order.id}`
        }));

        const stockAlerts: Notification[] = (lowStockProds || []).map(prod => ({
          id: `stock-${prod.id}`,
          title: '⚠️ وشك نفاذ المخزون',
          message: `المنتج "${prod.name_ar}" متبقي منه ${prod.stock_quantity} فقط!`,
          type: 'stock',
          created_at: new Date().toISOString(),
          read: true,
          link: `/admin/products`
        }));

        setNotifications([...orderAlerts, ...stockAlerts].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };

    fetchRecentAlerts();

    // 2. Setup Realtime Listener for new orders
    const ordersChannel = supabaseAdmin
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as any;
          
          const notification: Notification = {
            id: newOrder.id,
            title: '🎉 طلب جديد!',
            message: `وصل طلب جديد من ${newOrder.full_name} بقيمة ${newOrder.total_dzd} دج`,
            type: 'order',
            created_at: newOrder.created_at,
            read: false,
            link: `/admin/orders/${newOrder.id}`
          };

          setNotifications(prev => [notification, ...prev].slice(0, 15));
          setUnreadCount(prev => prev + 1);
          toast.success(notification.title, { description: notification.message });
        }
      )
      .subscribe();

    // 3. Setup Realtime Listener for product stock updates
    const stockChannel = supabaseAdmin
      .channel('admin-stock')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          const prod = payload.new as any;
          if (prod.stock_quantity <= 5 && (payload.old as any).stock_quantity > 5) {
            const notification: Notification = {
              id: `stock-${prod.id}-${Date.now()}`,
              title: '⚠️ تنبيه المخزون',
              message: `المنتج "${prod.name_ar}" على وشك النفاد (${prod.stock_quantity} قطعة متبقية)`,
              type: 'stock',
              created_at: new Date().toISOString(),
              read: false,
              link: `/admin/products`
            };
            setNotifications(prev => [notification, ...prev].slice(0, 15));
            setUnreadCount(prev => prev + 1);
            toast.error(notification.title, { description: notification.message });
          }
        }
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(ordersChannel);
      supabaseAdmin.removeChannel(stockChannel);
    };
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return { notifications, unreadCount, markAsRead };
}
