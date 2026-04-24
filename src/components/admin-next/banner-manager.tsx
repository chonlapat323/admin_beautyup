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
        className="w-full max-w-xl overflow-y-auto rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <h3 className="text-2xl font-bold text-dark dark:text-white">
            {editingId ? "แก้ไขแบนเนอร์" : "เพิ่มแบนเนอร์"}
          </h3>
          <button
            className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ปิด
          </button>
        </div>

        <form className="space-y-5 px-7 py-7" onSubmit={onSubmit}>
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
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.isActive ? "bg-[#58cf94]" : "bg-[#d7e2db]"}`}
              onClick={() => onChange({ isActive: !form.isActive })}
              type="button"
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-dark dark:text-white">{form.isActive ? "เผยแพร่" : "ซ่อน"}</span>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:opacity-70"
              disabled={isSubmitting}
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
        </form>
      </div>
    </div>
  );
}

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

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบแบนเนอร์นี้ใช่หรือไม่?")) return;
    try {
      await fetch(`/api/banners/${id}`, { method: "DELETE" });
      showToast("ลบแบนเนอร์สำเร็จ", "warning");
      await loadBanners();
    } catch {
      showToast("ไม่สามารถลบแบนเนอร์ได้", "error");
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

  return (
    <>
      <ContentCard
        title="จัดการแบนเนอร์"
        description="แบนเนอร์แสดงบนหน้าแรก mobile app ลากเพื่อเรียงลำดับ"
        aside={
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            type="button"
          >
            + เพิ่มแบนเนอร์
          </button>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[360px] text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="hidden px-4 py-4 font-medium w-8 sm:table-cell"></th>
                <th className="px-4 py-4 font-medium">รูป</th>
                <th className="px-4 py-4 font-medium">Eyebrow / หัวข้อ</th>
                <th className="hidden px-4 py-4 font-medium md:table-cell">ลิงก์</th>
                <th className="px-4 py-4 font-medium">สถานะ</th>
                <th className="px-4 py-4 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : banners.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-sm text-dark-5" colSpan={6}>ยังไม่มีแบนเนอร์</td></tr>
              ) : banners.map((banner, idx) => (
                <tr
                  key={banner.id}
                  className={`border-t border-stroke text-sm dark:border-dark-3 transition-colors ${draggingIdx === idx ? "opacity-40" : ""} ${dragOverIdx === idx ? "bg-[#eef8f1]" : ""}`}
                  draggable
                  onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                  onDragStart={() => setDraggingIdx(idx)}
                  onDrop={() => void handleDrop(idx)}
                >
                  <td className="hidden px-4 py-4 text-center text-lg text-dark-5 cursor-grab sm:table-cell">⠿</td>
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
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${banner.isActive ? "bg-[#58cf94]" : "bg-[#d7e2db]"}`}
                      onClick={() => void handleToggleActive(banner)}
                      type="button"
                    >
                      <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${banner.isActive ? "translate-x-6" : "translate-x-1"}`} />
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
                        onClick={() => void handleDelete(banner.id)}
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
      </ContentCard>

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
