import React from 'react';
import { useTranslation } from 'react-i18next';
import { SEOMeta } from '../components/shared/SEOMeta';
import { HelpCircle } from 'lucide-react';

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <>
      <SEOMeta title={t('nav.faq')} />
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-16 md:py-32 max-w-5xl">
          {/* Header Section */}
          <div className="mb-20 md:mb-32 border-b border-surface-high pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-6xl md:text-9xl font-display font-bold text-gray-900 tracking-tighter leading-none mb-6">
                  {t('nav.faq')}
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                  ESSENTIAL ARCHIVAL KNOWLEDGE
                </p>
              </div>
              <div className="w-16 h-16 bg-surface-low border border-surface-high flex items-center justify-center text-primary">
                <HelpCircle className="w-8 h-8 stroke-1" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <aside className="lg:col-span-4 sticky top-24 h-fit">
              <p className="text-sm text-gray-400 leading-relaxed uppercase tracking-widest font-bold">
                Everything you need to know about our curated delivery and acquisition protocols.
              </p>
            </aside>

            <div className="lg:col-span-8 space-y-24">
              <section className="space-y-12">
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-display font-bold text-primary/20 leading-none underline decoration-2 underline-offset-8">01.</div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 uppercase tracking-tight italic">Delivery Protocols</h2>
                </div>
                <div className="space-y-px bg-surface-high border border-surface-high">
                  {[
                    { q: "كم يستغرق التوصيل؟", a: "يستغرق التوصيل من 2 إلى 7 أيام عمل لجميع ولايات الجزائر الـ 58." },
                    { q: "أين أستلم طردي؟", a: "يتم تسليم الطرود عبر خدمة Stop Desk (الاستلام من مكتب شركة الشحن) في ولايتك." },
                    { q: "هل هناك رسوم إضافية؟", a: "لا توجد رسوم خفية. تدفع فقط السعر الإجمالي الموضح في الطلب." }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-8 md:p-10 group hover:bg-surface-low transition-all">
                      <h3 className="text-lg font-display font-bold text-gray-900 mb-4 tracking-tight">{item.q}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-12">
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-display font-bold text-primary/20 leading-none underline decoration-2 underline-offset-8">02.</div>
                  <h2 className="text-2xl font-display font-bold text-gray-900 uppercase tracking-tight italic">Acquisition & Payment</h2>
                </div>

                <div className="space-y-px bg-surface-high border border-surface-high">
                  {/* Video Tutorial Card */}
                  <div className="bg-primary/5 p-8 md:p-10 border-b border-surface-high">
                    <h3 className="text-lg font-display font-bold text-gray-900 mb-6 tracking-tight flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                        <span className="animate-ping absolute w-8 h-8 rounded-full bg-primary/40 -z-10" />
                        ▶
                      </span>
                      كيف أدفع بالبطاقة الذهبية (شرح فيديو)
                    </h3>
                    <div className="aspect-video w-full bg-gray-900 shadow-xl overflow-hidden group relative">
                       {/* Placeholder for iframe or actual video */}
                       <video
                         src="/e-dahabia-tutorial.webm"
                         className="w-full h-full"
                         controls
                         playsInline
                       />
                    </div>
                  </div>
                  {[
                    { q: "ما هي طرق الدفع المتوفرة؟", a: "نوفر الدفع عند الاستلام (COD) والدفع الإلكتروني عبر البطاقة الذهبية أو CIB." },
                    { q: "كيف أتأكد من نجاح طلبي؟", a: "ستصلك رسالة تأكيد عبر WhatsApp أو عبر الاتصال الهاتفي خلال 24 ساعة." },
                    { q: "كيف أتتبع شحنتي؟", a: "يمكنك تتبع حالة طلبك من صفحة 'تتبع الطلب' باستخدام رقم طلبك." }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-8 md:p-10 group hover:bg-surface-low transition-all">
                      <h3 className="text-lg font-display font-bold text-gray-900 mb-4 tracking-tight">{item.q}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="p-12 bg-surface-low border border-surface-high text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-6 font-medium">Still have inquiries?</p>
                <div className="text-lg font-display font-bold text-gray-900 tracking-tight italic">
                  Contact our support via WhatsApp for immediate assistance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
