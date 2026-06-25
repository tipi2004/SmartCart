"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Boxes, ChartNoAxesColumn, CreditCard, Grid2X2, Home, LayoutDashboard, LockKeyhole, PackageCheck, Search, Settings, ShieldCheck, ShoppingBag, Store, Users } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";
import { ToastHost } from "@/components/ui/ToastHost";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { getRoleFromToken } from "@/utils/auth";
import { cn } from "@/utils/cn";

const mainLinks = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/shops", label: "Shop/Seller", icon: Store },
  { href: "/admin/products", label: "Sản phẩm", icon: Boxes },
  { href: "/admin/categories", label: "Danh mục", icon: Grid2X2 },
  { href: "/admin/orders", label: "Đơn hàng", icon: PackageCheck },
  { href: "/admin/payments", label: "Thanh toán", icon: CreditCard }
];

const systemLinks = [
  { href: "/admin/reports", label: "Báo cáo", icon: ChartNoAxesColumn },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
  { href: "/", label: "Về trang chủ", icon: Home }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { accessToken, hydrate } = useAuthStore();
  const { open, openLogin, closeLogin } = useAuthModalStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  const token = accessToken || (typeof window !== "undefined" ? localStorage.getItem("smartcart_access_token") : null);
  const role = getRoleFromToken(token);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (hydrated && !token) openLogin();
  }, [hydrated, openLogin, token]);

  if (!hydrated) {
    return (
      <AdminAccessFrame>
        <div className="grid min-h-[60vh] place-items-center">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 animate-pulse text-[#3567ff]" />
            <p className="mt-4 text-lg font-black text-[#0b2463]">Đang kiểm tra quyền quản trị...</p>
          </div>
        </div>
      </AdminAccessFrame>
    );
  }

  if (!token || !isAdmin) {
    return (
      <AdminAccessFrame>
        <div className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-5 text-center">
          <div className="rounded-[1.75rem] border border-white/80 bg-white/78 p-8 shadow-[0_24px_70px_rgba(72,108,176,0.16)] backdrop-blur-xl">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#eee8ff] text-[#6d42ff]">
              <LockKeyhole className="h-8 w-8" />
            </span>
            <h1 className="mt-5 text-3xl font-black text-[#0b2463]">Cần quyền quản trị</h1>
            <p className="mt-3 text-sm font-bold leading-6 text-[#607198]">
              Khu vực admin chỉ dành cho tài khoản có vai trò quản trị viên. Hãy đăng nhập bằng tài khoản admin để tiếp tục.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#3567ff] to-[#d83cff] px-5 text-sm font-black text-white"
              >
                Đăng nhập admin
              </button>
              <Link href="/" className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-5 text-sm font-black text-[#0b2463] shadow-soft">
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
        <LoginModal open={open} onClose={closeLogin} />
        <ToastHost />
      </AdminAccessFrame>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f8ff] text-[#0b2463]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-[#dbe8fb] bg-white/88 px-5 py-6 shadow-[18px_0_60px_rgba(73,104,170,0.08)] backdrop-blur-xl lg:block">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#7c5cff] to-[#49a7ff] text-white shadow-soft">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <span className="text-xl font-black">
            SmartCart <span className="text-[#9b5cff]">Admin</span>
          </span>
        </Link>

        <nav className="mt-10 space-y-8">
          <NavGroup title="Quản lý" links={mainLinks} pathname={pathname} />
          <NavGroup title="Quản trị hệ thống" links={systemLinks} pathname={pathname} />
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-[#e5efff] bg-[#f8fbff] p-4">
          <p className="text-sm font-black text-[#7b5cff]">SmartCart AI</p>
          <p className="mt-1 text-xs font-bold text-[#607198]">Trợ lý quản trị thông minh</p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#dbe8fb] bg-white/82 px-5 py-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#6d5cff] shadow-soft lg:hidden">
              <ShieldCheck className="h-5 w-5" />
            </Link>
            <div className="relative max-w-2xl flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7789ad]" />
              <input
                placeholder="Tìm kiếm đơn hàng, sản phẩm, người dùng..."
                className="h-12 w-full rounded-2xl border border-[#dbe8fb] bg-white/86 pl-12 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#c7e4ff]/65"
              />
            </div>
            <button className="relative grid h-11 w-11 place-items-center rounded-full bg-white text-[#0b2463] shadow-soft" aria-label="Thông báo">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#d83cff] px-1 text-[10px] font-black text-white">12</span>
            </button>
            <Link
              href="/#shop"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#0b2463] shadow-soft transition hover:-translate-y-0.5"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Về cửa hàng</span>
            </Link>
            <div className="hidden items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-soft sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#dff2ff] font-black text-[#0b2463]">A</span>
              <span>
                <span className="block text-sm font-black">Admin</span>
                <span className="text-xs font-bold text-[#607198]">Quản trị viên</span>
              </span>
            </div>
          </div>
        </header>

        <main className="px-5 py-8 md:px-8">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}

function AdminAccessFrame({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#f3f8ff] text-[#0b2463]">{children}</div>;
}

function NavGroup({
  title,
  links,
  pathname
}: {
  title: string;
  links: Array<{ href: string; label: string; icon: ComponentType<{ className?: string }> }>;
  pathname: string;
}) {
  return (
    <div>
      <p className="mb-3 px-3 text-xs font-black uppercase text-[#607198]">{title}</p>
      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-black transition",
                active ? "bg-[#efe9ff] text-[#6d42ff]" : "text-[#0b2463] hover:bg-[#f3f8ff]"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
