import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Truck, Headset, ShieldCheck } from 'lucide-react';
import { SEOMeta } from '../components/shared/SEOMeta';
import { ProductCard } from '../components/store/ProductCard';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData) setCategories(catData);

      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .eq('is_published', true)
        .eq('auto_hidden', false)
        .limit(8);
      if (prodData) setFeaturedProducts(prodData);
    };
    fetchHomeData();
  }, []);

  return (
    <>
      <SEOMeta />
      
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            تسوق من AliExpress بكل سهولة
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
            منصة الشراء بالوكالة — ندفع بالنيابة عنك وتستلم في بيتك بالجزائر. ادفع بالدينار الجزائري بكل أمان.
          </p>
          <Link to="/products">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg font-bold px-8 py-6 rounded-full">
              تصفح المنتجات
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Row */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">تسوق حسب الفئة</h2>
          <div className="flex overflow-x-auto pb-4 gap-4 justify-center">
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/products?category=${cat.slug}`}
                className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-32 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="font-medium text-gray-800 text-center">
                  {isAr ? cat.name_ar : cat.name_en}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold text-gray-900">أحدث المنتجات</h2>
            <Link to="/products" className="text-blue-600 font-medium hover:underline">
              عرض الكل &larr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">دفع آمن بالدينار</h3>
              <p className="text-gray-600">ادفع بكل أمان عبر البطاقة الذهبية أو CIB باستخدام منصة Chargily.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">شحن مباشر إليك</h3>
              <p className="text-gray-600">نشحن طلبك مباشرة من الصين إلى عنوانك في الجزائر.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Headset className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">دعم جزائري</h3>
              <p className="text-gray-600">فريق دعم متواجد للرد على استفساراتك ومتابعة طلباتك.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
