"use client";

import Image from "next/image";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Loader2, LockKeyhole, LogOut, Mail, MapPin, Phone, Save, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { userService } from "@/services/userService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useProfileModalStore } from "@/store/profileModalStore";
import { useToastStore } from "@/store/toastStore";

export function ProfileModal() {
  const { open, closeProfile } = useProfileModalStore();
  const { accessToken, hydrate, logout } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProfile();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeProfile, open]);

  useEffect(() => {
    if (!open) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("smartcart_access_token") : null;
    if (!accessToken && !token) {
      setLoading(false);
      closeProfile();
      openLogin();
      return;
    }

    setLoading(true);
    userService
      .getProfile()
      .then((profile) => {
        setFullName(profile?.fullName || "");
        setEmail(profile?.email || "");
        setPhone(profile?.phone || "");
        setShippingAddress(profile?.shippingAddress || "");
      })
      .catch((error) => showToast(error instanceof Error ? error.message : "Không tải được hồ sơ.", "error"))
      .finally(() => setLoading(false));
  }, [accessToken, closeProfile, open, openLogin, showToast]);

  if (!open) return null;

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const profile = await userService.updateProfile({ fullName, phone, shippingAddress });
      setFullName(profile?.fullName || fullName);
      setPhone(profile?.phone || phone);
      setShippingAddress(profile?.shippingAddress || shippingAddress);
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

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto px-4 py-8">
      <button
        type="button"
        aria-label="Đóng hồ sơ"
        className="absolute inset-0 cursor-default bg-slate-950/10 backdrop-blur-md"
        onClick={closeProfile}
      />

      <section className="relative w-full max-w-3xl rounded-lg border-2 border-[#636884]/70 bg-[#e8e4ff]/78 p-6 shadow-[0_24px_80px_rgba(29,49,83,0.2)] backdrop-blur-xl md:p-9">
        <button
          type="button"
          aria-label="Đóng"
          onClick={closeProfile}
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/75 text-navySoft shadow-soft transition hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        <Image src="/images/clouds/cloud-06.png" alt="" width={190} height={110} className="pointer-events-none absolute -left-12 top-16 w-36 drop-shadow-xl" />
        <Image src="/images/clouds/cloud-10.png" alt="" width={220} height={120} className="pointer-events-none absolute -right-10 top-24 w-44 drop-shadow-xl" />
        <Image src="/images/clouds/cloud-03.png" alt="" width={210} height={120} className="pointer-events-none absolute -bottom-10 left-0 w-44 drop-shadow-xl" />
        <Image src="/images/clouds/cloud-08.png" alt="" width={220} height={120} className="pointer-events-none absolute -bottom-10 right-4 w-48 drop-shadow-xl" />

        <div className="relative z-10">
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
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              <form onSubmit={saveProfile} className="space-y-4">
                <ProfileField label="Họ và tên" icon={<UserRound className="h-4 w-4" />} value={fullName} onChange={setFullName} placeholder="Nhập họ và tên" />
                <ProfileField label="Email" icon={<Mail className="h-4 w-4" />} value={email} disabled placeholder="Email" />
                <ProfileField label="Số điện thoại" icon={<Phone className="h-4 w-4" />} value={phone} onChange={setPhone} placeholder="Nhập số điện thoại" />
                <ProfileTextarea label="Địa chỉ nhận hàng mặc định" icon={<MapPin className="h-4 w-4" />} value={shippingAddress} onChange={setShippingAddress} placeholder="Nhập địa chỉ nhận hàng..." />
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
                  onClick={() => {
                    closeProfile();
                    logout();
                  }}
                  className="flex w-full min-h-11 items-center justify-center gap-2 rounded-full bg-white/82 px-5 text-sm font-black text-navySoft shadow-soft transition hover:bg-blush/55"
                >
                  <LogOut className="h-5 w-5" />
                  Đăng xuất
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
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
  icon: ReactNode;
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

function ProfileTextarea({
  label,
  icon,
  value,
  onChange,
  placeholder
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-black text-navySoft">{label}</span>
      <span className="relative block">
        <span className="absolute left-3 top-4 text-navySoft/80">{icon}</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="min-h-24 w-full resize-none rounded-md border-2 border-[#34384a] bg-white/90 py-3 pl-10 pr-3 text-sm text-navySoft shadow-[0_2px_0_rgba(29,49,83,0.12)] outline-none transition placeholder:text-navyMuted/60 focus:border-[#5fa7ea] focus:ring-4 focus:ring-[#9fd4ff]/45"
        />
      </span>
    </label>
  );
}
