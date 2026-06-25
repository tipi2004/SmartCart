"use client";

import { Sparkle } from "lucide-react";
import { useProductStore } from "@/store/productStore";
import { cn } from "@/utils/cn";

const fallbackCategories = ["Đồ ăn", "Đồ uống", "Đồ dùng", "Sách", "Đồ chơi"];

export function CategoryPills() {
  const { categories, selectedCategoryId, setCategory } = useProductStore();
  const visibleCategories = categories.length > 0 ? categories : fallbackCategories.map((name) => ({ id: name, name }));

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 soft-scrollbar">
      <button
        onClick={() => setCategory(null)}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-black shadow-soft transition",
          !selectedCategoryId ? "bg-navySoft text-white" : "bg-white text-navySoft"
        )}
      >
        <Sparkle className="h-4 w-4" />
        Tất cả
      </button>
      {visibleCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => setCategory(categories.length > 0 ? category.id : null)}
          className={cn(
            "shrink-0 rounded-full px-5 py-3 text-sm font-black shadow-soft transition hover:-translate-y-0.5",
            selectedCategoryId === category.id ? "bg-navySoft text-white" : "bg-white text-navySoft"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
