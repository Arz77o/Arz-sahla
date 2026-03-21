import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Loader2,
  Save,
  ArrowRight,
  Image as ImageIcon,
  X,
  Star,
  Eye,
  DollarSign,
  Package,
  Tag,
  Link as LinkIcon,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { SEOMeta } from "../../components/shared/SEOMeta";
import { supabaseAdmin } from "../../lib/supabase";
import { formatAdminPreview } from "../../lib/pricing";
import { Button } from "../../components/ui/button";

// ✅ No zodResolver — avoids all Zod v4 type inference conflicts.
// We validate manually in onSubmit instead.
interface ProductFormValues {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price_usd: number;
  price_dzd: number;
  price_chargily: number;
  stock_quantity: number;
  category_id: string;
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
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    images: [] as string[],
    imageUrl: "",
    isUploadingReviewImage: false,
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
      name_ar: "",
      name_en: "",
      description_ar: "",
      description_en: "",
      price_usd: 0,
      price_dzd: 0,
      price_chargily: 0,
      stock_quantity: 0,
      category_id: "",
      avg_rating: 5,
      is_published: false,
    },
  });

  const priceUsd = watch("price_usd");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: catData } = await supabaseAdmin
          .from("categories")
          .select("*");
        if (catData) setCategories(catData);

        if (isEdit) {
          const { data: prodData, error } = await supabaseAdmin
            .from("products")
            .select("*, reviews(*)")
            .eq("id", id)
            .single();

          if (error || !prodData) {
            toast.error("المنتج غير موجود");
            navigate("/admin/products");
            return;
          }

          const productData = prodData as any;
          reset({
            name_ar: productData.name_ar || "",
            name_en: productData.name_en || "",
            description_ar: productData.description_ar || "",
            description_en: productData.description_en || "",
            price_usd: productData.price_usd || 0,
            price_dzd: productData.price_dzd || 0,
            price_chargily: productData.price_chargily || 0,
            stock_quantity: productData.stock_quantity || 0,
            category_id: productData.category_id || "",
            avg_rating: productData.avg_rating ?? 5,
            is_published: productData.is_published ?? false,
          });
          setImages(productData.images || []);
          setProductReviews(productData.reviews || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit, reset, navigate]);

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setImages([...images, imageUrlInput.trim()]);
    setImageUrlInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("products").getPublicUrl(filePath);

      setImages([...images, publicUrl]);
      toast.success("تم رفع الصورة بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل رفع الصورة");
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
      setError("name_ar", { message: "الاسم (عربي) مطلوب" });
      hasError = true;
    }
    if (!data.name_en || data.name_en.trim().length < 1) {
      setError("name_en", { message: "الاسم (إنجليزي) مطلوب" });
      hasError = true;
    }
    if (!data.category_id) {
      setError("category_id", { message: "الفئة مطلوبة" });
      hasError = true;
    }
    const price = Number(data.price_usd);
    if (!price || price <= 0) {
      setError("price_usd", { message: "السعر يجب أن يكون أكبر من 0" });
      hasError = true;
    }
    const rating = Number(data.avg_rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      setError("avg_rating", { message: "التقييم يجب أن يكون بين 0 و 5" });
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
        price_chargily: Number(data.price_chargily),
        stock_quantity: Number(data.stock_quantity),
        category_id: data.category_id || null,
        avg_rating: Number(data.avg_rating),
        is_published: data.is_published,
        images: images,
      };

      if (isEdit) {
        const { error } = await (supabaseAdmin as any)
          .from("products")
          .update(dbPayload)
          .eq("id", id);
        if (error) throw error;
        toast.success("تم تحديث المنتج بنجاح");
      } else {
        const { error } = await (supabaseAdmin as any)
          .from("products")
          .insert(dbPayload);
        if (error) throw error;
        toast.success("تم إضافة المنتج بنجاح");
        navigate("/admin/products");
      }
    } catch (error: any) {
      toast.error(error.message || "فشل حفظ المنتج");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReview = async () => {
    if (!newReview.comment.trim()) {
      toast.error("يرجى كتابة تعليق");
      return;
    }
    setIsAddingReview(true);
    try {
      const { data, error } = await (supabaseAdmin as any)
        .from("reviews")
        .insert({
          product_id: id,
          rating: newReview.rating,
          comment: newReview.comment,
          images: newReview.images,
          user_id: (await supabaseAdmin.auth.getUser()).data.user?.id, // Admin themselves or mock user
        })
        .select()
        .single();

      if (error) throw error;
      setProductReviews([data, ...productReviews]);
      setNewReview({
        rating: 5,
        comment: "",
        images: [],
        imageUrl: "",
        isUploadingReviewImage: false,
      });
      toast.success("تم إضافة التقييم بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة التقييم");
    } finally {
      setIsAddingReview(false);
    }
  };

  const handleReviewImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewReview((prev) => ({ ...prev, isUploadingReviewImage: true }));
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `review_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("products") // Using products bucket or creating reviews bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from("products").getPublicUrl(filePath);

      setNewReview((prev) => ({
        ...prev,
        images: [...prev.images, publicUrl],
        isUploadingReviewImage: false,
      }));
      toast.success("تم رفع صورة التقييم");
    } catch (error: any) {
      toast.error(error.message || "فشل رفع الصورة");
      setNewReview((prev) => ({ ...prev, isUploadingReviewImage: false }));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("حذف هذا التقييم؟")) return;
    try {
      const { error } = await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("id", reviewId);
      if (error) throw error;
      setProductReviews(productReviews.filter((r) => r.id !== reviewId));
      toast.success("تم حذف التقييم");
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
      <SEOMeta
        title={isEdit ? "تعديل منتج | الإدارة" : "إضافة منتج | الإدارة"}
      />

      <div className="mb-8 flex items-center gap-3">
        <Link
          to="/admin/products"
          className="text-gray-500 hover:text-gray-900"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "تعديل منتج" : "إضافة منتج جديد"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
      >
        {/* ── Main Info Column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" />
              المعلومات الأساسية
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  الاسم (عربي) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name_ar")}
                  placeholder="مثال: سماعة بلوتوث لاسلكية"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.name_ar ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                />
                {errors.name_ar && (
                  <p className="text-red-500 text-xs">
                    {errors.name_ar.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  الاسم (إنجليزي) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name_en")}
                  placeholder="e.g. Wireless Bluetooth Headphones"
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.name_en ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                  dir="ltr"
                />
                {errors.name_en && (
                  <p className="text-red-500 text-xs">
                    {errors.name_en.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                الوصف (عربي)
              </label>
              <textarea
                {...register("description_ar")}
                rows={4}
                placeholder="اكتب وصفًا تفصيليًا للمنتج يظهر للعملاء..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                الوصف (إنجليزي)
              </label>
              <textarea
                {...register("description_en")}
                rows={4}
                placeholder="Write a detailed product description in English..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                dir="ltr"
              />
            </div>

            {/* Category */}
            <div className="pt-4 border-t border-gray-100 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  الفئة <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("category_id")}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${errors.category_id ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                >
                  <option value="">اختر الفئة...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_ar}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-red-500 text-xs">
                    {errors.category_id.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              الصور ({images.length} صورة)
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="رابط الصورة (https://...)"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2.5 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors"
                >
                  إضافة رابط
                </button>
              </div>

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400 px-2">أو</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      رفع صورة من جهازك
                    </>
                  )}
                </button>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-red-500/80 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                          رئيسية
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">لا توجد صور مضافة</p>
                  <p className="text-xs mt-1">
                    الصور الأولى ستظهر أولاً في المتجر
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              التسعير والمخزون
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
              💡 <strong>سعر البيع</strong> = السعر الذي يراه الزبون |{" "}
              <strong>سعر التكلفة</strong> = تكلفة المنتج من المورد
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price DZD */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  🛍️ سعر البيع <span className="text-red-500">*</span>
                </label>
                <div
                  dir="ltr"
                  className={`flex rounded-lg border-2 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${errors.price_dzd ? "border-red-500" : "border-gray-200"}`}
                >
                  <span className="flex items-center px-3 bg-blue-100 text-blue-700 text-sm font-bold">
                    DZD
                  </span>
                  <input
                    type="number"
                    {...register("price_dzd", { valueAsNumber: true })}
                    className="flex-1 px-3 py-2.5 outline-none font-bold text-lg text-blue-600 bg-white"
                    dir="ltr"
                  />
                </div>
                {errors.price_dzd && (
                  <p className="text-red-500 text-xs">
                    {errors.price_dzd.message}
                  </p>
                )}
              </div>

              {/* Price USD / Purchase Price */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  💰 سعر التكلفة
                </label>
                <div
                  dir="ltr"
                  className={`flex rounded-lg border-2 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${errors.price_usd ? "border-red-500" : "border-gray-200"}`}
                >
                  <span className="flex items-center px-3 bg-amber-100 text-amber-700 text-sm font-bold">
                    DZD
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price_usd", { valueAsNumber: true })}
                    className="flex-1 px-3 py-2.5 outline-none bg-white"
                    dir="ltr"
                  />
                </div>
                {errors.price_usd && (
                  <p className="text-red-500 text-xs">
                    {errors.price_usd.message}
                  </p>
                )}
              </div>

              {/* Price Chargily */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  ⚡ سعر Chargily
                </label>
                <div
                  dir="ltr"
                  className={`flex rounded-lg border-2 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${errors.price_chargily ? "border-red-500" : "border-gray-200"}`}
                >
                  <span className="flex items-center px-3 bg-green-100 text-green-700 text-sm font-bold">
                    DZD
                  </span>
                  <input
                    type="number"
                    {...register("price_chargily", { valueAsNumber: true })}
                    className="flex-1 px-3 py-2.5 outline-none font-bold text-lg text-green-600 bg-white"
                    dir="ltr"
                  />
                </div>
                {errors.price_chargily && (
                  <p className="text-red-500 text-xs">
                    {errors.price_chargily?.message as string}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 mt-1">
                  💡 اتركه 0 إذا كنت لا تريد تقديم خصم خاص بـ Chargily
                </p>
              </div>

              {/* Stock Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  الكمية المتوفرة <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register("stock_quantity", { valueAsNumber: true })}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  dir="ltr"
                />
                {errors.stock_quantity && (
                  <p className="text-red-500 text-xs">
                    {errors.stock_quantity.message}
                  </p>
                )}
              </div>
            </div>

            {priceUsd > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <CheckCircle2 className="w-4 h-4 inline text-green-600 mr-1" />
                  <strong>الربح المتوقع:</strong>{" "}
                  {priceUsd > 0
                    ? `${(watch("price_dzd") - priceUsd).toLocaleString()} DZD`
                    : "بدون حساب"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar Column ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Preview */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              معاينة المنتج
            </h2>

            <div className="space-y-4">
              {images.length > 0 ? (
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md">
                  <img
                    src={images[0]}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                </div>
              )}

              <div>
                <h3 className="font-bold text-base text-gray-900 line-clamp-2">
                  {watch("name_ar") || "اسم المنتج"}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {watch("description_ar") || "سيظهر الوصف هنا..."}
                </p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-600">
                  {watch("price_dzd") || "0"} DZD
                </span>
              </div>

              {watch("avg_rating") > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(watch("avg_rating")) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                    />
                  ))}
                  <span className="text-gray-600 text-xs ml-1">
                    ({watch("avg_rating")})
                  </span>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
                ✓ المخزون المتاح: {watch("stock_quantity") || 0}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3">
              الإعدادات
            </h2>

            {/* Publish toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">حالة النشر</p>
                <p className="text-xs text-gray-500">
                  هل يظهر المنتج في المتجر؟
                </p>
              </div>
              <input
                type="checkbox"
                id="is_published"
                {...register("is_published")}
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
              />
            </div>

            {/* Rating ⭐ */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                التقييم (0 - 5)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                {...register("avg_rating", { valueAsNumber: true })}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-amber-400 outline-none font-bold ${errors.avg_rating ? "border-red-500 bg-red-50" : "border-gray-200"}`}
                dir="ltr"
              />
              {errors.avg_rating && (
                <p className="text-red-500 text-xs">
                  {errors.avg_rating.message}
                </p>
              )}
              <p className="text-xs text-gray-400">مثال: 4.7 أو 5</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-12 text-base font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  حفظ المنتج
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── Reviews Management Section ── */}
      {isEdit && (
        <div className="mt-12 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 italic">
              آراء وتقييمات العملاء (Reviews)
            </h2>
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
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      التقييم (1-5)
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setNewReview({ ...newReview, rating: star })
                          }
                          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${newReview.rating >= star
                            ? "bg-amber-100 text-amber-600"
                            : "bg-gray-100 text-gray-400"
                            }`}
                        >
                          <Star
                            className={`w-4 h-4 ${newReview.rating >= star ? "fill-current" : ""}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      التعليق
                    </label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) =>
                        setNewReview({ ...newReview, comment: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                      placeholder="اكتب التقييم هنا..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">
                      صور التقييم (رابط أو رفع ملف)
                    </label>
                    <div className="flex gap-1 mb-2">
                      <input
                        type="url"
                        value={newReview.imageUrl}
                        onChange={(e) =>
                          setNewReview({
                            ...newReview,
                            imageUrl: e.target.value,
                          })
                        }
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        placeholder="رابط الصورة..."
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
                            imageUrl: "",
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
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={newReview.isUploadingReviewImage}
                        >
                          {newReview.isUploadingReviewImage ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ImageIcon className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {newReview.images.map((img, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-md overflow-hidden bg-gray-100 group"
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNewReview({
                                ...newReview,
                                images: newReview.images.filter(
                                  (_, idx) => idx !== i,
                                ),
                              })
                            }
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
                    {isAddingReview ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "نشر التقييم في المتجر"
                    )}
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
                  <div
                    key={review.id}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                          {review.full_name?.[0] || "U"}
                        </div>
                        <div>
                          <div className="flex gap-1 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-900 font-medium text-sm">
                            {review.comment}
                          </p>
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
                          <div
                            key={i}
                            className="w-16 h-16 rounded-lg overflow-hidden border border-gray-100"
                          >
                            <img
                              src={img}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 text-[10px] text-gray-400 font-mono italic">
                      ID: {review.id} | Date:{" "}
                      {new Date(review.created_at).toLocaleDateString()}
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
