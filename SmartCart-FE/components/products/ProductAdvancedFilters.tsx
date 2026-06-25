"use client";

import { SlidersHorizontal, X } from "lucide-react";
import type { ProductSortOrder } from "@/utils/productFilters";

type ProductAdvancedFiltersProps = {
  sortOrder: ProductSortOrder;
  minPrice: string;
  maxPrice: string;
  resultCount: number;
  onSortOrderChange: (sortOrder: ProductSortOrder) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onClear: () => void;
};

export function ProductAdvancedFilters({
  sortOrder,
  minPrice,
  maxPrice,
  resultCount,
  onSortOrderChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear
}: ProductAdvancedFiltersProps) {
  const hasFilters = minPrice.trim() || maxPrice.trim() || sortOrder !== "newest";

  return (
    <div className="rounded-[1.25rem] border border-white/80 bg-white/78 p-4 shadow-soft backdrop-blur-xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-skyPastel text-navySoft">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div>
            <p className="font-black text-navySoft">Lọc và sắp xếp</p>
            <p className="text-xs font-bold text-navyMuted">{resultCount} sản phẩm phù hợp</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center">
          <label className="block">
            <span className="sr-only">Sắp xếp sản phẩm</span>
            <select
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value as ProductSortOrder)}
              className="h-11 w-full rounded-full border border-skyPastel/80 bg-white px-4 text-sm font-black text-navySoft shadow-button outline-none focus:ring-4 focus:ring-skyPastel/40 lg:w-48"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá thấp đến cao</option>
              <option value="price_desc">Giá cao đến thấp</option>
              <option value="name_asc">Tên A-Z</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={minPrice}
              onChange={(event) => onMinPriceChange(event.target.value)}
              inputMode="numeric"
              placeholder="Giá từ"
              className="h-11 min-w-0 rounded-full border border-skyPastel/80 bg-white px-4 text-sm font-bold text-navySoft shadow-button outline-none placeholder:text-navyMuted/60 focus:ring-4 focus:ring-skyPastel/40"
            />
            <input
              value={maxPrice}
              onChange={(event) => onMaxPriceChange(event.target.value)}
              inputMode="numeric"
              placeholder="Giá đến"
              className="h-11 min-w-0 rounded-full border border-skyPastel/80 bg-white px-4 text-sm font-bold text-navySoft shadow-button outline-none placeholder:text-navyMuted/60 focus:ring-4 focus:ring-skyPastel/40"
            />
          </div>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasFilters}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-navySoft shadow-button transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Xóa lọc
          </button>
        </div>
      </div>
    </div>
  );
}
