import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOMeta } from "../components/shared/SEOMeta";
import { ProductCard } from "../components/store/ProductCard";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

export default function Products() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitialized = React.useRef(false);

  const categoryFilter = searchParams.get("category");

  // Fetch categories once on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const loadCategories = async () => {
      try {
        const { data, error: err } = await supabase
          .from("categories")
          .select("*");
        
        if (err) {
          console.error("Categories error:", err);
        } else {
          setCategories(data || []);
        }
      } catch (err) {
        console.error("Categories exception:", err);
      }
    };

    loadCategories();
  }, []);

  // Fetch products when filter changes
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from("products")
          .select("*")
          .eq("is_published", true)
          .eq("auto_hidden", false);

        // Apply category filter if set
        if (categoryFilter && categories.length > 0) {
          const category = categories.find(c => c.slug === categoryFilter);
          if (category) {
            query = query.eq("category_id", category.id);
          } else {
            setProducts([]);
            setLoading(false);
            return;
          }
        }

        const { data, error: err } = await query;

        if (err) {
          console.error("Products error:", err);
          setError(err.message);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } catch (err: any) {
        console.error("Products exception:", err);
        setError(err?.message || "Unknown error");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categoryFilter, categories]);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <>
      <SEOMeta title={t("nav.products")} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
              <h3 className="font-bold text-lg mb-4">الفئات</h3>
              <ul className="space-y-2 mb-8">
                <li>
                  <button
                    onClick={() => updateFilter("category", null)}
                    className={`text-sm ${!categoryFilter ? "font-bold text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
                  >
                    الكل
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => updateFilter("category", cat.slug)}
                      className={`text-sm ${categoryFilter === cat.slug ? "font-bold text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
                    >
                      {isAr ? cat.name_ar : cat.name_en}
                    </button>
                  </li>
                ))}
              </ul>


            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("nav.products")}
              </h1>
              <span className="text-sm text-gray-500">
                {products.length} منتج
              </span>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <p className="font-semibold">خطأ</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">لا توجد منتجات</p>
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-4 text-blue-600 font-medium hover:underline"
                >
                  مسح الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
