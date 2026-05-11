import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name_ar: string;
  name_en?: string | null;
  description_ar: string | null;
  description_en?: string | null;
  problem_solved_ar: string | null;
  problem_solved_en?: string | null;
  price_dzd: number | null;
  price_chargily?: number | null;
  images: string[];
  category_id: string;
  avg_rating: number;
  is_published: boolean;
  stock_quantity: number | null;
  variants: any[];
  categories?: {
    name_ar: string;
    name_en: string;
  } | null;
}

export function useProducts(categoryId?: string, includeHidden = false) {
  return useQuery({
    queryKey: ['products', categoryId, includeHidden],
    queryFn: async () => {
      let query = supabaseAdmin
        .from('products')
        .select('*, categories(name_ar, name_en)')
        .order('created_at', { ascending: false });

      if (!includeHidden) {
        query = query.eq('is_published', true);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Product[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*, categories(name_ar, name_en), reviews(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as unknown as Product & { reviews: any[] };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم حذف المنتج بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل حذف المنتج');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Product> & { id: string }) => {
      // Remove joined/relational fields that are not actual DB columns
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { categories, reviews, ...cleanPayload } = payload as any;
      const { error } = await supabaseAdmin.from('products').update(cleanPayload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('تم تحديث المنتج بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل تحديث المنتج');
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Product, 'id'>) => {
      const { error } = await supabaseAdmin.from('products').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('تم إضافة المنتج بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل إضافة المنتج');
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabaseAdmin
        .from('reviews')
        .insert({
          ...payload,
          status: 'pending', // ✅ جديد: التقييم الجديد يبدأ بحالة "قيد المراجعة"
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.product_id] });
      toast.success('شكراً على تقييمك! سيتم نشره بعد المراجعة ⏳');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل إضافة التقييم');
    },
  });
}

export function useDeleteReview(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabaseAdmin.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('تم حذف التقييم بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل حذف التقييم');
    },
  });
}
