-- شرح بسيط: 
-- نضيف حقول جديدة للـ reviews table:
-- 1. status: حالة التقييم (pending = منتظر, approved = مقبول, rejected = مرفوض)
-- 2. admin_note: ملاحظات الـ admin (ليش رفض التقييم مثلاً)
-- 3. full_name: اسم العميل الكامل
-- 4. images: صور التقييم (JSON array)

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS images JSONB;

-- إنشاء index للبحث السريع على الـ status
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
