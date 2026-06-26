import { CloudTransition } from "@/components/sections/CloudTransition";
import { HeroSection } from "@/components/sections/HeroSection";
import { ShoppingSection } from "@/components/sections/ShoppingSection";
import { Header } from "@/components/layout/Header";
import { MobileHome } from "@/components/mobile/MobileHome";

export default function HomePage() {
  return (
    <>
      <div className="hidden md:block">
        <Header overlay />
        <main className="min-h-screen overflow-x-hidden bg-white">
          <HeroSection />
          <CloudTransition />
          <ShoppingSection />
        </main>
      </div>
      <div className="block md:hidden">
        <MobileHome />
      </div>
    </>
  );
}
