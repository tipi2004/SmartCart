"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, LockKeyhole, LogOut, Mail, Phone, Save, UserRound } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { userService } from "@/services/userService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

export default function ProfilePage() {
  const { accessToken, hydrate, logout } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("smartcart_access_token") : null;
    if (!accessToken && !token) {
      setLoading(false);
      openLogin();
      return;
    }

    userService
      .getProfile()
      .then((profile) => {
        setFullName(profile?.fullName || "");
        setEmail(profile?.email || "");
        setPhone(profile?.phone || "");
      })
      .catch((error) => showToast(error instanceof Error ? error.message : "Không tải được hồ sơ.", "error"))
      .finally(() => setLoading(false));
  }, [accessToken, openLogin, showToast]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const profile = await userService.updateProfile({ fullName, phone });
      setFullName(profile?.fullName || fullName);
      setPhone(profile?.phone || phone);
      showToast("Đã lưu hồ sơ cá nhân.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không lưu được hồ sơ.", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setChangingPassword(true);
    try {
      const message = await userService.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không đổi được mật khẩu.", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const isLoggedIn = Boolean(accessToken || (typeof window !== "undefined" && localStorage.getItem("smartcart_access_token")));

  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-white to-[#fff8ea] px-4 py-28">
        <Image src="/images/clouds/cloud-06.png" alt="" width={210} height={120} className="absolute left-[14%] top-24 w-40 opacity-90 drop-shadow-xl" />
        <Image src="/images/clouds/cloud-10.png" alt="" width={260} height={140} className="absolute right-[13%] top-32 w-56 opacity-90 drop-shadow-xl" />
        <Image src="/images/clouds/cloud-03.png" alt="" width={220} height={130} className="absolute bottom-12 left-[16%] w-48 opacity-90 drop-shadow-xl" />
        <Image src="/images/clouds/cloud-08.png" alt="" width={240} height={130} className="absolute bottom-10 right-[18%] w-52 opacity-90 drop-shadow-xl" />

        <section className="relative z-10 mx-auto max-w-3xl rounded-lg border-2 border-[#636884]/70 bg-[#e8e4ff]/72 p-6 shadow-[0_24px_80px_rgba(29,49,83,0.2)] backdrop-blur-xl md:p-9">
          <div className="mx-auto mb-5 grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-[#5b6285] bg-white shadow-soft">
            <Image src="/images/bunny-cart-cutout.png" alt="" width={150} height={150} className="mt-9 h-32 w-32 object-contain" />
          </div>
          <div className="relative mx-auto mb-8 flex h-12 w-56 items-center justify-center bg-[#465e8d] text-base font-black uppercase text-white shadow-[0_8px_0_rgba(36,53,87,0.18)]">
            <span className="absolute -left-8 top-2 h-8 w-10 skew-y-[-18deg] bg-[#31456f]" />
            <span className="absolute -right-8 top-2 h-8 w-10 skew-y-[18deg] bg-[#31456f]" />
            <span className="relative z-10">Hồ sơ cá nhân</span>
          </div>

          {loading ? (
            <div className="grid min-h-72 place-items-center">
              <Loader2 className="h-8 w-8 animate-spin text-navySoft" />
            </div>
          ) : !isLoggedIn ? (
            <div className="rounded-cute bg-white/75 p-8 text-center shadow-soft">
              <p className="text-xl font-black text-navySoft">Vui lòng đăng nhập để xem hồ sơ.</p>
              <Button className="mt-5" onClick={openLogin}>Đăng nhập</Button>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              <form onSubmit={saveProfile} className="space-y-4">
                <ProfileField label="Ho va ten" icon={<UserRound className="h-4 w-4" />} value={fullName} onChange={setFullName} placeholder="Nhap ho va ten" />
                <ProfileField label="Email" icon={<Mail className="h-4 w-4" />} value={email} disabled placeholder="Email" />
                <ProfileField label="So dien thoai" icon={<Phone className="h-4 w-4" />} value={phone} onChange={setPhone} placeholder="Nhap so dien thoai" />
                <Button className="w-full bg-[#7c92b7] hover:bg-[#8fa5c9]" disabled={saving}>
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Lưu thay đổi
                </Button>
              </form>

              <form onSubmit={changePassword} className="space-y-4">
                <ProfileField label="Mật khẩu hiện tại" icon={<LockKeyhole className="h-4 w-4" />} value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Mật khẩu hiện tại" />
                <ProfileField label="Mật khẩu mới" icon={<LockKeyhole className="h-4 w-4" />} value={newPassword} onChange={setNewPassword} type="password" placeholder="Tối thiểu 6 ký tự" />
                <ProfileField label="Nhập lại mật khẩu mới" icon={<LockKeyhole className="h-4 w-4" />} value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Nhập lại mật khẩu" />
                <Button className="w-full bg-[#7c92b7] hover:bg-[#8fa5c9]" disabled={changingPassword}>
                  {changingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
                  Cập nhật mật khẩu
                </Button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full min-h-11 items-center justify-center gap-2 rounded-full bg-white/82 px-5 text-sm font-black text-navySoft shadow-soft transition hover:bg-blush/55"
                >
                  <LogOut className="h-5 w-5" />
                  Đăng xuất
                </button>
              </form>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function ProfileField({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-navySoft">{label}</span>
      <span className="relative block">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navySoft/80">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          type={type}
          disabled={disabled}
          className="h-11 w-full rounded-md border-2 border-[#34384a] bg-white/90 pl-10 pr-3 text-sm text-navySoft shadow-[0_2px_0_rgba(29,49,83,0.12)] outline-none transition placeholder:text-navyMuted/60 focus:border-[#5fa7ea] focus:ring-4 focus:ring-[#9fd4ff]/45 disabled:cursor-not-allowed disabled:bg-white/55"
        />
      </span>
    </label>
  );
}
