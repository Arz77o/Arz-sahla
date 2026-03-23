import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { Button } from '../../components/ui/button';
import type { Database } from '../../types/database.types';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { 
  useCategories, 
  useDeleteCategory, 
  useUpdateCategory, 
  useCreateCategory 
} from '../../hooks/useCategories';

type Category = Database['public']['Tables']['categories']['Row'];

export default function AdminCategories() {
  const { data: categories = [], isLoading: loading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const updateMutation = useUpdateCategory();
  const createMutation = useCreateCategory();
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');

  const handleEdit = (cat: Category) => {
    setIsEditing(true);
    setEditId(cat.id);
    setNameAr(cat.name_ar);
    setNameEn(cat.name_en);
    setSlug(cat.slug);
    setIcon(cat.icon || '');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditId(null);
    setNameAr('');
    setNameEn('');
    setSlug('');
    setIcon('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع المنتجات المرتبطة بها!')) return;
    deleteMutation.mutate(id);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr || !nameEn || !slug) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    const categoryData = {
      name_ar: nameAr,
      name_en: nameEn,
      slug,
      icon: icon || null,
      parent_id: null,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, ...categoryData }, {
        onSuccess: () => handleCancel()
      });
    } else {
      createMutation.mutate(categoryData, {
        onSuccess: () => handleCancel()
      });
    }
  };

  const isSaving = updateMutation.isPending || createMutation.isPending;

  return (
    <>
      <SEOMeta title="إدارة الفئات | الإدارة" />
      
      <AdminPageHeader
        title="الفئات / Categories"
        subtitle="إدارة فئات المنتجات"
        kicker="CATEGORY SYSTEM"
        actions={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700 font-bold px-6">
              <Plus className="w-5 h-5 ml-2" />
              إضافة فئة جديدة / New Category
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        {isEditing && (
          <div className="lg:col-span-1">
            <form onSubmit={handleSave} className="bg-white p-6 border border-surface-high space-y-4 sticky top-24">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {editId ? 'تعديل فئة' : 'إضافة فئة جديدة'}
                </h2>
                <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الاسم (عربي) *</label>
                <input 
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الاسم (إنجليزي) *</label>
                <input 
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">الرابط (Slug) *</label>
                <input 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  dir="ltr"
                  placeholder="e.g. electronics"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">أيقونة (Lucide Icon Name)</label>
                <input 
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  dir="ltr"
                  placeholder="e.g. Smartphone"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-12 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 mt-4"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Save className="w-5 h-5 ml-2" />
                    حفظ الفئة
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* List */}
        <div className={isEditing ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white border border-surface-high overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الرابط (Slug)</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الأيقونة</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        لا توجد فئات حالياً
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cat.name_ar}</div>
                          <div className="text-xs text-gray-500" dir="ltr">{cat.name_en}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500" dir="ltr">
                          {cat.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500" dir="ltr">
                          {cat.icon || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-50">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(cat.id)}
                              className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
