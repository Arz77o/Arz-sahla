import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Truck, Headset, ShieldCheck } from 'lucide-react';
import { SEOMeta } from '../components/shared/SEOMeta';
import { ProductCard } from '../components/store/ProductCard';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Reveal } from '../components/shared/Reveal';

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
      <section className="relative bg-surface overflow-hidden pt-12 md:pt-20 pb-20 md:pb-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12">
            {/* Text Content */}
            <div className="md:w-1/2 text-right">
                <Reveal delay={0.1}>
                  <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-1.5 mb-6">
                    Premium Shopping
                  </span>
                </Reveal>
                <Reveal delay={0.2}>
                  <h1 className="text-5xl md:text-7xl font-display font-bold text-gray-900 mb-8 leading-[1.1] tracking-tighter">
                    تسوق ببساطة <br /> للجميع.
                  </h1>
                </Reveal>
                <Reveal delay={0.3}>
                  <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed max-w-xl ml-auto">
                    مجموعات مختارة بعناية من أفضل المنتجات العالمية، تصلك إلى مكتب Yalidine في ولايتك بكل سهولة وأمان.
                  </p>
                </Reveal>
                <Reveal delay={0.4}>
                  <div className="flex flex-col sm:flex-row-reverse items-center gap-4">
                    <Link to="/products" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto px-10">
                        تصفح المنتجات
                      </Button>
                    </Link>
                    <Link to="/order/track" className="w-full sm:w-auto">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto px-10">
                        تتبع طلبك
                      </Button>
                    </Link>
                  </div>
                </Reveal>
            </div>

            {/* Product Image Component / Editorial Image */}
            <div className="md:w-1/2 relative">
              <div className="relative z-10 p-8 md:p-12">
                <img 
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop" 
                  alt="Featured Product"
                  className="w-full h-auto object-cover shadow-2xl grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="absolute top-0 right-0 w-2/3 h-full bg-surface-low -z-0 translate-x-12 translate-y-12" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-surface-low">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-4">
            <div className="text-right">
              <h2 className="text-3xl font-display font-bold text-gray-900">تسوق حسب الفئة</h2>
              <div className="w-12 h-1 bg-primary mt-4 ml-auto" />
            </div>
          </div>
          <div className="flex flex-wrap justify-start border-t border-r border-gray-200">
            {categories.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 0.05 + 0.1} width="auto">
                <Link 
                  to={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center justify-center p-8 md:p-12 bg-white hover:bg-surface-high transition-all duration-300 w-full min-w-[160px] md:min-w-[200px] border-l border-b border-gray-200"
                >
                  <div className="w-12 h-12 text-gray-400 group-hover:text-primary transition-colors mb-4">
                    <ShoppingBag className="w-full h-full stroke-1" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-widest text-center">
                    {isAr ? cat.name_ar : cat.name_en}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-row-reverse justify-between items-end mb-16">
            <div className="text-right">
              <h2 className="text-3xl font-display font-bold text-gray-900">أحدث المنتجات</h2>
              <p className="text-sm text-gray-400 mt-2">مجموعتنا الجديدة وصلت لتوها</p>
            </div>
            <Link to="/products" className="text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary/20 hover:border-primary transition-all pb-1">
              عرض الكل &larr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-surface-high">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <Reveal delay={0.1}>
              <div className="text-right space-y-6">
                <div className="w-12 h-12 text-primary">
                  <ShieldCheck className="w-full h-full stroke-1" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">دفع آمن بالدينار</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  ادفع بكل أمان عبر البطاقة الذهبية أو CIB باستخدام منصة Chargily المشفرة.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="text-right space-y-6">
                <div className="w-12 h-12 text-primary">
                  <Truck className="w-full h-full stroke-1" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">توصيل Stop Desk</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  نشحن طلبك إلى أقرب مكتب Yalidine في ولايتك للتوصيل السريع والمضمون في 48 ساعة.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="text-right space-y-6">
                <div className="w-12 h-12 text-primary">
                  <Headset className="w-full h-full stroke-1" />
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">دعم متواصل</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  فريق دعم متخصص للرد على استفساراتك ومتابعة طلباتك عبر الهاتف أو فيسبوك.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
