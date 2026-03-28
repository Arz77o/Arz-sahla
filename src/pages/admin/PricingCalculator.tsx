import React, { useState, useMemo, useEffect } from "react";
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
  Info,
  EyeOff,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { SEOMeta } from "../../components/shared/SEOMeta";
import { supabaseAdmin } from "../../lib/supabase";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";

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
  const [shippingType, setShippingType] = useState<"Maystro Delivery" | "manual">(
    "Maystro Delivery",
  );
  const [deliveryType] = useState<"home" | "desk">("desk"); // Hardcoded to desk as requested
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(22); // Default Alger
  const [manualShippingFee, setManualShippingFee] = useState<number>(0);
  const [packagingFee, setPackagingFee] = useState<number>(100);
  const [retourFee, setRetourFee] = useState<number>(130);
  const [returnRateCOD, setReturnRateCOD] = useState<number>(30);
  const [returnRateChargily, setReturnRateChargily] = useState<number>(1);
  const [profitMargin, setProfitMargin] = useState<number>(40);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feesRes, settingsRes] = await Promise.all([
          supabaseAdmin
            .from("shipping_fees")
            .select("*")
            .order("wilaya_code", { ascending: true }),
          supabaseAdmin.from("settings").select("*").single(),
        ]);

        if (feesRes.error) throw feesRes.error;
        setWilayas(feesRes.data || []);

        if (settingsRes.data) {
          const s = settingsRes.data as any;
          const pm = s.payment_methods || {};
          setProfitMargin(pm.default_profit_margin ?? 40);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        toast.error("فشل تحميل الإعدادات");
      } finally {
        setLoadingWilayas(false);
      }
    };

    fetchData();
  }, []);

  const shippingFee = useMemo(() => {
    if (shippingType === "manual") return manualShippingFee;
    const wilaya = wilayas.find((w) => w.wilaya_code === selectedWilayaCode);
    if (!wilaya) return 0;
    return deliveryType === "home" ? wilaya.home_fee : wilaya.desk_fee;
  }, [
    shippingType,
    deliveryType,
    selectedWilayaCode,
    manualShippingFee,
    wilayas,
  ]);

  const results = useMemo(() => {
    const currentShippingFee = shippingFee;

    // COD Calculations
    const successRateCOD = 1 - returnRateCOD / 100;
    const returnRatioCOD = returnRateCOD / 100 / (successRateCOD || 0.01);
    const retourLossCOD = currentShippingFee + retourFee + packagingFee;
    const retourShareCOD = returnRatioCOD * retourLossCOD;
    const realCostCOD =
      buyPrice + currentShippingFee + packagingFee + retourShareCOD;
    const marginCOD = realCostCOD * (profitMargin / 100);
    const codSell = Math.round((realCostCOD + marginCOD) / 10) * 10;
    const codProfit = codSell - realCostCOD;
    const codMarginActual = (codProfit / (codSell || 1)) * 100;

    // Chargily Calculations
    const successRateChargily = 1 - returnRateChargily / 100;
    const returnRatioChargily =
      returnRateChargily / 100 / (successRateChargily || 0.01);
    const retourLossChargily = currentShippingFee + retourFee + packagingFee;
    const retourShareChargily = returnRatioChargily * retourLossChargily;
    const realCostChargily =
      buyPrice + currentShippingFee + packagingFee + retourShareChargily;
    const marginChargily = realCostChargily * (profitMargin / 100);
    const chargilySell =
      Math.round((realCostChargily + marginChargily) / 10) * 10;
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
      codRejectionLoss,
    };
  }, [
    buyPrice,
    shippingFee,
    packagingFee,
    retourFee,
    returnRateCOD,
    returnRateChargily,
    profitMargin,
  ]);

  const handleCopy = () => {
    const selectedWilaya = wilayas.find(
      (w) => w.wilaya_code === selectedWilayaCode,
    );
    const selectedZoneName =
      shippingType === "Maystro Delivery"
        ? `${selectedWilayaCode} - ${selectedWilaya?.wilaya_name} (Maystro Delivery Desk)`
        : "بدون شحن";

    const text = `المنتج: ${buyPrice.toLocaleString("ar-DZ")} دج
سعر Chargily: ${results.chargilySell.toLocaleString("ar-DZ")} دج — ربح ${results.chargilyProfit.toLocaleString("ar-DZ")} دج
سعر COD: ${results.codSell.toLocaleString("ar-DZ")} دج — ربح ${results.codProfit.toLocaleString("ar-DZ")} دج
المنطقة: ${selectedZoneName}
نسبة العودة: Chargily (${returnRateChargily}%) | COD (${returnRateCOD}%)
هامش الربح: ${profitMargin}%`;

    navigator.clipboard.writeText(text);
    toast.success("تم نسخ النتائج إلى الحافظة");
  };

  const formatPrice = (val: number) => val.toLocaleString("ar-DZ") + " دج";

  return (
    <div className="space-y-8" dir="rtl">
      <SEOMeta title="آلة حاسبة التسعير | الإدارة" />

      <AdminPageHeader
        title="آلة حاسبة التسعير / Pricing Calculator"
        subtitle="خطط لتسعير منتجاتك بذكاء لضمان الربحية"
        kicker="PROFIT PLANNING TOOL"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md space-y-8">
            <div className="space-y-6">
              {/* Primary Input: Buy Price */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                  <Package className="w-4 h-4 text-blue-600" />
                  سعر الشراء (دج)
                </label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(Number(e.target.value))}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-0 outline-none font-black text-2xl transition-all bg-gray-50/30"
                  placeholder="2200"
                />
              </div>

              {/* Primary Input: Wilaya */}
              <div className="space-y-3">
                <label className="text-sm font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest">
                  <Truck className="w-4 h-4 text-blue-600" />
                  الولاية المختارة
                </label>
                <select
                  value={selectedWilayaCode}
                  onChange={(e) =>
                    setSelectedWilayaCode(Number(e.target.value))
                  }
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none font-bold bg-white text-lg transition-all"
                  disabled={loadingWilayas}
                >
                  {loadingWilayas ? (
                    <option>جاري التحميل...</option>
                  ) : (
                    wilayas.map((wilaya) => (
                      <option
                        key={wilaya.wilaya_code}
                        value={wilaya.wilaya_code}
                      >
                        {wilaya.wilaya_code} - {wilaya.wilaya_name} (+
                        {formatPrice(wilaya.desk_fee)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Advanced Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-gray-300 text-gray-400 text-xs font-bold hover:text-blue-600 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
              >
                {showAdvanced ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Settings className="w-3.5 h-3.5" />
                )}
                {showAdvanced
                  ? "إخفاء الإعدادات المتقدمة"
                  : "تعديل هوامش الربح والتكاليف الإضافية"}
              </button>

              {/* Advanced Settings */}
              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      التغليف
                    </label>
                    <input
                      type="number"
                      value={packagingFee}
                      onChange={(e) => setPackagingFee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none font-bold text-sm bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      سعر الـ Retour
                    </label>
                    <input
                      type="number"
                      value={retourFee}
                      onChange={(e) => setRetourFee(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none font-bold text-sm bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      العودة COD %
                    </label>
                    <input
                      type="number"
                      value={returnRateCOD}
                      onChange={(e) => setReturnRateCOD(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none font-bold text-sm bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      العودة Chargily %
                    </label>
                    <input
                      type="number"
                      value={returnRateChargily}
                      onChange={(e) =>
                        setReturnRateChargily(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none font-bold text-sm bg-gray-50/50"
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                      <span>نسبة الربح المستهدفة</span>
                      <span className="text-blue-600 font-black">
                        {profitMargin}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="150"
                      step="5"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Combined Pricing Dashboard Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-100 shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Calculator className="w-32 h-32" />
            </div>

            <div className="space-y-8 relative z-10">
              {/* Chargily Panel */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 tracking-tight">
                      الدفع الإلكتروني
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                      Chargily Gateway
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-4xl bg-emerald-50 border-2 border-emerald-100 flex flex-col items-center text-center space-y-2">
                  <span className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest">
                    سعر البيع المقترح
                  </span>
                  <div className="text-4xl font-black text-emerald-900 tracking-tighter">
                    {formatPrice(results.chargilySell)}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full text-emerald-600 font-black text-xs shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5" />+
                    {formatPrice(results.chargilyProfit)} ربح صافي
                  </div>
                </div>
              </div>

              {/* COD Panel */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 tracking-tight">
                      الدفع عند الاستلام
                    </h3>
                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">
                      Cash on Delivery
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-4xl bg-orange-50 border-2 border-orange-100 flex flex-col items-center text-center space-y-2">
                  <span className="text-xs font-bold text-orange-700/60 uppercase tracking-widest">
                    سعر البيع المقترح
                  </span>
                  <div className="text-4xl font-black text-orange-900 tracking-tighter">
                    {formatPrice(results.codSell)}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full text-orange-600 font-black text-xs shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5" />+
                    {formatPrice(results.codProfit)} ربح صافي
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                  التكلفة (Real Cost)
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {formatPrice(results.realCostCOD)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                  مخاطرة الـ Retour
                </div>
                <div className="font-bold text-red-500 text-sm">
                  -{formatPrice(results.codRejectionLoss)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Breakdown - Moved to bottom and made more subtle */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <button
          onClick={() => handleCopy()}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
        >
          <Copy className="w-5 h-5" />
          نسخ ملخص الحسابات للواتساب
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70 hover:opacity-100 transition-opacity">
          <div className="p-4 rounded-xl bg-slate-50 text-[10px] space-y-1">
            <p className="font-bold text-slate-500 uppercase">
              تفاصيل التكلفة COD
            </p>
            <div className="flex justify-between">
              <span>شراء + تغليف:</span>{" "}
              <span>{formatPrice(buyPrice + packagingFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>شحن:</span> <span>{formatPrice(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>تأمين العودة:</span>{" "}
              <span>+{formatPrice(results.retourShareCOD)}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 text-[10px] space-y-1">
            <p className="font-bold text-emerald-500 uppercase">
              تفاصيل التكلفة Chargily
            </p>
            <div className="flex justify-between">
              <span>شراء + تغليف:</span>{" "}
              <span>{formatPrice(buyPrice + packagingFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>شحن:</span> <span>{formatPrice(shippingFee)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>تأمين العودة:</span>{" "}
              <span>+{formatPrice(results.retourShareChargily)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
