import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { SEOMeta } from '../components/shared/SEOMeta';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/account';
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(returnTo);
    } catch (error: any) {
      toast.error(error.message || 'فشل تسجيل الدخول. تأكد من بياناتك.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOMeta title={t('nav.login')} />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('nav.login')}</h1>
            <p className="text-gray-500">مرحباً بعودتك إلى Sahla</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email"
                  {...register('email')}
                  className={`w-full pl-4 pr-12 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password"
                  {...register('password')}
                  className={`w-full pl-4 pr-12 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'}`}
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('nav.login')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            ليس لديك حساب؟{' '}
            <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="text-blue-600 font-bold hover:underline">
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
