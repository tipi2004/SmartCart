"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export function CloudTransition() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const yLayer1 = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const yLayer2 = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const yLayer3 = useTransform(scrollYProgress, [0, 1], [260, -80]);
  const xLayer1 = useTransform(scrollYProgress, [0, 1], [-40, 60]);
  const xLayer2 = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.62, 1]);

  return (
    <section
      ref={ref}
      className="relative h-[125vh] overflow-hidden bg-gradient-to-b from-white via-sky-50 to-[#fff8ea]"
    >
      <motion.div className="absolute inset-0" style={{ opacity }}>
        <motion.div style={{ x: xLayer1, y: yLayer1 }} className="absolute left-[-12vw] top-[6vh] h-[34vh] w-[124vw]">
          <CloudBand className="top-4" size="large" />
          <CloudBand className="top-32" size="medium" />
        </motion.div>
        <motion.div style={{ x: xLayer2, y: yLayer2 }} className="absolute left-[-18vw] top-[24vh] h-[44vh] w-[136vw]">
          <CloudBand className="top-0" size="large" />
          <CloudBand className="top-44" size="large" />
        </motion.div>
        <motion.div style={{ y: yLayer3 }} className="absolute left-[-14vw] top-[48vh] h-[52vh] w-[128vw]">
          <CloudBand className="top-0" size="medium" />
          <CloudBand className="top-36" size="large" />
          <CloudBand className="top-72" size="medium" />
        </motion.div>
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fff8ea] to-transparent" />
    </section>
  );
}

function CloudBand({ className, size }: { className?: string; size: "medium" | "large" }) {
  const height = size === "large" ? "h-36 md:h-48" : "h-28 md:h-36";
  const baseWidth = size === "large" ? "w-64 md:w-96" : "w-52 md:w-72";

  return (
    <div className={`absolute left-0 w-full ${height} ${className ?? ""}`}>
      <CloudImage src="/images/clouds/cloud-04.png" className={`left-[-4%] top-6 ${baseWidth}`} />
      <CloudImage src="/images/clouds/cloud-10.png" className={`left-[10%] top-0 ${baseWidth}`} />
      <CloudImage src="/images/clouds/cloud-07.png" className={`left-[28%] top-8 ${baseWidth}`} />
      <CloudImage src="/images/clouds/cloud-02.png" className={`left-[48%] top-1 ${baseWidth}`} />
      <CloudImage src="/images/clouds/cloud-11.png" className={`left-[67%] top-9 ${baseWidth}`} />
      <CloudImage src="/images/clouds/cloud-05.png" className={`right-[-3%] top-2 ${baseWidth}`} />
      <CloudImage src="/images/clouds/cloud-01.png" className={`left-[1%] top-20 ${baseWidth} opacity-95`} />
      <CloudImage src="/images/clouds/cloud-06.png" className={`left-[21%] top-24 ${baseWidth} opacity-95`} />
      <CloudImage src="/images/clouds/cloud-12.png" className={`left-[39%] top-[4.5rem] ${baseWidth} opacity-95`} />
      <CloudImage src="/images/clouds/cloud-03.png" className={`left-[58%] top-[6.25rem] ${baseWidth} opacity-95`} />
      <CloudImage src="/images/clouds/cloud-08.png" className={`left-[78%] top-20 ${baseWidth} opacity-95`} />
      <CloudImage src="/images/clouds/cloud-09.png" className={`right-[-10%] top-24 ${baseWidth} opacity-95`} />
    </div>
  );
}

function CloudImage({ src, className }: { src: string; className: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={320}
      height={210}
      className={`absolute h-auto drop-shadow-[0_22px_42px_rgba(125,211,252,0.22)] ${className}`}
    />
  );
}
