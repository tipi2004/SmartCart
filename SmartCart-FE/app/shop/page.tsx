"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { FloatingBunny } from "@/components/bunny/FloatingBunny";
import { CategoryPills } from "@/components/products/CategoryPills";
import { ProductAdvancedFilters } from "@/components/products/ProductAdvancedFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useProductStore } from "@/store/productStore";

export default function ShopPage() {
  const {
    products,
    loading,
    error,
    fetchCategories,
    setKeyword,
    sortOrder,
    minPrice,
    maxPrice,
    setSortOrder,
    setMinPrice,
    setMaxPrice,
    clearAdvancedFilters
  } = useProductStore();

  useEffect(() => {
    const initialKeyword = new URLSearchParams(window.location.search).get("q") || "";
    setKeyword(initialKeyword);
    fetchCategories();
    void useProductStore.getState().fetchProducts();
  }, [fetchCategories, setKeyword]);

  return (
    <>
      <Header />
      <main className="min-h-screen px-5 py-8 md:px-8">
        <section className="mx-auto max-w-7xl">
          <div className="mb-8 rounded-cute bg-skyPastel p-6 shadow-soft md:p-8">
            <p className="text-sm font-black uppercase tracking-wide text-navyMuted">Bunny market</p>
            <h1 className="mt-2 text-4xl font-black text-navySoft md:text-5xl">Cửa hàng SmartCart</h1>
            <p className="mt-3 max-w-2xl leading-7 text-navySoft/75">
              Chọn danh mục, tìm sản phẩm và thêm vào giỏ hàng với các animation nhẹ nhàng.
            </p>
          </div>
          <div className="mb-7">
            <CategoryPills />
          </div>
          <div className="mb-7">
            <ProductAdvancedFilters
              sortOrder={sortOrder}
              minPrice={minPrice}
              maxPrice={maxPrice}
              resultCount={products.length}
              onSortOrderChange={setSortOrder}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onClear={clearAdvancedFilters}
            />
          </div>
          {error && <div className="mb-5 rounded-full bg-blush px-5 py-3 text-sm font-bold text-navySoft">{error}</div>}
          <ProductGrid products={products} loading={loading} />
        </section>
      </main>
      <FloatingBunny />
    </>
  );
}
