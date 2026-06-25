import { BunnyMascot } from "@/components/bunny/BunnyMascot";

export function FloatingBunny() {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-30 hidden md:block">
      <BunnyMascot className="scale-75" />
    </div>
  );
}
