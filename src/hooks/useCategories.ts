import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  created_at?: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('name_ar');
      
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previousCategories = queryClient.getQueryData<Category[]>(['categories']);
      queryClient.setQueryData<Category[]>(['categories'], (old) => 
        old?.filter((c) => c.id !== id)
      );
      return { previousCategories };
    },
    onError: (error: any, _, context: any) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
      toast.error(error.message || 'فشل حذف الفئة');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onSuccess: () => {
      toast.success('تم حذف الفئة بنجاح');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Category> & { id: string }) => {
      const { error } = await supabaseAdmin.from('categories').update(payload).eq('id', id);
      if (error) throw error;
    },
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previousCategories = queryClient.getQueryData<Category[]>(['categories']);
      queryClient.setQueryData<Category[]>(['categories'], (old) => 
        old?.map((c) => (c.id === newCategory.id ? { ...c, ...newCategory } : c))
      );
      return { previousCategories };
    },
    onError: (error: any, _, context: any) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
      toast.error(error.message || 'فشل تحديث الفئة');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onSuccess: () => {
      toast.success('تم تحديث الفئة بنجاح');
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<Category, 'id'>) => {
      const { error } = await supabaseAdmin.from('categories').insert(payload);
      if (error) throw error;
    },
    onMutate: async (newCategory) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previousCategories = queryClient.getQueryData<Category[]>(['categories']);
      queryClient.setQueryData<Category[]>(['categories'], (old) => [
        ...(old || []),
        { id: 'temp-' + Date.now(), ...newCategory } as Category
      ]);
      return { previousCategories };
    },
    onError: (error: any, _, context: any) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(['categories'], context.previousCategories);
      }
      toast.error(error.message || 'فشل إضافة الفئة');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onSuccess: () => {
      toast.success('تم إضافة الفئة بنجاح');
    },
  });
}
