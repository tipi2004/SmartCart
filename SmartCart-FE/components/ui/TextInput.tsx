import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-full border border-white/80 bg-white/85 px-5 text-sm text-navySoft shadow-soft outline-none transition placeholder:text-navyMuted/60 focus:border-skyPastel focus:ring-4 focus:ring-skyPastel/30",
        className
      )}
      {...props}
    />
  );
}
