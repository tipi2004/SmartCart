"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ProductImage } from "@/components/products/ProductImage";
import { Button } from "@/components/ui/Button";
import { productService } from "@/services/productService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { Product } from "@/types";
import { formatCurrency } from "@/utils/format";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartMessage, setCartMessage] = useState("");
  const { addToCart } = useCartStore();
  const { accessToken, hydrate } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!params.id) return;
    productService
      .getProduct(params.id)
      .then((data) => setProduct(data ?? null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const addProductToCart = async () => {
    if (!accessToken && !(typeof window !== "undefined" && localStorage.getItem("smartcart_access_token"))) {
      openLogin();
      return;
    }
    if (!product) return;
    setCartMessage("");
    try {
      await addToCart(product.id, 1);
      setCartMessage("Đã thêm sản phẩm vào giỏ hàng.");
      showToast("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thêm được sản phẩm vào giỏ.";
      setCartMessage(message);
      showToast(message, "error");
      if (message.toLowerCase().includes("unauthorized") || message.includes("401")) openLogin();
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen px-5 py-8 md:px-8">
        <section className="mx-auto max-w-6xl">
          <Link href="/shop" className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-navySoft shadow-soft">
            <ArrowLeft className="h-4 w-4" />
            Quay lại shop
          </Link>
          {loading ? (
            <div className="grid min-h-96 place-items-center rounded-cute bg-white/75 shadow-soft">
              <Loader2 className="h-8 w-8 animate-spin text-navySoft" />
            </div>
          ) : product ? (
            <div className="grid gap-8 rounded-cute bg-white/82 p-4 shadow-soft md:grid-cols-2 md:p-8">
              <div className="relative aspect-square overflow-hidden rounded-cute bg-cloud">
                <ProductImage src={product.imageUrl} name={product.name} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-sm font-black uppercase tracking-wide text-navyMuted">{product.categoryName || "SmartCart"}</p>
                <h1 className="mt-3 text-4xl font-black text-navySoft md:text-5xl">{product.name}</h1>
                <p className="mt-5 text-3xl font-black text-navySoft">{formatCurrency(product.basePrice)}</p>
                <p className="mt-5 leading-8 text-navyMuted">{product.description || "San pham dang cho cap nhat mo ta tu shop."}</p>
                <Button className="mt-8 w-full sm:w-max" onClick={addProductToCart}>
                  <Plus className="h-5 w-5" />
                  Thêm vào giỏ hàng
                </Button>
                {cartMessage && <p className="mt-4 rounded-full bg-mint px-5 py-3 text-sm font-bold text-navySoft">{cartMessage}</p>}
              </div>
            </div>
          ) : (
            <div className="rounded-cute bg-white/75 p-8 text-center shadow-soft">
              <p className="text-xl font-black text-navySoft">Không tìm thấy sản phẩm.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
