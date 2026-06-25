"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Boxes, CheckCircle2, Clock3, Loader2, PackageCheck, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminService } from "@/services/adminService";
import { useToastStore } from "@/store/toastStore";
import type { Order, Product, UserProfile } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

export default function AdminDashboardPage() {
  const { showToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [orderList, productList, userList] = await Promise.all([
          adminService.getOrders(),
          adminService.getProducts(),
          adminService.getUsers()
        ]);
        setOrders(orderList);
        setProducts(productList);
        setUsers(userList);
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Không tải được dữ liệu tổng quan.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [showToast]);

  const stats = useMemo(() => {
    const revenue = orders
      .filter((order) => order.paymentStatus === "paid" || order.status === "confirmed")
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      revenue,
      orders: orders.length,
      users: users.length,
      products: products.length,
      pending: orders.filter((order) => order.status === "pending").length,
      waitingPayment: orders.filter((order) => order.paymentStatus === "processing").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      activeProducts: products.filter((product) => product.isActive !== false).length
    };
  }, [orders, products, users]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5),
    [orders]
  );

  const topProducts = useMemo(() => products.slice(0, 5), [products]);

  return (
    <AdminShell>
      <section>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#0b2463] md:text-4xl">Chào mừng trở lại, Admin</h1>
            <p className="mt-2 text-sm font-bold text-[#607198]">Đây là tổng quan hoạt động của hệ thống SmartCart.</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#3567ff] to-[#d83cff] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(93,94,255,0.22)]"
          >
            Xem đơn hàng
          </Link>
        </div>

        {loading ? (
          <div className="grid min-h-[60vh] place-items-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#3567ff]" />
          </div>
        ) : (
          <>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={<TrendingUp className="h-6 w-6" />} label="Tổng doanh thu" value={formatCurrency(stats.revenue)} helper="Từ đơn đã thanh toán/xác nhận" tone="purple" />
              <Metric icon={<PackageCheck className="h-6 w-6" />} label="Đơn hàng" value={String(stats.orders)} helper={`${stats.pending} đơn chờ xác nhận`} tone="blue" />
              <Metric icon={<Users className="h-6 w-6" />} label="Người dùng" value={String(stats.users)} helper="Tất cả tài khoản" tone="orange" />
              <Metric icon={<Boxes className="h-6 w-6" />} label="Sản phẩm" value={String(stats.products)} helper={`${stats.activeProducts} sản phẩm đang hiển thị`} tone="green" />
            </div>

            <div className="mt-7 grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
              <section className="rounded-[1.5rem] border border-white/80 bg-white/76 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.13)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-black text-[#0b2463]">Tình hình đơn hàng</h2>
                  <Link href="/admin/orders" className="text-sm font-black text-[#3567ff]">
                    Xem tất cả
                  </Link>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <MiniStat icon={<Clock3 className="h-5 w-5" />} label="Chờ xác nhận" value={stats.pending} className="bg-[#fff3d8] text-[#935b00]" />
                  <MiniStat icon={<ShoppingBag className="h-5 w-5" />} label="Chờ thanh toán" value={stats.waitingPayment} className="bg-[#efe9ff] text-[#6d42ff]" />
                  <MiniStat icon={<CheckCircle2 className="h-5 w-5" />} label="Đã xác nhận" value={stats.confirmed} className="bg-[#dff7e9] text-[#17664f]" />
                </div>

                <div className="mt-6 space-y-3">
                  {recentOrders.length === 0 ? (
                    <EmptyState label="Chưa có đơn hàng mới." />
                  ) : (
                    recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href="/admin/orders"
                        className="grid gap-3 rounded-2xl border border-[#dbeaff] bg-white/82 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(76,107,171,0.12)] md:grid-cols-[160px_1fr_150px]"
                      >
                        <div>
                          <p className="font-black text-[#0b2463]">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="mt-1 text-xs font-bold text-[#607198]">{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</p>
                        </div>
                        <p className="line-clamp-2 text-sm font-black text-[#0b2463]">
                          {order.items?.map((item) => item.productName).join(", ") || "Đơn hàng SmartCart"}
                        </p>
                        <p className="font-black text-[#ff3d9a] md:text-right">{formatCurrency(order.totalAmount || 0)}</p>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              <div className="space-y-5">
                <section className="rounded-[1.5rem] border border-white/80 bg-white/76 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.13)] backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-black text-[#0b2463]">Sản phẩm nổi bật</h2>
                    <Link href="/admin/products" className="text-sm font-black text-[#3567ff]">
                      Quản lý
                    </Link>
                  </div>
                  <div className="mt-5 space-y-3">
                    {topProducts.length === 0 ? (
                      <EmptyState label="Chưa có sản phẩm." />
                    ) : (
                      topProducts.map((product) => (
                        <Link key={product.id} href="/admin/products" className="flex items-center gap-3 rounded-2xl border border-[#dbeaff] bg-white/82 p-3 transition hover:bg-[#f7fbff]">
                          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f3f8ff]">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <Boxes className="h-6 w-6 text-[#607198]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-black text-[#0b2463]">{product.name}</p>
                            <p className="mt-1 text-xs font-bold text-[#607198]">{product.categoryName || "Chưa có danh mục"}</p>
                          </div>
                          <p className="text-sm font-black text-[#3567ff]">{formatCurrency(product.basePrice)}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-white/80 bg-gradient-to-br from-[#3567ff] to-[#d83cff] p-5 text-white shadow-[0_24px_70px_rgba(72,108,176,0.18)]">
                  <p className="text-lg font-black">Việc nên xử lý trước</p>
                  <p className="mt-2 text-sm font-bold text-white/82">
                    Có {stats.waitingPayment} giao dịch đang chờ xác nhận thanh toán và {stats.pending} đơn đang chờ xác nhận.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <Link href="/admin/payments" className="rounded-2xl bg-white/92 px-4 py-3 text-center text-sm font-black text-[#3567ff]">
                      Xử lý thanh toán
                    </Link>
                    <Link href="/admin/orders" className="rounded-2xl bg-white/20 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/35">
                      Xác nhận đơn hàng
                    </Link>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </section>
    </AdminShell>
  );
}

function Metric({
  icon,
  label,
  value,
  helper,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: "purple" | "blue" | "orange" | "green";
}) {
  const toneClass = {
    purple: "bg-[#eee8ff] text-[#7b5cff]",
    blue: "bg-[#dff2ff] text-[#3567ff]",
    orange: "bg-[#ffe7c7] text-[#d17a00]",
    green: "bg-[#dff7e9] text-[#1a9d64]"
  }[tone];

  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.12)] backdrop-blur-xl">
      <span className={cn("grid h-14 w-14 place-items-center rounded-[1rem]", toneClass)}>{icon}</span>
      <p className="mt-5 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#0b2463]">{value}</p>
      <p className="mt-2 text-xs font-bold text-[#607198]">{helper}</p>
    </div>
  );
}

function MiniStat({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: number; className: string }) {
  return (
    <div className="rounded-2xl border border-[#dbeaff] bg-white/82 p-4">
      <span className={cn("grid h-11 w-11 place-items-center rounded-2xl", className)}>{icon}</span>
      <p className="mt-4 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#0b2463]">{value}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-[#cfe1fb] bg-white/55 text-center text-sm font-black text-[#607198]">
      {label}
    </div>
  );
}
