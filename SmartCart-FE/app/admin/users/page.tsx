"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Lock, Search, ShieldCheck, UserCheck, Users, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/adminService";
import { useToastStore } from "@/store/toastStore";
import type { UserProfile } from "@/types";
import { cn } from "@/utils/cn";

const filters = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang hoạt động" },
  { value: "locked", label: "Đã khóa" },
  { value: "admin", label: "Admin" },
  { value: "seller", label: "Người bán" },
  { value: "customer", label: "Khách hàng" }
] as const;

export default function AdminUsersPage() {
  const { showToast } = useToastStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      setUsers(await adminService.getUsers());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được danh sách người dùng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return users.filter((user) => {
      const role = user.role?.toLowerCase() || "customer";
      const matchesKeyword =
        !query ||
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && user.isActive !== false) ||
        (filter === "locked" && user.isActive === false) ||
        role === filter;
      return matchesKeyword && matchesFilter;
    });
  }, [filter, keyword, users]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.isActive !== false).length,
      locked: users.filter((user) => user.isActive === false).length,
      admins: users.filter((user) => user.role?.toLowerCase() === "admin").length
    }),
    [users]
  );

  const toggleUserStatus = async (user: UserProfile) => {
    const nextStatus = user.isActive === false;
    setWorkingId(user.id);
    try {
      const updated = await adminService.updateUserStatus(user.id, nextStatus);
      if (updated) {
        setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      showToast(nextStatus ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không cập nhật được trạng thái người dùng.", "error");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <AdminShell>
      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#e9f4ff] px-4 py-2 text-sm font-black text-[#3567ff]">SmartCart Admin</p>
            <h1 className="mt-4 text-4xl font-black text-[#0b2463]">Quản lý người dùng</h1>
            <p className="mt-2 text-sm font-bold text-[#607198]">Theo dõi tài khoản, phân loại vai trò và khóa/mở khóa người dùng.</p>
          </div>
          <Button variant="ghost" onClick={loadUsers}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Làm mới
          </Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={<Users className="h-5 w-5" />} label="Tổng người dùng" value={stats.total} tone="blue" />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Đang hoạt động" value={stats.active} tone="green" />
          <Stat icon={<Lock className="h-5 w-5" />} label="Đã khóa" value={stats.locked} tone="pink" />
          <Stat icon={<ShieldCheck className="h-5 w-5" />} label="Admin" value={stats.admins} tone="purple" />
        </div>

        <div className="mt-7 rounded-[1.5rem] border border-white/80 bg-white/76 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.13)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7daa]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại hoặc mã người dùng..."
                className="h-12 w-full rounded-full border border-[#d8e8ff] bg-white/86 pl-12 pr-5 text-sm font-bold text-[#11285f] outline-none focus:ring-4 focus:ring-[#bcd8ff]/55"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    "min-w-max rounded-full px-5 py-3 text-sm font-black shadow-[0_12px_28px_rgba(79,107,167,0.14)] transition",
                    filter === item.value
                      ? "bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white"
                      : "border border-[#d8e8ff] bg-white/86 text-[#11285f] hover:bg-[#eaf5ff]"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-80 place-items-center">
              <Loader2 className="h-9 w-9 animate-spin text-[#3567ff]" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <Users className="mx-auto h-12 w-12 text-[#3567ff]" />
                <p className="mt-4 text-xl font-black text-[#11285f]">Không có người dùng phù hợp.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-[#dbeaff] bg-white/70">
              <div className="hidden grid-cols-[1.2fr_1fr_150px_160px_180px] border-b border-[#dbeaff] px-4 py-3 text-xs font-black uppercase text-[#607198] lg:grid">
                <span>Người dùng</span>
                <span>Liên hệ</span>
                <span>Vai trò</span>
                <span>Trạng thái</span>
                <span className="text-right">Thao tác</span>
              </div>
              <div className="divide-y divide-[#dbeaff]">
                {filteredUsers.map((user) => (
                  <UserRow key={user.id} user={user} working={workingId === user.id} onToggleStatus={toggleUserStatus} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function UserRow({
  user,
  working,
  onToggleStatus
}: {
  user: UserProfile;
  working: boolean;
  onToggleStatus: (user: UserProfile) => void;
}) {
  const isActive = user.isActive !== false;
  const role = user.role?.toLowerCase() || "customer";

  return (
    <article className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_1fr_150px_160px_180px] lg:items-center">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#dff2ff] text-lg font-black text-[#0b2463]">
          {(user.fullName || user.email || "U").trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-black text-[#0b2463]">{user.fullName || "Chưa cập nhật tên"}</p>
          <p className="mt-1 truncate text-xs font-bold text-[#607198]">#{user.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className="min-w-0 text-sm font-bold text-[#607198]">
        <p className="truncate">{user.email || "Chưa có email"}</p>
        <p className="mt-1 truncate">{user.phone || "Chưa có số điện thoại"}</p>
      </div>

      <span className={cn("w-max rounded-full px-3 py-1 text-xs font-black", roleClass(role))}>{roleLabel(role)}</span>

      <span className={cn("w-max rounded-full px-3 py-1 text-xs font-black", isActive ? "bg-mint/70 text-[#17664f]" : "bg-blush/70 text-[#8d2845]")}>
        {isActive ? "Đang hoạt động" : "Đã khóa"}
      </span>

      <div className="flex justify-start lg:justify-end">
        <Button
          variant={isActive ? "ghost" : "primary"}
          className={cn(!isActive && "bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90")}
          disabled={working}
          onClick={() => onToggleStatus(user)}
        >
          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : isActive ? <Lock className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          {isActive ? "Khóa" : "Mở khóa"}
        </Button>
      </div>
    </article>
  );
}

function roleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "seller") return "Người bán";
  return "Khách hàng";
}

function roleClass(role: string) {
  if (role === "admin") return "bg-[#eee8ff] text-[#6d42ff]";
  if (role === "seller") return "bg-[#ffe7c7] text-[#d17a00]";
  return "bg-[#dff2ff] text-[#3567ff]";
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "green" | "pink" | "purple" }) {
  const toneClass = {
    blue: "bg-[#dff2ff] text-[#3567ff]",
    green: "bg-[#dff7e9] text-[#1a9d64]",
    pink: "bg-[#ffe3ef] text-[#c93472]",
    purple: "bg-[#eee8ff] text-[#7b5cff]"
  }[tone];

  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.12)] backdrop-blur-xl">
      <span className={cn("grid h-12 w-12 place-items-center rounded-[1rem]", toneClass)}>{icon}</span>
      <p className="mt-5 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#0b2463]">{value}</p>
    </div>
  );
}
