"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, Eye, Loader2, MapPin, PackageCheck, Search, Store, UserCheck, WalletCards, X, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderQrCard } from "@/components/orders/OrderQrCard";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/adminService";
import { orderService } from "@/services/orderService";
import { useToastStore } from "@/store/toastStore";
import type { Order } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

const filters = [
  { value: "all", label: "Tất cả" },
  { value: "payment", label: "Chờ thanh toán" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "cancelled", label: "Đã hủy" }
] as const;

export default function AdminOrdersPage() {
  const { showToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      setOrders(await adminService.getOrders());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được danh sách đơn hàng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesKeyword =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.items?.some((item) => item.productName?.toLowerCase().includes(query));
      const matchesFilter =
        filter === "all" ||
        (filter === "payment" && order.paymentStatus === "processing") ||
        (filter !== "payment" && order.status === filter);
      return matchesKeyword && matchesFilter;
    });
  }, [filter, keyword, orders]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      waitingPayment: orders.filter((order) => order.paymentStatus === "processing").length,
      pending: orders.filter((order) => order.status === "pending").length,
      confirmed: orders.filter((order) => order.status === "confirmed").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length
    }),
    [orders]
  );

  const updateOrder = (updated?: Order) => {
    if (!updated) return;
    setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
    setSelectedOrder((current) => (current?.id === updated.id ? updated : current));
  };

  const openDetail = async (id: string) => {
    setDetailLoadingId(id);
    try {
      const order = await adminService.getOrder(id);
      if (order) setSelectedOrder(order);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được chi tiết đơn hàng.", "error");
    } finally {
      setDetailLoadingId(null);
    }
  };

  const confirmPayment = async (id: string) => {
    setWorkingId(id);
    try {
      updateOrder(await orderService.confirmPayment(id));
      showToast("Đã xác nhận thanh toán.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không xác nhận được thanh toán.", "error");
    } finally {
      setWorkingId(null);
    }
  };

  const confirmOrder = async (id: string) => {
    setWorkingId(id);
    try {
      updateOrder(await orderService.confirmOrder(id));
      showToast("Đã xác nhận đơn hàng.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không xác nhận được đơn hàng.", "error");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <AdminShell>
      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#e9f4ff] px-4 py-2 text-sm font-black text-[#3567ff]">SmartCart Admin</p>
            <h1 className="mt-4 text-4xl font-black text-[#0b2463]">Quản lý đơn hàng</h1>
            <p className="mt-2 text-sm font-bold text-[#607198]">Xác nhận thanh toán, xác nhận đơn và theo dõi các đơn hàng trong hệ thống.</p>
          </div>
          <Button variant="ghost" onClick={loadOrders}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
            Làm mới
          </Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={<PackageCheck className="h-5 w-5" />} label="Tổng đơn hàng" value={stats.total} tone="blue" />
          <Stat icon={<CreditCard className="h-5 w-5" />} label="Chờ thanh toán" value={stats.waitingPayment} tone="purple" />
          <Stat icon={<Clock3 className="h-5 w-5" />} label="Chờ xác nhận" value={stats.pending} tone="orange" />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Đã xác nhận" value={stats.confirmed} tone="green" />
        </div>

        <div className="mt-7 rounded-[1.5rem] border border-white/80 bg-white/76 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.13)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7daa]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
                className="h-12 w-full rounded-full border border-[#d8e8ff] bg-white/86 pl-12 pr-5 text-sm font-bold text-[#11285f] outline-none focus:ring-4 focus:ring-[#bcd8ff]/55"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    "min-w-max rounded-full px-5 py-3 text-sm font-black shadow-[0_12px_28px_rgba(79,107,167,0.14)] transition",
                    filter === item.value
                      ? "bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white"
                      : "border border-[#d8e8ff] bg-white/86 text-[#11285f] hover:bg-[#eaf5ff]"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-80 place-items-center">
              <Loader2 className="h-9 w-9 animate-spin text-[#3567ff]" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <PackageCheck className="mx-auto h-12 w-12 text-[#3567ff]" />
                <p className="mt-4 text-xl font-black text-[#11285f]">Không có đơn hàng phù hợp.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  working={workingId === order.id}
                  detailLoading={detailLoadingId === order.id}
                  onOpenDetail={openDetail}
                  onConfirmPayment={confirmPayment}
                  onConfirmOrder={confirmOrder}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      {selectedOrder && (
        <AdminOrderDetailModal
          order={selectedOrder}
          working={workingId === selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
          onConfirmPayment={confirmPayment}
          onConfirmOrder={confirmOrder}
        />
      )}
    </AdminShell>
  );
}

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: "blue" | "purple" | "orange" | "green" }) {
  const toneClass = {
    blue: "bg-[#dff2ff] text-[#3567ff]",
    purple: "bg-[#eee8ff] text-[#7b5cff]",
    orange: "bg-[#ffe7c7] text-[#d17a00]",
    green: "bg-[#dff7e9] text-[#1a9d64]"
  }[tone];

  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.12)] backdrop-blur-xl">
      <span className={cn("grid h-12 w-12 place-items-center rounded-[1rem]", toneClass)}>{icon}</span>
      <p className="mt-5 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#0b2463]">{value}</p>
    </div>
  );
}

function OrderRow({
  order,
  working,
  detailLoading,
  onOpenDetail,
  onConfirmPayment,
  onConfirmOrder
}: {
  order: Order;
  working: boolean;
  detailLoading: boolean;
  onOpenDetail: (id: string) => void;
  onConfirmPayment: (id: string) => void;
  onConfirmOrder: (id: string) => void;
}) {
  const canConfirmPayment = order.paymentStatus === "processing" && order.status !== "cancelled";
  const canConfirmOrder = order.status === "pending" && (order.paymentMethod === "cod" || order.paymentStatus === "paid");
  const meta = order.status === "cancelled"
    ? { label: "Đã hủy", className: "bg-blush/70 text-[#8d2845]", icon: XCircle }
    : order.paymentStatus === "processing"
      ? { label: "Chờ thanh toán", className: "bg-[#efe9ff] text-[#6d42ff]", icon: CreditCard }
      : order.status === "confirmed"
        ? { label: "Đã xác nhận", className: "bg-mint/70 text-[#17664f]", icon: CheckCircle2 }
        : { label: "Chờ xác nhận", className: "bg-honey/35 text-[#935b00]", icon: Clock3 };
  const Icon = meta.icon;

  return (
    <article className="grid gap-4 rounded-[1.25rem] border border-[#dbeaff] bg-white/82 p-4 shadow-[0_14px_36px_rgba(76,107,171,0.12)] lg:grid-cols-[220px_1fr_180px_300px] lg:items-center">
      <div>
        <p className="font-black text-[#0b2463]">#{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="mt-1 text-sm font-bold text-[#607198]">{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</p>
        <span className={cn("mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black", meta.className)}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
      </div>

      <div>
        <p className="text-sm font-bold text-[#607198]">{order.items?.length || 0} sản phẩm</p>
        <p className="mt-1 line-clamp-2 font-black text-[#0b2463]">{order.items?.map((item) => item.productName).join(", ") || "Đơn hàng SmartCart"}</p>
        <p className="mt-2 text-xs font-black text-[#607198]">
          {paymentLabel(order.paymentMethod)} - {paymentStatusLabel(order.paymentStatus)}
        </p>
      </div>

      <p className="text-lg font-black text-[#0b2463] lg:text-right">{formatCurrency(order.totalAmount || 0)}</p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {canConfirmPayment && (
          <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" disabled={working} onClick={() => onConfirmPayment(order.id)}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Xác nhận đã thanh toán
          </Button>
        )}
        {canConfirmOrder && (
          <Button variant="ghost" disabled={working} onClick={() => onConfirmOrder(order.id)}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Xác nhận đơn
          </Button>
        )}
        <Button variant="ghost" disabled={detailLoading} onClick={() => onOpenDetail(order.id)}>
          {detailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Xem chi tiết
        </Button>
      </div>
    </article>
  );
}

function AdminOrderDetailModal({
  order,
  working,
  onClose,
  onConfirmPayment,
  onConfirmOrder
}: {
  order: Order;
  working: boolean;
  onClose: () => void;
  onConfirmPayment: (id: string) => void;
  onConfirmOrder: (id: string) => void;
}) {
  const subtotal = order.items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) ?? 0;
  const canConfirmPayment = order.paymentStatus === "processing" && order.status !== "cancelled";
  const canConfirmOrder = order.status === "pending" && (order.paymentMethod === "cod" || order.paymentStatus === "paid");
  const status = getStatusMeta(order);
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto px-4 py-8">
      <button type="button" className="absolute inset-0 bg-[#17244f]/50 backdrop-blur-md" onClick={onClose} aria-label="Đóng chi tiết đơn hàng" />
      <section className="relative w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white bg-white/96 p-6 shadow-[0_30px_110px_rgba(20,38,84,0.34)] md:p-8">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white text-[#092768] shadow-[0_14px_34px_rgba(59,87,150,0.18)]">
          <X className="h-5 w-5" />
        </button>

        <div className="pr-14">
          <p className="inline-flex rounded-full bg-[#e9f4ff] px-4 py-2 text-sm font-black text-[#3567ff]">SmartCart Admin</p>
          <h2 className="mt-4 text-3xl font-black text-[#092768]">Chi tiết đơn hàng #{order.id.slice(0, 8).toUpperCase()}</h2>
          <p className="mt-2 text-sm font-bold text-[#607198]">{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[330px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", status.className)}>
                  <StatusIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-[#607198]">Trạng thái đơn</p>
                  <p className="mt-1 font-black text-[#092768]">{status.label}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm font-bold text-[#607198]">
                <Row label="Thanh toán" value={paymentStatusLabel(order.paymentStatus)} />
                <Row label="Phương thức" value={paymentLabel(order.paymentMethod)} />
                {order.paymentExpiresAt && <Row label="Hết hạn" value={new Date(order.paymentExpiresAt).toLocaleString("vi-VN")} />}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
              <div className="mb-3 flex items-center gap-2 font-black text-[#092768]">
                <MapPin className="h-5 w-5 text-[#3567ff]" />
                Địa chỉ nhận hàng
              </div>
              <p className="whitespace-pre-line text-sm font-bold leading-6 text-[#607198]">{order.shippingAddress || "Chưa cập nhật địa chỉ nhận hàng."}</p>
            </section>

            <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
              <div className="mb-3 flex items-center gap-2 font-black text-[#092768]">
                <Store className="h-5 w-5 text-[#3567ff]" />
                Thông tin bán hàng
              </div>
              <p className="text-sm font-bold text-[#607198]">Seller/cửa hàng sẽ được hiển thị chi tiết hơn khi backend trả thêm shop info.</p>
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
                {order.items?.map((item, index) => (
                  <div key={`${item.productId || index}-${item.productName}`} className="flex items-center justify-between gap-4 rounded-3xl border border-[#dbeaff] bg-white p-4 text-sm font-bold text-[#092768]">
                    <div>
                      <p className="font-black">{item.productName || "Sản phẩm SmartCart"}</p>
                      <p className="mt-1 text-[#607198]">
                        {formatCurrency(item.unitPrice)} x {item.quantity}
                      </p>
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
                <div className="border-t border-[#dbeaff] pt-4">
                  <Row label="Tổng thanh toán" value={formatCurrency(order.totalAmount || 0)} strong />
                </div>
              </div>
            </section>

            {order.note && (
              <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5">
                <h3 className="font-black text-[#092768]">Ghi chú</h3>
                <p className="mt-2 text-sm font-bold text-[#607198]">{order.note}</p>
              </section>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {canConfirmPayment && (
                <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" disabled={working} onClick={() => onConfirmPayment(order.id)}>
                  {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                  Xác nhận đã thanh toán
                </Button>
              )}
              {canConfirmOrder && (
                <Button variant="ghost" disabled={working} onClick={() => onConfirmOrder(order.id)}>
                  {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                  Xác nhận đơn
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
      <span className="text-right">{value}</span>
    </div>
  );
}

function getStatusMeta(order: Order) {
  if (order.status === "cancelled") return { label: "Đã hủy", className: "bg-blush/70 text-[#8d2845]", icon: XCircle };
  if (order.paymentStatus === "processing") return { label: "Chờ thanh toán", className: "bg-[#efe9ff] text-[#6d42ff]", icon: CreditCard };
  if (order.status === "confirmed") return { label: "Đã xác nhận", className: "bg-mint/70 text-[#17664f]", icon: CheckCircle2 };
  return { label: "Chờ xác nhận", className: "bg-honey/35 text-[#935b00]", icon: Clock3 };
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
