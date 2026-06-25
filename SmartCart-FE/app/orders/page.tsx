"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  Star,
  Store,
  Truck,
  WalletCards,
  X
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { OrderQrCard } from "@/components/orders/OrderQrCard";
import { Button } from "@/components/ui/Button";
import { orderService } from "@/services/orderService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import type { Order } from "@/types";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

const filters = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "cancelled", label: "Đã hủy" }
] as const;

const statusMeta: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: "bg-honey/35 text-[#935b00]" },
  confirmed: { label: "Đã xác nhận", className: "bg-mint/70 text-[#17664f]" },
  processing: { label: "Đang chuẩn bị", className: "bg-skyPastel/70 text-[#1e5fb8]" },
  shipping: { label: "Đang giao", className: "bg-skyPastel/70 text-[#1e5fb8]" },
  delivered: { label: "Hoàn thành", className: "bg-mint/70 text-[#17664f]" },
  cancelled: { label: "Đã hủy", className: "bg-blush/70 text-[#8d2845]" }
};

export default function OrdersPage() {
  const { accessToken, hydrate } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { showToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<(typeof filters)[number]["value"]>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isLoggedIn = Boolean(accessToken || (typeof window !== "undefined" && localStorage.getItem("smartcart_access_token")));

  const loadOrders = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      openLogin();
      return;
    }

    setLoading(true);
    try {
      setOrders(await orderService.getMyOrders());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được đơn hàng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isLoggedIn]);

  const filteredOrders = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesKeyword = !query || order.id.toLowerCase().includes(query);
      return matchesStatus && matchesKeyword;
    });
  }, [keyword, orders, status]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length
    }),
    [orders]
  );

  const openDetail = async (id: string) => {
    setDetailLoadingId(id);
    try {
      const order = await orderService.getOrder(id);
      if (order) setSelectedOrder(order);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được chi tiết đơn.", "error");
    } finally {
      setDetailLoadingId(null);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      const updated = await orderService.cancelOrder(id);
      if (updated) {
        setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
        setSelectedOrder(updated);
      }
      showToast("Đã hủy đơn hàng.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không hủy được đơn hàng.", "error");
    }
  };

  const confirmPayment = async (id: string) => {
    setConfirmingPaymentId(id);
    try {
      const updated = await orderService.confirmPayment(id);
      if (updated) {
        setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
        setSelectedOrder(updated);
      }
      showToast("Đã xác nhận thanh toán.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không xác nhận được thanh toán.", "error");
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  return (
    <>
      <Header overlay />
      <main className="min-h-screen bg-[#eef8ff] px-5 pb-28 pt-32 text-[#092768] md:px-8">
        <section className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[1fr_560px]">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/62 p-8 shadow-[0_24px_70px_rgba(72,108,176,0.16)] backdrop-blur-xl">
              <div className="absolute right-8 top-8 h-28 w-28 rounded-[2rem] bg-gradient-to-br from-[#b8dcff] to-[#f8c9ff] opacity-60 blur-sm" />
              <p className="relative inline-flex rounded-full bg-[#dff2ff] px-4 py-2 text-sm font-black text-[#2563eb]">SmartCart</p>
              <h1 className="relative mt-5 text-4xl font-black text-[#11285f] md:text-5xl">Đơn hàng của tôi</h1>
              <p className="relative mt-3 max-w-xl text-[#51648e]">Theo dõi trạng thái đơn hàng và quản lý lịch sử mua sắm của bạn.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<PackageCheck className="h-5 w-5" />} label="Tổng đơn hàng" value={stats.total} />
              <StatCard icon={<Clock3 className="h-5 w-5" />} label="Chờ xử lý" value={stats.pending} />
              <StatCard icon={<Truck className="h-5 w-5" />} label="Đã xác nhận" value={stats.confirmed} />
              <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Đã hủy" value={stats.cancelled} />
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/75 bg-white/72 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.15)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7daa]" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm theo mã đơn hàng..."
                  className="h-12 w-full rounded-full border border-[#d8e8ff] bg-white/82 pl-12 pr-5 text-sm font-bold text-[#11285f] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none placeholder:text-[#97a4c0] focus:ring-4 focus:ring-[#bcd8ff]/55"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatus(filter.value)}
                    className={cn(
                      "min-w-max rounded-full px-5 py-3 text-sm font-black shadow-[0_12px_28px_rgba(79,107,167,0.14)] transition",
                      status === filter.value
                        ? "bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white"
                        : "border border-[#d8e8ff] bg-white/86 text-[#11285f] hover:bg-[#eaf5ff]"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid min-h-80 place-items-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#3567ff]" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="grid min-h-80 place-items-center text-center">
                <div>
                  <PackageCheck className="mx-auto h-12 w-12 text-[#3567ff]" />
                  <p className="mt-4 text-xl font-black text-[#11285f]">Chưa có đơn hàng nào.</p>
                  <Link href="/#shop" className="mt-5 inline-block">
                    <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90">Đi mua sắm</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredOrders.map((order) => {
                  const meta = statusMeta[order.status || "pending"] || statusMeta.pending;
                  return (
                    <article key={order.id} className="grid gap-4 rounded-[1.25rem] border border-[#dbeaff] bg-white/78 p-4 shadow-[0_14px_36px_rgba(76,107,171,0.13)] backdrop-blur lg:grid-cols-[1fr_1.4fr_220px] lg:items-center">
                      <div>
                        <p className="font-black text-[#092768]">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="mt-1 text-sm font-bold text-[#607198]">{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</p>
                        <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black", meta.className)}>{meta.label}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#607198]">{order.items?.length || 0} sản phẩm</p>
                        <p className="mt-1 line-clamp-2 font-black text-[#092768]">
                          {order.items?.map((item) => item.productName).join(", ") || "Đơn hàng SmartCart"}
                        </p>
                        <p className="mt-2 text-sm font-bold text-[#607198]">Ship: {formatCurrency(order.shippingFee || 0)}</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <p className="text-right text-lg font-black text-[#092768]">{formatCurrency(order.totalAmount || 0)}</p>
                        <button
                          type="button"
                          onClick={() => openDetail(order.id)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d8e8ff] bg-white/90 px-4 text-sm font-black text-[#244ad7] shadow-[0_12px_28px_rgba(79,107,167,0.14)] transition hover:-translate-y-0.5"
                        >
                          {detailLoadingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                          Xem chi tiết
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          confirmingPayment={confirmingPaymentId === selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
          onCancel={cancelOrder}
          onConfirmPayment={confirmPayment}
        />
      )}
    </>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[1.35rem] border border-white/75 bg-white/68 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.14)] backdrop-blur-xl">
      <span className="grid h-12 w-12 place-items-center rounded-[1rem] bg-[#c6eaff] text-[#2563eb] shadow-[0_12px_28px_rgba(37,99,235,0.16)]">{icon}</span>
      <p className="mt-5 text-sm font-black text-[#51648e]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#092768]">{value}</p>
    </div>
  );
}

function OrderDetailModal({
  order,
  confirmingPayment,
  onClose,
  onCancel,
  onConfirmPayment
}: {
  order: Order;
  confirmingPayment: boolean;
  onClose: () => void;
  onCancel: (id: string) => void;
  onConfirmPayment: (id: string) => void;
}) {
  const meta = statusMeta[order.status || "pending"] || statusMeta.pending;
  const subtotal = order.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) ?? 0;
  const steps = [
    { key: "pending", label: "Chờ xác nhận", description: "Shop sẽ xác nhận đơn sớm nhất", icon: PackageCheck },
    { key: "confirmed", label: "Đang chuẩn bị", description: "Shop đang chuẩn bị hàng", icon: Store },
    { key: "shipping", label: "Đang giao", description: "Đơn hàng đang trên đường tới bạn", icon: Truck },
    { key: "delivered", label: "Đã nhận hàng", description: "Đơn hàng hoàn tất", icon: CheckCircle2 }
  ];
  const normalizedStatus = order.status === "processing" ? "confirmed" : order.status;
  const activeIndex = order.status === "cancelled" ? 0 : Math.max(0, steps.findIndex((step) => step.key === normalizedStatus));

  return (
    <div className="fixed inset-0 z-[65] grid place-items-center overflow-y-auto px-4 py-8">
      <button type="button" className="absolute inset-0 bg-[#17244f]/46 backdrop-blur-md" onClick={onClose} aria-label="Đóng chi tiết đơn hàng" />
      <section className="relative w-full max-w-5xl rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_30px_110px_rgba(20,38,84,0.34)] md:p-8">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white text-[#092768] shadow-[0_14px_34px_rgba(59,87,150,0.18)]">
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#51648e]">Chi tiết đơn hàng</p>
              <h2 className="mt-2 text-3xl font-black text-[#092768]">#{order.id.slice(0, 8).toUpperCase()}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-black", meta.className)}>{meta.label}</span>
                <span className="text-sm font-bold text-[#607198]">{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</span>
              </div>
            </div>

            <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
              <p className="font-black text-[#092768]">Trạng thái đơn hàng</p>
              <div className="mt-5 space-y-5">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const active = order.status !== "cancelled" && index <= activeIndex;
                  return (
                    <div key={step.key} className="relative flex gap-4">
                      {index < steps.length - 1 && <span className="absolute left-[18px] top-10 h-10 w-px bg-[#d6e4fa]" />}
                      <span className={cn("relative z-10 grid h-9 w-9 place-items-center rounded-full shadow-[0_8px_18px_rgba(76,107,171,0.12)]", active ? "bg-gradient-to-br from-[#3567ff] to-[#d83cff] text-white" : "bg-white text-[#8da0c4]")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block font-black text-[#092768]">{step.label}</span>
                        <span className="mt-1 block text-sm font-bold text-[#607198]">{step.description}</span>
                      </span>
                    </div>
                  );
                })}
                {order.status === "cancelled" && <p className="rounded-2xl bg-[#ffd7e8] px-4 py-3 text-sm font-black text-[#9b244f]">Đơn hàng đã được hủy.</p>}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f1ecff] text-[#7b5cff]">
                  <Store className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-black text-[#092768]">SmartCart Shop</p>
                  <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[#607198]">
                    <Star className="h-4 w-4 fill-[#f7c873] text-[#f7c873]" /> Seller SmartCart
                  </p>
                </div>
              </div>
              <Button variant="ghost" className="mt-4 w-full">
                <MessageCircle className="h-4 w-4" />
                Liên hệ shop
              </Button>
            </section>

            <OrderQrCard orderId={order.id} />
          </aside>

          <div className="space-y-5">
            <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-black text-[#092768]">Sản phẩm</h3>
                <span className="text-sm font-black text-[#3567ff]">{order.items?.length || 0} sản phẩm</span>
              </div>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={`${item.productId}-${item.productName}`} className="flex items-center justify-between gap-4 rounded-3xl border border-[#dbeaff] bg-white p-4 text-sm font-bold text-[#092768]">
                    <div>
                      <p className="font-black">{item.productName}</p>
                      <p className="mt-1 text-[#607198]">Số lượng: x{item.quantity}</p>
                    </div>
                    <span className="shrink-0 text-[#ff3d9a]">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
              <h3 className="font-black text-[#092768]">Tổng thanh toán</h3>
              <div className="mt-4 space-y-3 text-sm font-bold text-[#607198]">
                <Row label="Tạm tính" value={formatCurrency(subtotal)} />
                <Row label="Phí vận chuyển" value={formatCurrency(order.shippingFee || 0)} />
                <Row label="Phương thức" value={paymentLabel(order.paymentMethod)} />
                <Row label="Trạng thái thanh toán" value={paymentStatusLabel(order.paymentStatus)} />
                <div className="border-t border-[#dbeaff] pt-4">
                  <Row label="Tổng thanh toán" value={formatCurrency(order.totalAmount || 0)} strong />
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
                <div className="mb-3 flex items-center gap-2 font-black text-[#092768]">
                  <MapPin className="h-5 w-5 text-[#3567ff]" />
                  Địa chỉ nhận hàng
                </div>
                <p className="whitespace-pre-line text-sm font-bold leading-6 text-[#607198]">{order.shippingAddress || "Chưa cập nhật"}</p>
              </section>
              <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
                <div className="mb-3 flex items-center gap-2 font-black text-[#092768]">
                  <WalletCards className="h-5 w-5 text-[#3567ff]" />
                  Thanh toán
                </div>
                <p className="text-sm font-bold text-[#607198]">{paymentLabel(order.paymentMethod)}</p>
                <p className="mt-2 inline-flex rounded-full bg-[#e2f7ef] px-3 py-1 text-xs font-black text-[#1c9d65]">{paymentStatusLabel(order.paymentStatus)}</p>
                {order.paymentStatus === "processing" && (
                  <Button
                    className="mt-4 w-full bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90"
                    disabled={confirmingPayment}
                    onClick={() => onConfirmPayment(order.id)}
                  >
                    {confirmingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Xác nhận đã thanh toán
                  </Button>
                )}
              </section>
            </div>

            {order.note && (
              <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
                <h3 className="font-black text-[#092768]">Ghi chú</h3>
                <p className="mt-2 text-sm font-bold text-[#607198]">{order.note}</p>
              </section>
            )}

            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="ghost">
                <MessageCircle className="h-4 w-4" />
                Liên hệ shop
              </Button>
              <Button variant="ghost">
                <Star className="h-4 w-4" />
                Đánh giá sản phẩm
              </Button>
              {order.status === "pending" ? (
                <Button className="bg-[#ffd7e8] text-[#9b244f] hover:bg-[#ffc8df]" onClick={() => onCancel(order.id)}>
                  Hủy đơn hàng
                </Button>
              ) : (
                <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90">
                  <Truck className="h-4 w-4" />
                  Theo dõi đơn hàng
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", strong && "text-lg font-black text-[#092768]")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function paymentLabel(method?: string) {
  if (method === "bank_transfer") return "Chuyển khoản";
  if (method === "qr") return "Thanh toán QR";
  return "Thanh toán khi nhận hàng";
}

function paymentStatusLabel(status?: string) {
  if (status === "processing") return "Chờ xác nhận thanh toán";
  if (status === "paid") return "Đã thanh toán";
  if (status === "failed") return "Thanh toán thất bại";
  return "Chờ thanh toán";
}
