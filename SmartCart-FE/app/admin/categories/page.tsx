"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, Grid2X2, ImageIcon, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { adminService, type CategoryPayload } from "@/services/adminService";
import { useToastStore } from "@/store/toastStore";
import type { Category } from "@/types";
import { cn } from "@/utils/cn";

type CategoryFormState = {
  name: string;
  slug: string;
  imageUrl: string;
  displayOrder: string;
  parentId: string;
};

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  imageUrl: "",
  displayOrder: "0",
  parentId: ""
};

export default function AdminCategoriesPage() {
  const { showToast } = useToastStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      setCategories(await adminService.getCategories());
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được danh sách danh mục.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return categories.filter((category) => {
      return (
        !query ||
        category.name.toLowerCase().includes(query) ||
        category.slug?.toLowerCase().includes(query) ||
        category.id.toLowerCase().includes(query)
      );
    });
  }, [categories, keyword]);

  const rootCount = useMemo(() => categories.filter((category) => !category.parentId).length, [categories]);
  const childCount = categories.length - rootCount;

  const openCreate = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      imageUrl: category.imageUrl || "",
      displayOrder: String(category.displayOrder ?? 0),
      parentId: category.parentId || ""
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingCategory(null);
    setForm(emptyForm);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      showToast("Tên danh mục không được để trống.", "error");
      return;
    }

    const payload: CategoryPayload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      displayOrder: Number(form.displayOrder || 0),
      parentId: form.parentId || null
    };

    setSaving(true);
    try {
      const saved = editingCategory
        ? await adminService.updateCategory(editingCategory.id, payload)
        : await adminService.createCategory(payload);
      if (saved) {
        setCategories((current) => {
          const exists = current.some((category) => category.id === saved.id);
          return exists
            ? current.map((category) => (category.id === saved.id ? saved : category))
            : [...current, saved].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name));
        });
      }
      showToast(editingCategory ? "Đã cập nhật danh mục." : "Đã tạo danh mục.");
      closeForm();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không lưu được danh mục.", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    if (!window.confirm(`Xóa danh mục "${category.name}"?`)) return;
    setDeletingId(category.id);
    try {
      await adminService.deleteCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      showToast("Đã xóa danh mục.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không xóa được danh mục.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminShell>
      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex rounded-full bg-[#e9f4ff] px-4 py-2 text-sm font-black text-[#3567ff]">SmartCart Admin</p>
            <h1 className="mt-4 text-4xl font-black text-[#0b2463]">Quản lý danh mục</h1>
            <p className="mt-2 text-sm font-bold text-[#607198]">Tạo, chỉnh sửa và sắp xếp danh mục sản phẩm.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={loadCategories}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Grid2X2 className="h-4 w-4" />}
              Làm mới
            </Button>
            <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Thêm danh mục
            </Button>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Stat label="Tổng danh mục" value={categories.length} />
          <Stat label="Danh mục gốc" value={rootCount} />
          <Stat label="Danh mục con" value={childCount} />
        </div>

        <div className="mt-7 rounded-[1.5rem] border border-white/80 bg-white/76 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.13)] backdrop-blur-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7daa]" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên, slug hoặc mã danh mục..."
              className="h-12 w-full rounded-full border border-[#d8e8ff] bg-white/86 pl-12 pr-5 text-sm font-bold text-[#11285f] outline-none focus:ring-4 focus:ring-[#bcd8ff]/55"
            />
          </div>

          {loading ? (
            <div className="grid min-h-80 place-items-center">
              <Loader2 className="h-9 w-9 animate-spin text-[#3567ff]" />
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <Grid2X2 className="mx-auto h-12 w-12 text-[#3567ff]" />
                <p className="mt-4 text-xl font-black text-[#11285f]">Không có danh mục phù hợp.</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {filteredCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  parentName={categories.find((item) => item.id === category.parentId)?.name}
                  deleting={deletingId === category.id}
                  onEdit={openEdit}
                  onDelete={deleteCategory}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {formOpen && (
        <CategoryFormModal
          form={form}
          categories={categories}
          editingCategory={editingCategory}
          saving={saving}
          onClose={closeForm}
          onSubmit={submitForm}
          onChange={setForm}
        />
      )}
    </AdminShell>
  );
}

function CategoryCard({
  category,
  parentName,
  deleting,
  onEdit,
  onDelete
}: {
  category: Category;
  parentName?: string;
  deleting: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  return (
    <article className="grid gap-4 rounded-[1.25rem] border border-[#dbeaff] bg-white/82 p-4 shadow-[0_14px_36px_rgba(76,107,171,0.12)] sm:grid-cols-[96px_1fr]">
      <div className="aspect-square overflow-hidden rounded-[1.1rem] bg-[#f4f9ff]">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-[#607198]">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-black text-[#0b2463]">{category.name}</p>
            <p className="mt-1 truncate text-xs font-black uppercase text-[#607198]">/{category.slug}</p>
          </div>
          <span className="rounded-full bg-[#e9f4ff] px-3 py-1 text-xs font-black text-[#3567ff]">Thứ tự {category.displayOrder ?? 0}</span>
        </div>
        <p className="mt-3 text-sm font-bold text-[#607198]">{parentName ? `Danh mục cha: ${parentName}` : "Danh mục gốc"}</p>
        <p className="mt-2 text-xs font-bold text-[#8b9abb]">#{category.id.slice(0, 8).toUpperCase()}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => onEdit(category)}>
            <Edit3 className="h-4 w-4" />
            Sửa
          </Button>
          <Button className="bg-[#ffd7e8] text-[#9b244f] hover:bg-[#ffc8df]" disabled={deleting} onClick={() => onDelete(category)}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Xóa
          </Button>
        </div>
      </div>
    </article>
  );
}

function CategoryFormModal({
  form,
  categories,
  editingCategory,
  saving,
  onClose,
  onSubmit,
  onChange
}: {
  form: CategoryFormState;
  categories: Category[];
  editingCategory: Category | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onChange: (form: CategoryFormState) => void;
}) {
  const parentOptions = categories.filter((category) => category.id !== editingCategory?.id);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto px-4 py-8">
      <button type="button" className="absolute inset-0 bg-[#17244f]/50 backdrop-blur-md" onClick={onClose} aria-label="Đóng form danh mục" />
      <form onSubmit={onSubmit} className="relative w-full max-w-2xl rounded-[1.75rem] border border-white bg-white/96 p-6 shadow-[0_30px_110px_rgba(20,38,84,0.34)] md:p-8">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-[#092768] shadow-[0_14px_34px_rgba(59,87,150,0.18)]">
          <X className="h-5 w-5" />
        </button>
        <p className="inline-flex rounded-full bg-[#e9f4ff] px-4 py-2 text-sm font-black text-[#3567ff]">Danh mục</p>
        <h2 className="mt-4 text-3xl font-black text-[#092768]">{editingCategory ? "Sửa danh mục" : "Thêm danh mục"}</h2>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-black text-[#0b2463]">Tên danh mục</span>
            <input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55" />
          </label>
          <label className="block">
            <span className="text-sm font-black text-[#0b2463]">Slug</span>
            <input value={form.slug} onChange={(event) => onChange({ ...form, slug: event.target.value })} placeholder="Tự tạo nếu để trống" className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55" />
          </label>
          <label className="block">
            <span className="text-sm font-black text-[#0b2463]">Thứ tự hiển thị</span>
            <input type="number" value={form.displayOrder} onChange={(event) => onChange({ ...form, displayOrder: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-black text-[#0b2463]">Ảnh danh mục</span>
            <input value={form.imageUrl} onChange={(event) => onChange({ ...form, imageUrl: event.target.value })} placeholder="https://..." className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-black text-[#0b2463]">Danh mục cha</span>
            <select value={form.parentId} onChange={(event) => onChange({ ...form, parentId: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55">
              <option value="">Không có - danh mục gốc</option>
              {parentOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {editingCategory ? "Lưu thay đổi" : "Tạo danh mục"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.12)] backdrop-blur-xl">
      <span className="grid h-12 w-12 place-items-center rounded-[1rem] bg-[#dff2ff] text-[#3567ff]">
        <Grid2X2 className="h-5 w-5" />
      </span>
      <p className="mt-5 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#0b2463]">{value}</p>
    </div>
  );
}
