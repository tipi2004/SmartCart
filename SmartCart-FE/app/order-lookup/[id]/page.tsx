"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, MapPin, PackageCheck, QrCode, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { orderService } from "@/services/orderService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import type { Order } from "@/types";
import { formatCurrency } from "@/utils/format";

export default function OrderLookupPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const { accessToken, hydrate } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!orderId) return;
    const token = accessToken || localStorage.getItem("smartcart_access_token");
    if (!token) {
      setLoading(false);
      openLogin();
      return;
    }

    setLoading(true);
    setError("");
    orderService
      .lookupOrder(orderId)
      .then((data) => {
        if (!data) throw new Error("Không tìm thấy đơn hàng.");
        setOrder(data);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Không thể tra cứu đơn hàng.");
      })
      .finally(() => setLoading(false));
  }, [accessToken, openLogin, orderId]);

  return (
    <>
      <Header overlay />
      <main className="min-h-screen bg-[#eef8ff] px-4 pb-20 pt-28 text-[#092768] md:px-8">
        <section className="mx-auto max-w-4xl">
          <div className="rounded-[1.5rem] border border-white bg-white/92 p-6 shadow-[0_24px_70px_rgba(72,108,176,0.18)] md:p-8">
            {loading ? (
              <div className="grid min-h-[28rem] place-items-center">
                <Loader2 className="h-9 w-9 animate-spin text-[#3567ff]" />
              </div>
            ) : error ? (
              <div className="grid min-h-[28rem] place-items-center text-center">
                <div>
                  <ShieldCheck className="mx-auto h-14 w-14 text-[#ff5c9d]" />
                  <h1 className="mt-5 text-2xl font-black">Không thể mở đơn hàng</h1>
                  <p className="mt-2 font-bold text-[#607198]">{error}</p>
                  <Link href="/" className="mt-6 inline-block">
                    <Button>Về trang chủ</Button>
                  </Link>
                </div>
              </div>
            ) : order ? (
              <>
                <header className="flex flex-col gap-5 border-b border-[#dbeaff] pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-black text-[#3567ff]">
                      <QrCode className="h-5 w-5" />
                      Tra cứu từ mã QR
                    </p>
                    <h1 className="mt-2 text-3xl font-black">Đơn hàng #{order.id.slice(0, 8).toUpperCase()}</h1>
                    <p className="mt-2 text-sm font-bold text-[#607198]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#dff7eb] px-4 py-2 text-sm font-black text-[#17664f]">
                    {statusLabel(order.status)}
                  </span>
                </header>

                <div className="mt-6 grid gap-5 md:grid-cols-[1fr_280px]">
                  <section className="space-y-3">
                    <h2 className="flex items-center gap-2 text-lg font-black">
                      <PackageCheck className="h-5 w-5 text-[#3567ff]" />
                      Sản phẩm trong đơn
                    </h2>
                    {order.items?.map((item) => (
                      <div key={`${item.productId}-${item.productName}`} className="flex items-center justify-between gap-4 rounded-xl border border-[#dbeaff] bg-[#f8fbff] p-4">
                        <div>
                          <p className="font-black">{item.productName || "Sản phẩm SmartCart"}</p>
                          <p className="mt-1 text-sm font-bold text-[#607198]">Số lượng: {item.quantity}</p>
                        </div>
                        <p className="shrink-0 font-black text-[#ff3d9a]">{formatCurrency(item.subtotal || 0)}</p>
                      </div>
                    ))}
                  </section>

                  <aside className="space-y-4">
                    <section className="rounded-xl border border-[#dbeaff] bg-[#f8fbff] p-5">
                      <h2 className="font-black">Thanh toán</h2>
                      <InfoRow label="Tạm tính" value={formatCurrency((order.totalAmount || 0) - (order.shippingFee || 0))} />
                      <InfoRow label="Phí vận chuyển" value={formatCurrency(order.shippingFee || 0)} />
                      <InfoRow label="Tổng cộng" value={formatCurrency(order.totalAmount || 0)} strong />
                    </section>
                    <section className="rounded-xl border border-[#dbeaff] bg-[#f8fbff] p-5">
                      <h2 className="flex items-center gap-2 font-black">
                        <MapPin className="h-5 w-5 text-[#3567ff]" />
                        Địa chỉ nhận hàng
                      </h2>
                      <p className="mt-3 whitespace-pre-line text-sm font-bold leading-6 text-[#607198]">
                        {order.shippingAddress || "Chưa cập nhật địa chỉ."}
                      </p>
                    </section>
                  </aside>
                </div>
              </>
            ) : (
              <div className="grid min-h-[28rem] place-items-center text-center">
                <div>
                  <p className="font-bold text-[#607198]">Đăng nhập để tra cứu đơn hàng từ mã QR.</p>
                  <Button className="mt-5" onClick={openLogin}>Đăng nhập</Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`mt-3 flex justify-between gap-3 text-sm ${strong ? "border-t border-[#dbeaff] pt-3 text-base font-black" : "font-bold text-[#607198]"}`}>
      <span>{label}</span>
      <span className={strong ? "text-[#ff3d9a]" : "text-[#092768]"}>{value}</span>
    </div>
  );
}

function statusLabel(status?: string) {
  if (status === "confirmed") return "Đã xác nhận";
  if (status === "shipping") return "Đang giao";
  if (status === "delivered") return "Đã giao";
  if (status === "cancelled") return "Đã hủy";
  return "Chờ xác nhận";
}
