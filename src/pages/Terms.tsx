import React from "react";
import { SEOMeta } from "../components/shared/SEOMeta";
import {
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  Truck,
  RefreshCcw,
  Lock,
} from "lucide-react";

export default function Terms() {
  const lastUpdate = "مارس 2026";

  return (
    <>
      <SEOMeta title="الشروط والأحكام وسياسة الإرجاع" />
      <div className="min-h-screen bg-white py-12 md:py-32" dir="rtl">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header Section */}
          <div className="mb-20 md:mb-32 border-b border-surface-high pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-6xl md:text-9xl font-display font-bold text-gray-900 tracking-tighter leading-none mb-6">
                  .SAHLA DZ
                </h1>
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary italic">
                  الشروط والأحكام — سياسة الإرجاع والاستبدال
                </p>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-surface-high px-4 py-2 bg-surface-low">
                آخر تحديث: {lastUpdate}
              </div>
            </div>
          </div>

          <div className="border border-surface-high">
            {/* Intro Notice */}
            <div className="bg-primary p-8 md:p-12 text-white">
              <p className="text-xl md:text-2xl font-display font-bold leading-tight tracking-tight italic">
                يُرجى قراءة هذه الشروط بعناية قبل إتمام أي طلب شراء. بالنقر على
                'أوافق على الشروط والأحكام' فإنك تقر بقراءة وفهم وقبول جميع
                البنود الواردة في هذه الوثيقة.
              </p>
            </div>

            <div className="p-8 md:p-16 space-y-24 bg-white">
              {/* 1. General Info */}
              <section className="relative">
                <div className="flex items-center gap-6 mb-12">
                  <div className="text-4xl font-display font-bold text-primary/20 leading-none">
                    01.
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 uppercase tracking-tight">
                    معلومات عامة
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-surface-high border border-surface-high">
                  <div className="p-8 bg-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                      اسم المتجر
                    </span>
                    <span className="font-display font-bold text-gray-900 text-xl tracking-tight">
                      .SAHLA DZ
                    </span>
                  </div>
                  <div className="p-8 bg-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                      نوع النشاط
                    </span>
                    <span className="font-display font-bold text-gray-900 tracking-tight text-lg">
                      بيئة إلكترونية — بيع منتجات مبتكرة وحلول ذكية
                    </span>
                  </div>
                  <div className="p-8 bg-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                      منطقة التوصيل
                    </span>
                    <span className="font-display font-bold text-gray-900 tracking-tight text-lg">
                      30 ولاية جزائرية
                    </span>
                  </div>
                  <div className="p-8 bg-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                      طرق الدفع
                    </span>
                    <span className="font-display font-bold text-gray-900 tracking-tight text-lg italic uppercase text-primary">
                      الدفع عند الاستلام (COD)
                    </span>
                  </div>
                </div>
              </section>

              {/* 2. Products and Prices */}
              <section>
                <div className="flex items-center gap-6 mb-12">
                  <div className="text-4xl font-display font-bold text-primary/20 leading-none">
                    02.
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 uppercase tracking-tight">
                    المنتجات والأسعار
                  </h2>
                </div>
                <div className="space-y-12 text-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-l-2 border-primary pl-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900">
                      وصف المنتجات
                    </h3>
                    <div className="md:col-span-2 space-y-4">
                      <p className="text-sm leading-loose">
                        نقدم منتجات إلكترونية من علامات تجارية موثوقة. الصور
                        المعروضة تمثل الحالة الحقيقية للمنتج. الأسعار تشمل
                        تكاليف الخدمة وقابلة للتغيير بناءً على متطلبات السوق.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Shipping and Delivery */}
              <section>
                <div className="flex items-center gap-6 mb-12">
                  <div className="text-4xl font-display font-bold text-primary/20 leading-none">
                    03.
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 uppercase tracking-tight">
                    الشحن والتوصيل
                  </h2>
                </div>
                <div className="space-y-10 text-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-l-2 border-primary pl-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900">
                      طريقة الشحن
                    </h3>
                    <div className="md:col-span-2 space-y-4 text-sm leading-loose">
                      <p>
                        نعتمد حصرياً على خدمة{" "}
                        <span className="font-bold text-gray-900">
                          Expedia Chrono
                        </span>{" "}
                        بخيارين للتوصيل:{" "}
                        <span className="italic">توصيل إلى المكتب</span>{" "}
                        أو <span className="italic">توصيل إلى المنزل</span>.
                        يختار الزبون الطريقة المناسبة له عند إتمام الطلبية.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-l-2 border-gray-100 pl-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900">
                      الجدول الزمني
                    </h3>
                    <div className="md:col-span-2 space-y-4 text-sm leading-loose">
                      <p>
                        تستغرق عملية التجهيز 24 ساعة، بينما يستغرق التوصيل من
                        48-72 ساعة بعد التأكيد الطلبية حسب بعد الولاية.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Payment Rules */}
              <section>
                <div className="flex items-center gap-6 mb-12">
                  <div className="text-4xl font-display font-bold text-primary/20 leading-none">
                    04.
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 uppercase tracking-tight">
                    طرق الدفع والرسوم
                  </h2>
                </div>
                <div className="space-y-10 text-gray-700">

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-l-2 border-gray-100 pl-8">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900">
                      الدفع عند الاستلام
                    </h3>
                    <div className="md:col-span-2 space-y-4 text-sm leading-loose">
                      <p>
                        في حال اختيار الدفع عند الاستلام (COD)، يلتزم الزبون
                        بدفع سعر المنتج + مصاريف الشحن الكاملة للولاية المعنية
                        لموظف شركة التوصيل.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. Customer Obligations */}
              <section>
                <div className="flex items-center gap-6 mb-12">
                  <div className="text-4xl font-display font-bold text-primary/20 leading-none">
                    05.
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 uppercase tracking-tight">
                    التزامات العميل
                  </h2>
                </div>
                <div className="space-y-6 text-sm text-gray-600 leading-loose">
                  <p className="flex items-start gap-4 uppercase tracking-[0.1em]">
                    <span className="text-primary font-bold">✓</span>
                    يجب تزويدنا برقم هاتف شغال واسم حقيقي لضمان تأكيد الطلب.
                  </p>
                  <p className="flex items-start gap-4 uppercase tracking-[0.1em]">
                    <span className="text-primary font-bold">✓</span>
                    الطلبات غير المؤكدة عبر الهاتف خلال 48 ساعة يتم إلغاؤها
                    تلقائياً.
                  </p>
                  <p className="flex items-start gap-4 uppercase tracking-[0.1em]">
                    <span className="text-red-600 font-bold italic underline">
                      ⚠️ تنبيه:
                    </span>
                    رفض استلام الطلبات المؤكدة (COD) يسبب خسائر مادية للمتجر, قد
                    يؤدي إلى حظر حسابك من الطلبات المستقبلية.
                  </p>
                </div>
              </section>

              {/* 6. Store Obligations */}
              <section>
                <div className="flex items-center gap-6 mb-12">
                  <div className="text-4xl font-display font-bold text-primary/20 leading-none">
                    06.
                  </div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 uppercase tracking-tight">
                    التزامات المتجر
                  </h2>
                </div>
                <div className="space-y-6 text-sm text-gray-600 leading-loose">
                  <p className="flex items-start gap-4 uppercase tracking-[0.1em]">
                    <span className="text-primary font-bold">✓</span>
                    فحص دقيق لكل منتج قبل الشحن لضمان وصوله بحالة ممتازة.
                  </p>
                  <p className="flex items-start gap-4 uppercase tracking-[0.1em]">
                    <span className="text-primary font-bold">✓</span>
                    معالجة الطلبات المؤكدة خلال 24 ساعة وإعلامك بحالة الشحن.
                  </p>
                  <p className="flex items-start gap-4 uppercase tracking-[0.1em]">
                    <span className="text-primary font-bold">✓</span>
                    الحفاظ على سرية بياناتك الشخصية واستخدامها فقط لأغراض الطلب.
                  </p>
                  <p className="flex items-start gap-4 uppercase tracking-[0.1em]">
                    <span className="text-primary font-bold">✓</span>
                    تقديم دعم فني واستشاري سريع في حال وجود أي استفسار أو مشكلة.
                  </p>
                </div>
              </section>

              {/* 7. Return Policy - Red Alert Block */}
              <section className="bg-surface-low -mx-8 md:-mx-16 p-8 md:p-16 border-y border-surface-high">
                <div className="flex items-center gap-6 mb-16">
                  <div className="text-4xl font-display font-bold text-red-600/20 leading-none">
                    06.
                  </div>
                  <h2 className="text-3xl font-display font-bold text-red-600 uppercase tracking-tight italic">
                    سياسة الإرجاع
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-1.5 bg-green-500" />
                      حالات القبول
                    </h3>
                    <div className="grid grid-cols-1 gap-px bg-surface-high border border-surface-high">
                      {[
                        {
                          title: "منتج تالف أو مكسور",
                          action: "استبدال أو استرجاع كامل",
                        },
                        { title: "منتج مختلف تماماً", action: "تصحيح فوري" },
                        { title: "ضمان تشغيل", action: "صلاحية 5 أيام" },
                      ].map((item, i) => (
                        <div key={i} className="bg-white p-6">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                            {item.title}
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {item.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900 flex items-center gap-3 mb-8">
                      <div className="w-1.5 h-1.5 bg-red-500" />
                      حالات الرفض
                    </h3>
                    <div className="space-y-4">
                      {[
                        "تجاوز فترة 5 أيام",
                        "فتح العلبة الأصلية أو إتلافها",
                        "تغيير الرأي الشخصي",
                        "كسر ناتج عن سوء الاستخدام",
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 text-gray-500 text-xs font-medium uppercase tracking-widest border-b border-surface-high pb-4 last:border-0 italic"
                        >
                          <span>✕</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Final Conclusion */}
              <section className="text-center pt-24 border-t border-surface-high">
                <div className="inline-block p-12 bg-surface-low border border-surface-high">
                  <p className="text-lg font-display font-bold text-gray-900 mb-6 uppercase tracking-widest">
                    Agreement Confirmation
                  </p>
                  <p className="text-gray-400 text-xs uppercase tracking-[0.2em] leading-loose max-w-sm mx-auto">
                    By proceeding, you confirm full adherence to our curated
                    trading standards and quality service protocols
                  </p>
                </div>
                <div className="mt-20 font-display font-bold text-gray-300 text-xs uppercase tracking-[0.5em]">
                  SAHLA DZ. — Smart Solutions 2026
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
