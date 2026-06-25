"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { BunnyMascot } from "@/components/bunny/BunnyMascot";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login({ username, password });
    router.push("/shop");
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-cute bg-white/86 shadow-soft md:grid-cols-[0.9fr_1fr]">
        <div className="relative min-h-80 bg-skyPastel p-8">
          <div className="cloud-shape left-8 top-12 h-10 w-24" />
          <div className="cloud-shape left-28 top-44 h-9 w-20 opacity-75" />
          <BunnyMascot className="absolute bottom-12 left-1/2 -translate-x-1/2 scale-125" />
        </div>
        <form onSubmit={onSubmit} className="p-6 md:p-10">
          <p className="text-sm font-black uppercase tracking-wide text-navyMuted">Welcome back</p>
          <h1 className="mt-2 text-4xl font-black text-navySoft">Đăng nhập</h1>
          <div className="mt-8 space-y-4">
            <TextInput value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Email hoac so dien thoai" required />
            <TextInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu" type="password" required />
          </div>
          {error && <p className="mt-4 rounded-full bg-blush px-5 py-3 text-sm font-bold text-navySoft">{error}</p>}
          <Button className="mt-6 w-full" disabled={loading}>
            <LogIn className="h-5 w-5" />
            Đăng nhập
          </Button>
          <Link href="/register" className="mt-5 flex items-center justify-center gap-2 text-sm font-black text-navySoft">
            <Mail className="h-4 w-4" />
            Tạo tài khoản mới
          </Link>
        </form>
      </section>
    </main>
  );
}
