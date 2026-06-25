"use client";

import Image from "next/image";
import { FormEvent, InputHTMLAttributes, ReactNode, useEffect, useState } from "react";
import { KeyRound, LockKeyhole, LogIn, Mail, UserRound, UserPlus, X } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

type ActiveForm = "login" | "register" | "forgot";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
const GOOGLE_LOGIN_URL = `${API_BASE_URL.replace(/\/api\/?$/, "")}/oauth2/authorization/google`;

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ReactNode;
};

function AuthCloud({ className }: { className?: string }) {
  return (
    <Image
      src="/images/clouds/cloud-06.png"
      alt=""
      width={190}
      height={110}
      className={cn("pointer-events-none absolute select-none drop-shadow-[0_8px_10px_rgba(81,125,150,0.16)]", className)}
    />
  );
}

function AuthRibbon({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto mb-5 flex h-11 w-44 items-center justify-center bg-[#465e8d] text-sm font-black uppercase text-white shadow-[0_8px_0_rgba(36,53,87,0.18)]">
      <span className="absolute -left-7 top-2 h-7 w-9 skew-y-[-18deg] bg-[#31456f]" />
      <span className="absolute -right-7 top-2 h-7 w-9 skew-y-[18deg] bg-[#31456f]" />
      <span className="relative z-10">{children}</span>
    </div>
  );
}

function BunnyAvatar() {
  return (
    <div className="mx-auto mb-5 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-[#5b6285] bg-white shadow-soft">
      <Image
        src="/images/bunny-cart-cutout.png"
        alt=""
        width={130}
        height={130}
        className="mt-8 h-28 w-28 object-contain"
      />
    </div>
  );
}

function AuthField({ icon, className, ...props }: AuthFieldProps) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navySoft/80">{icon}</span>
      <input
        className={cn(
          "h-10 w-full rounded-md border-2 border-[#34384a] bg-white/92 pl-10 pr-3 text-sm text-navySoft shadow-[0_2px_0_rgba(29,49,83,0.12)] outline-none transition placeholder:text-navyMuted/65 focus:border-[#5fa7ea] focus:ring-4 focus:ring-[#9fd4ff]/45",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, register, loading, error } = useAuthStore();
  const [activeForm, setActiveForm] = useState<ActiveForm>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [waitingForSmsOtp, setWaitingForSmsOtp] = useState(false);
  const [message, setMessage] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;
    setMessage("");
    setLocalError("");
    setActiveForm("login");
  }, [open]);

  if (!open) return null;

  const onGoogleLogin = () => {
    window.location.href = GOOGLE_LOGIN_URL;
  };

  const switchForm = (form: ActiveForm) => {
    setActiveForm(form);
    setMessage("");
    setLocalError("");
  };

  const onForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLocalError("");

    if (resetPassword !== resetConfirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const result = await authService.forgotPassword({
        identifier: resetIdentifier,
        newPassword: resetPassword,
        confirmPassword: resetConfirmPassword
      });
      setMessage(result);
      setWaitingForSmsOtp(!resetIdentifier.includes("@"));
    } catch (requestError) {
      setLocalError(requestError instanceof Error ? requestError.message : "Không gửi được yêu cầu đổi mật khẩu.");
    }
  };

  const onVerifyResetOtp = async () => {
    setMessage("");
    setLocalError("");
    try {
      const result = await authService.verifySmsReset({ phone: resetIdentifier, otpCode: resetOtp });
      setMessage(result);
      setWaitingForSmsOtp(false);
      setPassword("");
      setUsername(resetIdentifier);
      setActiveForm("login");
    } catch (requestError) {
      setLocalError(requestError instanceof Error ? requestError.message : "Mã OTP không hợp lệ.");
    }
  };

  const onLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLocalError("");
    try {
      await login({ username, password });
      onClose();
    } catch {
      // The auth store exposes the error message inside the modal.
    }
  };

  const onRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setLocalError("");

    if (registerPassword !== confirmPassword) {
      setLocalError("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      const result = await register({ fullName, email, password: registerPassword });
      setMessage(result);
      setActiveForm("login");
      setUsername(email);
      setPassword("");
      setRegisterPassword("");
      setConfirmPassword("");
    } catch {
      // The auth store exposes the error message inside the modal.
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto px-4 py-8">
      <button
        type="button"
        aria-label="Đóng lớp phủ đăng nhập"
        className="absolute inset-0 cursor-default bg-slate-950/10 backdrop-blur-md"
        onClick={onClose}
      />

      <section className="relative w-full max-w-[520px]">
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/75 text-navySoft shadow-soft transition hover:bg-white"
        >
          <X className="h-5 w-5" />
        </button>

        {activeForm === "login" ? (
          <form
            onSubmit={onLoginSubmit}
            className="relative min-h-[480px] overflow-visible rounded-lg border-2 border-[#636884]/70 bg-[#dfe1ff]/76 px-8 pb-8 pt-7 shadow-[0_24px_70px_rgba(29,49,83,0.18)] backdrop-blur-xl"
          >
            <AuthCloud className="-right-16 top-24 w-40 opacity-95" />
            <AuthCloud className="-bottom-12 right-6 w-52 opacity-95" />

            <AuthRibbon>ĐĂNG NHẬP</AuthRibbon>
            <BunnyAvatar />

            <div className="relative z-10 mt-7 space-y-4">
              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Email</p>
                <AuthField
                  icon={<Mail className="h-4 w-4" />}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="ví dụ: user@email.com..."
                  required
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Mật khẩu</p>
                <AuthField
                  icon={<LockKeyhole className="h-4 w-4" />}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mật khẩu"
                  type="password"
                  required
                />
                <button
                  type="button"
                  onClick={() => switchForm("forgot")}
                  className="mt-2 block w-full text-right text-xs font-bold text-navySoft/80"
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            {error && <p className="relative z-10 mt-4 rounded-md bg-blush/90 px-4 py-2 text-sm font-bold text-navySoft">{error}</p>}
            {message && (
              <p className="relative z-10 mt-4 rounded-md bg-mint/90 px-4 py-2 text-sm font-bold text-navySoft">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative z-10 mx-auto mt-7 flex min-h-11 w-44 items-center justify-center gap-2 rounded-full bg-[#7c92b7] px-5 text-sm font-black uppercase text-white shadow-[0_6px_0_rgba(45,64,102,0.26)] transition hover:-translate-y-0.5 hover:bg-[#8fa5c9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </button>

            <div className="relative z-10 my-5 flex items-center gap-3 text-xs font-bold uppercase text-navySoft/65">
              <span className="h-px flex-1 bg-navySoft/20" />
              hoặc
              <span className="h-px flex-1 bg-navySoft/20" />
            </div>

            <button
              type="button"
              onClick={onGoogleLogin}
              className="relative z-10 flex min-h-11 w-full items-center justify-center gap-3 rounded-full border-2 border-white/75 bg-white/88 px-5 text-sm font-black text-navySoft shadow-soft transition hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-base font-black shadow-[0_4px_12px_rgba(29,49,83,0.12)]">
                <span className="text-[#4285f4]">G</span>
              </span>
              Đăng nhập bằng Google
            </button>

            <button
              type="button"
              onClick={() => switchForm("register")}
              className="relative z-10 mt-5 block w-full text-center text-sm font-black text-navySoft"
            >
              Chưa có tài khoản? Đăng ký
            </button>
          </form>
        ) : activeForm === "forgot" ? (
          <form
            onSubmit={onForgotSubmit}
            className="relative min-h-[540px] overflow-visible rounded-lg border-2 border-[#636884]/70 bg-[#e7f2ff]/78 px-8 pb-8 pt-7 shadow-[0_24px_70px_rgba(29,49,83,0.18)] backdrop-blur-xl"
          >
            <AuthCloud className="-right-16 top-24 w-40 opacity-95" />
            <AuthCloud className="-bottom-12 left-6 w-52 opacity-95" />

            <AuthRibbon>QUÊN MẬT KHẨU</AuthRibbon>
            <BunnyAvatar />

            <div className="relative z-10 mt-5 space-y-3">
              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Email hoặc số điện thoại</p>
                <AuthField
                  icon={<Mail className="h-4 w-4" />}
                  value={resetIdentifier}
                  onChange={(event) => {
                    setResetIdentifier(event.target.value);
                    setWaitingForSmsOtp(false);
                  }}
                  placeholder="Email hoặc số điện thoại"
                  required
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Mật khẩu mới</p>
                <AuthField
                  icon={<LockKeyhole className="h-4 w-4" />}
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  placeholder="Mật khẩu mới"
                  type="password"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Nhập lại mật khẩu mới</p>
                <AuthField
                  icon={<LockKeyhole className="h-4 w-4" />}
                  value={resetConfirmPassword}
                  onChange={(event) => setResetConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  type="password"
                  minLength={6}
                  required
                />
              </div>

              {waitingForSmsOtp && (
                <div>
                  <p className="mb-1 text-sm font-bold text-navySoft">Mã OTP SMS</p>
                  <AuthField
                    icon={<KeyRound className="h-4 w-4" />}
                    value={resetOtp}
                    onChange={(event) => setResetOtp(event.target.value)}
                    placeholder="Nhập mã OTP 6 số"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
              )}
            </div>

            {localError && <p className="relative z-10 mt-4 rounded-md bg-blush/90 px-4 py-2 text-sm font-bold text-navySoft">{localError}</p>}
            {message && <p className="relative z-10 mt-4 rounded-md bg-mint/90 px-4 py-2 text-sm font-bold text-navySoft">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="relative z-10 mx-auto mt-6 flex min-h-11 w-52 items-center justify-center gap-2 rounded-full bg-[#7c92b7] px-5 text-sm font-black uppercase text-white shadow-[0_6px_0_rgba(45,64,102,0.26)] transition hover:-translate-y-0.5 hover:bg-[#8fa5c9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              Gửi xác nhận
            </button>

            {waitingForSmsOtp && (
              <button
                type="button"
                onClick={onVerifyResetOtp}
                className="relative z-10 mx-auto mt-4 flex min-h-11 w-52 items-center justify-center gap-2 rounded-full bg-[#5fa7ea] px-5 text-sm font-black uppercase text-white shadow-[0_6px_0_rgba(45,64,102,0.2)] transition hover:-translate-y-0.5 hover:bg-[#74b8f3]"
              >
                Xác nhận OTP
              </button>
            )}

            <button
              type="button"
              onClick={() => switchForm("login")}
              className="relative z-10 mt-5 block w-full text-center text-sm font-black text-navySoft"
            >
              Quay lại đăng nhập
            </button>
          </form>
        ) : (
          <form
            onSubmit={onRegisterSubmit}
            className="relative min-h-[560px] overflow-visible rounded-lg border-2 border-[#636884]/70 bg-[#eeeefe]/78 px-8 pb-8 pt-7 shadow-[0_24px_70px_rgba(29,49,83,0.18)] backdrop-blur-xl"
          >
            <AuthCloud className="-left-14 top-16 w-36 opacity-95" />
            <AuthCloud className="-bottom-10 -left-8 w-44 opacity-95" />
            <AuthCloud className="-right-6 -top-8 w-36 opacity-95" />

            <AuthRibbon>ĐĂNG KÝ</AuthRibbon>
            <BunnyAvatar />

            <div className="relative z-10 space-y-3">
              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Họ và tên</p>
                <AuthField
                  icon={<UserRound className="h-4 w-4" />}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nhập họ và tên..."
                  required
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Email</p>
                <AuthField
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ví dụ: user@email.com..."
                  type="email"
                  required
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Mật khẩu</p>
                <AuthField
                  icon={<LockKeyhole className="h-4 w-4" />}
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  placeholder="Mật khẩu"
                  type="password"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold text-navySoft">Nhập lại mật khẩu</p>
                <AuthField
                  icon={<LockKeyhole className="h-4 w-4" />}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  type="password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            {(localError || error) && (
              <p className="relative z-10 mt-4 rounded-md bg-blush/90 px-4 py-2 text-sm font-bold text-navySoft">
                {localError || error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative z-10 mx-auto mt-6 flex min-h-11 w-44 items-center justify-center gap-2 rounded-full bg-[#7c92b7] px-5 text-sm font-black uppercase text-white shadow-[0_6px_0_rgba(45,64,102,0.26)] transition hover:-translate-y-0.5 hover:bg-[#8fa5c9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              Đăng ký ngay
            </button>

            <button
              type="button"
              onClick={() => switchForm("login")}
              className="relative z-10 mt-5 block w-full text-center text-sm font-black text-navySoft"
            >
              Đã có tài khoản? Đăng nhập
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
