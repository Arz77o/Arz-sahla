import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, Save, ArrowRight, Image as ImageIcon, X, Star } from 'lucide-react';
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
  price_dzd: number;
  stock_quantity: number;
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
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    images: [] as string[],
    imageUrl: '',
    isUploadingReviewImage: false
  });

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
      price_dzd: 0,
      stock_quantity: 0,
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
            .select('*, reviews(*)')
            .eq('id', id)
            .single();

          if (error || !prodData) {
            toast.error('المنتج غير موجود');
            navigate('/admin/products');
            return;
          }

          const productData = prodData as any;
          reset({
            name_ar: productData.name_ar || '',
            name_en: productData.name_en || '',
            description_ar: productData.description_ar || '',
            description_en: productData.description_en || '',
            price_usd: productData.price_usd || 0,
            price_dzd: productData.price_dzd || 0,
            stock_quantity: productData.stock_quantity || 0,
            aliexpress_url: productData.aliexpress_url || '',
            category_id: productData.category_id || '',
            product_badge: productData.product_badge || '',
            avg_rating: productData.avg_rating ?? 5,
            is_published: productData.is_published ?? false,
          });
          setImages(productData.images || []);
          setProductReviews(productData.reviews || []);
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
        price_dzd: Number(data.price_dzd),
        stock_quantity: Number(data.stock_quantity),
        aliexpress_url: data.aliexpress_url?.trim() || null,
        category_id: data.category_id || null,
        product_badge: (data.product_badge as 'brand' | 'choice') || null,
        avg_rating: Number(data.avg_rating),
        is_published: data.is_published,
        images: images,
      };

      if (isEdit) {
        const { error } = await (supabaseAdmin as any)
          .from('products')
          .update(dbPayload)
          .eq('id', id);
        if (error) throw error;
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        const { error } = await (supabaseAdmin as any)
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

  const handleAddReview = async () => {
    if (!newReview.comment.trim()) {
      toast.error('يرجى كتابة تعليق');
      return;
    }
    setIsAddingReview(true);
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from('reviews')
        .insert({
          product_id: id,
          rating: newReview.rating,
          comment: newReview.comment,
          images: newReview.images,
          user_id: (await supabaseAdmin.auth.getUser()).data.user?.id // Admin themselves or mock user
        })
        .select()
        .single();

      if (error) throw error;
      setProductReviews([data, ...productReviews]);
      setNewReview({ rating: 5, comment: '', images: [], imageUrl: '', isUploadingReviewImage: false });
      toast.success('تم إضافة التقييم بنجاح');
    } catch (error: any) {
      toast.error(error.message || 'فشل إضافة التقييم');
    } finally {
      setIsAddingReview(false);
    }
  };

  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewReview(prev => ({ ...prev, isUploadingReviewImage: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `review_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('products') // Using products bucket or creating reviews bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('products')
        .getPublicUrl(filePath);

      setNewReview(prev => ({
        ...prev,
        images: [...prev.images, publicUrl],
        isUploadingReviewImage: false
      }));
      toast.success('تم رفع صورة التقييم');
    } catch (error: any) {
      toast.error(error.message || 'فشل رفع الصورة');
      setNewReview(prev => ({ ...prev, isUploadingReviewImage: false }));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('حذف هذا التقييم؟')) return;
    try {
      const { error } = await supabaseAdmin.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      setProductReviews(productReviews.filter(r => r.id !== reviewId));
      toast.success('تم حذف التقييم');
    } catch (error: any) {
      toast.error(error.message);
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

            {/* Category */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
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

          {/* Pricing & Stock */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">التسعير والمخزون</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price DZD */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">سعر البيع (DZD) *</label>
                <div dir="ltr" className={`flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${errors.price_dzd ? 'border-red-500' : 'border-gray-200'}`}>
                  <span className="flex items-center px-3 bg-gray-100 text-gray-500 text-sm font-bold border-l">DZD</span>
                  <input
                    type="number"
                    {...register('price_dzd', { valueAsNumber: true })}
                    className="flex-1 px-3 py-2.5 outline-none font-bold text-lg text-blue-600 bg-white"
                    dir="ltr"
                  />
                </div>
                {errors.price_dzd && <p className="text-red-500 text-xs">{errors.price_dzd.message}</p>}
              </div>

              {/* Price USD / Purchase Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">سعر الشراء (DZD)</label>
                <div dir="ltr" className={`flex rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${errors.price_usd ? 'border-red-500' : 'border-gray-200'}`}>
                  <span className="flex items-center px-3 bg-gray-100 text-gray-500 text-sm font-bold border-l">DZD</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('price_usd', { valueAsNumber: true })}
                    className="flex-1 px-3 py-2.5 outline-none bg-white"
                    dir="ltr"
                  />
                </div>
                {errors.price_usd && <p className="text-red-500 text-xs">{errors.price_usd.message}</p>}
              </div>

              {/* Stock Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الكمية المتوفرة *</label>
                <input
                  type="number"
                  {...register('stock_quantity', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.stock_quantity ? 'border-red-500' : 'border-gray-200'}`}
                  dir="ltr"
                />
                {errors.stock_quantity && <p className="text-red-500 text-xs">{errors.stock_quantity.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar Column ── */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 sticky top-24">

            {/* Publish toggle */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">حالة النشر</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="is_published">
                  مرئي للزبائن
                </label>
                <input
                  type="checkbox"
                  id="is_published"
                  {...register('is_published')}
                  className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
              </div>
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

      {/* ── Reviews Management Section ── */}
      {isEdit && (
        <div className="mt-12 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 italic">آراء وتقييمات العملاء (Reviews)</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{productReviews.length} تقييم مضاف</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Add New Review Form */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm space-y-4 sticky top-24">
                <h3 className="font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  إضافة تقييم جديد
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">التقييم (1-5)</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button 
                          key={star}
                          type="button"
                          onClick={() => setNewReview({...newReview, rating: star})}
                          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                            newReview.rating >= star ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${newReview.rating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">التعليق</label>
                    <textarea 
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                      placeholder="اكتب التقييم هنا..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">صور التقييم (رابط أو رفع ملف)</label>
                    <div className="flex gap-1 mb-2">
                      <input 
                        type="url"
                        value={newReview.imageUrl}
                        onChange={(e) => setNewReview({...newReview, imageUrl: e.target.value})}
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        placeholder="رابط AliExpress..."
                        dir="ltr"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="secondary"
                        onClick={() => {
                          if (!newReview.imageUrl) return;
                          setNewReview({
                            ...newReview,
                            images: [...newReview.images, newReview.imageUrl],
                            imageUrl: ''
                          });
                        }}
                      >
                        أضف
                      </Button>
                      <div className="relative">
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleReviewImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={newReview.isUploadingReviewImage}
                        />
                        <Button type="button" size="sm" variant="outline" disabled={newReview.isUploadingReviewImage}>
                          {newReview.isUploadingReviewImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      {newReview.images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setNewReview({
                              ...newReview,
                              images: newReview.images.filter((_, idx) => idx !== i)
                            })}
                            className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                    onClick={handleAddReview}
                    disabled={isAddingReview || !newReview.comment}
                  >
                    {isAddingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'نشر التقييم في المتجر'}
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Reviews */}
            <div className="lg:col-span-2 space-y-4">
              {productReviews.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-12 text-center text-gray-400">
                  لا توجد تقييمات مضافة لهذا المنتج حتى الآن.
                </div>
              ) : (
                productReviews.map((review) => (
                  <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                          {review.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="flex gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <p className="text-gray-900 font-medium text-sm">{review.comment}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {review.images.map((img: string, i: number) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100">
                            <img src={img} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 text-[10px] text-gray-400 font-mono italic">
                      ID: {review.id} | Date: {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
