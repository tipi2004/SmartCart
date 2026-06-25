"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Search, ShieldAlert, Store, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/adminService";
import { useToastStore } from "@/store/toastStore";
import type { Shop } from "@/types";
import { cn } from "@/utils/cn";

type ShopFilter = "all" | "pending" | "active" | "suspended";
type ShopStatus = "pending" | "active" | "suspended";

const filters: Array<{ value: ShopFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "active", label: "Đang hoạt động" },
  { value: "suspended", label: "Đã khóa" }
];

export default function AdminShopsPage() {
  const { showToast } = useToastStore();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<ShopFilter>("pending");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadShops = async () => {
    setLoading(true);
    try {
      setShops(await adminService.getShops());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được danh sách shop.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const stats = useMemo(
    () => ({
      total: shops.length,
      pending: shops.filter((shop) => normalizeShopStatus(shop.status) === "pending").length,
      active: shops.filter((shop) => normalizeShopStatus(shop.status) === "active").length,
      suspended: shops.filter((shop) => normalizeShopStatus(shop.status) === "suspended").length
    }),
    [shops]
  );

  const filteredShops = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return shops.filter((shop) => {
      const status = normalizeShopStatus(shop.status);
      const matchesKeyword =
        !query ||
        shop.name.toLowerCase().includes(query) ||
        shop.ownerName?.toLowerCase().includes(query) ||
        shop.ownerEmail?.toLowerCase().includes(query) ||
        shop.ownerPhone?.toLowerCase().includes(query) ||
        shop.id.toLowerCase().includes(query) ||
        shop.ownerId.toLowerCase().includes(query);
      const matchesFilter = filter === "all" || status === filter;
      return matchesKeyword && matchesFilter;
    });
  }, [filter, keyword, shops]);

  const changeShopStatus = async (shop: Shop, status: ShopStatus) => {
    setWorkingId(shop.id);
    try {
      const updated = await adminService.updateShopStatus(shop.id, status);
      if (updated) {
        setShops((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      showToast(shopStatusMessage(status));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không cập nhật được trạng thái shop.", "error");
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
            <h1 className="mt-4 text-4xl font-black text-[#0b2463]">Duyệt shop/seller</h1>
            <p className="mt-2 text-sm font-bold text-[#607198]">Quản lý cửa hàng tiện lợi và sinh viên bán đồ trong hệ thống.</p>
          </div>
          <Button variant="ghost" onClick={loadShops}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
            Làm mới
          </Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={<Store className="h-5 w-5" />} label="Tổng shop" value={stats.total} tone="blue" />
          <Stat icon={<ShieldAlert className="h-5 w-5" />} label="Chờ duyệt" value={stats.pending} tone="amber" />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Đang hoạt động" value={stats.active} tone="green" />
          <Stat icon={<XCircle className="h-5 w-5" />} label="Đã khóa" value={stats.suspended} tone="pink" />
        </div>

        <div className="mt-7 rounded-[1.5rem] border border-white/80 bg-white/76 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.13)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7daa]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tên shop, tên chủ, email, số điện thoại..."
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
          ) : filteredShops.length === 0 ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <Store className="mx-auto h-12 w-12 text-[#3567ff]" />
                <p className="mt-4 text-xl font-black text-[#11285f]">Không có shop phù hợp.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {filteredShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} working={workingId === shop.id} onChangeStatus={changeShopStatus} />
              ))}
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

function ShopCard({
  shop,
  working,
  onChangeStatus
}: {
  shop: Shop;
  working: boolean;
  onChangeStatus: (shop: Shop, status: ShopStatus) => void;
}) {
  const status = normalizeShopStatus(shop.status);

  return (
    <article className="rounded-[1.25rem] border border-[#dbeaff] bg-white/82 p-5 shadow-[0_14px_36px_rgba(76,107,171,0.12)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-[#0b2463]">{shop.name}</p>
          <p className="mt-1 text-xs font-black uppercase text-[#607198]">Chủ shop: {shop.ownerName || shop.ownerId.slice(0, 8).toUpperCase()}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-black", shopStatusClass(status))}>{shopStatusLabel(status)}</span>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-bold text-[#607198]">
        <p>Email: {shop.ownerEmail || "Chưa có"}</p>
        <p>Số điện thoại: {shop.ownerPhone || "Chưa có"}</p>
        <p>Mã shop: {shop.id}</p>
        <p>Mã chủ shop: {shop.ownerId}</p>
        <p>Slug: {shop.slug || "Chưa có"}</p>
        <p>Xác minh: {shop.isVerified ? "Đã xác minh" : "Chưa xác minh"}</p>
        <p>Ngày tạo: {shop.createdAt ? new Date(shop.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {status !== "active" && (
          <Button className="bg-[#dff7e9] text-[#17664f] hover:bg-[#cff0dd]" disabled={working} onClick={() => onChangeStatus(shop, "active")}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Duyệt shop
          </Button>
        )}
        {status !== "suspended" && (
          <Button className="bg-[#ffd7e8] text-[#9b244f] hover:bg-[#ffc8df]" disabled={working} onClick={() => onChangeStatus(shop, "suspended")}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Khóa shop
          </Button>
        )}
        {status !== "pending" && (
          <Button variant="ghost" disabled={working} onClick={() => onChangeStatus(shop, "pending")}>
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
            Chờ duyệt lại
          </Button>
        )}
      </div>
    </article>
  );
}

function normalizeShopStatus(status?: string | null): ShopStatus {
  if (status === "pending" || status === "active" || status === "suspended") return status;
  return "active";
}

function shopStatusLabel(status: ShopStatus) {
  if (status === "pending") return "Chờ duyệt";
  if (status === "suspended") return "Đã khóa";
  return "Đang hoạt động";
}

function shopStatusMessage(status: ShopStatus) {
  if (status === "active") return "Đã duyệt shop.";
  if (status === "suspended") return "Đã khóa shop.";
  return "Đã chuyển shop về trạng thái chờ duyệt.";
}

function shopStatusClass(status: ShopStatus) {
  if (status === "pending") return "bg-honey/40 text-[#935b00]";
  if (status === "suspended") return "bg-blush/70 text-[#8d2845]";
  return "bg-mint/70 text-[#17664f]";
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "green" | "pink" | "amber" }) {
  const toneClass = {
    blue: "bg-[#dff2ff] text-[#3567ff]",
    green: "bg-[#dff7e9] text-[#1a9d64]",
    pink: "bg-[#ffe3ef] text-[#c93472]",
    amber: "bg-[#fff0c8] text-[#a66b00]"
  }[tone];

  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.12)] backdrop-blur-xl">
      <span className={cn("grid h-12 w-12 place-items-center rounded-[1rem]", toneClass)}>{icon}</span>
      <p className="mt-5 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#0b2463]">{value}</p>
    </div>
  );
}
