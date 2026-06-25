"use client";

import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/products/ProductImage";
import { useCartStore } from "@/store/cartStore";
import type { CartItem } from "@/types";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/utils/cn";

type CartItemRowProps = {
  item: CartItem;
  selected: boolean;
  onToggle: (itemId: string) => void;
};

export function CartItemRow({ item, selected, onToggle }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="grid gap-4 border-b border-[#e8f1ff] bg-white/64 p-4 last:border-b-0 sm:grid-cols-[32px_112px_1fr_auto] sm:items-center md:p-5">
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className={cn(
          "grid h-6 w-6 place-items-center rounded-md border transition shadow-[0_8px_18px_rgba(53,103,255,0.16)]",
          selected ? "border-transparent bg-gradient-to-br from-[#3567ff] to-[#7d5cff] text-white" : "border-[#bcd8ff] bg-white text-transparent"
        )}
        aria-label={selected ? "Bỏ chọn sản phẩm" : "Chọn sản phẩm"}
        aria-pressed={selected}
      >
        <Check className="h-4 w-4" />
      </button>
      <div className="relative h-28 overflow-hidden rounded-[1.1rem] bg-white shadow-[0_12px_28px_rgba(76,107,171,0.12)]">
        <ProductImage src={item.productImageUrl} name={item.productName} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-[#092768]">{item.productName}</p>
        <span className="mt-3 inline-flex rounded-full bg-[#e9d8ff] px-3 py-1 text-xs font-black text-[#7441d6]">
          SmartCart
        </span>
        <p className="mt-3 text-base font-black text-[#092768]">{formatCurrency(item.unitPrice)}</p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center rounded-full bg-[#f6fbff] p-1 shadow-[0_12px_26px_rgba(76,107,171,0.13)]">
          <button
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#092768] transition hover:bg-[#eaf5ff]"
            onClick={() => updateQuantity(item.id, item.productId, item.quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="grid h-9 min-w-10 place-items-center px-2 text-sm font-black text-[#092768]">{item.quantity}</span>
          <button
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#092768] transition hover:bg-[#eaf5ff]"
            onClick={() => updateQuantity(item.id, item.productId, item.quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="w-28 text-right font-black text-[#092768]">{formatCurrency(item.subtotal)}</p>
        <button
          type="button"
          className="grid h-12 w-12 place-items-center rounded-xl bg-[#ffd7e8] text-[#ff3d8f] transition hover:bg-[#ffc8df]"
          onClick={() => removeItem(item.id)}
          aria-label="Xóa sản phẩm"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
