"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Loader2,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  WalletCards,
  X
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { Button } from "@/components/ui/Button";
import { orderService } from "@/services/orderService";
import { userService } from "@/services/userService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
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

export default function CartPage() {
  const router = useRouter();
  const { cart, fetchCart, removeItem, error } = useCartStore();
  const { accessToken, hydrate } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { showToast } = useToastStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["value"]>("cod");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    hydrate();
    const token = typeof window !== "undefined" ? localStorage.getItem("smartcart_access_token") : null;
    if (accessToken || token) {
      fetchCart();
      return;
    }
    openLogin();
  }, [accessToken, fetchCart, hydrate, openLogin]);

  useEffect(() => {
    setSelectedIds((current) => {
      const availableIds = cart.items.map((item) => item.id);
      const keptIds = current.filter((id) => availableIds.includes(id));
      if (current.length === 0 && availableIds.length > 0) return availableIds;
      return keptIds;
    });
  }, [cart.items]);

  const isLoggedIn = Boolean(accessToken || (typeof window !== "undefined" && localStorage.getItem("smartcart_access_token")));
  const selectedItems = useMemo(() => cart.items.filter((item) => selectedIds.includes(item.id)), [cart.items, selectedIds]);
  const selectedTotalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedTotalAmount = selectedItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const allSelected = cart.items.length > 0 && selectedIds.length === cart.items.length;
  const shippingFee = selectedTotalAmount >= 200000 || selectedItems.length === 0 ? 0 : 24000;
  const freeShipRemaining = Math.max(0, 200000 - selectedTotalAmount);
  const finalTotal = selectedTotalAmount + shippingFee;
  const freeShipProgress = selectedItems.length === 0 ? 0 : Math.min(100, (selectedTotalAmount / 200000) * 100);

  const toggleItem = (itemId: string) => {
    setSelectedIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : cart.items.map((item) => item.id));
  };

  const removeSelectedItems = async () => {
    if (selectedIds.length === 0) {
      showToast("Vui lòng chọn sản phẩm cần xóa.", "error");
      return;
    }

    try {
      for (const itemId of selectedIds) {
        await removeItem(itemId);
      }
      setSelectedIds([]);
      showToast("Đã xóa sản phẩm đã chọn.");
    } catch (removeError) {
      showToast(removeError instanceof Error ? removeError.message : "Không xóa được sản phẩm đã chọn.", "error");
    }
  };

  const openConfirmOrder = async () => {
    if (cart.items.length === 0) return;
    if (!shippingAddress.trim()) {
      try {
        const profile = await userService.getProfile();
        if (profile?.shippingAddress) setShippingAddress(profile.shippingAddress);
        if (!recipientName.trim() && profile?.fullName) setRecipientName(profile.fullName);
        if (!recipientPhone.trim() && profile?.phone) setRecipientPhone(profile.phone);
      } catch {
        // Checkout can still continue if profile prefill is not available.
      }
    }
    setCreatedOrderId(null);
    setCheckoutError("");
    setConfirmOpen(true);
  };

  const placeOrder = async () => {
    if (!shippingAddress.trim()) {
      setCheckoutError("Vui lòng nhập địa chỉ nhận hàng trước khi xác nhận thanh toán.");
      showToast("Vui lòng nhập địa chỉ nhận hàng.", "error");
      return;
    }

    const contact = [recipientName.trim(), recipientPhone.trim()].filter(Boolean).join(" • ");
    const formattedAddress = [contact, shippingAddress.trim()].filter(Boolean).join("\n");

    setPlacing(true);
    setCheckoutError("");
    try {
      const order = await orderService.createOrder({
        shippingAddress: formattedAddress,
        shippingFee,
        paymentMethod,
        note: note.trim() || undefined,
        selectedItemIds: selectedIds
      });
      await fetchCart();
      setSelectedIds([]);
      setCreatedOrderId(order?.id ?? "created");
      setRecipientName("");
      setRecipientPhone("");
      setShippingAddress("");
      setNote("");
      showToast("Đặt hàng thành công.");
    } catch (orderError) {
      setCheckoutError(orderError instanceof Error ? orderError.message : "Đặt hàng thất bại. Vui lòng thử lại.");
      showToast(orderError instanceof Error ? orderError.message : "Đặt hàng thất bại.", "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <Header overlay />
      <main className="min-h-screen bg-[#eef8ff] px-3 pb-24 pt-36 text-[#092768] sm:px-5 md:px-8 md:pt-32">
        <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div>
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-[1.25rem] bg-[#dff2ff] text-[#3567ff] shadow-[0_18px_42px_rgba(53,103,255,0.14)] sm:h-16 sm:w-16">
                <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8" />
              </span>
              <div>
                <h1 className="text-3xl font-black text-[#092768] sm:text-4xl">Giỏ hàng</h1>
                <p className="mt-1 font-bold text-[#607198]">{cart.totalItems} sản phẩm trong giỏ hàng</p>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="mt-8 rounded-[1.5rem] border border-white/75 bg-white/72 p-8 text-center shadow-[0_24px_70px_rgba(72,108,176,0.15)] backdrop-blur-xl">
                <p className="text-xl font-black text-[#092768]">Vui lòng đăng nhập để xem giỏ hàng.</p>
                <Button className="mt-5 bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" onClick={openLogin}>
                  Đăng nhập
                </Button>
              </div>
            )}

            {error && <p className="mt-4 rounded-full bg-[#ffd7e8] px-5 py-3 text-sm font-bold text-[#092768]">{error}</p>}

            {isLoggedIn && (
              <div className="mt-8 space-y-5">
                <div className="rounded-[1.25rem] border border-white/75 bg-white/72 p-5 shadow-[0_18px_42px_rgba(72,108,176,0.13)] backdrop-blur-xl">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7e4ff] text-[#5f6cff]">
                        <ShieldCheck className="h-5 w-5" />
                      </span>
                      <p className="font-black text-[#092768]">
                        {shippingFee === 0 ? "Bạn đang được miễn phí vận chuyển." : "Bạn đang gần đạt miễn phí vận chuyển."}
                      </p>
                    </div>
                    <div className="min-w-[260px]">
                      <p className="mb-2 text-sm font-bold text-[#607198]">
                        {shippingFee === 0 ? "Đơn hàng đã đạt mốc miễn phí vận chuyển" : `Còn ${formatCurrency(freeShipRemaining)} để đạt miễn phí vận chuyển`}
                      </p>
                      <div className="h-2 overflow-hidden rounded-full bg-[#e9eef8]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#3567ff] to-[#d83cff]" style={{ width: `${freeShipProgress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {cart.items.length > 0 ? (
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/72 shadow-[0_24px_70px_rgba(72,108,176,0.15)] backdrop-blur-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8f1ff] px-4 py-4 sm:px-5">
                      <button type="button" onClick={toggleAll} className="flex items-center gap-3 font-black text-[#092768]">
                        <span
                          className={cn(
                            "grid h-6 w-6 place-items-center rounded-md border transition",
                            allSelected ? "border-transparent bg-gradient-to-br from-[#3567ff] to-[#7d5cff] text-white" : "border-[#bcd8ff] bg-white text-transparent"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </span>
                        Chọn tất cả ({cart.items.length})
                      </button>
                      <button
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-[#5f6cff] transition hover:bg-[#eaf5ff] disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                        onClick={removeSelectedItems}
                        disabled={selectedIds.length === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa đã chọn
                      </button>
                    </div>
                    {cart.items.map((item) => (
                      <CartItemRow key={item.id} item={item} selected={selectedIds.includes(item.id)} onToggle={toggleItem} />
                    ))}
                  </div>
                ) : (
                  <div className="grid min-h-72 place-items-center rounded-[1.5rem] border border-white/75 bg-white/72 p-8 text-center shadow-[0_24px_70px_rgba(72,108,176,0.15)] backdrop-blur-xl">
                    <div>
                      <ShoppingBag className="mx-auto h-12 w-12 text-[#3567ff]" />
                      <p className="mt-4 text-xl font-black text-[#092768]">Giỏ hàng đang trống.</p>
                      <Link href="/shop" className="mt-5 inline-block">
                        <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90">Đi mua sắm</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {isLoggedIn && (
            <aside className="space-y-5 lg:sticky lg:top-28 lg:h-max">
              <div className="rounded-[1.5rem] border border-white/75 bg-white/78 p-4 shadow-[0_24px_70px_rgba(72,108,176,0.15)] backdrop-blur-xl sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e7e4ff] text-[#3567ff]">
                    <ShoppingBag className="h-5 w-5" />
                  </span>
                  <p className="text-lg font-black text-[#092768]">Tổng kết đơn hàng</p>
                </div>
                <div className="mt-6 space-y-4">
                  <SummaryRow label={`Tạm tính (${selectedTotalItems} sản phẩm)`} value={formatCurrency(selectedTotalAmount)} />
                  <SummaryRow label="Phí vận chuyển" value={formatCurrency(shippingFee)} mutedValue={shippingFee === 0} />
                  <div className="border-t border-[#e8f1ff] pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-base font-black text-[#092768]">Tổng thanh toán</span>
                      <span className="text-2xl font-black text-[#ff3d9a]">{formatCurrency(finalTotal)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="mt-6 w-full bg-gradient-to-r from-[#3567ff] to-[#d83cff] py-4 text-white shadow-[0_16px_34px_rgba(93,86,255,0.28)] hover:opacity-90"
                  disabled={selectedIds.length === 0}
                  onClick={openConfirmOrder}
                >
                  Thanh toán ({selectedTotalItems}) <ArrowRight className="h-4 w-4" />
                </Button>
                {shippingFee === 0 && (
                  <div className="mt-4 rounded-full bg-[#e2f7ef] px-4 py-2 text-center text-sm font-black text-[#1c9d65]">
                    Bạn đã tiết kiệm phí vận chuyển
                  </div>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-white/75 bg-white/72 p-5 shadow-[0_18px_42px_rgba(72,108,176,0.13)] backdrop-blur-xl">
                <p className="mb-4 font-black text-[#092768]">Quyền lợi SmartCart</p>
                <div className="grid gap-3 text-sm font-bold text-[#607198]">
                  <Benefit icon={<Truck className="h-4 w-4" />} text="Miễn phí vận chuyển đơn từ 200k" />
                  <Benefit icon={<Sparkles className="h-4 w-4" />} text="Đổi trả dễ dàng trong 7 ngày" />
                  <Benefit icon={<PackageCheck className="h-4 w-4" />} text="Thanh toán an toàn" />
                </div>
              </div>
            </aside>
          )}
        </section>
      </main>
      {confirmOpen && (
        <ConfirmOrderModal
          cartItems={selectedItems}
          orderItemCount={selectedTotalItems}
          subtotal={selectedTotalAmount}
          shippingFee={shippingFee}
          total={finalTotal}
          placing={placing}
          recipientName={recipientName}
          recipientPhone={recipientPhone}
          shippingAddress={shippingAddress}
          note={note}
          paymentMethod={paymentMethod}
          checkoutError={checkoutError}
          onRecipientNameChange={setRecipientName}
          onRecipientPhoneChange={setRecipientPhone}
          onShippingAddressChange={setShippingAddress}
          onNoteChange={setNote}
          onPaymentMethodChange={setPaymentMethod}
          createdOrderId={createdOrderId}
          onClose={() => {
            setConfirmOpen(false);
            setCreatedOrderId(null);
            setCheckoutError("");
          }}
          onViewOrders={() => {
            setConfirmOpen(false);
            setCreatedOrderId(null);
            router.push("/orders");
          }}
          onContinueShopping={() => {
            setConfirmOpen(false);
            setCreatedOrderId(null);
            router.push("/#shop");
          }}
          onConfirm={placeOrder}
        />
      )}
    </>
  );
}

function SummaryRow({ label, value, mutedValue = false }: { label: string; value: string; mutedValue?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm font-bold text-[#607198]">
      <span>{label}</span>
      <span className={mutedValue ? "text-[#1c9d65]" : "text-[#092768]"}>{value}</span>
    </div>
  );
}

function Benefit({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#dff2ff] text-[#3567ff]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

type ConfirmOrderModalProps = {
  cartItems: Array<{ id: string; productName: string; quantity: number; subtotal: number }>;
  orderItemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  placing: boolean;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  note: string;
  paymentMethod: (typeof paymentMethods)[number]["value"];
  checkoutError: string;
  onRecipientNameChange: (value: string) => void;
  onRecipientPhoneChange: (value: string) => void;
  onShippingAddressChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onPaymentMethodChange: (value: (typeof paymentMethods)[number]["value"]) => void;
  createdOrderId: string | null;
  onClose: () => void;
  onViewOrders: () => void;
  onContinueShopping: () => void;
  onConfirm: () => void;
};

function ConfirmOrderModal({
  cartItems,
  orderItemCount,
  subtotal,
  shippingFee,
  total,
  placing,
  recipientName,
  recipientPhone,
  shippingAddress,
  note,
  paymentMethod,
  checkoutError,
  onRecipientNameChange,
  onRecipientPhoneChange,
  onShippingAddressChange,
  onNoteChange,
  onPaymentMethodChange,
  createdOrderId,
  onClose,
  onViewOrders,
  onContinueShopping,
  onConfirm
}: ConfirmOrderModalProps) {
  const selectedPayment = paymentMethods.find((method) => method.value === paymentMethod) ?? paymentMethods[0];

  if (createdOrderId) {
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto px-2 py-3 sm:px-4 sm:py-8">
        <button type="button" className="absolute inset-0 bg-[#17244f]/58 backdrop-blur-[5px]" onClick={onClose} aria-label="Đóng thông báo đặt hàng thành công" />
        <section className="relative w-full max-w-xl rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_30px_110px_rgba(20,38,84,0.34)] sm:rounded-[1.75rem] sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white text-[#092768] shadow-[0_14px_34px_rgba(59,87,150,0.18)] transition hover:-translate-y-0.5"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto flex max-w-md flex-col items-center py-8 text-center">
            <div className="relative grid h-36 w-36 place-items-center">
              <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-[#dff2ff] to-[#f3ddff] blur-sm" />
              <div className="relative grid h-28 w-28 place-items-center rounded-[2rem] bg-white shadow-[0_18px_44px_rgba(78,104,176,0.16)]">
                <CheckCircle2 className="h-16 w-16 text-[#33b978]" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-[#092768] sm:text-4xl">Đặt hàng thành công</h2>
            <p className="mt-3 font-bold text-[#607198]">
              Đơn hàng của bạn đã được gửi tới SmartCart. Bạn có thể theo dõi trạng thái trong mục đơn hàng.
            </p>
            {createdOrderId !== "created" && (
              <p className="mt-4 rounded-full bg-[#eef6ff] px-4 py-2 text-sm font-black text-[#3567ff]">
                Mã đơn: #{createdOrderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
              <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" onClick={onViewOrders}>
                Xem đơn hàng
              </Button>
              <Button variant="ghost" onClick={onContinueShopping}>
                Tiếp tục mua sắm
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto px-2 py-3 sm:px-4 sm:py-8">
      <button type="button" className="absolute inset-0 bg-[#17244f]/58 backdrop-blur-[5px]" onClick={onClose} aria-label="Đóng xác nhận đơn hàng" />
      <section className="relative flex max-h-[calc(100svh-1rem)] w-full max-w-2xl flex-col overflow-y-auto rounded-[1.5rem] border border-white bg-white p-4 shadow-[0_30px_110px_rgba(20,38,84,0.34)] sm:rounded-[1.75rem] sm:p-6 md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-white text-[#092768] shadow-[0_14px_34px_rgba(59,87,150,0.18)] transition hover:-translate-y-0.5"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

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
          <h2 className="text-3xl font-black text-[#092768] sm:text-4xl">Xác nhận đơn hàng</h2>
          <p className="mt-3 font-bold text-[#607198]">Vui lòng kiểm tra thông tin đơn hàng trước khi thanh toán</p>
        </div>

        <div className="mt-8 space-y-4">
          <InfoCard icon={<MapPin className="h-5 w-5" />} title="Địa chỉ nhận hàng" action="Thay đổi">
            <div className="grid gap-3 md:grid-cols-2">
              <input value={recipientName} onChange={(event) => onRecipientNameChange(event.target.value)} placeholder="Người nhận" className="h-12 rounded-2xl border border-[#dbeaff] bg-white px-4 text-sm font-bold text-[#092768] outline-none placeholder:text-[#93a0bd] focus:ring-4 focus:ring-[#bfdcff]/60" />
              <input value={recipientPhone} onChange={(event) => onRecipientPhoneChange(event.target.value)} placeholder="Số điện thoại" className="h-12 rounded-2xl border border-[#dbeaff] bg-white px-4 text-sm font-bold text-[#092768] outline-none placeholder:text-[#93a0bd] focus:ring-4 focus:ring-[#bfdcff]/60" />
            </div>
            <textarea value={shippingAddress} onChange={(event) => onShippingAddressChange(event.target.value)} placeholder="Nhập địa chỉ nhận hàng..." className="mt-3 min-h-20 w-full resize-none rounded-2xl border border-[#dbeaff] bg-white px-4 py-3 text-sm font-bold text-[#092768] outline-none placeholder:text-[#93a0bd] focus:ring-4 focus:ring-[#bfdcff]/60" />
          </InfoCard>

          <InfoCard icon={<CreditCard className="h-5 w-5" />} title="Phương thức thanh toán" action="Thay đổi">
            <div className="grid gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => onPaymentMethodChange(method.value)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                      paymentMethod === method.value ? "border-[#8e69ff] bg-[#f1ecff] shadow-[0_12px_28px_rgba(111,99,255,0.14)]" : "border-[#dbeaff] bg-white hover:bg-[#f8fbff]"
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
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm font-bold text-[#607198]">
                  <span className="line-clamp-1">{item.productName} x {item.quantity}</span>
                  <span className="shrink-0 text-[#092768]">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3 border-t border-[#e4efff] pt-4 text-sm font-bold text-[#607198]">
              <ModalSummaryRow label="Tạm tính" value={formatCurrency(subtotal)} />
              <ModalSummaryRow label="Phí vận chuyển" value={formatCurrency(shippingFee)} muted={shippingFee === 0} />
              <ModalSummaryRow label="Phương thức" value={selectedPayment.label} />
            </div>
            <input value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Ghi chú cho đơn hàng..." className="mt-4 h-12 w-full rounded-2xl border border-[#dbeaff] bg-white px-4 text-sm font-bold text-[#092768] outline-none placeholder:text-[#93a0bd] focus:ring-4 focus:ring-[#bfdcff]/60" />
          </InfoCard>

          <div className="flex items-center justify-between border-t border-[#e4efff] pt-5">
            <span className="text-lg font-black text-[#092768]">Tổng thanh toán</span>
            <span className="text-3xl font-black text-[#ff3d9a]">{formatCurrency(total)}</span>
          </div>

          {checkoutError && (
            <p className="rounded-2xl bg-[#ffd7e8] px-5 py-3 text-center text-sm font-black text-[#9b244f]">
              {checkoutError}
            </p>
          )}

          <Button className="w-full bg-gradient-to-r from-[#3567ff] to-[#d83cff] py-4 text-base text-white shadow-[0_16px_34px_rgba(93,86,255,0.3)] hover:opacity-90" disabled={placing} onClick={onConfirm}>
            {placing ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
            Xác nhận thanh toán
          </Button>

          <p className="flex items-center justify-center gap-2 text-sm font-bold text-[#98a6c2]">
            <LockKeyhole className="h-4 w-4" />
            Thông tin của bạn được bảo mật tuyệt đối
          </p>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon, title, action, children }: { icon: ReactNode; title: string; action: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.35rem] border border-[#e4efff] bg-[#f8fbff] p-5 shadow-[0_14px_36px_rgba(78,104,176,0.11)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e7f2ff] text-[#3567ff]">{icon}</span>
          <h3 className="font-black text-[#092768]">{title}</h3>
        </div>
        <span className="text-sm font-black text-[#4357ff]">{action}</span>
      </div>
      {children}
    </section>
  );
}

function ModalSummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className={muted ? "font-black text-[#1c9d65]" : "font-black text-[#092768]"}>{value}</span>
    </div>
  );
}
