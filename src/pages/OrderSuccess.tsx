import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight } from 'lucide-react';
import { SEOMeta } from '../components/shared/SEOMeta';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Clear cart on successful order
    clearCart();
  }, [clearCart]);

  return (
    <>
      <SEOMeta title="تم تأكيد طلبك" />
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          تم تأكيد طلبك! 🎉
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
          شكراً لتسوقك من Sahla. سنقوم بمعالجة طلبك وشراء المنتجات من AliExpress قريباً.
        </p>

        {orderId && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 max-w-md mx-auto mb-10">
            <div className="text-sm text-gray-500 mb-2">رقم الطلب الخاص بك</div>
            <div className="text-xl font-mono font-bold text-gray-900">{orderId}</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/order/track">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-700">
              <Package className="w-5 h-5 ml-2" />
              تتبع طلبي
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-xl font-bold text-lg">
              متابعة التسوق
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
