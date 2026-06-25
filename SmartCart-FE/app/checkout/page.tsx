"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, CreditCard, Loader2, LockKeyhole, MapPin, PackageCheck, WalletCards, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { orderService } from "@/services/orderService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

const paymentMethods = [
  {
    value: "cod",
    label: "Thanh toán khi nhận hàng (COD)",
    description: "Thanh toán bằng tiền mặt khi nhận hàng",
    icon: WalletCards
  },
  {
    value: "bank_transfer",
    label: "Chuyển khoản ngân hàng",
    description: "Thanh toán qua tài khoản ngân hàng",
    icon: CreditCard
  },
  {
    value: "qr",
    label: "Thanh toán QR",
    description: "Quét mã QR để thanh toán nhanh",
    icon: ClipboardCheck
  }
] as const;

export default function CheckoutPage() {
  const { cart, fetchCart } = useCartStore();
  const { accessToken, hydrate } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["value"]>("cod");

  useEffect(() => {
    hydrate();
    const token = typeof window !== "undefined" ? localStorage.getItem("smartcart_access_token") : null;
    if (accessToken || token) {
      fetchCart();
      return;
    }
    openLogin();
  }, [accessToken, fetchCart, hydrate, openLogin]);

  const isLoggedIn = Boolean(accessToken || (typeof window !== "undefined" && localStorage.getItem("smartcart_access_token")));
  const subtotal = Number(cart.totalAmount || 0);
  const shippingFee = subtotal >= 200000 || cart.items.length === 0 ? 0 : 24000;
  const total = subtotal + shippingFee;
  const selectedPayment = paymentMethods.find((method) => method.value === paymentMethod) ?? paymentMethods[0];
  const orderItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const formattedAddress = useMemo(() => {
    const contact = [recipientName.trim(), recipientPhone.trim()].filter(Boolean).join(" • ");
    return [contact, shippingAddress.trim()].filter(Boolean).join("\n");
  }, [recipientName, recipientPhone, shippingAddress]);

  const placeOrder = async () => {
    if (!isLoggedIn) {
      openLogin();
      return;
    }
    if (!shippingAddress.trim()) {
      setMessage("Vui lòng nhập địa chỉ giao hàng.");
      return;
    }
    if (cart.items.length === 0) {
      setMessage("Giỏ hàng đang trống.");
      return;
    }

    setPlacing(true);
    setMessage("");
    try {
      await orderService.createOrder({
        shippingAddress: formattedAddress,
        shippingFee,
        paymentMethod,
        note: note.trim() || undefined
      });
      await fetchCart();
      setMessage("Đặt hàng thành công. Đơn hàng đã được gửi về SmartCart.");
      setShippingAddress("");
      setRecipientName("");
      setRecipientPhone("");
      setNote("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đặt hàng thất bại.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <Header overlay />
      <main className="min-h-screen bg-[#eef8ff] px-5 pb-16 pt-28 text-[#092768] md:px-8">
        <section className="fixed inset-0 bg-[#152654]/34 backdrop-blur-[3px]" aria-hidden="true" />
        <section className="relative z-10 mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-4xl place-items-center">
          <div className="relative w-full overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/94 p-6 shadow-[0_30px_110px_rgba(20,38,84,0.28)] md:p-8">
            <Link
              href="/cart"
              className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white text-[#092768] shadow-[0_14px_34px_rgba(59,87,150,0.18)] transition hover:-translate-y-0.5"
              aria-label="Quay lại giỏ hàng"
            >
              <X className="h-5 w-5" />
            </Link>

            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="relative grid h-36 w-36 place-items-center">
                <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-[#dff2ff] to-[#f3ddff] blur-sm" />
                <div className="relative grid h-28 w-28 place-items-center rounded-[2rem] bg-white shadow-[0_18px_44px_rgba(78,104,176,0.16)]">
                  <ClipboardCheck className="h-14 w-14 text-[#6b62ff]" />
                  <span className="absolute -right-1 bottom-5 grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#6f63ff] to-[#b956ff] text-white shadow-[0_12px_28px_rgba(111,99,255,0.28)]">
                    <CheckCircle2 className="h-6 w-6" />
                  </span>
                </div>
              </div>
              <h1 className="text-4xl font-black text-[#092768]">Xác nhận đơn hàng</h1>
              <p className="mt-3 font-bold text-[#607198]">Vui lòng kiểm tra thông tin đơn hàng trước khi thanh toán</p>
            </div>

            {!isLoggedIn ? (
              <div className="mx-auto mt-8 max-w-xl rounded-[1.4rem] border border-[#e4efff] bg-[#f8fbff] p-6 text-center">
                <p className="text-xl font-black text-[#092768]">Vui lòng đăng nhập để đặt hàng.</p>
                <Button className="mt-5 bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" onClick={openLogin}>
                  Đăng nhập
                </Button>
              </div>
            ) : (
              <div className="mx-auto mt-8 max-w-2xl space-y-4">
                <InfoCard
                  icon={<MapPin className="h-5 w-5" />}
                  title="Địa chỉ nhận hàng"
                  action="Thay đổi"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={recipientName}
                      onChange={(event) => setRecipientName(event.target.value)}
                      placeholder="Người nhận"
                      className="h-12 rounded-2xl border border-[#dbeaff] bg-white/90 px-4 text-sm font-bold text-[#092768] outline-none placeholder:text-[#93a0bd] focus:ring-4 focus:ring-[#bfdcff]/60"
                    />
                    <input
                      value={recipientPhone}
                      onChange={(event) => setRecipientPhone(event.target.value)}
                      placeholder="Số điện thoại"
                      className="h-12 rounded-2xl border border-[#dbeaff] bg-white/90 px-4 text-sm font-bold text-[#092768] outline-none placeholder:text-[#93a0bd] focus:ring-4 focus:ring-[#bfdcff]/60"
                    />
                  </div>
                  <textarea
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    placeholder="Nhập địa chỉ nhận hàng..."
                    className="mt-3 min-h-20 w-full resize-none rounded-2xl border border-[#dbeaff] bg-white/90 px-4 py-3 text-sm font-bold text-[#092768] outline-none placeholder:text-[#93a0bd] focus:ring-4 focus:ring-[#bfdcff]/60"
                  />
                </InfoCard>

                <InfoCard icon={<CreditCard className="h-5 w-5" />} title="Phương thức thanh toán" action="Thay đổi">
                  <div className="grid gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                            paymentMethod === method.value
                              ? "border-[#8e69ff] bg-[#f1ecff] shadow-[0_12px_28px_rgba(111,99,255,0.14)]"
                              : "border-[#dbeaff] bg-white/80 hover:bg-[#f8fbff]"
                          )}
                        >
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#6b62ff]">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block font-black text-[#092768]">{method.label}</span>
                            <span className="mt-1 block text-sm font-bold text-[#607198]">{method.description}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </InfoCard>

                <InfoCard icon={<PackageCheck className="h-5 w-5" />} title={`Đơn hàng (${orderItemCount} sản phẩm)`} action="Xem chi tiết">
                  <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 text-sm font-bold text-[#607198]">
                        <span className="line-clamp-1">{item.productName} x {item.quantity}</span>
                        <span className="shrink-0 text-[#092768]">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-3 border-t border-[#e4efff] pt-4 text-sm font-bold text-[#607198]">
                    <SummaryRow label="Tạm tính" value={formatCurrency(subtotal)} />
                    <SummaryRow label="Phí vận chuyển" value={formatCurrency(shippingFee)} muted={shippingFee === 0} />
                    <SummaryRow label="Phương thức" value={selectedPayment.label} />
                  </div>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ghi chú cho đơn hàng..."
                    className="mt-4 h-12 w-full rounded-2xl border border-[#dbeaff] bg-white/90 px-4 text-sm font-bold text-[#092768] outline-none placeholder:text-[#93a0bd] focus:ring-4 focus:ring-[#bfdcff]/60"
                  />
                </InfoCard>

                <div className="flex items-center justify-between border-t border-[#e4efff] pt-5">
                  <span className="text-lg font-black text-[#092768]">Tổng thanh toán</span>
                  <span className="text-3xl font-black text-[#ff3d9a]">{formatCurrency(total)}</span>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#3567ff] to-[#d83cff] py-4 text-base text-white shadow-[0_16px_34px_rgba(93,86,255,0.3)] hover:opacity-90"
                  disabled={placing || cart.items.length === 0}
                  onClick={placeOrder}
                >
                  {placing ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
                  Xác nhận thanh toán
                </Button>

                <p className="flex items-center justify-center gap-2 text-sm font-bold text-[#98a6c2]">
                  <LockKeyhole className="h-4 w-4" />
                  Thông tin của bạn được bảo mật tuyệt đối
                </p>
                {message && <p className="rounded-2xl bg-[#e2f7ef] px-5 py-3 text-center text-sm font-black text-[#1c9d65]">{message}</p>}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function InfoCard({ icon, title, action, children }: { icon: React.ReactNode; title: string; action: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.35rem] border border-[#e4efff] bg-white/86 p-5 shadow-[0_14px_36px_rgba(78,104,176,0.11)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e7f2ff] text-[#3567ff]">{icon}</span>
          <h2 className="font-black text-[#092768]">{title}</h2>
        </div>
        <span className="text-sm font-black text-[#4357ff]">{action}</span>
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className={muted ? "font-black text-[#1c9d65]" : "font-black text-[#092768]"}>{value}</span>
    </div>
  );
}
