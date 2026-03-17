import React from 'react';
import { SEOMeta } from '../components/shared/SEOMeta';

export default function Terms() {
  return (
    <>
      <SEOMeta title="الشروط والأحكام" />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">الشروط والأحكام</h1>
          
          <div className="prose max-w-none text-gray-600 space-y-6">
            <p>
              مرحباً بك في منصة Sahla. باستخدامك لموقعنا، فإنك توافق على الشروط والأحكام التالية. يرجى قراءتها بعناية.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. طبيعة الخدمة</h2>
            <p>
              Sahla هي منصة وسيطة تقدم خدمة الشراء بالوكالة من موقع AliExpress. نحن نقوم بدفع قيمة المنتجات بالعملة الصعبة نيابة عنك، وتدفع لنا بالدينار الجزائري. نحن لا نملك المنتجات المعروضة ولا نقوم بتصنيعها.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. الأسعار والدفع</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>جميع الأسعار المعروضة على الموقع هي بالدينار الجزائري وتشمل عمولة الخدمة.</li>
              <li>الأسعار قابلة للتغيير بناءً على تقلبات أسعار الصرف.</li>
              <li>يتم الدفع مسبقاً وبشكل كامل عبر طرق الدفع الإلكتروني المتاحة (البطاقة الذهبية، CIB) عبر منصة Chargily.</li>
              <li>لا نقوم بمعالجة أو حفظ بيانات بطاقتك البنكية؛ تتم العملية بالكامل على خوادم Chargily الآمنة.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. الشحن والتوصيل</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>يتم شحن المنتجات مباشرة من البائعين في الصين إلى العنوان الذي تقدمه.</li>
              <li>تتراوح مدة التوصيل عادة بين 15 إلى 45 يوم عمل. هذه المدة تقديرية وقد تتأثر بعوامل خارجة عن إرادتنا مثل الجمارك أو شركات الشحن.</li>
              <li>أنت مسؤول عن تقديم عنوان صحيح وكامل. لا نتحمل مسؤولية ضياع الطرود بسبب خطأ في العنوان.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. الجمارك والرسوم الإضافية</h2>
            <p className="font-bold text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
              أنت (العميل) تتحمل المسؤولية الكاملة عن أي رسوم جمركية، ضرائب، أو مصاريف بريدية (مثل ضريبة 130 دج لبريد الجزائر) قد تُفرض على طردك عند وصوله إلى الجزائر.
            </p>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. الإلغاء والاسترجاع</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>يمكنك إلغاء الطلب واسترداد أموالك بالكامل إذا لم نقم بعد بتنفيذ عملية الشراء على AliExpress.</li>
              <li>بمجرد شراء المنتج وشحنه، لا يمكن إلغاء الطلب.</li>
              <li>في حال وصول منتج تالف أو غير مطابق للمواصفات، يجب إبلاغنا وتزويدنا بالصور خلال 48 ساعة من الاستلام لكي نقوم بفتح نزاع مع البائع نيابة عنك.</li>
              <li>استرداد الأموال في حالة النزاع يعتمد على قرار منصة AliExpress.</li>
            </ul>

            <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">6. إخلاء المسؤولية</h2>
            <p>
              نحن نعمل كوسطاء فقط. لا نتحمل مسؤولية جودة المنتجات، أو تأخر الشحن من قبل البائع، أو حجز الطرود من قبل الجمارك الجزائرية.
            </p>

            <p className="mt-12 text-sm text-gray-500">
              آخر تحديث: {new Date().toLocaleDateString('ar-DZ')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
