"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import type { Product } from "@/types";

export function ProductGrid({ products, loading }: { products: Product[]; loading?: boolean }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  if (loading) {
    return (
      <div className="grid min-h-64 place-items-center rounded-cute bg-white/70 shadow-soft">
        <Loader2 className="h-8 w-8 animate-spin text-navySoft" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-cute bg-white/70 p-8 text-center shadow-soft">
        <p className="text-lg font-black text-navySoft">Chưa có sản phẩm nào phù hợp.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} onOpen={setSelectedProduct} />
        ))}
      </div>
      <ProductDetailModal product={selectedProduct} open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
