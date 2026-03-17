import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Save, ArrowRight, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { supabaseAdmin } from '../../lib/supabase';
import { formatAdminPreview } from '../../lib/pricing';
import { Button } from '../../components/ui/button';

const productSchema = z.object({
  name_ar: z.string().min(3, 'الاسم بالعربية مطلوب'),
  name_en: z.string().min(3, 'الاسم بالإنجليزية مطلوب'),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  price_usd: z.number({ invalid_type_error: 'السعر مطلوب' }).positive('السعر يجب أن يكون أكبر من 0').max(50, 'السعر يجب أن لا يتجاوز 50$'),
  aliexpress_url: z.string().url('رابط غير صالح').optional().or(z.literal('')),
  category_id: z.string().min(1, 'الفئة مطلوبة'),
  product_badge: z.enum(['brand', 'choice', '']).optional().transform(v => v === '' ? null : v),
  is_published: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      is_published: false,
    }
  });

  const priceUsd = watch('price_usd');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: catData } = await supabaseAdmin.from('categories').select('*');
      if (catData) setCategories(catData);

      // Fetch product if edit mode
      if (isEdit) {
        const { data: prodData, error } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !prodData) {
          toast.error('المنتج غير موجود');
          navigate('/admin/products');
          return;
        }

        reset({
          name_ar: prodData.name_ar,
          name_en: prodData.name_en,
          description_ar: prodData.description_ar || '',
          description_en: prodData.description_en || '',
          price_usd: prodData.price_usd,
          aliexpress_url: prodData.aliexpress_url || '',
          category_id: prodData.category_id || '',
          product_badge: prodData.product_badge || '',
          is_published: prodData.is_published,
        });
        setImages(prodData.images || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [id, isEdit, reset, navigate]);

  const [isUploading, setIsUploading] = useState(false);

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setImages([...images, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('products')
        .getPublicUrl(filePath);

      setImages([...images, publicUrl]);
      toast.success('تم رفع الصورة بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'فشل رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSaving(true);
    try {
      const productData = {
        ...data,
        images,
        product_badge: data.product_badge || null,
        aliexpress_url: data.aliexpress_url || null,
      };

      if (isEdit) {
        const { error } = await supabaseAdmin
          .from('products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const { error } = await supabaseAdmin
          .from('products')
          .insert(productData);
        if (error) throw error;
        toast.success('تم إضافة المنتج بنجاح');
        navigate('/admin/products');
      }
    } catch (error: any) {
      toast.error(error.message || 'فشل حفظ المنتج');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <SEOMeta title={isEdit ? 'تعديل منتج | الإدارة' : 'إضافة منتج | الإدارة'} />
      
      <div className="mb-8 flex items-center gap-3">
        <Link to="/admin/products" className="text-gray-500 hover:text-gray-900">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'تعديل منتج' : 'إضافة منتج جديد'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">المعلومات الأساسية</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الاسم (عربي) *</label>
                <input 
                  {...register('name_ar')}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.name_ar ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.name_ar && <p className="text-red-500 text-xs">{errors.name_ar.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الاسم (إنجليزي) *</label>
                <input 
                  {...register('name_en')}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.name_en ? 'border-red-500' : 'border-gray-200'}`}
                  dir="ltr"
                />
                {errors.name_en && <p className="text-red-500 text-xs">{errors.name_en.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">الوصف (عربي)</label>
              <textarea 
                {...register('description_ar')}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">الوصف (إنجليزي)</label>
              <textarea 
                {...register('description_en')}
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                dir="ltr"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">الصور</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <input 
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="رابط الصورة (https://...)"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    dir="ltr"
                  />
                  <Button type="button" onClick={handleAddImage} variant="secondary">
                    إضافة
                  </Button>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-gray-400 text-sm mx-2">أو</span>
                </div>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button type="button" variant="outline" disabled={isUploading} className="w-full sm:w-auto">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <ImageIcon className="w-4 h-4 ml-2" />}
                    رفع صورة
                  </Button>
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {images.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>لا توجد صور مضافة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">النشر والتسعير</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="is_published">منشور</label>
                <input 
                  type="checkbox" 
                  id="is_published"
                  {...register('is_published')}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">السعر (USD) *</label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-gray-500 font-mono">$</span>
                <input 
                  type="number"
                  step="0.01"
                  {...register('price_usd', { valueAsNumber: true })}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none font-mono ${errors.price_usd ? 'border-red-500' : 'border-gray-200'}`}
                  dir="ltr"
                />
              </div>
              {errors.price_usd && <p className="text-red-500 text-xs">{errors.price_usd.message}</p>}
              <p className="text-sm font-bold text-blue-600 mt-2 bg-blue-50 p-2 rounded-lg text-center">
                {formatAdminPreview(priceUsd)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">الفئة *</label>
              <select 
                {...register('category_id')}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.category_id ? 'border-red-500' : 'border-gray-200'}`}
              >
                <option value="">اختر الفئة...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-500 text-xs">{errors.category_id.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">شارة المنتج</label>
              <select 
                {...register('product_badge')}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">بدون شارة</option>
                <option value="brand">Brand (أزرق)</option>
                <option value="choice">Choice (أخضر)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">رابط AliExpress</label>
              <input 
                type="url"
                {...register('aliexpress_url')}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.aliexpress_url ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="https://aliexpress.com/item/..."
                dir="ltr"
              />
              {errors.aliexpress_url && <p className="text-red-500 text-xs">{errors.aliexpress_url.message}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full h-12 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 mt-4"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Save className="w-5 h-5 ml-2" />
                  حفظ المنتج
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
