"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, PackageCheck, Search, ShoppingBag, ShoppingCart, Store, UserRound } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { ToastHost } from "@/components/ui/ToastHost";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useProductStore } from "@/store/productStore";
import { useProfileModalStore } from "@/store/profileModalStore";
import { getRoleFromToken } from "@/utils/auth";
import { cn } from "@/utils/cn";

type HeaderProps = {
  overlay?: boolean;
};

export function Header({ overlay = false }: HeaderProps) {
  const { accessToken, hydrate, logout, setTokens } = useAuthStore();
  const { open, openLogin, closeLogin } = useAuthModalStore();
  const { cart, fetchCart } = useCartStore();
  const { keyword, setKeyword, fetchProducts } = useProductStore();
  const { openProfile } = useProfileModalStore();
  const router = useRouter();
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const userRole = getRoleFromToken(accessToken);
  const isAdmin = userRole === "admin";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthAccessToken = params.get("accessToken");
    const oauthRefreshToken = params.get("refreshToken");

    if (oauthAccessToken && oauthRefreshToken) {
      setTokens({ accessToken: oauthAccessToken, refreshToken: oauthRefreshToken });
      params.delete("accessToken");
      params.delete("refreshToken");
      const cleanQuery = params.toString();
      const cleanUrl = `${window.location.pathname}${cleanQuery ? `?${cleanQuery}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", cleanUrl);
      return;
    }

    hydrate();
  }, [hydrate, setTokens]);

  useEffect(() => {
    if (accessToken) fetchCart();
  }, [accessToken, fetchCart]);

  useEffect(() => {
    if (!accountOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [accountOpen]);

  const submitSearch = async () => {
    const trimmedKeyword = keyword.trim();
    const query = trimmedKeyword ? `?q=${encodeURIComponent(trimmedKeyword)}` : "";

    if (pathname === "/") {
      window.history.replaceState({}, "", `${query}#shop`);
      window.dispatchEvent(new CustomEvent("smartcart:product-search", { detail: { keyword: trimmedKeyword } }));
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (pathname === "/shop") {
      window.history.replaceState({}, "", `/shop${query}`);
      await fetchProducts();
      return;
    }

    router.push(`/${query}#shop`);
  };

  return (
    <header className={cn(overlay ? "fixed left-0 right-0 top-0" : "sticky top-0", "z-40 bg-transparent")}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-soft">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-skyPastel text-navySoft">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="hidden text-sm font-black text-navySoft sm:block">SmartCart Bunny</span>
        </Link>

        <form
          className="relative ml-auto hidden flex-1 md:block"
          onSubmit={(event) => {
            event.preventDefault();
            void submitSearch();
          }}
        >
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navyMuted" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm bánh, sách, đồ uống..."
            className="h-12 w-full rounded-full border border-white bg-white/88 pl-12 pr-5 text-sm shadow-soft outline-none focus:ring-4 focus:ring-skyPastel/40"
          />
        </form>

        <Link
          href="/#shop"
          className="hidden rounded-full bg-white px-4 py-3 text-sm font-bold text-navySoft shadow-soft transition hover:-translate-y-0.5 lg:inline-flex"
        >
          Cửa hàng
        </Link>
        {accessToken ? (
          <Link
            href="/cart"
            data-cart-target="true"
            className="relative grid h-12 w-12 place-items-center rounded-full bg-navySoft text-white shadow-button"
          >
            <ShoppingCart className="h-5 w-5" />
            {cart.totalItems > 0 && (
              <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-blush px-1 text-xs font-black text-navySoft">
                {cart.totalItems}
              </span>
            )}
          </Link>
        ) : (
          <button
            type="button"
            onClick={openLogin}
            data-cart-target="true"
            className="relative grid h-12 w-12 place-items-center rounded-full bg-navySoft text-white shadow-button"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        )}
        {accessToken ? (
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              className="flex h-12 items-center gap-2 rounded-full bg-white px-3 text-navySoft shadow-soft transition hover:-translate-y-0.5"
              aria-label="Account menu"
              aria-expanded={accountOpen}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-skyPastel text-navySoft">
                <UserRound className="h-4 w-4" />
              </span>
              <ChevronDown className={cn("hidden h-4 w-4 transition sm:block", accountOpen && "rotate-180")} />
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/92 p-2 text-sm font-black text-navySoft shadow-[0_20px_60px_rgba(29,49,83,0.2)] backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    openProfile();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-skyPastel/35"
                >
                  <UserRound className="h-4 w-4" />
                  Hồ sơ cá nhân
                </button>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-[#efe9ff]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Trang quản lý
                  </Link>
                )}
                <Link
                  href="/seller"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-skyPastel/35"
                >
                  <Store className="h-4 w-4" />
                  Kênh bán hàng
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-skyPastel/35"
                >
                  <PackageCheck className="h-4 w-4" />
                  Đơn hàng của tôi
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-blush/45"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={openLogin}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-navySoft shadow-soft"
            aria-label="Login"
          >
            <UserRound className="h-5 w-5" />
          </button>
        )}
      </div>
      <LoginModal open={open} onClose={closeLogin} />
      <ProfileModal />
      <ToastHost />
    </header>
  );
}
