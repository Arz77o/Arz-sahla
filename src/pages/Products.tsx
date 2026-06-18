import React from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOMeta } from "../components/shared/SEOMeta";
import { ProductCard } from "../components/store/ProductCard";
import { Filter, X, AlertTriangle } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";

// Skeleton card — exact same dimensions as ProductCard to prevent CLS
function ProductCardSkeleton() {
  return (
    <div className="block tonal-card overflow-hidden animate-pulse">
      {/* Image placeholder — aspect-square matches ProductCard */}
      <div className="aspect-square bg-surface-high" />
      {/* Info placeholder — h-44 matches ProductCard */}
      <div className="p-5 flex flex-col h-44">
        <div className="h-4 bg-surface-high rounded w-3/4 mb-2" />
        <div className="h-4 bg-surface-high rounded w-1/2 mb-2" />
        <div className="mt-auto pt-4 border-t border-surface-high">
          <div className="h-6 bg-surface-high rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [searchParams, setSearchParams] = useSearchParams();

  const categorySlug = searchParams.get("category");

  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();

  const selectedCategory = categories.find((c) => c.slug === categorySlug);
  const categoryId = categorySlug ? selectedCategory?.id : undefined;

  // Don't block products fetch waiting for categories:
  // if categorySlug exists but selectedCategory not resolved yet, pass undefined
  // (will refetch once categoryId resolves via queryKey change)
  const {
    data: products = [],
    isLoading: isProductsLoading,
    error: productsError,
  } = useProducts(categoryId);

  const loading = isProductsLoading;
  const error = productsError ? (productsError as any).message : null;

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
      <div className="bg-white min-h-screen">
        <div className="container mx-auto px-4 py-12 md:py-24">
          {/* Hero Section */}
          <div className="mb-16 md:mb-24 border-b border-surface-high pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <h1 className="text-6xl md:text-9xl font-display font-bold text-gray-900 tracking-tighter leading-none mb-6">
                  Catalog
                </h1>
                {/* Reserve space while loading to avoid CLS */}
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 min-h-[1em]">
                  {loading ? "\u00A0" : `${products.length} CURATED SMART SOLUTIONS`}
                </p>
              </div>
              <div className="flex gap-4">
                {categorySlug && (
                  <button
                    onClick={() => updateFilter("category", null)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary px-4 py-2 hover:bg-primary hover:text-white transition-all"
                  >
                    <X className="w-3 h-3" />
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-72 shrink-0">
              <div className="sticky top-24 space-y-12">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900 mb-8 flex items-center gap-3">
                    <Filter className="w-4 h-4 text-primary" />
                    Categories
                  </h3>
                  <div className="flex flex-col gap-px bg-surface-high border border-surface-high">
                    <button
                      onClick={() => updateFilter("category", null)}
                      className={`text-left p-6 transition-all text-[11px] font-bold uppercase tracking-widest ${
                        !categorySlug
                          ? "bg-primary text-white"
                          : "bg-white text-gray-500 hover:bg-surface-low hover:text-gray-900"
                      }`}
                    >
                      All Collections
                    </button>
                    {isCategoriesLoading
                      ? // Skeleton for categories sidebar
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="p-6 bg-white animate-pulse">
                            <div className="h-3 bg-surface-high rounded w-2/3" />
                          </div>
                        ))
                      : categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => updateFilter("category", cat.slug)}
                            className={`text-left p-6 transition-all text-[11px] font-bold uppercase tracking-widest ${
                              categorySlug === cat.slug
                                ? "bg-primary text-white"
                                : "bg-white text-gray-500 hover:bg-surface-low hover:text-gray-900"
                            }`}
                          >
                            {isAr ? cat.name_ar : cat.name_en}
                          </button>
                        ))}
                  </div>
                </div>

                <div className="p-8 bg-surface-low border border-surface-high">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    Our catalog is updated weekly with new innovative products focused on convenience
                    and smart utility.
                  </p>
                </div>
              </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {error && (
                <div className="mb-12 p-8 bg-red-50 border border-red-100 flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                  <div>
                    <p className="font-display font-bold text-red-900 uppercase tracking-widest text-sm mb-2">
                      Error Loading Catalog
                    </p>
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Always render grid — skeletons while loading, products when ready */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      priority={index < 4}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 border border-surface-high bg-surface-low">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">
                    No Items Found in this Collection
                  </p>
                  <button
                    onClick={() => setSearchParams({})}
                    className="text-xs font-bold uppercase tracking-widest text-primary underline underline-offset-8 decoration-2 italic hover:text-primary-dim"
                  >
                    Back to All Products
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
