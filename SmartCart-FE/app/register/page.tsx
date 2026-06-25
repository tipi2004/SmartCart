"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { BunnyMascot } from "@/components/bunny/BunnyMascot";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await register({ fullName, email, phone, password });
    setMessage(result);
    setTimeout(() => router.push("/login"), 900);
  };

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-cute bg-white/86 shadow-soft md:grid-cols-[1fr_0.9fr]">
        <form onSubmit={onSubmit} className="p-6 md:p-10">
          <p className="text-sm font-black uppercase tracking-wide text-navyMuted">Join bunny cart</p>
          <h1 className="mt-2 text-4xl font-black text-navySoft">Đăng ký</h1>
          <div className="mt-8 space-y-4">
            <TextInput value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ho ten" required />
            <TextInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
            <TextInput value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="So dien thoai" />
            <TextInput value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu tối thiểu 6 ký tự" type="password" required />
          </div>
          {error && <p className="mt-4 rounded-full bg-blush px-5 py-3 text-sm font-bold text-navySoft">{error}</p>}
          {message && <p className="mt-4 rounded-full bg-mint px-5 py-3 text-sm font-bold text-navySoft">{message}</p>}
          <Button className="mt-6 w-full" disabled={loading}>
            <UserPlus className="h-5 w-5" />
            Tạo tài khoản
          </Button>
          <Link href="/login" className="mt-5 block text-center text-sm font-black text-navySoft">
            Đã có tài khoản? Đăng nhập
          </Link>
        </form>
        <div className="relative min-h-80 bg-cream p-8">
          <div className="cloud-shape left-8 top-14 h-10 w-24" />
          <div className="cloud-shape left-36 top-44 h-9 w-20 opacity-75" />
          <BunnyMascot className="absolute bottom-12 left-1/2 -translate-x-1/2 scale-125" />
        </div>
      </section>
    </main>
  );
}
