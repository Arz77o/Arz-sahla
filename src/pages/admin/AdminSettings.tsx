import React, { useEffect, useState } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { supabaseAdmin } from '../../lib/supabase';
import { Button } from '../../components/ui/button';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [siteActive, setSiteActive] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState({ cod: true, online: true });
  const [shippingFees, setShippingFees] = useState<any[]>([]);
  const [isFeesLoading, setIsFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchShippingFees();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .single();

    if (!error && data) {
      const s = data as any;
      setSiteActive(s.site_active);
      setPaymentMethods(s.payment_methods || { cod: true, online: true });
    }
    setLoading(false);
  };

  const fetchShippingFees = async () => {
    setIsFeesLoading(true);
    const { data, error } = await supabaseAdmin
      .from('shipping_fees')
      .select('*')
      .order('wilaya_code', { ascending: true });
    
    if (error) setFeesError(error.message);
    if (data) setShippingFees(data);
    setIsFeesLoading(false);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await (supabaseAdmin as any)
        .from('settings')
        .update({
          site_active: siteActive,
          payment_methods: paymentMethods,
          inventory_mode: 'strict',
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFee = async (id: number, field: string, value: number) => {
    const { error } = await (supabaseAdmin as any)
      .from('shipping_fees')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      toast.error('فشل تحديث رسوم الشحن');
    } else {
      setShippingFees(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
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
      <SEOMeta title="إعدادات المتجر | الإدارة" />
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات المتجر</h1>
          <p className="text-gray-500 mt-1">إدارة الشحن، الدفع، وقواعد التسعير</p>
        </div>
        <Button 
          onClick={handleSaveGeneral} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-bold"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ جميع الإعدادات'}
        </Button>
      </div>

      <div className="max-w-4xl space-y-8 pb-12">
          
          {/* General */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">الإعدادات العامة</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all border-gray-100 hover:border-gray-200">
                <input 
                  type="checkbox" 
                  checked={siteActive}
                  onChange={(e) => setSiteActive(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <div>
                  <div className="font-bold text-gray-900">المتجر نشط</div>
                  <div className="text-xs text-gray-500">تعطيل المتجر يمنع الزبائن من تصفح المنتجات</div>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">طرق الدفع المفعلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={paymentMethods.cod}
                  onChange={(e) => setPaymentMethods({...paymentMethods, cod: e.target.checked})}
                  className="w-6 h-6 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">الدفع عند الاستلام (COD)</div>
                  <div className="text-xs text-gray-500">تفعيل خيار الدفع كاش عند استلام الطرد</div>
                </div>
              </label>
              <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={paymentMethods.online}
                  onChange={(e) => setPaymentMethods({...paymentMethods, online: e.target.checked})}
                  className="w-6 h-6 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900">دفع إلكتروني (Chargily)</div>
                  <div className="text-xs text-gray-500">تفعيل الدفع بالبطاقة الذهبية أو CIB</div>
                </div>
              </label>
            </div>
          </div>

          {/* Shipping Fees Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">مصاريف الشحن لكل ولاية (DZD)</h2>
              <div className="text-xs text-gray-500">يتم الحفظ تلقائياً عند تغيير السعر</div>
            </div>
            <div className="overflow-x-auto">
              {feesError && <div className="p-4 text-red-600 bg-red-50 text-center font-bold">{feesError}</div>}
              {isFeesLoading ? (
                <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm">
                      <th className="px-6 py-4 font-bold">الولاية</th>
                      <th className="px-6 py-4 font-bold">مكتب (Stop Desk)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shippingFees.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-gray-400 text-xs font-mono ml-2">#{String(fee.wilaya_code).padStart(2, '0')}</span>
                          <span className="font-bold text-gray-900">{fee.wilaya_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            defaultValue={fee.desk_fee}
                            onBlur={(e) => handleUpdateFee(fee.id, 'desk_fee', parseInt(e.target.value))}
                            className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
      </div>
    </>
  );
}
