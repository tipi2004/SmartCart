import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "cream";
  children: ReactNode;
};

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-skyPastel/50 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-navySoft text-white shadow-button hover:-translate-y-0.5 hover:bg-[#28436c]",
        variant === "ghost" && "bg-white/75 text-navySoft shadow-soft hover:bg-white",
        variant === "cream" && "bg-cream text-navySoft shadow-button hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
