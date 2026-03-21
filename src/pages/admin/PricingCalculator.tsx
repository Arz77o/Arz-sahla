import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Truck,
  Package,
  RotateCcw,
  TrendingUp,
  AlertTriangle,
  Copy,
  ShieldCheck,
  CreditCard,
  Banknote,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { supabaseAdmin } from '../../lib/supabase';

interface WilayaFee {
  id: number;
  wilaya_name: string;
  wilaya_code: number;
  home_fee: number;
  desk_fee: number;
  is_active: boolean;
}

export default function PricingCalculator() {
  const [wilayas, setWilayas] = useState<WilayaFee[]>([]);
  const [loadingWilayas, setLoadingWilayas] = useState(true);
  const [buyPrice, setBuyPrice] = useState<number>(1000);
  const [shippingType, setShippingType] = useState<'yalidine' | 'manual'>('yalidine');
  const [deliveryType] = useState<'home' | 'desk'>('desk'); // Hardcoded to desk as requested
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16); // Default Alger
  const [manualShippingFee, setManualShippingFee] = useState<number>(0);
  const [packagingFee, setPackagingFee] = useState<number>(100);
  const [retourFee, setRetourFee] = useState<number>(350);
  const [returnRateCOD, setReturnRateCOD] = useState<number>(30);
  const [returnRateChargily, setReturnRateChargily] = useState<number>(5);
  const [profitMargin, setProfitMargin] = useState<number>(35);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const { data, error } = await supabaseAdmin
          .from('shipping_fees')
          .select('*')
          .order('wilaya_code', { ascending: true });

        if (error) throw error;
        setWilayas(data || []);
      } catch (err: any) {
        console.error('Error fetching shipping fees:', err);
        toast.error('فشل تحميل مصاريف الشحن');
      } finally {
        setLoadingWilayas(false);
      }
    };

    fetchFees();
  }, []);

  const shippingFee = useMemo(() => {
    if (shippingType === 'manual') return manualShippingFee;
    const wilaya = wilayas.find(w => w.wilaya_code === selectedWilayaCode);
    if (!wilaya) return 0;
    return deliveryType === 'home' ? wilaya.home_fee : wilaya.desk_fee;
  }, [shippingType, deliveryType, selectedWilayaCode, manualShippingFee, wilayas]);

  const results = useMemo(() => {
    const currentShippingFee = shippingFee;

    // COD Calculations
    const successRateCOD = 1 - (returnRateCOD / 100);
    const returnRatioCOD = (returnRateCOD / 100) / (successRateCOD || 0.01);
    const retourLossCOD = currentShippingFee + retourFee + packagingFee;
    const retourShareCOD = returnRatioCOD * retourLossCOD;
    const realCostCOD = buyPrice + currentShippingFee + packagingFee + retourShareCOD;
    const marginCOD = realCostCOD * (profitMargin / 100);
    const codSell = Math.round((realCostCOD + marginCOD) / 10) * 10;
    const codProfit = codSell - realCostCOD;
    const codMarginActual = (codProfit / (codSell || 1)) * 100;

    // Chargily Calculations
    const successRateChargily = 1 - (returnRateChargily / 100);
    const returnRatioChargily = (returnRateChargily / 100) / (successRateChargily || 0.01);
    const retourLossChargily = currentShippingFee + retourFee + packagingFee;
    const retourShareChargily = returnRatioChargily * retourLossChargily;
    const realCostChargily = buyPrice + currentShippingFee + packagingFee + retourShareChargily;
    const marginChargily = realCostChargily * (profitMargin / 100);
    const chargilySell = Math.round((realCostChargily + marginChargily) / 10) * 10;
    const chargilyProfit = chargilySell - realCostChargily;
    const chargilyMarginActual = (chargilyProfit / (chargilySell || 1)) * 100;

    const chargilyRejectionLoss = currentShippingFee + retourFee + packagingFee;
    const codRejectionLoss = currentShippingFee + retourFee + packagingFee;

    return {
      retourShareCOD,
      retourShareChargily,
      realCostCOD,
      realCostChargily,
      chargilySell,
      codSell,
      chargilyProfit,
      codProfit,
      chargilyMarginActual,
      codMarginActual,
      chargilyRejectionLoss,
      codRejectionLoss
    };
  }, [buyPrice, shippingFee, packagingFee, retourFee, returnRateCOD, returnRateChargily, profitMargin]);

  const zoneTableData = useMemo(() => {
    if (wilayas.length === 0) return [];

    return wilayas.map(wilaya => {
      const sFee = deliveryType === 'home' ? wilaya.home_fee : wilaya.desk_fee;

      // COD Price in table
      const successRateCOD = 1 - (returnRateCOD / 100);
      const returnRatioCOD = (returnRateCOD / 100) / (successRateCOD || 0.01);
      const retourShareCOD = returnRatioCOD * (sFee + retourFee + packagingFee);
      const realCostCOD = buyPrice + sFee + packagingFee + retourShareCOD;
      const codSell = Math.round((realCostCOD + (realCostCOD * (profitMargin / 100))) / 10) * 10;

      // Chargily Price in table
      const successRateChargily = 1 - (returnRateChargily / 100);
      const returnRatioChargily = (returnRateChargily / 100) / (successRateChargily || 0.01);
      const retourShareChargily = returnRatioChargily * (sFee + retourFee + packagingFee);
      const realCostChargily = buyPrice + sFee + packagingFee + retourShareChargily;
      const chargilySell = Math.round((realCostChargily + (realCostChargily * (profitMargin / 100))) / 10) * 10;

      const profit = codSell - realCostCOD;

      return {
        id: wilaya.id,
        name: wilaya.wilaya_name,
        code: wilaya.wilaya_code,
        fee: sFee,
        chargilySell,
        codSell,
        profit
      };
    });
  }, [buyPrice, retourFee, packagingFee, returnRateCOD, returnRateChargily, profitMargin, wilayas, deliveryType]);

  const handleCopy = () => {
    const selectedWilaya = wilayas.find(w => w.wilaya_code === selectedWilayaCode);
    const selectedZoneName = shippingType === 'yalidine'
      ? `${selectedWilayaCode} - ${selectedWilaya?.wilaya_name} (Yalidine Desk)`
      : 'بدون شحن';

    const text = `المنتج: ${buyPrice.toLocaleString('ar-DZ')} دج
سعر Chargily: ${results.chargilySell.toLocaleString('ar-DZ')} دج — ربح ${results.chargilyProfit.toLocaleString('ar-DZ')} دج
سعر COD: ${results.codSell.toLocaleString('ar-DZ')} دج — ربح ${results.codProfit.toLocaleString('ar-DZ')} دج
المنطقة: ${selectedZoneName}
نسبة العودة: Chargily (${returnRateChargily}%) | COD (${returnRateCOD}%)
هامش الربح: ${profitMargin}%`;

    navigator.clipboard.writeText(text);
    toast.success('تم نسخ النتائج إلى الحافظة');
  };

  const formatPrice = (val: number) => val.toLocaleString('ar-DZ') + ' دج';

  return (
    <div className="space-y-8" dir="rtl">
      <SEOMeta title="آلة حاسبة التسعير | الإدارة" />

      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">آلة حاسبة التسعير</h1>
          <p className="text-sm text-gray-500 font-medium">خطط لتسعير منتجاتك بذكاء لضمان الربحية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-gray-900 border-b pb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              المدخلات الأساسية
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buy Price */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">سعر شراء المنتج (دج)</label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                  placeholder="2200"
                />
              </div>

              {/* Shipping Type */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">نوع الشحن</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button
                    onClick={() => setShippingType('yalidine')}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${shippingType === 'yalidine' ? 'bg-white text-blue-600 shadow-sm outline outline-1 outline-blue-100' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Yalidine
                  </button>
                  <button
                    onClick={() => setShippingType('manual')}
                    className={`py-2 rounded-lg text-sm font-bold transition-all ${shippingType === 'manual' ? 'bg-white text-blue-600 shadow-sm outline outline-1 outline-blue-100' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    بدون شحن
                  </button>
                </div>
              </div>

              {/* Shipping Fee logic */}
              {shippingType === 'yalidine' ? (
                <>
                  <div className="space-y-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-900">التوصيل متوفر للمكتب فقط (Yalidine Desk)</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">اختر الولاية</label>
                    <select
                      value={selectedWilayaCode}
                      onChange={(e) => setSelectedWilayaCode(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
                      disabled={loadingWilayas}
                    >
                      {loadingWilayas ? (
                        <option>جاري تحميل الولايات...</option>
                      ) : (
                        wilayas.map(wilaya => (
                          <option key={wilaya.wilaya_code} value={wilaya.wilaya_code}>
                            {wilaya.wilaya_code} - {wilaya.wilaya_name} ({formatPrice(wilaya.desk_fee)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Truck className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">بدون مصاريف شحن</div>
                    <div className="text-[11px] text-gray-500">سيتم حساب التكلفة بناءً على سعر المنتج والتغليف والعودة فقط.</div>
                  </div>
                </div>
              )}

              {/* Packaging Fee */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">تكلفة التغليف (دج)</label>
                <input
                  type="number"
                  value={packagingFee}
                  onChange={(e) => setPackagingFee(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>

              {/* Retour Fee */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">سعر الـ Retour (دج)</label>
                <input
                  type="number"
                  value={retourFee}
                  onChange={(e) => setRetourFee(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>

              {/* Return Rate COD */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                  <span>نسبة العودة (COD) %</span>
                  <span className="text-[11px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    {returnRateCOD}%
                  </span>
                </label>
                <input
                  type="number"
                  value={returnRateCOD}
                  onChange={(e) => setReturnRateCOD(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                />
              </div>

              {/* Return Rate Chargily */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex justify-between items-center">
                  <span>نسبة العودة (Chargily) %</span>
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {returnRateChargily}%
                  </span>
                </label>
                <input
                  type="number"
                  value={returnRateChargily}
                  onChange={(e) => setReturnRateChargily(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>

              {/* Profit Margin */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">هامش الربح المرغوب %</label>
                <input
                  type="number"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1 - Real Cost */}
          <div className="bg-gray-800 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold border-b border-white/10 pb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              التكلفة الحقيقية (Real Cost)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm opacity-70">
                <span>تكلفة المنتج + الشحن + التغليف</span>
                <span>{formatPrice(buyPrice + shippingFee + packagingFee)}</span>
              </div>
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-80">التكلفة الحقيقية (COD)</span>
                  <span className="font-bold text-orange-400">{formatPrice(results.realCostCOD)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs opacity-80">التكلفة الحقيقية (Chargily)</span>
                  <span className="font-bold text-emerald-400">{formatPrice(results.realCostChargily)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 - Chargily */}
          <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold border-b border-white/20 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Chargily 💳
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">دفع إلكتروني</span>
            </h3>
            <div className="text-center py-2">
              <div className="text-xs opacity-80 mb-1">سعر البيع المقترح</div>
              <div className="text-4xl font-black mb-4">{formatPrice(results.chargilySell)}</div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div className="text-right">
                  <div className="text-[10px] opacity-70">ربحك الصافي</div>
                  <div className="font-bold text-lg">{formatPrice(results.chargilyProfit)}</div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] opacity-70">هامش فعلي</div>
                  <div className="font-bold text-lg">{results.chargilyMarginActual.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 - COD */}
          <div className="bg-orange-500 text-white p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold border-b border-white/20 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                COD 💵
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">عند الاستلام</span>
            </h3>
            <div className="text-center py-2">
              <div className="text-xs opacity-80 mb-1">سعر البيع المقترح</div>
              <div className="text-4xl font-black mb-4">{formatPrice(results.codSell)}</div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div className="text-right">
                  <div className="text-[10px] opacity-70">ربحك الصافي</div>
                  <div className="font-bold text-lg">{formatPrice(results.codProfit)}</div>
                </div>
                <div className="text-left">
                  <div className="text-[10px] opacity-70">هامش فعلي</div>
                  <div className="font-bold text-lg">{results.codMarginActual.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 - Rejection Loss */}
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4">
            <h3 className="text-red-700 font-bold flex items-center gap-2 text-sm italic">
              <AlertTriangle className="w-4 h-4" />
              خسارة الـ Retour ⚠️
            </h3>
            <div className="space-y-3">
              <p className="text-xs text-red-600 leading-tight">إذا رفض العميل الاستلام، ستتكبد المصاريف التالية:</p>
              <div className="flex justify-between text-sm font-bold text-red-700">
                <span>Chargily (الطلب المرفوض)</span>
                <span dir="ltr">-{formatPrice(results.chargilyRejectionLoss)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-red-700">
                <span>COD (الطلب المرفوض)</span>
                <span dir="ltr">-{formatPrice(results.codRejectionLoss)}</span>
              </div>
              <div className="pt-1 text-[10px] text-green-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                الدفع الإلكتروني (Chargily) أضمن للربحية لأن المال بحوزتك مسبقاً ✅
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Comparison Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg italic">
            <Package className="w-5 h-5 text-blue-600" />
            مقارنة الأسعار بكل الولايات ({deliveryType === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'})
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-100/50 text-gray-500 font-bold text-xs uppercase tracking-wider sticky top-0 bg-white z-10 shadow-sm">
                <th className="px-6 py-4">الولاية</th>
                <th className="px-6 py-4">تكلفة الشحن</th>
                <th className="px-6 py-4">سعر Chargily</th>
                <th className="px-6 py-4">سعر COD</th>
                <th className="px-6 py-4">صافي الربح المتوقع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {zoneTableData.map(zone => (
                <tr
                  key={zone.id}
                  className={`transition-colors group hover:bg-gray-50 ${selectedWilayaCode === zone.code && shippingType === 'yalidine' ? 'bg-blue-50/70 border-r-4 border-blue-600' : ''}`}
                >
                  <td className="px-6 py-4 font-bold text-gray-900">{zone.name}</td>
                  <td className="px-6 py-4 text-gray-500">{formatPrice(zone.fee)}</td>
                  <td className="px-6 py-4 font-black text-emerald-600">{formatPrice(zone.chargilySell)}</td>
                  <td className="px-6 py-4 font-black text-orange-600">{formatPrice(zone.codSell)}</td>
                  <td className="px-6 py-4 text-gray-900 font-bold">
                    <span className="bg-gray-100 px-3 py-1 rounded-full group-hover:bg-white transition-colors">
                      ~ {formatPrice(zone.profit)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Analysis Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <Calculator className="w-4 h-4 text-blue-600" />
              تفاصيل التكلفة (تحليل الربح)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* COD Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-xs font-bold text-slate-900">تحليل COD (الدفع عند الاستلام)</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>ثمن الشراء + التغليف</span>
                    <span className="font-bold text-slate-900">{formatPrice(buyPrice + packagingFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>مصاريف الشحن</span>
                    <span className="font-bold text-slate-900">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>حصة مخاطرة العودة (30%)</span>
                    <span className="font-bold">+{formatPrice(results.retourShareCOD)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900">
                    <span>التكلفة الحقيقية (Real Cost)</span>
                    <span>{formatPrice(results.realCostCOD)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>هامش الربح الصافي (35%)</span>
                    <span>+{formatPrice(results.codProfit)}</span>
                  </div>
                </div>
              </div>

              {/* Chargily Breakdown */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                  <span className="text-xs font-bold text-emerald-900">تحليل Chargily (دفع إلكتروني)</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-emerald-600/70">
                    <span>ثمن الشراء + التغليف</span>
                    <span className="font-bold text-emerald-900">{formatPrice(buyPrice + packagingFee)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600/70">
                    <span>مصاريف الشحن</span>
                    <span className="font-bold text-emerald-900">{formatPrice(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>حصة مخاطرة العودة (5%)</span>
                    <span className="font-bold">+{formatPrice(results.retourShareChargily)}</span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200 flex justify-between font-black text-emerald-900">
                    <span>التكلفة الحقيقية (Real Cost)</span>
                    <span>{formatPrice(results.realCostChargily)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>هامش الربح الصافي (35%)</span>
                    <span>+{formatPrice(results.chargilyProfit)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-blue-900">لماذا أضيف "حصة مخاطرة العودة"؟</div>
                <p className="text-[10px] text-blue-700 leading-relaxed mt-0.5">
                  هذا التعويض الصغير (حوالي 400-500 دج في COD) يُضاف لكل طلب لإنشاء "صندوق تأمين" داخلي يغطي خسائر الطلبات المرفوضة (شحن الذهاب والعودة). بدونه، فأن أول طلب يعود سيمسح ربح 3 طلبات ناجحة!
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
            >
              <Copy className="w-5 h-5" />
              نسخ ملخص الحسابات
            </button>
          </div>
    </div>
  );
}
