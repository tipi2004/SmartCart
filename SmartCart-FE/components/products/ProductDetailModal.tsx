"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Loader2, Minus, PackageCheck, Plus, RotateCcw, ShieldCheck, ShoppingCart, Star, Truck, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { productService } from "@/services/productService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

type ProductDetailModalProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
};

const fallbackGallery = [
  "/images/clouds/cloud-01.png",
  "/images/clouds/cloud-04.png",
  "/images/clouds/cloud-08.png",
  "/images/bunny-cart-cutout.png"
];

export function ProductDetailModal({ product, open, onClose }: ProductDetailModalProps) {
  const [detail, setDetail] = useState<Product | null>(product);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { accessToken } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { addToCart, loading: cartLoading } = useCartStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    if (!open || !product) return;

    setDetail(product);
    setQuantity(1);
    setActiveImage(0);
    setLoading(true);
    productService
      .getProduct(product.id)
      .then((data) => {
        if (data) setDetail(data);
      })
      .catch(() => {
        setDetail(product);
      })
      .finally(() => setLoading(false));
  }, [open, product]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const currentProduct = detail || product;
  const gallery = useMemo(() => {
    const images = [currentProduct?.imageUrl, ...fallbackGallery].filter(Boolean) as string[];
    return Array.from(new Set(images));
  }, [currentProduct?.imageUrl]);

  if (!open || !currentProduct) return null;
  const stockQuantity = currentProduct.stockQuantity ?? 0;
  const isOutOfStock = stockQuantity <= 0;

  const requireLogin = () => {
    if (accessToken || (typeof window !== "undefined" && localStorage.getItem("smartcart_access_token"))) return true;
    openLogin();
    return false;
  };

  const addProductToCart = async () => {
    if (!requireLogin()) return false;
    if (isOutOfStock || stockQuantity < quantity) {
      showToast(`Sản phẩm chỉ còn ${stockQuantity} trong kho.`, "error");
      return false;
    }
    try {
      await addToCart(currentProduct.id, quantity);
      showToast("Đã thêm sản phẩm vào giỏ hàng.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thêm được sản phẩm vào giỏ.";
      showToast(message, "error");
      return false;
    }
  };

  const buyNow = async () => {
    const added = await addProductToCart();
    if (added) {
      window.location.href = "/cart";
    }
  };

  const nextImage = () => setActiveImage((current) => (current + 1) % gallery.length);
  const previousImage = () => setActiveImage((current) => (current - 1 + gallery.length) % gallery.length);
  const originalPrice = Math.round(currentProduct.basePrice * 1.2);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-[#0f1f3d]/58 px-3 py-4 backdrop-blur-sm">
      <button type="button" aria-label="Đóng chi tiết sản phẩm" className="absolute inset-0 cursor-default" onClick={onClose} />

      <section className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.6rem] border border-white bg-[#f8fbff] p-4 text-[#092768] shadow-[0_32px_110px_rgba(23,42,86,0.42)] md:p-5">
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-[#092768] shadow-[0_12px_30px_rgba(23,42,86,0.18)] transition hover:-translate-y-0.5"
        >
          <X className="h-5 w-5" />
        </button>

        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/85 backdrop-blur-[2px]">
            <Loader2 className="h-9 w-9 animate-spin text-[#6d5cff]" />
          </div>
        )}

        <div className="grid min-h-0 gap-5 overflow-y-auto pr-1 lg:grid-cols-[minmax(300px,0.86fr)_1fr]">
          <div>
            <div className="relative aspect-[4/3] max-h-[390px] overflow-hidden rounded-[1rem] bg-white shadow-[0_18px_42px_rgba(23,42,86,0.14)]">
              <span className="absolute left-4 top-4 z-10 rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#ff5a2e] shadow-soft">🔥 Bán chạy</span>
              <ProductHeroImage src={gallery[activeImage]} name={currentProduct.name} />
              {gallery.length > 1 && (
                <>
                  <button type="button" onClick={previousImage} className="absolute left-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-[#6d5cff] shadow-soft">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={nextImage} className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-[#6d5cff] shadow-soft">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-[#15264a]/70 px-2.5 py-1 text-xs font-black text-white">
                    {activeImage + 1}/{gallery.length}
                  </span>
                </>
              )}
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {gallery.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => setActiveImage(index)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f6f7fb] transition",
                    activeImage === index ? "border-[#7d5cff] shadow-[0_8px_22px_rgba(125,92,255,0.25)]" : "border-transparent"
                  )}
                >
                  <ProductHeroImage src={image} name={`${currentProduct.name} ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="pr-12">
              <div className="inline-flex rounded-full bg-[#eee8ff] px-3 py-1 text-xs font-black text-[#7657ff]">
                {currentProduct.categoryName || "SmartCart"}
              </div>
              <h2 className="mt-2 text-2xl font-black leading-tight text-[#092768]">{currentProduct.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-bold text-[#607198]">
                <span className="inline-flex items-center gap-1 text-[#ffb020]">
                  <Star className="h-4 w-4 fill-current" /> 4.8
                </span>
                <span>(128 đánh giá)</span>
                <span>Đã bán 523</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-black text-[#3567ff]">{formatCurrency(currentProduct.basePrice)}</span>
                <span className="text-sm font-black text-[#9aa8c5] line-through">{formatCurrency(originalPrice)}</span>
                <span className="rounded-full bg-[#ffe1e8] px-2 py-1 text-xs font-black text-[#ff4d7d]">-17%</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#d9e8ff] bg-white p-3 shadow-[0_12px_28px_rgba(23,42,86,0.08)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#ffe5f1] text-xl">🐰</span>
                <div className="min-w-0 flex-1">
                  <p className="font-black">Sinh viên CNTT</p>
                  <p className="text-xs font-bold text-[#607198]">Online 2 giờ trước</p>
                </div>
                <span className="rounded-full bg-[#efe9ff] px-2 py-1 text-xs font-black text-[#7657ff]">★ 4.9</span>
                <Button variant="ghost" className="min-h-9 px-4 text-xs">Xem shop</Button>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm font-bold text-[#607198]">
              <InfoLine icon={<ShieldCheck className="h-4 w-4" />} label="Tình trạng" value={isOutOfStock ? "Hết hàng" : "Còn hàng"} success={!isOutOfStock} />
              <InfoLine icon={<PackageCheck className="h-4 w-4" />} label="Danh mục" value={currentProduct.categoryName || "SmartCart"} />
              <InfoLine icon={<Truck className="h-4 w-4" />} label="Giao hàng" value="2 - 4 ngày" />
              <InfoLine icon={<RotateCcw className="h-4 w-4" />} label="Đổi trả" value="Hỗ trợ đổi trả trong 3 ngày" />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="text-sm font-black">Số lượng</span>
              <div className="flex h-11 items-center rounded-full bg-white shadow-soft">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="grid h-11 w-12 place-items-center rounded-full">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-black">{quantity}</span>
                <button type="button" disabled={isOutOfStock || quantity >= stockQuantity} onClick={() => setQuantity((value) => Math.min(stockQuantity || 1, value + 1))} className="grid h-11 w-12 place-items-center rounded-full disabled:cursor-not-allowed disabled:opacity-40">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs font-bold text-[#607198]">Còn {stockQuantity} sản phẩm</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button variant="ghost" disabled={cartLoading || isOutOfStock} onClick={addProductToCart} className="border-[#7d5cff] text-[#6d5cff]">
                {cartLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
                Thêm vào giỏ hàng
              </Button>
              <Button disabled={cartLoading || isOutOfStock} onClick={buyNow} className="bg-gradient-to-r from-[#6b55ff] to-[#9d55ff] text-white shadow-[0_16px_32px_rgba(109,85,255,0.28)] hover:opacity-90">
                <Zap className="h-5 w-5" />
                Mua ngay
              </Button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_190px]">
              <div className="rounded-2xl border border-[#d9e8ff] bg-white p-4 shadow-[0_12px_28px_rgba(23,42,86,0.08)]">
                <div className="mb-4 flex gap-4 text-sm font-black">
                  <span className="text-[#6d5cff]">Mô tả sản phẩm</span>
                  <span className="text-[#607198]">Đánh giá (128)</span>
                  <span className="text-[#607198]">Hỏi đáp (16)</span>
                </div>
                <p className="text-sm font-semibold leading-6 text-[#29436f]">{currentProduct.description || "Sản phẩm phù hợp cho nhu cầu mua sắm nhanh quanh trường, giá rõ ràng và có thể thêm vào giỏ chỉ trong vài giây."}</p>
                <ul className="mt-4 space-y-2 text-sm font-semibold text-[#29436f]">
                  <li>✓ Hàng được kiểm tra trước khi giao</li>
                  <li>✓ Có thể thanh toán khi nhận hàng</li>
                </ul>
              </div>

              <div className="rounded-2xl bg-[#eee7ff] p-4 text-sm font-bold text-[#29436f] shadow-[0_12px_28px_rgba(23,42,86,0.08)]">
                <Benefit icon={<Truck className="h-5 w-5" />} title="Miễn phí giao hàng" text="Đơn từ 200.000đ" />
                <Benefit icon={<RotateCcw className="h-5 w-5" />} title="Đổi trả dễ dàng" text="Trong 3 ngày" />
              </div>
            </div>
          </div>
        </div>

        <button type="button" aria-label="Yêu thích" className="absolute right-8 top-20 grid h-11 w-11 place-items-center rounded-xl border border-[#e5efff] bg-white text-[#092768] shadow-soft">
          <Heart className="h-5 w-5" />
        </button>
      </section>
    </div>
  );
}

function ProductHeroImage({ src, name }: { src: string; name: string }) {
  return <Image src={src} alt={name} fill sizes="(max-width: 1024px) 100vw, 480px" className="object-cover" />;
}

function InfoLine({ icon, label, value, success = false }: { icon: ReactNode; label: string; value: string; success?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#607198]">{icon}</span>
      <span>{label}:</span>
      <span className={success ? "text-[#19a667]" : "text-[#29436f]"}>{value}</span>
    </div>
  );
}

function Benefit({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 border-b border-white/65 py-3 last:border-b-0">
      <span className="mt-0.5 text-[#6d5cff]">{icon}</span>
      <span>
        <span className="block font-black">{title}</span>
        <span className="text-xs text-[#607198]">{text}</span>
      </span>
    </div>
  );
}
