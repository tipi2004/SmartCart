"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/utils/cn";

export function BunnyMascot({ className }: { className?: string; cart?: boolean }) {
  return (
    <motion.div
      className={cn("relative h-80 w-80", className)}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      aria-label="Bunny mascot"
    >
      <Image src="/images/bunny-cart-cutout.png" alt="" fill priority className="object-contain drop-shadow-2xl" />
    </motion.div>
  );
}
