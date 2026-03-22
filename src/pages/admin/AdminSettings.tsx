import React, { useEffect, useState } from 'react';
import { Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { supabaseAdmin } from '../../lib/supabase';
import { Button } from '../../components/ui/button';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any>({ cod: true, online: true });
  const [settings, setSettings] = useState({
    free_shipping_threshold: 800,
    default_profit_margin: 50,
    meta_pixel_id: '',
  });

  const [shippingFees, setShippingFees] = useState<any[]>([]);
  const [isFeesLoading, setIsFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkAmount, setBulkAmount] = useState<number>(0);

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
      const pm = s.payment_methods || { cod: true, online: true };
      setPaymentMethods(pm);
      setSettings({
        free_shipping_threshold: pm.free_shipping_threshold ?? 800,
        default_profit_margin: pm.default_profit_margin ?? 50,
        meta_pixel_id: pm.meta_pixel_id || '',
      });
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabaseAdmin as any)
        .from('settings')
        .update({
          payment_methods: { ...paymentMethods, ...settings },
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      if (error) throw error;
      toast.success('تم حفظ قواعد العمل بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkUpdate = async (type: 'add' | 'subtract' | 'set') => {
    if (bulkAmount === 0 && type !== 'set') return;
    
    setIsFeesLoading(true);
    try {
      const updates = shippingFees.map(fee => {
        let newFee = fee.desk_fee;
        if (type === 'add') newFee += bulkAmount;
        else if (type === 'subtract') newFee -= bulkAmount;
        else if (type === 'set') newFee = bulkAmount;
        return { ...fee, desk_fee: Math.max(0, newFee) };
      });

      // Update in DB (sequentially or in bulk if supported)
      for (const update of updates) {
        await (supabaseAdmin as any)
          .from('shipping_fees')
          .update({ desk_fee: update.desk_fee })
          .eq('id', update.id);
      }

      setShippingFees(updates);
      toast.success('تم تحديث جميع الأسعار بنجاح');
    } catch (err) {
      toast.error('حدث خطأ أثناء التحديث الجماعي');
    } finally {
      setIsFeesLoading(false);
      setBulkAmount(0);
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
          onClick={handleSaveSettings} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-bold"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ جميع الإعدادات'}
        </Button>
      </div>

      <div className="max-w-4xl space-y-8 pb-12">
          
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        
        {/* Left Column: Rules */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-24">
            <h2 className="text-sm font-black text-gray-900 border-b pb-4 flex items-center justify-between">
              تحكم بآلية العمل ⚙️
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">مبلغ الشحن المجاني الأقصى</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={settings.free_shipping_threshold}
                    onChange={(e) => setSettings({...settings, free_shipping_threshold: Number(e.target.value)})}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-xs text-gray-400 font-bold">دج</span>
                </div>
                <p className="text-[9px] text-gray-400 leading-tight">الطلبات التي يتجاوز شحنها هذا المبلغ لن تستفيد من الشحن المجاني للدفع الإلكتروني.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">هامش الربح الافتراضي %</label>
                <input 
                  type="number" 
                  value={settings.default_profit_margin}
                  onChange={(e) => setSettings({...settings, default_profit_margin: Number(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[9px] text-gray-400 leading-tight">القيمة التي تظهر افتراضياً عند فتح آلة حاسبة الأسعار.</p>
                </div>

              <div className="space-y-2 border-t pt-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                  Meta Pixel ID (Facebook)
                </label>
                <input
                  type="text"
                  value={settings.meta_pixel_id}
                  onChange={(e) => setSettings({ ...settings, meta_pixel_id: e.target.value })}
                  placeholder="Ex: 123456789012345"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[9px] text-gray-400 leading-tight italic">أدخل معرف البيكسل (ID) لتفعيل تتبع الحملات الإعلانية تلقائياً.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <h4 className="text-[10px] font-bold text-blue-900 mb-2 uppercase tracking-tight">أدوات تعديل جماعية ⚡</h4>
                <div className="space-y-3">
                  <input 
                    type="number"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(Number(e.target.value))}
                    placeholder="المبلغ (دج)..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-blue-200 rounded-lg outline-none font-bold"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleBulkUpdate('add')}
                      className="flex-1 bg-white border border-blue-200 py-1.5 rounded-lg text-[10px] font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      إضافة للكل (+)
                    </button>
                    <button 
                      onClick={() => handleBulkUpdate('subtract')}
                      className="flex-1 bg-white border border-blue-200 py-1.5 rounded-lg text-[10px] font-bold text-blue-700 hover:bg-red-500 hover:border-red-600 hover:text-white transition-all shadow-sm"
                    >
                      خصم للكل (-)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Shipping Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter">مصاريف الشحن (Stop Desk)</h2>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="ابحث عن ولاية..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                />
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              {feesError && <div className="p-4 text-red-600 bg-red-50 text-center font-bold">{feesError}</div>}
              {isFeesLoading ? (
                <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
                      <th className="px-6 py-4">الولاية</th>
                      <th className="px-6 py-4">السعر (دج)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {shippingFees
                      .filter(fee => fee.wilaya_name.includes(searchQuery) || fee.wilaya_code.toString().includes(searchQuery))
                      .map((fee) => (
                        <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md min-w-[2rem] text-center">{fee.wilaya_code}</span>
                              <span className="font-bold text-gray-800 text-sm">{fee.wilaya_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="number" 
                              defaultValue={fee.desk_fee}
                              onBlur={(e) => handleUpdateFee(fee.id, 'desk_fee', parseInt(e.target.value))}
                              className="w-24 px-3 py-1.5 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-gray-900 group-hover:bg-white transition-all"
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
      </div>
      </div>
    </>
  );
}
