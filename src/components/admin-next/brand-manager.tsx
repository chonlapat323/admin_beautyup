"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiBrand,
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";
import { toProxiedImageUrl } from "@/lib/utils";

type BrandFormState = {
  name: string;
  isActive: boolean;
  sortOrder: string;
  imageUrl: string;
  tempImageFile: string;
  previewUrl: string;
};

const INITIAL_FORM: BrandFormState = {
  name: "",
  isActive: true,
  sortOrder: "0",
  imageUrl: "",
  tempImageFile: "",
  previewUrl: "",
};

function ConfirmDeleteModal({
  brandName,
  isDeleting,
  onClose,
  onConfirm,
}: {
  brandName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
              <svg className="h-5 w-5 text-[#b42318]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบแบรนด์</h3>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-dark-5 hover:bg-neutral-100 dark:hover:bg-dark-2"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">
            ต้องการลบแบรนด์{" "}
            <span className="font-semibold text-dark dark:text-white">"{brandName}"</span>{" "}
            ใช่หรือไม่?
            <br />การลบจะไม่สามารถกู้คืนได้
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
          <button
            className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="rounded-full bg-[#c84b44] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isDeleting}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
          </button>
        </div>
      </div>
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white";
const LABEL_CLS = "mb-1.5 block text-sm font-medium text-dark dark:text-white";

function BrandFormModal({
  editingId,
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: BrandFormState;
  isSubmitting: boolean;
  onChange: (next: Partial<BrandFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/temp", { method: "POST", body: fd });
      const data = await res.json() as { filename: string; url: string };
      onChange({ tempImageFile: data.filename, previewUrl: data.url, imageUrl: "" });
    } catch {
      // silently fail
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const preview = form.previewUrl || form.imageUrl || null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-6">
      <div className="w-full max-w-md rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขแบรนด์" : "เพิ่มแบรนด์"}
            </h3>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">
              {editingId ? "แก้ไขข้อมูลแบรนด์ที่เลือก" : "กรอกข้อมูลเพื่อเพิ่มแบรนด์ใหม่"}
            </p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-neutral-100 dark:hover:bg-dark-2"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form className="space-y-4 px-6 py-5" onSubmit={onSubmit}>
          <div>
            <label className={LABEL_CLS}>
              ชื่อแบรนด์ <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              className={INPUT_CLS}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="เช่น Wella, Schwarzkopf"
              value={form.name}
            />
          </div>

          {/* รูปแบรนด์ */}
          <div>
            <label className={LABEL_CLS}>รูปแบรนด์</label>
            <input
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImageChange(file);
                e.target.value = "";
              }}
            />
            {preview ? (
              <div className="relative inline-block">
                <img
                  alt="brand preview"
                  className="h-24 w-40 rounded-xl border border-[#d8e6dd] object-cover"
                  src={preview}
                />
                <button
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c84b44] text-xs text-white hover:bg-[#ad3d37]"
                  onClick={() => onChange({ tempImageFile: "", imageUrl: "", previewUrl: "" })}
                  type="button"
                >
                  ×
                </button>
                <button
                  className="mt-2 block text-xs text-[#45745a] underline"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  เปลี่ยนรูป
                </button>
              </div>
            ) : (
              <button
                className="flex h-24 w-40 items-center justify-center rounded-xl border-2 border-dashed border-[#d8e6dd] bg-[#f8fbf9] text-sm text-dark-5 transition-colors hover:border-[#5f8f74] hover:bg-[#f0f8f4] disabled:opacity-50"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {isUploading ? "กำลังอัปโหลด..." : "+ เพิ่มรูป"}
              </button>
            )}
          </div>

          <div>
            <label className={LABEL_CLS}>ลำดับ</label>
            <input
              className={INPUT_CLS}
              min="0"
              onChange={(e) => onChange({ sortOrder: e.target.value })}
              onFocus={(e) => e.target.select()}
              type="number"
              value={form.sortOrder}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>สถานะ</label>
            <select
              className={INPUT_CLS}
              onChange={(e) => onChange({ isActive: e.target.value === "active" })}
              value={form.isActive ? "active" : "inactive"}
            >
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
              onClick={onClose}
              type="button"
            >
              ยกเลิก
            </button>
            <button
              className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? editingId ? "กำลังบันทึก..." : "กำลังเพิ่ม..."
                : editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มแบรนด์"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { label: "ทุกสถานะ", value: "all" as const },
  { label: "เปิดใช้งาน", value: "active" as const },
  { label: "ปิดใช้งาน", value: "inactive" as const },
];

export function BrandManager() {
  const { showToast } = useToast();
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BrandFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<ApiBrand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const filteredBrands = brands.filter((b) => {
    const matchSearch = !searchTerm || b.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && b.isActive) ||
      (statusFilter === "inactive" && !b.isActive);
    return matchSearch && matchStatus;
  });

  async function loadBrands() {
    setIsLoading(true);
    try {
      const data = await getBrands();
      setBrands(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลแบรนด์ได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBrands();
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(brand: ApiBrand) {
    setEditingId(brand.id);
    setForm({
      name: brand.name,
      isActive: brand.isActive,
      sortOrder: String(brand.sortOrder),
      imageUrl: brand.imageUrl ?? "",
      tempImageFile: "",
      previewUrl: brand.imageUrl ?? "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(INITIAL_FORM);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("กรุณากรอกชื่อแบรนด์", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const sortOrder = parseInt(form.sortOrder, 10);
      if (editingId) {
        const updated = await updateBrand(editingId, {
          name: form.name.trim(),
          isActive: form.isActive,
          sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
          ...(form.tempImageFile ? { tempImageFile: form.tempImageFile } : {}),
          ...(form.imageUrl === "" && !form.tempImageFile ? { imageUrl: "" } : {}),
        });
        setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToast("อัปเดตแบรนด์สำเร็จ", "success");
      } else {
        const created = await createBrand({
          name: form.name.trim(),
          sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
          ...(form.tempImageFile ? { tempImageFile: form.tempImageFile } : {}),
        });
        setBrands((prev) => [...prev, created]);
        showToast("เพิ่มแบรนด์สำเร็จ", "success");
      }
      closeModal();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถบันทึกแบรนด์ได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDrop(toIdx: number) {
    if (draggingIdx === null || draggingIdx === toIdx) return;
    const next = [...brands];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(toIdx, 0, moved);
    const reordered = next.map((b, i) => ({ ...b, sortOrder: i }));
    setBrands(reordered);
    setDraggingIdx(null);
    setDragOverIdx(null);
    try {
      await fetch("/api/brands/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((b) => ({ id: b.id, sortOrder: b.sortOrder })) }),
      });
    } catch {
      showToast("ไม่สามารถบันทึกลำดับได้", "error");
      await loadBrands();
    }
  }

  async function handleConfirmDelete() {
    if (!brandToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBrand(brandToDelete.id);
      setBrands((prev) => prev.filter((b) => b.id !== brandToDelete.id));
      showToast("ลบแบรนด์สำเร็จ", "warning");
      setBrandToDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถลบแบรนด์ได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard title="จัดการแบรนด์">
        {/* Filter bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: search + status pills */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-60">
              <svg
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาแบรนด์..."
                value={searchTerm}
              />
            </div>
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                    statusFilter === opt.value
                      ? "bg-[#45745a] text-white"
                      : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
                  }`}
                  onClick={() => setStatusFilter(opt.value)}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Right: add button */}
          <button
            className="shrink-0 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreateModal}
            type="button"
          >
            + เพิ่มแบรนด์
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="w-8 px-2 py-3" />
                <th className="px-4 py-3 font-semibold">รูป</th>
                <th className="px-4 py-3 font-semibold">ชื่อแบรนด์</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">ลำดับ</th>
                <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">
                      <div className="h-10 w-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-8 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="h-6 w-12 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                        <div className="h-6 w-12 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && filteredBrands.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2]">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">
                        {searchTerm || statusFilter !== "all" ? "ไม่พบแบรนด์ที่ตรงกัน" : "ยังไม่มีแบรนด์"}
                      </p>
                      <p className="mt-1 text-sm text-dark-5">
                        {searchTerm || statusFilter !== "all"
                          ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                          : "เพิ่มแบรนด์แรกเพื่อเริ่มต้น"}
                      </p>
                      {!searchTerm && statusFilter === "all" ? (
                        <button
                          className="mt-4 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
                          onClick={openCreateModal}
                          type="button"
                        >
                          + เพิ่มแบรนด์แรก
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && (() => {
                const dragEnabled = !searchTerm && statusFilter === "all";
                return filteredBrands.map((brand, idx) => (
                  <tr
                    key={brand.id}
                    className={`group border-t border-stroke text-sm transition-colors dark:border-dark-3 ${draggingIdx === idx ? "opacity-40" : ""} ${dragOverIdx === idx && draggingIdx !== idx ? "bg-[#eef8f1]" : "hover:bg-[#fafcfb] dark:hover:bg-dark-2/50"}`}
                    draggable={dragEnabled}
                    onDragStart={() => { if (dragEnabled) setDraggingIdx(idx); }}
                    onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
                    onDragOver={(e) => { e.preventDefault(); if (dragEnabled) setDragOverIdx(idx); }}
                    onDrop={() => { if (dragEnabled) void handleDrop(idx); }}
                  >
                    <td className="cursor-grab select-none px-2 py-3 text-center text-dark-5 opacity-30 transition-opacity group-hover:opacity-70">⠿</td>
                    <td className="px-4 py-3">
                      {brand.imageUrl ? (
                        <img
                          alt={brand.name}
                          className="h-10 w-16 rounded-lg border border-stroke object-cover"
                          src={toProxiedImageUrl(brand.imageUrl)}
                        />
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded-lg border border-stroke bg-[#f0f4f2]">
                          <svg className="h-4 w-4 text-[#a0b8ad]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-dark dark:text-white">
                      {brand.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-dark-5 dark:text-dark-6">
                      {brand.slug}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-dark-5 dark:text-dark-6">
                      {brand.sortOrder}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-dark-5 dark:text-dark-6">
                      {brand._count?.categories ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={brand.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        tone={brand.isActive ? "success" : "danger"}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                          onClick={() => openEditModal(brand)}
                          type="button"
                        >
                          แก้ไข
                        </button>
                        <button
                          className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4]"
                          onClick={() => setBrandToDelete(brand)}
                          type="button"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <p className="text-sm text-dark-5">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#d8e6dd] border-t-[#45745a]" />
                กำลังโหลด...
              </span>
            ) : (
              <>
                <span className="font-semibold text-dark dark:text-white">{filteredBrands.length}</span>
                {" แบรนด์"}
              </>
            )}
          </p>
        </div>
      </ContentCard>

      {brandToDelete
        ? createPortal(
            <ConfirmDeleteModal
              brandName={brandToDelete.name}
              isDeleting={isDeleting}
              onClose={() => setBrandToDelete(null)}
              onConfirm={handleConfirmDelete}
            />,
            document.body,
          )
        : null}

      {isModalOpen
        ? createPortal(
            <BrandFormModal
              editingId={editingId}
              form={form}
              isSubmitting={isSubmitting}
              onChange={(next) => setForm((c) => ({ ...c, ...next }))}
              onClose={closeModal}
              onSubmit={handleSubmit}
            />,
            document.body,
          )
        : null}
    </>
  );
}
