import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, Save, ArrowRight, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { supabaseAdmin } from '../../lib/supabase';
import { formatAdminPreview } from '../../lib/pricing';
import { Button } from '../../components/ui/button';

// ✅ No zodResolver — avoids all Zod v4 type inference conflicts.
// We validate manually in onSubmit instead.
interface ProductFormValues {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price_usd: number;
  aliexpress_url: string;
  category_id: string;
  product_badge: string;
  avg_rating: number;
  is_published: boolean;
}

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ✅ useForm<ProductFormValues> without zodResolver — no type conflicts
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
    setError,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      price_usd: 0,
      category_id: '',
      product_badge: '',
      aliexpress_url: '',
      avg_rating: 5,
      is_published: false,
    },
  });

  const priceUsd = watch('price_usd');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: catData } = await supabaseAdmin.from('categories').select('*');
        if (catData) setCategories(catData);

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
            name_ar: prodData.name_ar || '',
            name_en: prodData.name_en || '',
            description_ar: prodData.description_ar || '',
            description_en: prodData.description_en || '',
            price_usd: prodData.price_usd || 0,
            aliexpress_url: prodData.aliexpress_url || '',
            category_id: prodData.category_id || '',
            product_badge: prodData.product_badge || '',
            avg_rating: prodData.avg_rating ?? 5,
            is_published: prodData.is_published ?? false,
          });
          setImages(prodData.images || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit, reset, navigate]);

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

  // ✅ Manual validation — cleaner than fighting Zod v4 type incompatibilities
  const onSubmit = async (data: ProductFormValues) => {
    // Manual validation
    let hasError = false;
    if (!data.name_ar || data.name_ar.trim().length < 1) {
      setError('name_ar', { message: 'الاسم (عربي) مطلوب' });
      hasError = true;
    }
    if (!data.name_en || data.name_en.trim().length < 1) {
      setError('name_en', { message: 'الاسم (إنجليزي) مطلوب' });
      hasError = true;
    }
    if (!data.category_id) {
      setError('category_id', { message: 'الفئة مطلوبة' });
      hasError = true;
    }
    const price = Number(data.price_usd);
    if (!price || price <= 0) {
      setError('price_usd', { message: 'السعر يجب أن يكون أكبر من 0' });
      hasError = true;
    }
    const rating = Number(data.avg_rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      setError('avg_rating', { message: 'التقييم يجب أن يكون بين 0 و 5' });
      hasError = true;
    }
    if (hasError) return;

    setIsSaving(true);
    try {
      const dbPayload = {
        name_ar: data.name_ar.trim(),
        name_en: data.name_en.trim(),
        description_ar: data.description_ar?.trim() || null,
        description_en: data.description_en?.trim() || null,
        price_usd: Number(data.price_usd),
        aliexpress_url: data.aliexpress_url?.trim() || null,
        category_id: data.category_id || null,
        product_badge: (data.product_badge as 'brand' | 'choice') || null,
        avg_rating: Number(data.avg_rating),
        is_published: data.is_published,
        images: images,
      };

      if (isEdit) {
        const { error } = await supabaseAdmin
          .from('products')
          .update(dbPayload)
          .eq('id', id);
        if (error) throw error;
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const { error } = await supabaseAdmin
          .from('products')
          .insert(dbPayload);
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

        {/* ── Main Info Column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
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

          {/* Images */}
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
                    {isUploading
                      ? <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      : <ImageIcon className="w-4 h-4 ml-2" />}
                    رفع صورة
                  </Button>
                </div>
              </div>

              {images.length > 0 ? (
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
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>لا توجد صور مضافة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar Column ── */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 sticky top-24">

            {/* Publish toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">النشر والتسعير</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="is_published">
                  منشور
                </label>
                <input
                  type="checkbox"
                  id="is_published"
                  {...register('is_published')}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Price */}
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

            {/* Category */}
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

            {/* Badge */}
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

            {/* Rating ⭐ */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">⭐ تقييم المنتج (0 - 5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                {...register('avg_rating', { valueAsNumber: true })}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-yellow-400 outline-none font-mono ${errors.avg_rating ? 'border-red-500' : 'border-gray-200'}`}
                dir="ltr"
              />
              {errors.avg_rating && <p className="text-red-500 text-xs">{errors.avg_rating.message}</p>}
              <p className="text-xs text-gray-400">ادخل قيمة من 0 إلى 5، مثال: 4.7</p>
            </div>

            {/* AliExpress URL */}
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

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-12 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 mt-4"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
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
