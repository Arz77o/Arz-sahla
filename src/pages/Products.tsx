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

  const categoryFilter = searchParams.get("category");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: catData } = await supabase.from("categories").select("*");
      if (catData) setCategories(catData);

      let query = supabase
        .from("products")
        .select("*, categories!inner(slug)")
        .eq("is_published", true)
        .eq("auto_hidden", false);

      if (categoryFilter) {
        query = query.eq("categories.slug", categoryFilter);
      }

      const { data: prodData } = await query;
      if (prodData) setProducts(prodData);

      setLoading(false);
    };
    fetchData();
  }, [categoryFilter]);

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

              <h3 className="font-bold text-lg mb-4">الشارات</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => updateFilter("badge", null)}
                    className={`text-sm ${!badgeFilter ? "font-bold text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
                  >
                    الكل
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => updateFilter("badge", "brand")}
                    className={`text-sm ${badgeFilter === "brand" ? "font-bold text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
                  >
                    Brand
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => updateFilter("badge", "choice")}
                    className={`text-sm ${badgeFilter === "choice" ? "font-bold text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
                  >
                    Choice
                  </button>
                </li>
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
                <p className="text-gray-500">لا توجد منتجات تطابق بحثك.</p>
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
