"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";

import { ProductImageManager, type PreviewImage } from "./product-image-manager";
import { ContentCard, StatusPill } from "./page-elements";

type RewardProductImage = {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  sortOrder: number;
};

type RewardProduct = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  images: RewardProductImage[];
  pointCost: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
};

type FormState = {
  name: string;
  description: string;
  pointCost: string;
  stock: string;
  isActive: boolean;
};

type StatusFilter = "all" | "active" | "inactive";
type SelectOption<T extends string | number> = { label: string; value: T };

const NUM_COLS = 5;

const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { label: "ทุกสถานะ", value: "all" },
  { label: "เปิดใช้งาน", value: "active" },
  { label: "ปิดใช้งาน", value: "inactive" },
];

const PAGE_SIZE_OPTIONS: SelectOption<number>[] = [
  { label: "10 รายการ", value: 10 },
  { label: "20 รายการ", value: 20 },
  { label: "50 รายการ", value: 50 },
];

const INITIAL_FORM: FormState = {
  name: "",
  description: "",
  pointCost: "",
  stock: "",
  isActive: true,
};

function SelectField<T extends string | number>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        className="flex w-full items-center justify-between rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark transition-colors hover:border-[#bfd6c7] focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        onClick={() => setIsOpen((c) => !c)}
        type="button"
      >
        <span>{selectedOption?.label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-dark-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-[#d8e6dd] bg-white shadow-1 dark:border-dark-3 dark:bg-dark-2">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                  isSelected ? "bg-[#eef8f1] font-semibold text-[#355846]" : "text-dark hover:bg-[#f8fbf9] dark:text-white dark:hover:bg-dark-3"
                }`}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                type="button"
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <svg className="h-4 w-4 text-[#45745a]" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z" fillRule="evenodd" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function RewardProductModal({
  title,
  form,
  images,
  isSubmitting,
  onChange,
  onImagesChange,
  onClose,
  onSubmit,
}: {
  title: string;
  form: FormState;
  images: PreviewImage[];
  isSubmitting: boolean;
  onChange: (next: Partial<FormState>) => void;
  onImagesChange: React.Dispatch<React.SetStateAction<PreviewImage[]>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}) {
  const inputCls =
    "w-full rounded-[14px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white";

  async function handleFilesDropped(files: File[]) {
    const pending: PreviewImage[] = files.map((f) => ({
      key: `${Date.now()}-${f.name}`,
      url: URL.createObjectURL(f),
      kind: "temp",
      uploading: true,
      error: false,
    }));
    onImagesChange([...images, ...pending]);

    const results = await Promise.allSettled(
      files.map(async (f, i) => {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/uploads/temp", { method: "POST", body: fd });
        const data = await res.json() as { filename: string; url: string };
        if (!res.ok) throw new Error("upload failed");
        return { key: pending[i].key, filename: data.filename, url: data.url };
      }),
    );

    onImagesChange((prev: PreviewImage[]) =>
      prev.map((img) => {
        const idx = pending.findIndex((p) => p.key === img.key);
        if (idx === -1) return img;
        const r = results[idx];
        if (r.status === "fulfilled") {
          return { ...img, url: r.value.url, tempFilename: r.value.filename, uploading: false };
        }
        return { ...img, uploading: false, error: true };
      }),
    );
  }

  async function handleRemove(key: string) {
    const img = images.find((i) => i.key === key);
    if (img?.kind === "temp" && img.tempFilename) {
      void fetch(`/api/uploads/temp/${img.tempFilename}`, { method: "DELETE" });
    }
    onImagesChange(images.filter((i) => i.key !== key));
  }

  function handleReorder(from: number, to: number) {
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onImagesChange(next);
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div className="flex w-full max-w-lg flex-col rounded-[24px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark" style={{ maxHeight: "90vh" }}>
        <div className="shrink-0 flex items-center justify-between border-b border-[#edf4ef] px-6 py-5 dark:border-dark-3">
          <h3 className="text-lg font-semibold text-dark dark:text-white">{title}</h3>
          <button onClick={onClose} type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e7dc] text-dark-5 transition-colors hover:bg-[#f4fbf6] dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="reward-product-form" onSubmit={onSubmit} className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">ชื่อสินค้า <span className="text-red-500">*</span></label>
              <input className={inputCls} value={form.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="เช่น ครีมบำรุงผม" required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">รายละเอียด</label>
              <input className={inputCls} value={form.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="รายละเอียดสั้นๆ" />
            </div>


            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">รูปภาพ</label>
              <ProductImageManager
                images={images}
                onFilesDropped={handleFilesDropped}
                onRemove={handleRemove}
                onReorder={handleReorder}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">แต้มที่ใช้ <span className="text-red-500">*</span></label>
                <input className={inputCls} type="number" min={1} value={form.pointCost} onChange={(e) => onChange({ pointCost: e.target.value })} onFocus={(e) => e.target.select()} placeholder="500" required />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">จำนวนสต็อก <span className="text-red-500">*</span></label>
                <input className={inputCls} type="number" min={0} value={form.stock} onChange={(e) => onChange({ stock: e.target.value })} onFocus={(e) => e.target.select()} placeholder="10" required />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onChange({ isActive: !form.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm text-dark dark:text-white">{form.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
            </div>
          </form>
        </div>

        <div className="shrink-0 flex justify-end gap-3 border-t border-[#edf4ef] px-6 py-4 dark:border-dark-3">
          <button type="button" onClick={onClose} className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]">
            ยกเลิก
          </button>
          <button type="submit" form="reward-product-form" disabled={isSubmitting} className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:opacity-70">
            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function RewardProductManager({ initialItems }: { initialItems: RewardProduct[] }) {
  const [items, setItems] = useState(initialItems);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<RewardProduct | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [modalImages, setModalImages] = useState<PreviewImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RewardProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { showToast } = useToast();

  useEffect(() => { setItems(initialItems); }, [initialItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.isActive : !item.isActive);
      return matchSearch && matchStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilter = !!searchTerm || statusFilter !== "all";

  function updateForm(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function openCreate() {
    setForm(INITIAL_FORM);
    setModalImages([]);
    setShowCreate(true);
  }

  function openEdit(item: RewardProduct) {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      pointCost: String(item.pointCost),
      stock: String(item.stock),
      isActive: item.isActive,
    });
    setModalImages(
      item.images.map((img) => ({
        key: img.id,
        url: img.url,
        kind: "existing" as const,
        existingId: img.id,
        uploading: false,
        error: false,
      })),
    );
  }

  function closeModal() {
    setShowCreate(false);
    setEditItem(null);
    setForm(INITIAL_FORM);
    setModalImages([]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const readyImages = modalImages.filter((i) => !i.uploading && !i.error);
      const tempFiles = readyImages
        .filter((i) => i.kind === "temp")
        .map((i) => i.tempFilename!);

      const body: Record<string, unknown> = {
        name: form.name,
        pointCost: Number(form.pointCost),
        stock: Number(form.stock),
        isActive: form.isActive,
      };
      if (form.description) body.description = form.description;
      if (tempFiles.length > 0) body.tempFiles = tempFiles;

      const res = await fetch("/api/reward-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => [data, ...prev]);
      setPage(1);
      closeModal();
      showToast("สร้างสินค้าแลกแต้มสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setIsSubmitting(true);
    try {
      const readyImages = modalImages.filter((i) => !i.uploading && !i.error);
      const orderedImages = readyImages.map((img) =>
        img.kind === "existing"
          ? { kind: "existing" as const, id: img.existingId! }
          : { kind: "temp" as const, filename: img.tempFilename! },
      );

      const body: Record<string, unknown> = {
        name: form.name,
        pointCost: Number(form.pointCost),
        stock: Number(form.stock),
        isActive: form.isActive,
        description: form.description || null,
        orderedImages,
      };

      const res = await fetch(`/api/reward-products/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? data : i)));
      closeModal();
      showToast("แก้ไขสินค้าแลกแต้มสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/reward-products/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("ลบสินค้าแลกแต้มสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard
        title="สินค้าแลกแต้ม"
        description="จัดการสินค้าที่สมาชิกสามารถแลกด้วยแต้มสะสม"
        aside={
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreate}
            type="button"
          >
            + เพิ่มสินค้า
          </button>
        }
      >
        {/* Filter bar */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_130px]">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5"
              fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
              placeholder="ค้นหาสินค้า..."
              value={searchTerm}
            />
          </div>
          <SelectField
            options={STATUS_OPTIONS}
            onChange={(v) => { setPage(1); setStatusFilter(v); }}
            value={statusFilter}
          />
          <SelectField
            options={PAGE_SIZE_OPTIONS}
            onChange={(v) => { setPage(1); setPageSize(v); }}
            value={pageSize}
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">สินค้า</th>
                <th className="px-4 py-3 text-center font-semibold">แต้มที่ใช้</th>
                <th className="px-4 py-3 text-center font-semibold">สต็อก</th>
                <th className="px-4 py-3 text-center font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-center font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={NUM_COLS} className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2]">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">
                        {hasActiveFilter ? "ไม่พบสินค้าแลกแต้ม" : "ยังไม่มีสินค้าแลกแต้ม"}
                      </p>
                      <p className="mt-1 text-sm text-dark-5">
                        {hasActiveFilter ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เพิ่มสินค้าแรกเพื่อให้สมาชิกแลกด้วยแต้มสะสม"}
                      </p>
                      {!hasActiveFilter ? (
                        <button
                          className="mt-4 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
                          onClick={openCreate}
                          type="button"
                        >
                          + เพิ่มสินค้าแรก
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="group border-t border-stroke text-sm transition-colors hover:bg-[#fafcfb] dark:border-dark-3 dark:hover:bg-dark-2/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.images[0].thumbnailUrl ?? item.images[0].url} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg border border-[#d8e6dd] object-cover" />
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-[#f0f7f2]" />
                        )}
                        <div>
                          <p className="font-medium text-dark dark:text-white">{item.name}</p>
                          {item.description && <p className="text-xs text-dark-5 dark:text-dark-6">{item.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold tabular-nums text-[#45745a]">{item.pointCost.toLocaleString()} pts</td>
                    <td className="px-4 py-3 text-center tabular-nums text-dark dark:text-white">{item.stock}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill label={item.isActive ? "เปิด" : "ปิด"} tone={item.isActive ? "success" : "default"} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                          type="button"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4] disabled:opacity-50"
                          type="button"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-dark-5">
            <span className="font-semibold text-dark dark:text-white">{filteredItems.length}</span>
            {" รายการ"}
            {totalPages > 1 ? ` · หน้า ${page}/${totalPages}` : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >
              ← ก่อนหน้า
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </ContentCard>

      {showCreate && (
        <RewardProductModal
          title="เพิ่มสินค้าแลกแต้ม"
          form={form}
          images={modalImages}
          isSubmitting={isSubmitting}
          onChange={updateForm}
          onImagesChange={setModalImages}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}
      {editItem && (
        <RewardProductModal
          title="แก้ไขสินค้าแลกแต้ม"
          form={form}
          images={modalImages}
          isSubmitting={isSubmitting}
          onChange={updateForm}
          onImagesChange={setModalImages}
          onClose={closeModal}
          onSubmit={handleEdit}
        />
      )}

      {deleteTarget ? createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-center justify-between gap-3 border-b border-[#f3e8e7] px-6 py-5 dark:border-dark-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
                  <svg fill="none" height="18" stroke="#c84b44" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
                </div>
                <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบสินค้า</h3>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e7dc] text-dark-5 transition-colors hover:bg-[#f4fbf6] dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2">✕</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">
                ต้องการลบ <strong className="text-dark dark:text-white">{deleteTarget.name}</strong> ใช่หรือไม่?{" "}
                การลบไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#f3e8e7] px-6 py-4 dark:border-dark-3">
              <button className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]" onClick={() => setDeleteTarget(null)} type="button">ยกเลิก</button>
              <button className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:opacity-70" disabled={isDeleting} onClick={() => void confirmDelete()} type="button">
                {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
