import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Loader2, Star } from 'lucide-react';
import { SEOMeta } from '../../components/shared/SEOMeta';
import { formatDZD } from '../../lib/pricing';
import { Button } from '../../components/ui/button';
import { useProducts, useDeleteProduct } from '../../hooks/useProducts';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

export default function AdminProducts() {

  const { data: products = [], isLoading: loading } = useProducts(undefined, true);
  const deleteMutation = useDeleteProduct();

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    deleteMutation.mutate(id);
  };

  return (
    <>
      <SEOMeta title="إدارة المنتجات | الإدارة" />

      <AdminPageHeader
        title="المنتجات / Products"
        subtitle="إضافة وتعديل وحذف المنتجات"
        kicker="PRODUCT CATALOG"
        actions={
          <Link to="/admin/products/new">
            <Button className="bg-blue-600 hover:bg-blue-700 font-bold px-6">
              <Plus className="w-5 h-5 ml-2" />
              إضافة منتج جديد / New Product
            </Button>
          </Link>
        }
      />

      <div className="bg-white border border-surface-high overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الصورة</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-nowrap">سعر التكلفة</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-nowrap">سعر البيع</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">المخزون</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">التقييم</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    لا توجد منتجات حالياً
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={product.images?.[0] || 'https://picsum.photos/seed/sahla/100/100'} alt="" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-[200px]" title={product.name_ar}>
                        {product.name_ar}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.categories?.name_ar || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500" dir="ltr">
                      {formatDZD(product.price_dzd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600" dir="ltr">
                      {formatDZD(product.price_chargily || product.price_dzd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${(product.stock_quantity ?? 0) <= 0 ? 'bg-red-100 text-red-800' :
                          (product.stock_quantity ?? 0) < 5 ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                        {product.stock_quantity ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{(Number(product.avg_rating) || 0).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {product.is_published ? 'منشور' : 'مسودة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link to={`/admin/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-900 hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
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
    </>
  );
}
