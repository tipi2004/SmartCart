"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Home, Loader2, MapPin, Search, ShoppingBag, ShoppingCart, UserRound } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { BunnyMascot } from "@/components/bunny/BunnyMascot";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { ProductImage } from "@/components/products/ProductImage";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { productService } from "@/services/productService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useProfileModalStore } from "@/store/profileModalStore";
import { useToastStore } from "@/store/toastStore";
import type { Category, Product } from "@/types";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

const featuredLabels = ["Gần trường", "Giá tốt", "Mới đăng", "Đồ ăn nhanh"];

export function MobileHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { accessToken, hydrate } = useAuthStore();
  const { open, openLogin, closeLogin } = useAuthModalStore();
  const { openProfile } = useProfileModalStore();
  const { cart, fetchCart, addToCart, loading: cartLoading } = useCartStore();
  const { showToast } = useToastStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("smartcart_access_token") : null;
    if (accessToken || token) {
      void fetchCart();
    }
  }, [accessToken, fetchCart]);

  useEffect(() => {
    let mounted = true;
    Promise.all([productService.getProducts(), productService.getCategories()])
      .then(([productData, categoryData]) => {
        if (!mounted) return;
        setProducts(productData);
        setCategories(categoryData.filter((category) => category.name.trim().toLowerCase() !== "tất cả"));
      })
      .catch(() => {
        if (mounted) showToast("Không tải được danh sách sản phẩm.", "error");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showToast]);

  const isLoggedIn = Boolean(accessToken || (typeof window !== "undefined" && localStorage.getItem("smartcart_access_token")));

  const visibleProducts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return products.filter((product) => {
      const matchCategory = selectedCategoryId ? product.categoryName && categories.find((category) => category.id === selectedCategoryId)?.name === product.categoryName : true;
      const matchKeyword = normalizedKeyword ? `${product.name} ${product.categoryName || ""}`.toLowerCase().includes(normalizedKeyword) : true;
      return matchCategory && matchKeyword;
    });
  }, [categories, keyword, products, selectedCategoryId]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.getElementById("mobile-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const requireLogin = () => {
    if (isLoggedIn) return true;
    openLogin();
    return false;
  };

  const addProductToCart = async (product: Product) => {
    if (!requireLogin()) return;
    try {
      await addToCart(product.id, 1);
      showToast(`Đã thêm ${product.name} vào giỏ hàng.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thêm được sản phẩm.", "error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#84d6f7] via-[#eaf8ff] to-[#fff7e8] pb-24 text-[#092768]">
      <header className="sticky top-0 z-40 border-b border-white/35 bg-[#eaf8ff]/88 px-4 pb-3 pt-3 shadow-[0_12px_34px_rgba(9,39,104,0.08)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-soft">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#b9e9ff] text-[#092768]">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <span className="truncate text-sm font-black">SmartCart</span>
          </Link>
          <button type="button" className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-white/80 px-3 py-2 text-xs font-black text-[#607198] shadow-soft">
            <MapPin className="h-4 w-4 text-[#3567ff]" />
            Quanh trường
          </button>
          <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-full bg-[#193762] text-white shadow-button" aria-label="Giỏ hàng">
            <ShoppingCart className="h-5 w-5" />
            {cart.totalItems > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ffd1e2] px-1 text-[0.68rem] font-black text-[#092768]">
                {cart.totalItems}
              </span>
            )}
          </Link>
        </div>

        <form onSubmit={submitSearch} className="relative mt-3">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#607198]" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm bánh, sách, đồ uống..."
            className="h-12 w-full rounded-full border border-white bg-white/95 pl-12 pr-4 text-sm font-bold shadow-soft outline-none focus:ring-4 focus:ring-[#b9e9ff]/70"
          />
        </form>
      </header>

      <section className="px-4 pt-5">
        <div className="relative overflow-hidden rounded-[1.6rem] bg-white/84 p-5 shadow-soft backdrop-blur">
          <div className="relative z-10 max-w-[62%]">
            <p className="inline-flex rounded-full bg-[#dff2ff] px-3 py-1 text-xs font-black text-[#3567ff]">SmartCart Bunny</p>
            <h1 className="mt-3 text-3xl font-black leading-tight">Mua nhanh quanh trường</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-[#607198]">Tìm đồ ăn, sách, đồ dùng học tập và đặt hàng trong vài chạm.</p>
          </div>
          <div className="absolute -bottom-4 right-0 h-40 w-40">
            <BunnyMascot className="h-40 w-40 scale-110" />
          </div>
        </div>
      </section>

      <section className="px-4 pt-5">
        <div className="flex gap-2 overflow-x-auto pb-2 soft-scrollbar">
          {featuredLabels.map((label) => (
            <span key={label} className="shrink-0 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-[#092768] shadow-button">
              {label}
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 soft-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={cn(
              "shrink-0 rounded-full border border-[#b9e9ff] px-4 py-2 text-sm font-black shadow-button",
              selectedCategoryId ? "bg-white text-[#092768]" : "bg-[#193762] text-white"
            )}
          >
            Tất cả
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={cn(
                "shrink-0 rounded-full border border-[#b9e9ff] px-4 py-2 text-sm font-black shadow-button",
                selectedCategoryId === category.id ? "bg-[#193762] text-white" : "bg-white text-[#092768]"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section id="mobile-products" className="px-4 pt-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black">Gợi ý hôm nay</h2>
            <p className="text-xs font-bold text-[#607198]">{visibleProducts.length} sản phẩm phù hợp</p>
          </div>
          <Link href="/cart" className="text-xs font-black text-[#3567ff]">Xem giỏ</Link>
        </div>

        {loading ? (
          <div className="grid min-h-48 place-items-center rounded-[1.4rem] bg-white/80 shadow-soft">
            <Loader2 className="h-7 w-7 animate-spin text-[#3567ff]" />
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="grid min-h-48 place-items-center rounded-[1.4rem] bg-white/80 p-6 text-center shadow-soft">
            <p className="font-black">Chưa tìm thấy sản phẩm phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-[1.35rem] bg-white/90 p-2 shadow-soft">
                <button type="button" onClick={() => setSelectedProduct(product)} className="relative block aspect-square w-full overflow-hidden rounded-[1rem] bg-[#f7fbff] text-left">
                  <ProductImage src={product.imageUrl} name={product.name} />
                </button>
                <div className="px-1 pb-1 pt-3">
                  <p className="line-clamp-2 min-h-10 text-sm font-black leading-5">{product.name}</p>
                  <p className="mt-1 truncate text-[0.68rem] font-bold uppercase text-[#607198]">{product.categoryName || "SmartCart"}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-[#3567ff]">{formatCurrency(product.basePrice)}</span>
                    <button
                      type="button"
                      disabled={cartLoading}
                      onClick={() => addProductToCart(product)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#193762] text-white shadow-button disabled:opacity-60"
                      aria-label={`Thêm ${product.name} vào giỏ hàng`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={() => setChatOpen((current) => !current)}
        className="fixed bottom-20 right-3 z-40 grid h-16 w-16 place-items-center rounded-full bg-white shadow-[0_18px_42px_rgba(9,39,104,0.22)]"
        aria-label="Mở chatbot SmartCart"
      >
        <BunnyMascot className="h-16 w-16 scale-[1.35]" cart={false} />
      </button>
      {chatOpen && (
        <div className="fixed bottom-40 right-4 z-40 max-w-[17rem] rounded-[1.35rem] border border-[#b9e9ff] bg-white/95 p-4 shadow-soft backdrop-blur">
          <p className="font-black">SmartCart Bot</p>
          <p className="mt-1 text-sm font-bold leading-5 text-[#607198]">Bạn muốn tìm sản phẩm, xem giỏ hàng hay kiểm tra đơn?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setKeyword("đồ ăn")} className="rounded-full bg-[#dff2ff] px-3 py-1.5 text-xs font-black">Tìm đồ ăn</button>
            <Link href="/orders" className="rounded-full bg-[#dff2ff] px-3 py-1.5 text-xs font-black">Kiểm tra đơn</Link>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[1.4rem] border border-white bg-white/94 px-2 py-2 shadow-[0_18px_44px_rgba(9,39,104,0.16)] backdrop-blur-xl">
        <MobileNavItem icon={<Home className="h-5 w-5" />} label="Home" href="/" active />
        <MobileNavItem icon={<Search className="h-5 w-5" />} label="Search" href="#mobile-products" />
        <MobileNavItem icon={<ShoppingCart className="h-5 w-5" />} label="Cart" href="/cart" />
        <button type="button" onClick={isLoggedIn ? openProfile : openLogin} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-black text-[#607198]">
          <UserRound className="h-5 w-5" />
          Profile
        </button>
      </nav>

      <ProductDetailModal product={selectedProduct} open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} />
      <LoginModal open={open} onClose={closeLogin} />
      <ProfileModal />
    </main>
  );
}

function MobileNavItem({ icon, label, href, active = false }: { icon: ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-black", active ? "bg-[#dff2ff] text-[#3567ff]" : "text-[#607198]")}>
      {icon}
      {label}
    </Link>
  );
}
