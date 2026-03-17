import React, { useState } from 'react';
import { Search, Package, CheckCircle2, Clock, Truck, Home, AlertCircle } from 'lucide-react';
import { SEOMeta } from '../components/shared/SEOMeta';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId.trim())
        .single();

      if (fetchError || !data) {
        setError('لم يتم العثور على طلب بهذا الرقم. يرجى التأكد من الرقم والمحاولة مرة أخرى.');
      } else {
        setOrder(data);
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'paid': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'rejected': return -1;
      default: return 0;
    }
  };

  const currentStep = order ? getStatusStep(order.status) : 0;

  return (
    <>
      <SEOMeta title="تتبع الطلب" />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">تتبع طلبك</h1>
          <p className="text-gray-600">أدخل رقم الطلب الخاص بك لمعرفة حالة الشحنة ومسارها.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="block w-full pl-4 pr-12 py-4 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-lg"
                placeholder="رقم الطلب (مثال: 123e4567-e89b-12d3-a456-426614174000)"
                dir="ltr"
              />
            </div>
            <Button 
              type="submit" 
              size="lg" 
              className="h-16 px-8 rounded-xl text-lg font-bold bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'جاري البحث...' : 'تتبع الآن'}
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </form>

        {order && currentStep >= 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">حالة الطلب</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">{order.id}</p>
              </div>
              <div className="text-left">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {order.status === 'paid' && 'تم الدفع'}
                  {order.status === 'processing' && 'قيد التنفيذ'}
                  {order.status === 'shipped' && 'تم الشحن'}
                  {order.status === 'delivered' && 'تم التسليم'}
                  {order.status === 'pending' && 'في الانتظار'}
                </span>
              </div>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Step 1: Paid */}
              <div className="relative flex items-start gap-6 mb-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="pt-3">
                  <h4 className={`text-lg font-bold ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                    تم الدفع بنجاح
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">تم استلام الدفع وتأكيد الطلب.</p>
                </div>
              </div>

              {/* Step 2: Processing */}
              <div className="relative flex items-start gap-6 mb-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div className="pt-3">
                  <h4 className={`text-lg font-bold ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                    قيد التنفيذ
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">جاري شراء المنتجات من AliExpress وتجهيزها للشحن.</p>
                </div>
              </div>

              {/* Step 3: Shipped */}
              <div className="relative flex items-start gap-6 mb-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                  currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                <div className="pt-3">
                  <h4 className={`text-lg font-bold ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
                    تم الشحن
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 mb-3">تم شحن طلبك من الصين وهو في طريقه إلى الجزائر.</p>
                  
                  {order.tracking_number && currentStep >= 3 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 inline-block">
                      <div className="text-xs text-blue-600 font-medium mb-1">رقم التتبع الدولي:</div>
                      <div className="font-mono font-bold text-gray-900 text-lg mb-3">{order.tracking_number}</div>
                      <a 
                        href={`https://t.17track.net/en#nums=${order.tracking_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        تتبع الشحنة على 17Track &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Delivered */}
              <div className="relative flex items-start gap-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                  currentStep >= 4 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Home className="w-6 h-6" />
                </div>
                <div className="pt-3">
                  <h4 className={`text-lg font-bold ${currentStep >= 4 ? 'text-gray-900' : 'text-gray-400'}`}>
                    تم التسليم
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">تم تسليم الطلب بنجاح. شكراً لتسوقك معنا!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {order && currentStep === -1 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-700 mb-2">تم رفض الطلب</h3>
            <p className="text-red-600">
              عذراً، لم نتمكن من معالجة طلبك. قد يكون ذلك بسبب فشل عملية الدفع أو نفاد الكمية.
              يرجى التواصل مع الدعم الفني للمزيد من المعلومات.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
