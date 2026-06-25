import { CloudTransition } from "@/components/sections/CloudTransition";
import { HeroSection } from "@/components/sections/HeroSection";
import { ShoppingSection } from "@/components/sections/ShoppingSection";
import { Header } from "@/components/layout/Header";

export default function HomePage() {
  return (
    <>
      <Header overlay />
      <main className="min-h-screen overflow-x-hidden bg-white">
        <HeroSection />
        <CloudTransition />
        <ShoppingSection />
      </main>
    </>
  );
}
