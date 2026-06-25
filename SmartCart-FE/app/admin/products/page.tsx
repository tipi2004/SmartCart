"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Boxes, CheckCircle2, Eye, EyeOff, ImageIcon, Loader2, PackageSearch, Search, ShieldCheck, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/adminService";
import { useToastStore } from "@/store/toastStore";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

type ProductFilter = "all" | "pending" | "approved" | "rejected" | "inactive";
type ApprovalStatus = "pending" | "approved" | "rejected";

const filters: Array<{ value: ProductFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
  { value: "inactive", label: "Đang ẩn" }
];

export default function AdminProductsPage() {
  const { showToast } = useToastStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("pending");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await adminService.getProducts());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được danh sách sản phẩm.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return products.filter((product) => {
      const status = normalizeApproval(product.approvalStatus);
      const matchesKeyword =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.categoryName?.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query);
      const matchesFilter =
        filter === "all" ||
        (filter === "inactive" && product.isActive === false) ||
        (filter !== "inactive" && status === filter);
      return matchesKeyword && matchesFilter;
    });
  }, [filter, keyword, products]);

  const stats = useMemo(
    () => ({
      total: products.length,
      pending: products.filter((product) => normalizeApproval(product.approvalStatus) === "pending").length,
      approved: products.filter((product) => normalizeApproval(product.approvalStatus) === "approved").length,
      rejected: products.filter((product) => normalizeApproval(product.approvalStatus) === "rejected").length,
      inactive: products.filter((product) => product.isActive === false).length
    }),
    [products]
  );

  const updateLocalProduct = (updated?: Product) => {
    if (!updated) return;
    setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  };

  const changeApproval = async (product: Product, approvalStatus: ApprovalStatus, rejectionReason?: string) => {
    setWorkingId(product.id);
    try {
      const updated = await adminService.updateProductApprovalStatus(product.id, approvalStatus, rejectionReason);
      updateLocalProduct(updated);
      showToast(approvalMessage(approvalStatus));
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không cập nhật được trạng thái duyệt sản phẩm.", "error");
    } finally {
      setWorkingId(null);
    }
  };

  const openRejectModal = (product: Product) => {
    setRejectTarget(product);
    setRejectReason(product.rejectionReason || "");
  };

  const closeRejectModal = () => {
    if (workingId) return;
    setRejectTarget(null);
    setRejectReason("");
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      showToast("Vui lòng nhập lý do từ chối sản phẩm.", "error");
      return;
    }
    await changeApproval(rejectTarget, "rejected", rejectReason.trim());
    closeRejectModal();
  };

  const toggleProductStatus = async (product: Product) => {
    const nextStatus = product.isActive === false;
    setWorkingId(product.id);
    try {
      const updated = await adminService.updateProductStatus(product.id, nextStatus);
      updateLocalProduct(updated);
      showToast(nextStatus ? "Đã hiển thị sản phẩm." : "Đã ẩn sản phẩm.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không cập nhật được trạng thái sản phẩm.", "error");
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
            <h1 className="mt-4 text-4xl font-black text-[#0b2463]">Duyệt sản phẩm</h1>
            <p className="mt-2 text-sm font-bold text-[#607198]">Admin duyệt sản phẩm do cửa hàng tiện lợi hoặc sinh viên đăng bán.</p>
          </div>
          <Button variant="ghost" onClick={loadProducts}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageSearch className="h-4 w-4" />}
            Làm mới
          </Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat icon={<Boxes className="h-5 w-5" />} label="Tổng sản phẩm" value={stats.total} tone="blue" />
          <Stat icon={<PackageSearch className="h-5 w-5" />} label="Chờ duyệt" value={stats.pending} tone="amber" />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Đã duyệt" value={stats.approved} tone="green" />
          <Stat icon={<XCircle className="h-5 w-5" />} label="Từ chối" value={stats.rejected} tone="pink" />
          <Stat icon={<EyeOff className="h-5 w-5" />} label="Đang ẩn" value={stats.inactive} tone="gray" />
        </div>

        <div className="mt-7 rounded-[1.5rem] border border-white/80 bg-white/76 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.13)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7daa]" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tên, danh mục hoặc mã sản phẩm..."
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
          ) : filteredProducts.length === 0 ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <PackageSearch className="mx-auto h-12 w-12 text-[#3567ff]" />
                <p className="mt-4 text-xl font-black text-[#11285f]">Không có sản phẩm phù hợp.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  working={workingId === product.id}
                  onToggleStatus={toggleProductStatus}
                  onChangeApproval={changeApproval}
                  onReject={openRejectModal}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {rejectTarget && (
        <RejectReasonModal
          product={rejectTarget}
          reason={rejectReason}
          saving={workingId === rejectTarget.id}
          onChange={setRejectReason}
          onClose={closeRejectModal}
          onSubmit={submitReject}
        />
      )}
    </AdminShell>
  );
}

function ProductCard({
  product,
  working,
  onToggleStatus,
  onChangeApproval,
  onReject
}: {
  product: Product;
  working: boolean;
  onToggleStatus: (product: Product) => void;
  onChangeApproval: (product: Product, approvalStatus: ApprovalStatus, rejectionReason?: string) => void;
  onReject: (product: Product) => void;
}) {
  const isActive = product.isActive !== false;
  const approval = normalizeApproval(product.approvalStatus);

  return (
    <article className="grid gap-4 rounded-[1.25rem] border border-[#dbeaff] bg-white/82 p-4 shadow-[0_14px_36px_rgba(76,107,171,0.12)] sm:grid-cols-[132px_1fr]">
      <div className="aspect-square overflow-hidden rounded-[1.1rem] bg-[#f4f9ff]">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-[#607198]">
            <ImageIcon className="h-9 w-9" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-lg font-black text-[#0b2463]">{product.name}</p>
            <p className="mt-1 text-xs font-black uppercase text-[#607198]">{product.categoryName || "Chưa có danh mục"}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-black", approvalClass(approval))}>{approvalLabel(approval)}</span>
            {!isActive && <span className="rounded-full bg-blush/70 px-3 py-1 text-xs font-black text-[#8d2845]">Đang ẩn</span>}
          </div>
        </div>

        <p className="mt-4 text-2xl font-black text-[#ff3d9a]">{formatCurrency(product.basePrice)}</p>
        <p className="mt-2 line-clamp-2 text-sm font-bold text-[#607198]">{product.description || "Sản phẩm chưa có mô tả."}</p>

        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          {approval !== "approved" && (
            <Button
              className="bg-[#dff7e9] text-[#17664f] hover:bg-[#cff0dd]"
              disabled={working}
              onClick={() => onChangeApproval(product, "approved")}
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Duyệt
            </Button>
          )}
          {approval !== "rejected" && (
            <Button
              className="bg-[#ffd7e8] text-[#9b244f] hover:bg-[#ffc8df]"
              disabled={working}
              onClick={() => onReject(product)}
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Từ chối
            </Button>
          )}
          <Button
            variant={isActive ? "ghost" : "primary"}
            className={cn(!isActive && "bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90")}
            disabled={working}
            onClick={() => onToggleStatus(product)}
          >
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isActive ? "Ẩn sản phẩm" : "Hiện sản phẩm"}
          </Button>
        </div>
      </div>
    </article>
  );
}

function RejectReasonModal({
  product,
  reason,
  saving,
  onChange,
  onClose,
  onSubmit
}: {
  product: Product;
  reason: string;
  saving: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center px-4 py-8">
      <button type="button" className="absolute inset-0 bg-[#17244f]/45 backdrop-blur-md" onClick={onClose} aria-label="Đóng popup từ chối" />
      <div className="relative w-full max-w-xl rounded-[1.5rem] border border-white/80 bg-white/95 p-6 shadow-[0_30px_110px_rgba(20,38,84,0.34)]">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-[#f4f9ff] text-[#092768]">
          <XCircle className="h-5 w-5" />
        </button>
        <p className="inline-flex rounded-full bg-[#ffe3ef] px-4 py-2 text-sm font-black text-[#9b244f]">Từ chối sản phẩm</p>
        <h2 className="mt-4 pr-12 text-2xl font-black text-[#0b2463]">{product.name}</h2>
        <p className="mt-2 text-sm font-bold text-[#607198]">Lý do này sẽ hiển thị cho seller để họ chỉnh lại sản phẩm.</p>
        <textarea
          value={reason}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          placeholder="Ví dụ: Ảnh sản phẩm chưa rõ, mô tả còn thiếu tình trạng hàng..."
          className="mt-5 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 py-3 text-sm font-bold text-[#11285f] outline-none focus:ring-4 focus:ring-[#ffd7e8]/60"
        />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button type="button" className="bg-[#ffd7e8] text-[#9b244f] hover:bg-[#ffc8df]" onClick={onSubmit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Xác nhận từ chối
          </Button>
        </div>
      </div>
    </div>
  );
}

function normalizeApproval(status?: string | null): ApprovalStatus {
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  return "approved";
}

function approvalLabel(status: ApprovalStatus) {
  if (status === "pending") return "Chờ duyệt";
  if (status === "rejected") return "Từ chối";
  return "Đã duyệt";
}

function approvalMessage(status: ApprovalStatus) {
  if (status === "approved") return "Đã duyệt sản phẩm.";
  if (status === "rejected") return "Đã từ chối sản phẩm.";
  return "Đã chuyển sản phẩm về trạng thái chờ duyệt.";
}

function approvalClass(status: ApprovalStatus) {
  if (status === "pending") return "bg-honey/40 text-[#935b00]";
  if (status === "rejected") return "bg-blush/70 text-[#8d2845]";
  return "bg-mint/70 text-[#17664f]";
}

function Stat({
  icon,
  label,
  value,
  tone
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "blue" | "green" | "pink" | "amber" | "gray";
}) {
  const toneClass = {
    blue: "bg-[#dff2ff] text-[#3567ff]",
    green: "bg-[#dff7e9] text-[#1a9d64]",
    pink: "bg-[#ffe3ef] text-[#c93472]",
    amber: "bg-[#fff0c8] text-[#a66b00]",
    gray: "bg-[#eef3fb] text-[#607198]"
  }[tone];

  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.12)] backdrop-blur-xl">
      <span className={cn("grid h-12 w-12 place-items-center rounded-[1rem]", toneClass)}>{icon}</span>
      <p className="mt-5 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#0b2463]">{value}</p>
    </div>
  );
}
