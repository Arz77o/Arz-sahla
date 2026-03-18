import React from 'react';
import { useTranslation } from 'react-i18next';
import { SEOMeta } from '../components/shared/SEOMeta';
import { HelpCircle } from 'lucide-react';

export default function FAQ() {
  const { t } = useTranslation();

  return (
    <>
      <SEOMeta title={t('nav.faq')} />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('nav.faq')}</h1>
          <p className="text-gray-600">إجابات على الأسئلة الأكثر شيوعاً حول خدماتنا.</p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">كيفية استلام المنتج</h2>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">كم يستغرق التوصيل؟</h3>
                <p className="text-gray-600 leading-relaxed">بما أن المنتجات تشحن مباشرة من الصين، فإن مدة التوصيل تتراوح عادة بين 15 إلى 45 يوم عمل حسب شركة الشحن والجمارك.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">أين أستلم طردي؟</h3>
                <p className="text-gray-600 leading-relaxed">يتم تسليم الطرود عادة إلى أقرب مركز بريد (Algérie Poste) لعنوانك، أو عبر شركة التوصيل (EMS) إذا كانت متوفرة.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">هل أدفع رسوم جمركية؟</h3>
                <p className="text-gray-600 leading-relaxed">نعم، قد تخضع بعض المنتجات لرسوم جمركية عند وصولها للجزائر (مثل ضريبة 130 دج للطرود العادية). هذه الرسوم يدفعها العميل عند الاستلام.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">ماذا أفعل إذا لم يصل المنتج؟</h3>
                <p className="text-gray-600 leading-relaxed">إذا تجاوزت المدة 60 يوماً ولم يصل المنتج، يرجى التواصل معنا لفتح نزاع واسترداد أموالك.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">هل يمكنني إرجاع المنتج؟</h3>
                <p className="text-gray-600 leading-relaxed">سياسة الإرجاع تعتمد على البائع في AliExpress. في حال وصول منتج تالف أو غير مطابق، يرجى تصويره فوراً والتواصل معنا.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">كيف تتبع منتجك</h2>
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">كيف أحصل على رقم التتبع؟</h3>
                <p className="text-gray-600 leading-relaxed">بمجرد شحن البائع للمنتج، سنقوم بتحديث حالة طلبك وإضافة رقم التتبع الدولي. ستتلقى أيضاً بريداً إلكترونياً بذلك.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">أين يمكنني تتبع الشحنة؟</h3>
                <p className="text-gray-600 leading-relaxed">يمكنك تتبع شحنتك عبر صفحة "تتبع الطلب" في موقعنا، أو باستخدام مواقع التتبع العالمية مثل 17Track.net.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">رقم التتبع لا يعمل، ماذا أفعل؟</h3>
                <p className="text-gray-600 leading-relaxed">قد يستغرق ظهور معلومات التتبع من 3 إلى 7 أيام بعد الشحن. يرجى التحلي بالصبر والمحاولة لاحقاً.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">ما معنى "Arrived at destination country"؟</h3>
                <p className="text-gray-600 leading-relaxed">تعني أن الطرد وصل إلى الجزائر وهو الآن قيد المعالجة الجمركية قبل توجيهه إلى مركز البريد الخاص بك.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">كيف أعرف أن الطرد في مركز البريد؟</h3>
                <p className="text-gray-600 leading-relaxed">ستتلقى إشعاراً في هاتفك يأكد أن طردك وصل إلى عنوانك و يرجى أخذه من المركز حاملا معك بطاقة التعريف و رقم  التتبع المرسل إليك في البريد الإلكتروني، أو يمكنك تتبع الرقم محلياً عبر موقع بريد الجزائر إذا كان مدعوماً.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-lg mb-2 text-blue-600">هل يمكن تتبع جميع الطرود؟</h3>
                <p className="text-gray-600 leading-relaxed">معظم الطرود توفر تتبعاً كاملاً، لكن بعض طرق الشحن الاقتصادي قد توفر تتبعاً جزئياً يتوقف عند وصول الطرد للجزائر.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
