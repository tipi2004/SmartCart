"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";

export function ProductImage({ src, name }: { src?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full min-h-44 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-skyPastel via-white to-blush">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-white/80 text-navySoft shadow-soft">
          <ShoppingBag className="h-9 w-9" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}
