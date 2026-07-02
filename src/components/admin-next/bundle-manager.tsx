"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard } from "./page-elements";

type BundleItemData = {
  id: string;
  productId: string;
  quantity: number;
  product: { id: string; name: string; sku: string };
};

type Bundle = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  items: BundleItemData[];
};

type ProductOption = { id: string; name: string; sku: string };

type FormItem = { productId: string; quantity: number };

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function ProductSearchPicker({
  value,
  products,
  onChange,
}: {
  value: string;
  products: ProductOption[];
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.id === value);
  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku.toLowerCase().includes(query.toLowerCase()),
      )
    : products;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(id: string) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative flex-1" ref={ref}>
      {selected && !open ? (
        <button
          className="w-full rounded-[14px] border border-[#5f8f74] bg-[#f0f9f4] px-3 py-2 text-left text-sm text-dark outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          onClick={() => { setQuery(""); setOpen(true); }}
          type="button"
        >
          <span className="font-medium text-[#355846]">{selected.sku}</span>
          {" — "}
          {selected.name}
        </button>
      ) : (
        <input
          autoFocus={open}
          className="w-full rounded-[14px] border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="พิมพ์ชื่อหรือ SKU..."
          value={query}
        />
      )}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-[14px] border border-[#d8e6dd] bg-white shadow-lg dark:border-dark-3 dark:bg-dark-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-xs text-dark-5">ไม่พบสินค้า</p>
          ) : (
            filtered.map((p) => (
              <button
                className="w-full px-3 py-2 text-left text-sm text-dark hover:bg-[#f0f9f4] dark:text-white dark:hover:bg-dark-3"
                key={p.id}
                onClick={() => select(p.id)}
                type="button"
              >
                <span className="font-medium text-[#355846]">{p.sku}</span>
                {" — "}
                {p.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BundleFormModal({
  editingId,
  formName,
  formDesc,
  formActive,
  formItems,
  imageFile,
  imagePreview,
  isSubmitting,
  products,
  onChangeName,
  onChangeDesc,
  onChangeActive,
  onChangeItems,
  onImageChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  formName: string;
  formDesc: string;
  formActive: boolean;
  formItems: FormItem[];
  imageFile: File | null;
  imagePreview: string | null;
  isSubmitting: boolean;
  products: ProductOption[];
  onChangeName: (v: string) => void;
  onChangeDesc: (v: string) => void;
  onChangeActive: (v: boolean) => void;
  onChangeItems: (v: FormItem[]) => void;
  onImageChange: (file: File) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function addItem() {
    onChangeItems([...formItems, { productId: "", quantity: 1 }]);
  }

  function removeItem(idx: number) {
    onChangeItems(formItems.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, patch: Partial<FormItem>) {
    onChangeItems(formItems.map((item, i) => i === idx ? { ...item, ...patch } : item));
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="flex w-full max-w-xl flex-col rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <h3 className="text-2xl font-bold text-dark dark:text-white">
            {editingId ? "แก้ไขสูตรพิเศษ" : "เพิ่มสูตรพิเศษ"}
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
          <form className="space-y-5 px-7 py-7" id="bundle-form" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                ชื่อสูตรพิเศษ <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChangeName(e.target.value)}
                placeholder="เช่น ชุดบำรุงผิวหน้าครบเซ็ต"
                value={formName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">คำอธิบาย</label>
              <textarea
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChangeDesc(e.target.value)}
                placeholder="คำอธิบายสั้นๆ (ไม่บังคับ)"
                rows={2}
                value={formDesc}
              />
            </div>

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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formActive ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
                onClick={() => onChangeActive(!formActive)}
                type="button"
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${formActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-dark dark:text-white">{formActive ? "เผยแพร่" : "ซ่อน"}</span>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-dark dark:text-white">สินค้าในชุด</label>
                <button
                  className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                  onClick={addItem}
                  type="button"
                >
                  + เพิ่มสินค้า
                </button>
              </div>
              {formItems.length === 0 ? (
                <p className="text-xs text-dark-5">ยังไม่มีสินค้าในชุด</p>
              ) : (
                <div className="space-y-2">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <ProductSearchPicker
                        value={item.productId}
                        products={products}
                        onChange={(id) => updateItem(idx, { productId: id })}
                      />
                      <button
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#f1d0cf] text-[#b42318] hover:bg-[#fff5f4]"
                        onClick={() => removeItem(idx)}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="shrink-0 flex flex-wrap gap-3 border-t border-[#edf4ef] px-7 py-5 dark:border-dark-3">
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:opacity-70"
            disabled={isSubmitting}
            form="bundle-form"
            type="submit"
          >
            {isSubmitting ? "กำลังบันทึก..." : editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มสูตรพิเศษ"}
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

export function BundleManager() {
  const { showToast } = useToast();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formItems, setFormItems] = useState<FormItem[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [bundleToDelete, setBundleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadBundles() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bundles", { cache: "no-store" });
      const data = await res.json() as Bundle[];
      setBundles(Array.isArray(data) ? data : []);
    } catch {
      showToast("ไม่สามารถโหลดสูตรพิเศษได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await fetch("/api/products?status=active&pageSize=200", { cache: "no-store" });
      const data = await res.json() as { items?: ProductOption[] };
      setProducts(data.items ?? []);
    } catch {
      // silently fail
    }
  }

  useEffect(() => { void loadBundles(); }, []);
  useEffect(() => { if (isModalOpen) void loadProducts(); }, [isModalOpen]);

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormActive(true);
    setFormItems([]);
    setImageFile(null);
    setImagePreview(null);
  }

  function startEdit(bundle: Bundle) {
    setEditingId(bundle.id);
    setFormName(bundle.name);
    setFormDesc(bundle.description ?? "");
    setFormActive(bundle.isActive);
    setFormItems(bundle.items.map((item) => ({ productId: item.productId, quantity: item.quantity })));
    setImagePreview(bundle.imageUrl ?? null);
    setImageFile(null);
    setIsModalOpen(true);
  }

  function handleImageChange(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("กรุณากรอกชื่อสูตรพิเศษ", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        isActive: formActive,
        items: formItems.filter((item) => item.productId !== ""),
      };

      let savedId = editingId;

      if (editingId) {
        await fetch(`/api/bundles/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/bundles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as Bundle;
        savedId = data.id;
      }

      if (imageFile && savedId) {
        const fd = new FormData();
        fd.append("file", imageFile);
        await fetch(`/api/bundles/${savedId}/image`, { method: "POST", body: fd });
      }

      showToast(editingId ? "อัปเดตสูตรพิเศษสำเร็จ" : "สร้างสูตรพิเศษสำเร็จ", "success");
      setIsModalOpen(false);
      resetForm();
      await loadBundles();
    } catch {
      showToast("ไม่สามารถบันทึกสูตรพิเศษได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(bundle: Bundle) {
    try {
      await fetch(`/api/bundles/${bundle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !bundle.isActive }),
      });
      setBundles((prev) => prev.map((b) => b.id === bundle.id ? { ...b, isActive: !b.isActive } : b));
    } catch {
      showToast("ไม่สามารถเปลี่ยนสถานะได้", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!bundleToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/bundles/${bundleToDelete}`, { method: "DELETE" });
      showToast("ลบสูตรพิเศษสำเร็จ", "warning");
      setBundleToDelete(null);
      await loadBundles();
    } catch {
      showToast("ไม่สามารถลบสูตรพิเศษได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDrop(toIdx: number) {
    if (draggingIdx === null || draggingIdx === toIdx) return;
    const next = [...bundles];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(toIdx, 0, moved);
    const reordered = next.map((b, i) => ({ ...b, sortOrder: i }));
    setBundles(reordered);
    setDraggingIdx(null);
    setDragOverIdx(null);
    try {
      await fetch("/api/bundles/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((b) => ({ id: b.id, sortOrder: b.sortOrder })) }),
      });
    } catch {
      showToast("ไม่สามารถบันทึกลำดับได้", "error");
      await loadBundles();
    }
  }

  const filteredBundles = bundles.filter((b) =>
    !search.trim() || b.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const totalItems = filteredBundles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedBundles = filteredBundles.slice((page - 1) * pageSize, page * pageSize);
  const hasFilter = search.trim() !== "";
  const dragEnabled = !hasFilter && totalPages === 1;

  return (
    <>
      <ContentCard
        title="จัดการสูตรพิเศษ"
        description="ชุดสินค้าพิเศษสำหรับลูกค้า ลากเพื่อเรียงลำดับ"
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
              + เพิ่มสูตรพิเศษ
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="hidden px-4 py-3 font-semibold w-8 sm:table-cell"></th>
                <th className="px-4 py-3 font-semibold">รูป</th>
                <th className="px-4 py-3 font-semibold">ชื่อ / คำอธิบาย</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">จำนวนสินค้า</th>
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
                    <td className="hidden px-4 py-4 md:table-cell"><div className="h-4 w-16 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-11 animate-pulse rounded-full bg-dark-5/20" /></td>
                    <td className="px-4 py-4"><div className="h-7 w-20 animate-pulse rounded-full bg-dark-5/20" /></td>
                  </tr>
                ))
              ) : pagedBundles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect height="18" rx="3" width="18" x="3" y="3" /><path d="M3 9h18M9 21V9" /></svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">{hasFilter ? "ไม่พบรายการ" : "ยังไม่มีสูตรพิเศษ"}</p>
                      <p className="mt-1 text-sm text-dark-5">{hasFilter ? "ลองเปลี่ยนคำค้นหา" : "เพิ่มสูตรพิเศษแรกเพื่อให้ลูกค้าเลือกซื้อเป็นชุด"}</p>
                    </div>
                  </td>
                </tr>
              ) : pagedBundles.map((bundle, idx) => (
                <tr
                  key={bundle.id}
                  className={`group border-t border-stroke text-sm dark:border-dark-3 transition-colors ${draggingIdx === idx ? "opacity-40" : ""} ${dragOverIdx === idx && draggingIdx !== idx ? "bg-[#eef8f1]" : ""}`}
                  draggable={dragEnabled}
                  onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
                  onDragOver={(e) => { e.preventDefault(); if (dragEnabled) setDragOverIdx(idx); }}
                  onDragStart={() => { if (dragEnabled) setDraggingIdx(idx); }}
                  onDrop={() => { if (dragEnabled) void handleDrop(idx); }}
                >
                  <td className="hidden cursor-grab select-none px-3 py-3 text-center text-dark-5 opacity-30 transition-opacity group-hover:opacity-70 sm:table-cell">⠿</td>
                  <td className="px-3 py-2">
                    {bundle.imageUrl ? (
                      <img alt={bundle.name} className="h-12 w-20 rounded-lg object-cover border border-[#d8e6dd]" src={bundle.thumbnailUrl ?? bundle.imageUrl} />
                    ) : (
                      <div className="h-12 w-20 rounded-lg border border-dashed border-[#c8ddd1] bg-[#f8fbf9] flex items-center justify-center text-lg text-[#b8d4c1]">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect height="18" rx="3" width="18" x="3" y="3" /><path d="M3 9h18M9 21V9" /></svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-dark dark:text-white">{bundle.name}</div>
                    {bundle.description ? (
                      <div className="text-xs text-dark-5 mt-0.5 line-clamp-1">{bundle.description}</div>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-4 text-sm text-dark-5 md:table-cell">
                    {bundle.items.length} รายการ
                  </td>
                  <td className="px-4 py-4">
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bundle.isActive ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
                      onClick={() => void handleToggleActive(bundle)}
                      type="button"
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${bundle.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                        onClick={() => startEdit(bundle)}
                        type="button"
                      >
                        แก้ไข
                      </button>
                      <button
                        className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4]"
                        onClick={() => setBundleToDelete(bundle.id)}
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

      {bundleToDelete ? createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-center justify-between gap-3 border-b border-[#f3e8e7] px-6 py-5 dark:border-dark-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
                  <svg fill="none" height="18" stroke="#c84b44" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
                </div>
                <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบสูตรพิเศษ</h3>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3" onClick={() => setBundleToDelete(null)} type="button">✕</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">ต้องการลบสูตรพิเศษนี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#f3e8e7] px-6 py-4 dark:border-dark-3">
              <button className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]" onClick={() => setBundleToDelete(null)} type="button">ยกเลิก</button>
              <button className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:opacity-70" disabled={isDeleting} onClick={() => void handleConfirmDelete()} type="button">
                {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      {isModalOpen ? createPortal(
        <BundleFormModal
          editingId={editingId}
          formName={formName}
          formDesc={formDesc}
          formActive={formActive}
          formItems={formItems}
          imageFile={imageFile}
          imagePreview={imagePreview}
          isSubmitting={isSubmitting}
          products={products}
          onChangeName={setFormName}
          onChangeDesc={setFormDesc}
          onChangeActive={setFormActive}
          onChangeItems={setFormItems}
          onImageChange={handleImageChange}
          onClose={() => { setIsModalOpen(false); resetForm(); }}
          onSubmit={handleSubmit}
        />,
        document.body,
      ) : null}
    </>
  );
}
