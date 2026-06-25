"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, Loader2, PackageCheck, QrCode, Search, WalletCards, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/adminService";
import { orderService } from "@/services/orderService";
import { useToastStore } from "@/store/toastStore";
import type { Order } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

const filters = [
  { value: "processing", label: "Chờ xác nhận" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "failed", label: "Thất bại/quá hạn" },
  { value: "all", label: "Tất cả" }
] as const;

export default function AdminPaymentsPage() {
  const { showToast } = useToastStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("processing");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await adminService.getOrders();
      setOrders(allOrders.filter((order) => order.paymentMethod === "bank_transfer" || order.paymentMethod === "qr"));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được danh sách thanh toán.", "error");
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
      const matchesFilter = filter === "all" || order.paymentStatus === filter;
      return matchesKeyword && matchesFilter;
    });
  }, [filter, keyword, orders]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      processing: orders.filter((order) => order.paymentStatus === "processing").length,
      paid: orders.filter((order) => order.paymentStatus === "paid").length,
      failed: orders.filter((order) => order.paymentStatus === "failed").length
    }),
    [orders]
  );

  const confirmPayment = async (id: string) => {
    setWorkingId(id);
    try {
      const updated = await orderService.confirmPayment(id);
      if (updated) {
        setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
      }
      showToast("Đã xác nhận thanh toán.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không xác nhận được thanh toán.", "error");
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
            <h1 className="mt-4 text-4xl font-black text-[#0b2463]">Quản lý thanh toán</h1>
            <p className="mt-2 text-sm font-bold text-[#607198]">Xác nhận các đơn chuyển khoản ngân hàng và thanh toán QR.</p>
          </div>
          <Button variant="ghost" onClick={loadOrders}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
            Làm mới
          </Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={<WalletCards className="h-5 w-5" />} label="Tổng giao dịch" value={stats.total} tone="blue" />
          <Stat icon={<Clock3 className="h-5 w-5" />} label="Chờ xác nhận" value={stats.processing} tone="purple" />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Đã thanh toán" value={stats.paid} tone="green" />
          <Stat icon={<XCircle className="h-5 w-5" />} label="Thất bại/quá hạn" value={stats.failed} tone="pink" />
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
                <WalletCards className="mx-auto h-12 w-12 text-[#3567ff]" />
                <p className="mt-4 text-xl font-black text-[#11285f]">Không có giao dịch phù hợp.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredOrders.map((order) => (
                <PaymentRow key={order.id} order={order} working={workingId === order.id} onConfirmPayment={confirmPayment} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function PaymentRow({ order, working, onConfirmPayment }: { order: Order; working: boolean; onConfirmPayment: (id: string) => void }) {
  const pending = order.paymentStatus === "processing" && order.status !== "cancelled";
  const transferCode = `SMARTCART-${order.id.slice(0, 8).toUpperCase()}`;
  const status = paymentStatusMeta(order.paymentStatus);
  const StatusIcon = status.icon;

  return (
    <article className="grid gap-4 rounded-[1.25rem] border border-[#dbeaff] bg-white/82 p-4 shadow-[0_14px_36px_rgba(76,107,171,0.12)] lg:grid-cols-[220px_1fr_190px_260px] lg:items-center">
      <div>
        <p className="font-black text-[#0b2463]">#{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="mt-1 text-sm font-bold text-[#607198]">{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</p>
        <span className={cn("mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black", status.className)}>
          <StatusIcon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>

      <div>
        <p className="line-clamp-2 font-black text-[#0b2463]">{order.items?.map((item) => item.productName).join(", ") || "Đơn hàng SmartCart"}</p>
        <div className="mt-3 grid gap-2 text-xs font-black text-[#607198] sm:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            {order.paymentMethod === "qr" ? <QrCode className="h-4 w-4 text-[#6d42ff]" /> : <CreditCard className="h-4 w-4 text-[#3567ff]" />}
            {paymentLabel(order.paymentMethod)}
          </span>
          <span>Nội dung: {transferCode}</span>
          {order.paymentExpiresAt && <span>Hết hạn: {new Date(order.paymentExpiresAt).toLocaleString("vi-VN")}</span>}
        </div>
      </div>

      <p className="text-lg font-black text-[#0b2463] lg:text-right">{formatCurrency(order.totalAmount || 0)}</p>

      <div className="flex justify-start lg:justify-end">
        {pending ? (
          <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" disabled={working} onClick={() => onConfirmPayment(order.id)}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Xác nhận thanh toán
          </Button>
        ) : (
          <Button variant="ghost">
            <PackageCheck className="h-4 w-4" />
            Đã xử lý
          </Button>
        )}
      </div>
    </article>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "purple" | "green" | "pink" }) {
  const toneClass = {
    blue: "bg-[#dff2ff] text-[#3567ff]",
    purple: "bg-[#eee8ff] text-[#7b5cff]",
    green: "bg-[#dff7e9] text-[#1a9d64]",
    pink: "bg-[#ffe3ef] text-[#c93472]"
  }[tone];

  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.12)] backdrop-blur-xl">
      <span className={cn("grid h-12 w-12 place-items-center rounded-[1rem]", toneClass)}>{icon}</span>
      <p className="mt-5 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#0b2463]">{value}</p>
    </div>
  );
}

function paymentStatusMeta(status?: string) {
  if (status === "paid") return { label: "Đã thanh toán", className: "bg-mint/70 text-[#17664f]", icon: CheckCircle2 };
  if (status === "failed") return { label: "Thất bại/quá hạn", className: "bg-blush/70 text-[#8d2845]", icon: XCircle };
  if (status === "processing") return { label: "Chờ xác nhận", className: "bg-[#efe9ff] text-[#6d42ff]", icon: Clock3 };
  return { label: "Chờ thanh toán", className: "bg-honey/35 text-[#935b00]", icon: Clock3 };
}

function paymentLabel(method?: string) {
  if (method === "bank_transfer") return "Chuyển khoản ngân hàng";
  if (method === "qr") return "Thanh toán QR";
  return "Thanh toán khi nhận hàng";
}
