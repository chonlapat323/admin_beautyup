"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard } from "./page-elements";

type ApiBanner = {
  id: string;
  eyebrow: string;
  title: string;
  body?: string | null;
  tag?: string | null;
  buttonLabel: string;
  imageUrl?: string | null;
  linkType: string;
  linkId?: string | null;
  sortOrder: number;
  isActive: boolean;
};

type BannerFormState = {
  eyebrow: string;
  title: string;
  body: string;
  tag: string;
  buttonLabel: string;
  linkType: string;
  linkId: string;
  isActive: boolean;
};

const INITIAL_FORM: BannerFormState = {
  eyebrow: "",
  title: "",
  body: "",
  tag: "",
  buttonLabel: "Shop Now",
  linkType: "none",
  linkId: "",
  isActive: true,
};

const LINK_TYPE_OPTIONS = [
  { label: "ไม่มีลิงก์", value: "none" },
  { label: "สินค้า (ProductDetail)", value: "product" },
  { label: "หมวดหมู่ (Category)", value: "category" },
];

function BannerFormModal({
  editingId,
  form,
  isSubmitting,
  categories,
  products,
  imageFile,
  imagePreview,
  onChange,
  onImageChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: BannerFormState;
  isSubmitting: boolean;
  categories: { id: string; name: string }[];
  products: { id: string; name: string; sku: string }[];
  imageFile: File | null;
  imagePreview: string | null;
  onChange: (next: Partial<BannerFormState>) => void;
  onImageChange: (file: File) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="flex w-full max-w-xl flex-col rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <h3 className="text-2xl font-bold text-dark dark:text-white">
            {editingId ? "แก้ไขแบนเนอร์" : "เพิ่มแบนเนอร์"}
          </h3>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e7dc] text-dark-5 transition-colors hover:bg-[#f4fbf6] dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form className="space-y-5 px-7 py-7" id="banner-form" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                Eyebrow <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ eyebrow: e.target.value })}
                placeholder="เช่น Spring Ritual"
                value={form.eyebrow}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                หัวข้อหลัก <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="เช่น Care That Feels Premium"
                value={form.title}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">คำอธิบาย</label>
              <textarea
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ body: e.target.value })}
                placeholder="คำอธิบายสั้นๆ (ไม่บังคับ)"
                rows={2}
                value={form.body}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                Badge <span className="text-xs font-normal text-dark-5">(เช่น NEW, BEST SELLER — แสดงมุมบนขวาของ banner)</span>
              </label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ tag: e.target.value })}
                placeholder="NEW / BEST SELLER (ไม่บังคับ)"
                value={form.tag}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">ชื่อปุ่ม</label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ buttonLabel: e.target.value })}
                placeholder="Shop Now"
                value={form.buttonLabel}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">ลิงก์ปุ่ม</label>
              <select
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ linkType: e.target.value, linkId: "" })}
                value={form.linkType}
              >
                {LINK_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {form.linkType === "product" ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  เลือกสินค้า <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  onChange={(e) => onChange({ linkId: e.target.value })}
                  value={form.linkId}
                >
                  <option value="">เลือกสินค้า</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                  ))}
                </select>
              </div>
            ) : form.linkType === "category" ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  เลือกหมวดหมู่ <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  onChange={(e) => onChange({ linkId: e.target.value })}
                  value={form.linkId}
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">รูปภาพ</label>
              <input
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageChange(f); }}
                ref={fileRef}
                type="file"
              />
              <button
                className="flex h-14 w-full items-center justify-center rounded-[18px] border-2 border-dashed border-[#c8ddd1] bg-[#f8fbf9] text-sm text-[#5f8f74] transition-colors hover:border-[#5f8f74]"
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                {imagePreview ? (
                  <img alt="preview" className="h-12 w-auto rounded-lg object-cover" src={imagePreview} />
                ) : (
                  "คลิกเพื่อเลือกรูป"
                )}
              </button>
              {imageFile ? (
                <p className="mt-1 text-xs text-dark-5">{imageFile.name}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
                onClick={() => onChange({ isActive: !form.isActive })}
                type="button"
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-dark dark:text-white">{form.isActive ? "เผยแพร่" : "ซ่อน"}</span>
            </div>
          </form>
        </div>

        <div className="shrink-0 flex flex-wrap gap-3 border-t border-[#edf4ef] px-7 py-5 dark:border-dark-3">
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:opacity-70"
            disabled={isSubmitting}
            form="banner-form"
            type="submit"
          >
            {isSubmitting ? "กำลังบันทึก..." : editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มแบนเนอร์"}
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function BannerManager() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerFormState>(INITIAL_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadBanners() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/banners", { cache: "no-store" });
      const data = await res.json() as ApiBanner[];
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      showToast("ไม่สามารถโหลดแบนเนอร์ได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormData() {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories?status=active&pageSize=100", { cache: "no-store" }),
        fetch("/api/products?status=active&pageSize=200", { cache: "no-store" }),
      ]);
      const catData = await catRes.json() as { items?: { id: string; name: string }[] };
      const prodData = await prodRes.json() as { items?: { id: string; name: string; sku: string }[] };
      setCategories(catData.items ?? []);
      setProducts(prodData.items ?? []);
    } catch {
      // silently fail
    }
  }

  useEffect(() => { void loadBanners(); }, []);
  useEffect(() => { if (isModalOpen) void loadFormData(); }, [isModalOpen]);

  function resetForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setImageFile(null);
    setImagePreview(null);
  }

  function startEdit(banner: ApiBanner) {
    setEditingId(banner.id);
    setForm({
      eyebrow: banner.eyebrow,
      title: banner.title,
      body: banner.body ?? "",
      tag: banner.tag ?? "",
      buttonLabel: banner.buttonLabel,
      linkType: banner.linkType,
      linkId: banner.linkId ?? "",
      isActive: banner.isActive,
    });
    setImagePreview(banner.imageUrl ?? null);
    setImageFile(null);
    setIsModalOpen(true);
  }

  function handleImageChange(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.eyebrow.trim() || !form.title.trim()) {
      showToast("กรุณากรอก Eyebrow และหัวข้อหลัก", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        eyebrow: form.eyebrow.trim(),
        title: form.title.trim(),
        body: form.body.trim() || undefined,
        tag: form.tag.trim() || null,
        buttonLabel: form.buttonLabel.trim() || "Shop Now",
        linkType: form.linkType,
        linkId: form.linkId || null,
        isActive: form.isActive,
      };

      let savedId = editingId;

      if (editingId) {
        await fetch(`/api/banners/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as ApiBanner;
        savedId = data.id;
      }

      if (imageFile && savedId) {
        const fd = new FormData();
        fd.append("file", imageFile);
        await fetch(`/api/banners/${savedId}/image`, { method: "POST", body: fd });
      }

      showToast(editingId ? "อัปเดตแบนเนอร์สำเร็จ" : "สร้างแบนเนอร์สำเร็จ", "success");
      setIsModalOpen(false);
      resetForm();
      await loadBanners();
    } catch {
      showToast("ไม่สามารถบันทึกแบนเนอร์ได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(banner: ApiBanner) {
    try {
      await fetch(`/api/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
    } catch {
      showToast("ไม่สามารถเปลี่ยนสถานะได้", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/banners/${bannerToDelete}`, { method: "DELETE" });
      showToast("ลบแบนเนอร์สำเร็จ", "warning");
      setBannerToDelete(null);
      await loadBanners();
    } catch {
      showToast("ไม่สามารถลบแบนเนอร์ได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDrop(toIdx: number) {
    if (draggingIdx === null || draggingIdx === toIdx) return;
    const next = [...banners];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(toIdx, 0, moved);
    const reordered = next.map((b, i) => ({ ...b, sortOrder: i }));
    setBanners(reordered);
    setDraggingIdx(null);
    setDragOverIdx(null);
    try {
      await fetch("/api/banners/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((b) => ({ id: b.id, sortOrder: b.sortOrder })) }),
      });
    } catch {
      showToast("ไม่สามารถบันทึกลำดับได้", "error");
      await loadBanners();
    }
  }

  const linkLabel = (b: ApiBanner) => {
    if (b.linkType === "product") return `สินค้า: ${products.find((p) => p.id === b.linkId)?.name ?? b.linkId ?? "-"}`;
    if (b.linkType === "category") return `หมวดหมู่: ${categories.find((c) => c.id === b.linkId)?.name ?? b.linkId ?? "-"}`;
    return "-";
  };

  const filteredBanners = banners.filter((b) =>
    !search.trim() ||
    b.title.toLowerCase().includes(search.trim().toLowerCase()) ||
    b.eyebrow.toLowerCase().includes(search.trim().toLowerCase())
  );
  const totalItems = filteredBanners.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedBanners = filteredBanners.slice((page - 1) * pageSize, page * pageSize);
  const hasFilter = search.trim() !== "";
  const dragEnabled = !hasFilter && totalPages === 1;

  return (
    <>
      <ContentCard
        title="จัดการแบนเนอร์"
        description="แบนเนอร์แสดงบนหน้าแรก mobile app ลากเพื่อเรียงลำดับ"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-60">
            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหา..."
              value={search}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              value={pageSize}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} รายการ</option>
              ))}
            </select>
            <button
              className="shrink-0 inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              type="button"
            >
              + เพิ่มแบนเนอร์
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[360px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="hidden px-4 py-3 font-semibold w-8 sm:table-cell"></th>
                <th className="px-4 py-3 font-semibold">รูป</th>
                <th className="px-4 py-3 font-semibold">Eyebrow / หัวข้อ</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ลิงก์</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="hidden px-4 py-4 sm:table-cell"><div className="h-4 w-4 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-3 py-2"><div className="h-12 w-20 animate-pulse rounded-lg bg-dark-5/20" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-36 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="hidden px-4 py-4 md:table-cell"><div className="h-4 w-28 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-11 animate-pulse rounded-full bg-dark-5/20" /></td>
                    <td className="px-4 py-4"><div className="h-7 w-20 animate-pulse rounded-full bg-dark-5/20" /></td>
                  </tr>
                ))
              ) : pagedBanners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect height="18" rx="3" width="18" x="3" y="3" /><path d="M3 9h18M9 21V9" /></svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">{hasFilter ? "ไม่พบรายการ" : "ยังไม่มีแบนเนอร์"}</p>
                      <p className="mt-1 text-sm text-dark-5">{hasFilter ? "ลองเปลี่ยนคำค้นหา" : "เพิ่มแบนเนอร์แรกเพื่อแสดงบนหน้าแรก mobile app"}</p>
                    </div>
                  </td>
                </tr>
              ) : pagedBanners.map((banner, idx) => (
                <tr
                  key={banner.id}
                  className={`group border-t border-stroke text-sm dark:border-dark-3 transition-colors ${draggingIdx === idx ? "opacity-40" : ""} ${dragOverIdx === idx && draggingIdx !== idx ? "bg-[#eef8f1]" : ""}`}
                  draggable={dragEnabled}
                  onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
                  onDragOver={(e) => { e.preventDefault(); if (dragEnabled) setDragOverIdx(idx); }}
                  onDragStart={() => { if (dragEnabled) setDraggingIdx(idx); }}
                  onDrop={() => { if (dragEnabled) void handleDrop(idx); }}
                >
                  <td className="hidden cursor-grab select-none px-3 py-3 text-center text-dark-5 opacity-30 transition-opacity group-hover:opacity-70 sm:table-cell">⠿</td>
                  <td className="px-3 py-2">
                    {banner.imageUrl ? (
                      <img alt={banner.title} className="h-12 w-20 rounded-lg object-cover border border-[#d8e6dd]" src={banner.imageUrl} />
                    ) : (
                      <div className="h-12 w-20 rounded-lg border border-dashed border-[#c8ddd1] bg-[#f8fbf9] flex items-center justify-center text-lg text-[#b8d4c1]">🖼</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-dark-5 uppercase">{banner.eyebrow}</div>
                    <div className="font-semibold text-dark dark:text-white">{banner.title}</div>
                    <div className="text-xs text-dark-5">{banner.buttonLabel}</div>
                  </td>
                  <td className="hidden px-4 py-4 text-xs text-dark-5 md:table-cell">{linkLabel(banner)}</td>
                  <td className="px-4 py-4">
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${banner.isActive ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
                      onClick={() => void handleToggleActive(banner)}
                      type="button"
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${banner.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                        onClick={() => startEdit(banner)}
                        type="button"
                      >
                        แก้ไข
                      </button>
                      <button
                        className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4]"
                        onClick={() => setBannerToDelete(banner.id)}
                        type="button"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-dark-5">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#d8e6dd] border-t-[#45745a]" />
                กำลังโหลด...
              </span>
            ) : (
              <>
                <span className="font-semibold text-dark dark:text-white">{totalItems}</span>
                {" รายการ"}
                {totalPages > 1 ? ` · หน้า ${page}/${totalPages}` : ""}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >← ก่อนหน้า</button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >ถัดไป →</button>
          </div>
        </div>
      </ContentCard>

      {bannerToDelete ? createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-center justify-between gap-3 border-b border-[#f3e8e7] px-6 py-5 dark:border-dark-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
                  <svg fill="none" height="18" stroke="#c84b44" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
                </div>
                <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบแบนเนอร์</h3>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3" onClick={() => setBannerToDelete(null)} type="button">✕</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">ต้องการลบแบนเนอร์นี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#f3e8e7] px-6 py-4 dark:border-dark-3">
              <button className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]" onClick={() => setBannerToDelete(null)} type="button">ยกเลิก</button>
              <button className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:opacity-70" disabled={isDeleting} onClick={() => void handleConfirmDelete()} type="button">
                {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      {isModalOpen ? createPortal(
        <BannerFormModal
          editingId={editingId}
          form={form}
          isSubmitting={isSubmitting}
          categories={categories}
          products={products}
          imageFile={imageFile}
          imagePreview={imagePreview}
          onChange={(next) => setForm((c) => ({ ...c, ...next }))}
          onImageChange={handleImageChange}
          onClose={() => { setIsModalOpen(false); resetForm(); }}
          onSubmit={handleSubmit}
        />,
        document.body,
      ) : null}
    </>
  );
}
