import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X, Star, Loader2, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import {
  usePendingReviews,
  useApproveReview,
  useRejectReview,
  useDeleteApprovedReview,
  useAllReviews,
} from "../../hooks/useReviewsModeration";

// شرح بسيط:
// هذه الصفحة تظهر التقييمات قيد المراجعة وتلك الموافق عليها
// الـ Admin على يستطيع (قبول أو رفض أو حذف) التقييمات

export default function AdminReviews() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  
  const { data: pendingReviews = [], isLoading: isPendingLoading } = usePendingReviews();
  const { data: approvedReviews = [], isLoading: isApprovedLoading } = useAllReviews("approved");
  
  const approveReview = useApproveReview();
  const rejectReview = useRejectReview();
  const deleteReview = useDeleteApprovedReview();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleApprove = (reviewId: string) => {
    approveReview.mutate(reviewId);
  };

  const handleReject = (reviewId: string) => {
    if (!rejectReason.trim()) return;
    rejectReview.mutate({ reviewId, reason: rejectReason });
    setRejectingId(null);
    setRejectReason("");
  };

  const handleDelete = (reviewId: string) => {
    deleteReview.mutate(reviewId);
    setDeletingId(null);
  };


  return (
    <div>
      <AdminPageHeader title="إدارة التقييمات" subtitle="مراجعة وقبول/رفض حذف تقييمات العملاء" />

      <div className="container mx-auto px-4 py-8">
        {/* التابات */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "pending"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ⏳ التقييمات قيد المراجعة ({pendingReviews.length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "approved"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ✓ التقييمات الموافق عليها ({approvedReviews.length})
          </button>
        </div>

        {/* التقييمات قيد المراجعة */}
        {activeTab === "pending" && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 font-semibold">
                📊 عدد التقييمات قيد المراجعة: <span className="text-2xl font-bold">{pendingReviews.length}</span>
              </p>
            </div>

            {isPendingLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pendingReviews.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <p className="text-green-900 text-lg font-semibold">✓ رائع! لا توجد تقييمات قيد المراجعة</p>
                <p className="text-green-700 mt-2">جميع التقييمات تمت مراجعتها بالفعل</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* رأس التقييم */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{review.products?.name_ar || review.product_id}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500">👤 العميل: {review.full_name || review.user_id}</p>
                          {review.has_purchased ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                              ✅ اشترى المنتج
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                              ⚠️ لم يشتر
                            </span>
                          )}
                        </div>
                      </div>
                      {/* النجوم */}
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* التعليق */}
                    <div className="bg-gray-50 rounded p-4 mb-4">
                      <p className="text-gray-700">{review.comment || "بدون تعليق"}</p>
                    </div>

                    {/* عرض الصور */}
                    {review.images && review.images.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">📸 الصور المرفقة ({review.images.length}/3)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {review.images.map((image: string, i: number) => (
                            <div key={i} className="relative group">
                              <img
                                src={image}
                                alt={`صورة ${i + 1}`}
                                className="w-full h-24 object-cover rounded border border-gray-300 hover:shadow-md transition-shadow"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">صورة {i + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* التاريخ */}
                    <p className="text-xs text-gray-400 mb-4">
                      {new Date(review.created_at).toLocaleDateString("ar-DZ")}
                    </p>

                    {/* الأزرار الأساسية */}
                    <div className="flex gap-3 mb-4">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(review.id)}
                        disabled={approveReview.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        قبول ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectingId(review.id)}
                        disabled={rejectReview.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        رفض ✗
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                      >
                        {expandedId === review.id ? "إخفاء الخيارات" : "خيارات أخرى"}
                      </Button>
                    </div>

                    {/* نموذج الرفض */}
                    {rejectingId === review.id && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5 mb-4 animate-in fade-in">
                        <label className="block text-sm font-bold text-red-900 mb-3">
                          🛑 السبب (لماذا تحذف هذا التقييم؟)
                        </label>
                        <textarea
                          autoFocus
                          placeholder="اكتب هنا... مثال: تعليق مسيء ❌ | إعلان غير مناسب 📢 | معلومات خاطئة ⚠️"
                          className="w-full px-4 py-3 border-2 border-red-200 rounded-lg resize-vertical focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-300 bg-white text-gray-900 placeholder-gray-500 font-medium"
                          rows={4}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <p className="text-xs text-red-700 mt-2 mb-3">💡 الملاحظة ستُحفظ وقد تراسل للعميل (اختياري)</p>
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => handleReject(review.id)}
                            className="bg-red-600 hover:bg-red-700 font-bold flex-1"
                          >
                            ✓ تأكيد الرفض
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 hover:bg-red-50"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                          >
                            ✕ إلغاء
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* خيارات إضافية */}
                    {expandedId === review.id && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-in fade-in">
                        <p className="text-sm font-semibold text-blue-900 mb-3">تفاصيل التقييم:</p>
                        <div className="space-y-2 text-sm text-blue-800">
                          <div><strong>معرف التقييم:</strong> {review.id}</div>
                          <div><strong>معرف المنتج:</strong> {review.product_id}</div>
                          <div><strong>معرف المستخدم:</strong> {review.user_id}</div>
                          <div><strong>الحالة الحالية:</strong> {review.status}</div>
                          {review.admin_note && (
                            <div><strong>ملاحظات سابقة:</strong> {review.admin_note}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* التقييمات الموافق عليها */}
        {activeTab === "approved" && (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-900 font-semibold">
                ✓ عدد التقييمات الموافق عليها: <span className="text-2xl font-bold">{approvedReviews.length}</span>
              </p>
            </div>

            {isApprovedLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : approvedReviews.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-900 text-lg font-semibold">لا توجد تقييمات موافق عليها</p>
                <p className="text-gray-600 mt-2">التقييمات ستظهر هنا بعد قبولها من قبل الـ Admin</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedReviews.map((review: any) => (
                  <div
                    key={review.id}
                    className="bg-white border border-green-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* رأس التقييم */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{review.products?.name_ar || review.product_id}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500">👤 العميل: {review.full_name || review.user_id}</p>
                          {review.has_purchased ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                              ✅ اشترى المنتج
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                              ⚠️ لم يشتر
                            </span>
                          )}
                        </div>
                      </div>
                      {/* النجوم */}
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* التعليق */}
                    <div className="bg-gray-50 rounded p-4 mb-4">
                      <p className="text-gray-700">{review.comment || "بدون تعليق"}</p>
                    </div>

                    {/* عرض الصور */}
                    {review.images && review.images.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-600 mb-2">📸 الصور المرفقة ({review.images.length}/3)</p>
                        <div className="grid grid-cols-3 gap-2">
                          {review.images.map((image: string, i: number) => (
                            <div key={i} className="relative group">
                              <img
                                src={image}
                                alt={`صورة ${i + 1}`}
                                className="w-full h-24 object-cover rounded border border-gray-300 hover:shadow-md transition-shadow"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">صورة {i + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* التاريخ */}
                    <p className="text-xs text-gray-400 mb-4">
                      {new Date(review.created_at).toLocaleDateString("ar-DZ")}
                    </p>

                    {/* أزرار الحذف */}
                    {deletingId === review.id ? (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 animate-in fade-in">
                        <p className="text-sm font-bold text-red-900 mb-4">
                          ⚠️ هل أنت متأكد من رغبتك في حذف هذا التقييم؟ هذا الإجراء لا يمكن التراجع عنه.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => handleDelete(review.id)}
                            disabled={deleteReview.isPending}
                            className="bg-red-600 hover:bg-red-700 font-bold flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            نعم، احذفه الآن
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 hover:bg-red-50"
                            onClick={() => setDeletingId(null)}
                          >
                            ✕ إلغاء
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => setDeletingId(review.id)}
                        disabled={deleteReview.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        حذف التقييم
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
