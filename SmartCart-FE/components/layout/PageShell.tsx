import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { FloatingBunny } from "@/components/bunny/FloatingBunny";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <FloatingBunny />
    </>
  );
}
