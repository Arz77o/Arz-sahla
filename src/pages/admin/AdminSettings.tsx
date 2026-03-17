import React, { useEffect, useState } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { supabaseAdmin } from '../../lib/supabase';
import { Button } from '../../components/ui/button';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings state
  const [exchangeRate, setExchangeRate] = useState<number>(240);
  const [profitMargin, setProfitMargin] = useState<number>(1.2);
  const [shippingCost, setShippingCost] = useState<number>(500);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from('settings')
        .select('*')
        .single();

      if (!error && data) {
        setExchangeRate(data.exchange_rate);
        setProfitMargin(data.profit_margin);
        setShippingCost(data.shipping_cost_dzd);
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exchangeRate <= 0 || profitMargin <= 0 || shippingCost < 0) {
      toast.error('يرجى إدخال قيم صحيحة وموجبة');
      return;
    }

    if (!window.confirm('تحذير: تغيير هذه الإعدادات سيؤثر فوراً على أسعار جميع المنتجات في المتجر. هل أنت متأكد؟')) {
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabaseAdmin
        .from('settings')
        .update({
          exchange_rate: exchangeRate,
          profit_margin: profitMargin,
          shipping_cost_dzd: shippingCost,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1); // Assuming single row with id 1

      if (error) throw error;
      toast.success('تم حفظ الإعدادات بنجاح');
      
      // Note: In a real app, you might want to trigger a revalidation of cached prices
      // or notify the frontend to refresh.
    } catch (error: any) {
      toast.error(error.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <SEOMeta title="الإعدادات | الإدارة" />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات المتجر</h1>
        <p className="text-gray-500 mt-1">إدارة التسعير والشحن</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-amber-900">تأثير فوري على الأسعار</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    أي تغيير في سعر الصرف أو هامش الربح سيتم تطبيقه فوراً على جميع المنتجات المعروضة في المتجر. يرجى المراجعة بعناية قبل الحفظ.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">سعر الصرف (1 USD = ? DZD)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                    dir="ltr"
                    required
                  />
                  <span className="absolute right-4 top-3.5 text-gray-500 font-bold">DZD</span>
                </div>
                <p className="text-sm text-gray-500">سعر صرف الدولار مقابل الدينار الجزائري (السوق الموازي).</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">هامش الربح (المضاعف)</label>
                <input 
                  type="number"
                  step="0.01"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                  dir="ltr"
                  required
                />
                <p className="text-sm text-gray-500">
                  مثال: 1.2 يعني ربح 20%. السعر النهائي = (سعر المنتج بالدولار × سعر الصرف) × هامش الربح.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">تكلفة الشحن الثابتة (DZD)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="10"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-lg"
                    dir="ltr"
                    required
                  />
                  <span className="absolute right-4 top-3.5 text-gray-500 font-bold">DZD</span>
                </div>
                <p className="text-sm text-gray-500">تكلفة الشحن الداخلي في الجزائر (تضاف على إجمالي الطلب).</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <Save className="w-6 h-6 ml-2" />
                      حفظ الإعدادات وتحديث الأسعار
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Calculator */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">حاسبة تجريبية</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">سعر منتج افتراضي</span>
                <span className="font-mono font-bold text-gray-900" dir="ltr">$10.00</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">بعد الصرف ({exchangeRate})</span>
                <span className="font-mono font-bold text-gray-900" dir="ltr">{(10 * exchangeRate).toFixed(0)} DZD</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-sm font-bold text-blue-900">سعر البيع للعميل</span>
                <span className="font-mono font-black text-blue-700 text-lg" dir="ltr">
                  {Math.ceil((10 * exchangeRate * profitMargin) / 10) * 10} DZD
                </span>
              </div>
              
              <p className="text-xs text-center text-gray-500 mt-4">
                يتم تقريب السعر النهائي لأقرب 10 دينار.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
