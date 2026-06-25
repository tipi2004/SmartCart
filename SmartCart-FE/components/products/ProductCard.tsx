"use client";

import { motion } from "framer-motion";
import { Plus, ShoppingCart } from "lucide-react";
import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/Button";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/format";

export function ProductCard({ product, index = 0, onOpen }: { product: Product; index?: number; onOpen?: (product: Product) => void }) {
  const { addToCart, loading } = useCartStore();
  const { accessToken } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { showToast } = useToastStore();

  const addProductToCart = async () => {
    if (!accessToken && !(typeof window !== "undefined" && localStorage.getItem("smartcart_access_token"))) {
      openLogin();
      return;
    }
    try {
      await addToCart(product.id, 1);
      showToast("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thêm được sản phẩm vào giỏ.";
      showToast(message, "error");
      if (message.toLowerCase().includes("unauthorized") || message.includes("401")) openLogin();
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.45 }}
      whileHover={{ y: -6 }}
      className="product-card-bg overflow-hidden rounded-cute border border-white/85 p-3 shadow-soft"
    >
      <button type="button" onClick={() => onOpen?.(product)} className="relative block aspect-[4/3] w-full overflow-hidden rounded-[1.35rem] bg-white text-left">
        <ProductImage src={product.imageUrl} name={product.name} />
      </button>
      <div className="space-y-3 p-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-navyMuted">{product.categoryName || "SmartCart"}</p>
          <button type="button" onClick={() => onOpen?.(product)} className="mt-1 line-clamp-2 min-h-12 text-left text-lg font-black text-navySoft transition hover:text-[#6d5cff]">
            {product.name}
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-black text-navySoft">{formatCurrency(product.basePrice)}</p>
          <Button
            aria-label="Add to cart"
            disabled={loading}
            onClick={addProductToCart}
            className="h-11 min-h-11 w-11 px-0"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-navyMuted">
          <ShoppingCart className="h-4 w-4" />
          Thêm nhanh vào giỏ
        </div>
      </div>
    </motion.article>
  );
}
