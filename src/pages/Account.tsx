import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, LogOut, Loader2, Settings, Copy, Check, Globe, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOMeta } from '../components/shared/SEOMeta';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { formatDZD } from '../lib/pricing';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function Account() {
  const { t } = useTranslation();
  const { user, logout, isAdmin } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(name_ar, name_en, images))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  return (
    <>
      <SEOMeta title={t('nav.account')} />
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4 mx-auto">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-1">
                {user?.user_metadata?.full_name || 'مستخدم'}
              </h2>
              <p className="text-sm text-center text-gray-500 mb-6">{user?.email}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium">
                  <Package className="w-5 h-5" />
                  طلباتي
                </div>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                    <Settings className="w-5 h-5" />
                    لوحة تحكم الإدارة
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">سجل الطلبات</h1>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد طلبات بعد</h3>
                <p className="text-gray-500 mb-6">لم تقم بإجراء أي طلبات حتى الآن.</p>
                <Link to="/products">
                  <Button>تصفح المنتجات</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">رقم الطلب</div>
                        <div className="font-mono font-medium text-gray-900">{order.id.split('-')[0]}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">التاريخ</div>
                        <div className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString('ar-DZ')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">الإجمالي</div>
                        <div className="font-bold text-blue-600">{formatDZD(order.total_dzd)}</div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800'
                          }`}>
                          {t(`order.${order.status}`)}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex gap-4 items-center">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                              <img src={item.products?.images?.[0] || 'https://picsum.photos/seed/sahla/100/100'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 line-clamp-1">{item.products?.name_ar}</h4>
                              <div className="text-sm text-gray-500">الكمية: {item.quantity}</div>
                            </div>
                            <div className="font-bold text-gray-900">
                              {formatDZD(item.unit_price_dzd)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-4">
                          {order.tracking_number && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                رقم التتبع العالمي (AliExpress)
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                                  <code className="text-sm font-mono font-bold text-amber-700">{order.tracking_number}</code>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(order.tracking_number);
                                      toast.success('تم نسخ رقم التتبع العالمي');
                                    }}
                                    className="text-amber-400 hover:text-amber-600 transition-colors"
                                    title="نسخ رقم التتبع العالمي"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                                <a
                                  href={`https://t.17track.net/ar#nums=${order.tracking_number}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                                  title="تتبع على 17Track"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Link to={`/order/track?order_id=${order.id}`}>
                            <Button variant="outline" className="rounded-xl">تتبع الطلب</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
