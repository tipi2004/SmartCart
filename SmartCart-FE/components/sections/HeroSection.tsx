"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Heart, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { BunnyMascot } from "@/components/bunny/BunnyMascot";
import { Button } from "@/components/ui/Button";
import { CloudLayer } from "@/components/sections/CloudLayer";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";

const features = [
  { icon: ShoppingBag, title: "Sản phẩm tươi", text: "Danh sách mua sắm gọn gàng." },
  { icon: Heart, title: "Wishlist pastel", text: "Lưu món thích thật nhanh." },
  { icon: ShieldCheck, title: "Thanh toán an tâm", text: "Giỏ hàng rõ ràng, dễ kiểm tra." }
];

export function HeroSection() {
  const { accessToken } = useAuthStore();
  const { openLogin } = useAuthModalStore();

  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-white md:min-h-screen">
      <CloudLayer />
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pb-14 pt-28 sm:px-5 md:grid-cols-[1fr_0.9fr] md:px-8 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-blue-700 shadow-xl">
            <Sparkles className="h-4 w-4 text-honey" />
            SmartCart pastel shopping
          </div>
          <h1 className="text-4xl font-black leading-tight text-blue-950 sm:text-6xl lg:text-7xl">
            SmartCart Bunny
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-700 sm:mt-5 sm:text-lg sm:leading-8">
            Mua sắm nhẹ như mây trôi với giao diện dễ thương, giỏ hàng nhanh gọn và sản phẩm kết nối trực tiếp backend SmartCart.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="#shop">
              <motion.span
                className="inline-flex"
                animate={{ scale: [1, 1.035, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Button className="px-7">
                  Mua sam ngay
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.span>
            </Link>
            {accessToken ? (
              <Link href="/cart">
                <Button variant="ghost">Xem giỏ hàng</Button>
              </Link>
            ) : (
              <Button variant="ghost" onClick={openLogin}>Xem giỏ hàng</Button>
            )}
          </div>
          <motion.div
            className="mt-7 grid gap-3 sm:mt-9 sm:grid-cols-3 sm:gap-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } }
            }}
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="rounded-[1.25rem] border border-white/60 bg-white/80 p-4 shadow-xl"
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }}
              >
                <feature.icon className="h-5 w-5 text-blue-700" />
                <h3 className="mt-3 text-sm font-black text-blue-950">{feature.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-700">{feature.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto h-[240px] w-full max-w-sm sm:h-[330px] sm:max-w-md md:h-[360px]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8 }}
        >
          <div className="absolute inset-x-8 bottom-10 h-24 rounded-full bg-white/60 blur-2xl" />
          <motion.div
            className="absolute bottom-14 left-[26%] z-10 -translate-x-1/2"
            animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <BunnyMascot className="scale-[2.75] sm:scale-[4.65] md:scale-[5.35]" />
          </motion.div>
          <div className="absolute bottom-[-0.5rem] left-1/2 z-0 h-36 w-[112%] -translate-x-1/2">
            <Image src="/images/clouds/cloud-10.png" alt="" fill className="object-contain drop-shadow-2xl" />
            <Image src="/images/clouds/cloud-03.png" alt="" width={250} height={132} className="absolute -left-2 bottom-5 w-52 drop-shadow-xl" />
            <Image src="/images/clouds/cloud-06.png" alt="" width={232} height={127} className="absolute -right-4 bottom-4 w-56 drop-shadow-xl" />
          </div>
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
