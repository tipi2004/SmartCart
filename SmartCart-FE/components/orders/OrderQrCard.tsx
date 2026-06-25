"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode } from "lucide-react";
import { cn } from "@/utils/cn";

export function OrderQrCard({ orderId, compact = false }: { orderId: string; compact?: boolean }) {
  const [lookupUrl, setLookupUrl] = useState("");

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    setLookupUrl(`${baseUrl}/order-lookup/${orderId}`);
  }, [orderId]);

  return (
    <section className={cn("border border-[#dbeaff] bg-white text-[#092768]", compact ? "rounded-xl p-3" : "rounded-[1.35rem] p-5")}>
      <div className="flex items-center gap-2 font-black">
        <QrCode className="h-5 w-5 text-[#3567ff]" />
        Mã QR đơn hàng
      </div>
      <div className={cn("mt-3 flex items-center", compact ? "gap-3" : "flex-col gap-3 text-center")}>
        <div className="rounded-lg bg-white p-2 shadow-[0_10px_28px_rgba(53,103,255,0.15)]">
          {lookupUrl ? (
            <QRCodeSVG
              value={lookupUrl}
              size={compact ? 88 : 156}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#092768"
            />
          ) : (
            <div className={cn("animate-pulse rounded bg-[#eef6ff]", compact ? "h-[88px] w-[88px]" : "h-[156px] w-[156px]")} />
          )}
        </div>
        <div className={cn(compact ? "min-w-0 text-left" : "")}>
          <p className="text-xs font-bold text-[#607198]">Quét để mở đơn hàng</p>
          <p className="mt-1 break-all text-xs font-black text-[#3567ff]">#{orderId.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>
    </section>
  );
}
