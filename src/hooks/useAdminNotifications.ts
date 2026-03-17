import { useEffect, useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'support' | 'system';
  created_at: string;
  read: boolean;
  link?: string;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 1. Initial fetch of recent unread items (simulated from orders)
    const fetchRecentAlerts = async () => {
      const { data: recentOrders } = await supabaseAdmin
        .from('orders')
        .select('id, full_name, total_dzd, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentOrders) {
        const alerts: Notification[] = (recentOrders as any[]).map(order => ({
          id: order.id,
          title: 'طلب جديد مستلم',
          message: `طلب من ${order.full_name} بقيمة ${order.total_dzd} دج`,
          type: 'order',
          created_at: order.created_at,
          read: true,
          link: `/admin/orders/${order.id}`
        }));
        setNotifications(alerts);
      }
    };

    fetchRecentAlerts();

    // 2. Setup Realtime Listener for new orders
    const channel = supabaseAdmin
      .channel('admin-notifications')
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

          setNotifications(prev => [notification, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);

          // Trigger sound and toast
          toast.success(notification.title, {
            description: notification.message,
            action: {
              label: 'عرض الطلب',
              onClick: () => window.location.href = notification.link || '#'
            },
            duration: 10000
          });

          // Optional: Add audio cue
          try {
            const audio = new Audio('/notification-sound.mp3');
            audio.play();
          } catch (e) {
            // Ignore if blocked by browser
          }
        }
      )
      .subscribe();

    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, []);

  const markAsRead = () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return { notifications, unreadCount, markAsRead };
}
