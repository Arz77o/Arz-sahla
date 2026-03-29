import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase';
import { toast } from 'sonner';

// شرح بسيط:
// هذا الـ Hook يساعدنا نتعامل مع التقييمات من ناحية الـ Admin
// مثل الموافقة، الرفض، والبحث عن التقييمات المعلقة

export interface ReviewModeration {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  images: any | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  full_name?: string; // ✅ اسم العميل
  // معلومات إضافية للعرض
  product?: { name_ar: string };
  user?: { email: string };
}

// جلب التقييمات قيد المراجعة
export function usePendingReviews() {
  return useQuery({
    queryKey: ['reviews', 'pending'],
    queryFn: async () => {
      // جلب التقييمات مع بيانات المنتج فقط
      // سنحصل على اسم العميل من user_metadata
      const { data, error } = await supabaseAdmin
        .from('reviews')
        .select(`
          *,
          products(name_ar),
          user_id
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // للحصول على أسماء المستخدمين، سنستخدم user_id مباشرة
      // أو نحاول جلب بيانات المستخدم من جدول آخر إن توفر
      return data as unknown as ReviewModeration[];
    },
    staleTime: 1000 * 60, // تحديث كل دقيقة
  });
}

// جلب جميع التقييمات (مع إمكانية التصفية)
export function useAllReviews(status?: string) {
  return useQuery({
    queryKey: ['reviews', 'all', status],
    queryFn: async () => {
      let query = supabaseAdmin
        .from('reviews')
        .select(`
          *,
          products(name_ar),
          user_id
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ReviewModeration[];
    },
    staleTime: 1000 * 60,
  });
}

// قبول تقييم
export function useApproveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabaseAdmin
        .from('reviews')
        .update({ status: 'approved', admin_note: null })
        .eq('id', reviewId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('تم قبول التقييم ✓');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل قبول التقييم');
    },
  });
}

// رفض تقييم
export function useRejectReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      const { error } = await supabaseAdmin
        .from('reviews')
        .update({ status: 'rejected', admin_note: reason })
        .eq('id', reviewId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('تم رفض التقييم');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل رفض التقييم');
    },
  });
}

// حذف تقييم
export function useDeleteApprovedReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('تم حذف التقييم');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل حذف التقييم');
    },
  });
}
