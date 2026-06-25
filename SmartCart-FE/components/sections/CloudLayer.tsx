"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

export function CloudLayer() {
  const { scrollYProgress } = useScroll();
  const yNear = useTransform(scrollYProgress, [0, 0.6], [0, 90]);
  const yFar = useTransform(scrollYProgress, [0, 0.6], [0, 42]);
  const xNear = useTransform(scrollYProgress, [0, 0.6], [0, 86]);
  const xFar = useTransform(scrollYProgress, [0, 0.6], [0, -58]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <CloudAsset src="/images/clouds/cloud-01.png" className="left-[8%] top-[16%] h-24 w-40" style={{ x: xFar, y: yFar }} />
      <CloudAsset src="/images/clouds/cloud-03.png" className="left-[58%] top-[12%] h-28 w-48" style={{ x: xNear, y: yNear }} />
      <CloudAsset src="/images/clouds/cloud-08.png" className="left-[28%] top-[57%] h-24 w-40" style={{ x: xFar, y: yFar }} />
      <CloudAsset src="/images/clouds/cloud-12.png" className="left-[72%] top-[61%] h-24 w-44" style={{ x: xNear, y: yNear }} />
    </div>
  );
}

function CloudAsset({ src, className, style }: { src: string; className: string; style: { x: MotionValue<number>; y: MotionValue<number> } }) {
  return (
    <motion.div style={style} className={`absolute ${className}`}>
      <Image src={src} alt="" fill className="object-contain drop-shadow-xl" />
    </motion.div>
  );
}
