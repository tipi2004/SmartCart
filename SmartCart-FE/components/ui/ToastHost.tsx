"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { useToastStore } from "@/store/toastStore";
import { cn } from "@/utils/cn";

type ToastPhase = "show" | "fly";

export function ToastHost() {
  const { message, type, visible, hideToast } = useToastStore();
  const toastRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<ToastPhase>("show");
  const [flyStyle, setFlyStyle] = useState<CSSProperties>({});

  const startFlyOut = useCallback(() => {
    const toastBox = toastRef.current?.getBoundingClientRect();
    const cartBox = document.querySelector<HTMLElement>("[data-cart-target='true']")?.getBoundingClientRect();

    if (!toastBox || !cartBox) {
      hideToast();
      return;
    }

    const toastCenterX = toastBox.left + toastBox.width / 2;
    const toastCenterY = toastBox.top + toastBox.height / 2;
    const cartCenterX = cartBox.left + cartBox.width / 2;
    const cartCenterY = cartBox.top + cartBox.height / 2;

    setFlyStyle({
      transform: `translate(calc(-50% + ${cartCenterX - toastCenterX}px), calc(-50% + ${cartCenterY - toastCenterY}px)) scale(0.35)`,
      opacity: 0
    });
    setPhase("fly");
    window.setTimeout(hideToast, 620);
  }, [hideToast]);

  useEffect(() => {
    if (!visible) return;
    setPhase("show");
    setFlyStyle({});
    const timeout = window.setTimeout(() => startFlyOut(), 1900);
    return () => window.clearTimeout(timeout);
  }, [visible, message, startFlyOut]);

  if (!visible) return null;

  const Icon = type === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      ref={toastRef}
      className={cn(
        "fixed left-1/2 top-1/2 z-[70] flex max-w-sm -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border px-5 py-3 text-sm font-black shadow-[0_24px_70px_rgba(29,49,83,0.24)] backdrop-blur-xl transition-all duration-700 ease-in-out",
        phase === "show" && "scale-100 opacity-100",
        type === "success" ? "border-mint/80 bg-white/88 text-navySoft" : "border-blush/80 bg-white/88 text-navySoft"
      )}
      style={phase === "fly" ? flyStyle : undefined}
      role="status"
    >
      <span className={cn("grid h-8 w-8 place-items-center rounded-full text-white", type === "success" ? "bg-[#4fbf9f]" : "bg-[#ef6f8f]")}>
        <Icon className="h-5 w-5" />
      </span>
      <span>{message}</span>
      <button type="button" onClick={startFlyOut} className="ml-1 grid h-7 w-7 place-items-center rounded-full bg-white/80 text-navySoft" aria-label="Dong thong bao">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
