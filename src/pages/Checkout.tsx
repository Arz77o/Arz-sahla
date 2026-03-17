import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { SEOMeta } from '../components/shared/SEOMeta';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { WILAYAS } from '../lib/algeria';
import { formatDZD } from '../lib/pricing';
import { Button } from '../components/ui/button';

const checkoutSchema = z.object({
  fullName: z.string().min(3, 'الاسم الكامل مطلوب'),
  address: z.string().min(10, 'العنوان التفصيلي مطلوب'),
  wilaya: z.string().min(1, 'يرجى اختيار الولاية'),
  commune: z.string().min(2, 'اسم البلدية مطلوب'),
  zipCode: z.string().min(4, 'الرمز البريدي مطلوب'),
  phone: z.string().regex(/^(0)(5|6|7)[0-9]{8}$/, 'رقم هاتف غير صالح (مثال: 0550123456)'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'يجب الموافقة على الشروط والأحكام',
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const { items, getTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      phone: user?.user_metadata?.phone || '',
      termsAccepted: false,
    }
  });

  const termsAccepted = watch('termsAccepted');

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // 1. Create Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_dzd: getTotal(),
          full_name: data.fullName,
          address: data.address,
          wilaya: data.wilaya,
          commune: data.commune,
          zip_code: data.zipCode,
          phone: data.phone,
          terms_accepted: data.termsAccepted,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      const order = orderData as any;

      // 2. Create Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: 1,
        unit_price_dzd: item.price_dzd,
        variant: item.variant || {},
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Call Edge Function to get Chargily checkout URL
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          order_id: order.id,
          total_dzd: getTotal(),
          customer_name: data.fullName,
          customer_email: user.email,
          locale: i18n.language,
        }
      });

      if (checkoutError) throw checkoutError;

      if (checkoutData?.checkout_url) {
        // Redirect to Chargily
        window.location.href = checkoutData.checkout_url;
      } else {
        throw new Error('لم يتم إرجاع رابط الدفع');
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'حدث خطأ أثناء إنشاء الطلب');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOMeta title={t('checkout.title')} />
      <div className="container mx-auto px-4 py-8">
        
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0 rounded-full"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-blue-600 z-0 rounded-full"></div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-blue-600">السلة</span>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm border-4 border-white">
                2
              </div>
              <span className="text-sm font-bold text-blue-600">التوصيل</span>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold shadow-sm border-4 border-white">
                3
              </div>
              <span className="text-sm font-medium text-gray-500">الدفع</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
          {/* Form */}
          <div className="flex-1">
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">معلومات التوصيل</h2>
              
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('checkout.fullName')} *</label>
                    <input 
                      {...register('fullName')}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      placeholder="الاسم واللقب كما في بطاقة الهوية"
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('checkout.phone')} *</label>
                    <input 
                      {...register('phone')}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      placeholder="0550123456"
                      dir="ltr"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('checkout.address')} *</label>
                  <input 
                    {...register('address')}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                    placeholder="رقم العمارة، الشارع، الحي..."
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('checkout.wilaya')} *</label>
                    <select 
                      {...register('wilaya')}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.wilaya ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                    >
                      <option value="">اختر الولاية...</option>
                      {WILAYAS.map(w => (
                        <option key={w.code} value={isAr ? w.name_ar : w.name_en}>
                          {w.code} - {isAr ? w.name_ar : w.name_en}
                        </option>
                      ))}
                    </select>
                    {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('checkout.commune')} *</label>
                    <input 
                      {...register('commune')}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.commune ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      placeholder={t('checkout.communePlaceholder')}
                    />
                    {errors.commune && <p className="text-red-500 text-xs mt-1">{errors.commune.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('checkout.zipCode')} *</label>
                    <input 
                      {...register('zipCode')}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                      placeholder="الرمز البريدي"
                      dir="ltr"
                    />
                    {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode.message}</p>}
                  </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="termsAccepted"
                      type="checkbox"
                      {...register('termsAccepted')}
                      className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="termsAccepted" className="text-sm font-medium text-amber-900 cursor-pointer">
                      أوافق على <Link to="/terms" target="_blank" className="underline hover:text-amber-700">الشروط والأحكام</Link> الخاصة بمنصة Sahla
                    </label>
                    <p className="text-xs text-amber-700 mt-1">
                      أقر بأنني قرأت وفهمت سياسة الشحن والجمارك وأنني أتحمل مسؤولية أي رسوم جمركية قد تفرض على شحنتي.
                    </p>
                    {errors.termsAccepted && <p className="text-red-500 text-xs mt-1">{errors.termsAccepted.message}</p>}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.product_id} className="flex gap-3 items-center">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                      <img src={item.image || 'https://picsum.photos/seed/sahla/100/100'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{isAr ? item.name_ar : item.name_en}</h4>
                      <p className="text-xs text-gray-500">{item.variant ? `${item.variant.group}: ${item.variant.option}` : ''}</p>
                      <div className="text-sm font-bold text-blue-600 mt-1">{formatDZD(item.price_dzd)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي</span>
                  <span>{formatDZD(getTotal())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>الشحن</span>
                  <span className="text-green-600 font-medium">مجاني</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">الإجمالي</span>
                  <span className="text-2xl font-black text-blue-600">{formatDZD(getTotal())}</span>
                </div>
              </div>

              <Button 
                type="submit"
                form="checkout-form"
                size="lg" 
                className="w-full h-14 text-lg font-bold rounded-xl mb-4 bg-blue-600 hover:bg-blue-700"
                disabled={!isValid || !termsAccepted || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  `${t('checkout.pay')} — ${formatDZD(getTotal())}`
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>دفع آمن عبر Chargily</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
