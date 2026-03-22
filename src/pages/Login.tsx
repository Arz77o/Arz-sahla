import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react';
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
      <div className="bg-white min-h-screen flex items-center justify-center py-20">
        <div className="w-full max-w-lg px-4">
          <div className="mb-16 border-b border-surface-high pb-8">
            <h1 className="text-6xl md:text-8xl font-display font-bold text-gray-900 tracking-tighter leading-none mb-4">
              Access
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary italic">
              AUTHENTICATE TO YOUR ARCHIVE
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 group">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block ml-auto">البريد الإلكتروني</label>
                <div className="relative border-b border-surface-high focus-within:border-primary transition-all">
                  <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400 stroke-1" />
                  </div>
                  <input 
                    type="email"
                    {...register('email')}
                    className="w-full pl-0 pr-8 py-4 bg-transparent text-gray-900 font-display font-medium text-lg outline-none placeholder:text-gray-200"
                    placeholder="name@archival.com"
                    dir="ltr"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2">✕ {errors.email.message}</p>}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block ml-auto">كلمة المرور</label>
                <div className="relative border-b border-surface-high focus-within:border-primary transition-all">
                  <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400 stroke-1" />
                  </div>
                  <input 
                    type="password"
                    {...register('password')}
                    className="w-full pl-0 pr-8 py-4 bg-transparent text-gray-900 font-display font-medium text-lg outline-none placeholder:text-gray-200"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
                {errors.password && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2">✕ {errors.password.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-6">
              <Button 
                type="submit" 
                className="w-full h-16 text-lg font-bold uppercase tracking-widest"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin stroke-1" /> : t('nav.login')}
              </Button>
              
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400 italic">
                <Link to="/" className="flex items-center gap-2 hover:text-primary">
                  <ArrowLeft className="w-3 h-3" />
                  Back to Store
                </Link>
                <Link to={`/register?returnTo=${encodeURIComponent(returnTo)}`} className="text-primary hover:underline underline-offset-4">
                  Register New Account
                </Link>
              </div>
            </div>
          </form>

          <div className="mt-32 pt-8 border-t border-surface-high text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-200">
              Sahla DZ — Security Protocol 2026
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
