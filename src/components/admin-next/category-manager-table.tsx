"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiBrand,
  ApiCategory,
  CategoryFormPayload,
  CategoryListMeta,
  CategoryRecord,
  createCategory,
  getBrands,
  softDeleteCategory,
  updateCategory,
  updateCategoryStatus,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";
import { toProxiedImageUrl } from "@/lib/utils";

type CategoryManagerTableProps = {
  initialItems: CategoryRecord[];
  initialMeta: CategoryListMeta;
};

type CategoryApiResponse = {
  items: ApiCategory[];
  meta: CategoryListMeta;
};

type StatusFilter = "all" | "active" | "inactive";
type SelectOption<T extends string | number> = {
  label: string;
  value: T;
};

const INITIAL_FORM: CategoryFormPayload = {
  name: "",
  slug: "",
  eyebrow: "",
  description: "",
  imageUrl: undefined,
  tempImageFile: undefined,
  isActive: true,
  brandId: null,
};

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

const NUM_COLS = 7;

const FORM_STATUS_OPTIONS: SelectOption<"active" | "inactive">[] = [
  { label: "เปิดใช้งาน", value: "active" },
  { label: "ปิดใช้งาน", value: "inactive" },
];

function formatCategoryDate(value?: string | null) {
  if (!value) {
    return "เชื่อมต่อหลังบ้าน";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function mapCategoryRecord(category: ApiCategory): CategoryRecord {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    eyebrow: category.eyebrow ?? "",
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? null,
    requiresShadeSelection: category.requiresShadeSelection ?? false,
    sortOrder: category.sortOrder ?? 0,
    status: category.isActive ? "Active" : "Inactive",
    isActive: category.isActive,
    products: String(category._count?.products ?? 0),
    updatedAt: formatCategoryDate(category.updatedAt),
    processedBy: category.processedBy ?? "system",
    processedAt: formatCategoryDate(category.processedAt),
    brandId: category.brandId ?? null,
    brandName: category.brand?.name ?? null,
    thumbnailUrl: category.thumbnailUrl ?? null,
    source: "api",
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function SelectField<T extends string | number>({
  label,
  options,
  value,
  onChange,
  className = "",
}: {
  label?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label ? (
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
          {label}
        </label>
      ) : null}

      <button
        className="flex w-full items-center justify-between rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark transition-colors hover:border-[#bfd6c7] focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-dark-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
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
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-[#eef8f1] font-semibold text-[#355846]"
                    : "text-dark hover:bg-[#f8fbf9] dark:text-white dark:hover:bg-dark-3"
                }`}
                key={String(option.value)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                type="button"
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <svg className="h-4 w-4 text-[#45745a]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 0 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
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

function CategoryFormModal({
  editingId,
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: CategoryFormPayload;
  isSubmitting: boolean;
  onChange: (nextValue: Partial<CategoryFormPayload>) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div className="w-full max-w-2xl rounded-[30px] border border-[#dce9e1] bg-white p-0 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-dark-5 dark:text-dark-6">
              ใช้เฉพาะข้อมูลพื้นฐานก่อน เพื่อให้ทีมเริ่มใช้งานได้เร็วและจัดการง่าย
            </p>
          </div>

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
              ชื่อหมวดหมู่
            </label>
            <input
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="เช่น สีผม"
              value={form.name ?? ""}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Slug
            </label>
            <input
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(event) => onChange({ slug: event.target.value })}
              placeholder="เช่น hair-color"
              value={form.slug ?? ""}
            />
          </div>

          <SelectField
            label="สถานะ"
            onChange={(nextValue) => onChange({ isActive: nextValue === "active" })}
            options={FORM_STATUS_OPTIONS}
            value={form.isActive ? "active" : "inactive"}
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? editingId
                  ? "กำลังบันทึก..."
                  : "กำลังเพิ่ม..."
                : editingId
                  ? "บันทึกการเปลี่ยนแปลง"
                  : "เพิ่มหมวดหมู่"}
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

function ConfirmDeleteModal({
  categoryName,
  isDeleting,
  onClose,
  onConfirm,
}: {
  categoryName: string;
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
            <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบหมวดหมู่</h3>
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
            ต้องการลบหมวดหมู่{" "}
            <span className="font-semibold text-dark dark:text-white">"{categoryName}"</span>{" "}
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


export function CategoryManagerTable({
  initialItems,
  initialMeta,
}: CategoryManagerTableProps) {
  const { showToast } = useToast();
  const isFirstLoad = useRef(true);
  const [categories, setCategories] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormPayload>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(initialMeta.page);
  const [pageSize, setPageSize] = useState(initialMeta.pageSize);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [formBrands, setFormBrands] = useState<ApiBrand[]>([]);

  const tableRows = useMemo(
    () =>
      categories.map((category, index) => ({
        ...category,
        no: (meta.page - 1) * meta.pageSize + index + 1,
      })),
    [categories, meta.page, meta.pageSize],
  );

  async function loadCategories(overrides?: Partial<Record<"page" | "pageSize" | "searchTerm" | "statusFilter", string | number>>) {
    const nextPage = typeof overrides?.page === "number" ? overrides.page : page;
    const nextPageSize = typeof overrides?.pageSize === "number" ? overrides.pageSize : pageSize;
    const nextSearchTerm =
      typeof overrides?.searchTerm === "string" ? overrides.searchTerm : searchTerm;
    const nextStatusFilter =
      typeof overrides?.statusFilter === "string"
        ? (overrides.statusFilter as "all" | "active" | "inactive")
        : statusFilter;

    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(nextPageSize),
    });

    if (nextSearchTerm.trim()) {
      params.set("search", nextSearchTerm.trim());
    }

    if (nextStatusFilter !== "all") {
      params.set("status", nextStatusFilter);
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/categories?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as CategoryApiResponse | { message?: string };

      if (!response.ok || !("items" in data) || !("meta" in data)) {
        throw new Error(("message" in data && data.message) || "ไม่สามารถดึงข้อมูลหมวดหมู่ได้");
      }

      setCategories(data.items.map(mapCategoryRecord));
      setMeta(data.meta);
    } catch (caughtError) {
      showToast(
        caughtError instanceof Error ? caughtError.message : "ไม่สามารถดึงข้อมูลหมวดหมู่ได้",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    void loadCategories();
  }, [page, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    getBrands().then(setFormBrands).catch(() => {});
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setImagePreview(null);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  function startEdit(category: CategoryRecord) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      eyebrow: category.eyebrow,
      description: category.description,
      imageUrl: category.imageUrl ?? undefined,
      isActive: category.isActive,
      brandId: category.brandId ?? null,
    });
    setImagePreview(category.imageUrl ?? null);
    setIsModalOpen(true);
  }

  function slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleImageUpload(file: File) {
    setIsUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/temp", { method: "POST", body: fd });
      const data = await res.json() as { filename: string; url: string };
      setImagePreview(data.url);
      setForm((c) => ({ ...c, tempImageFile: data.filename, imageUrl: undefined }));
    } catch {
      showToast("อัปโหลดรูปล้มเหลว", "error");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleCategoryDrop(targetIdx: number) {
    if (draggingIdx === null || draggingIdx === targetIdx) {
      setDraggingIdx(null); setDragOverIdx(null); return;
    }
    const reordered = [...categories];
    const [moved] = reordered.splice(draggingIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const updated = reordered.map((c, i) => ({ ...c, sortOrder: i }));
    setCategories(updated);
    setDraggingIdx(null); setDragOverIdx(null);
    try {
      await Promise.all(updated.map((c) => updateCategory(c.id, { name: c.name, slug: c.slug, sortOrder: c.sortOrder })));
      showToast("บันทึกลำดับแล้ว", "success");
    } catch {
      showToast("บันทึกลำดับไม่สำเร็จ", "error");
      void loadCategories();
    }
  }

  async function refreshAfterMutation(targetPage = page) {
    await loadCategories({ page: targetPage });
    setPage(targetPage);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: CategoryFormPayload = {
        ...form,
        name: form.name?.trim() ?? "",
        slug: form.slug?.trim() ? slugify(form.slug) : slugify(form.name ?? ""),
      };

      if (!payload.name || !payload.slug) {
        throw new Error("กรุณากรอกชื่อหมวดหมู่และ slug");
      }

      await (editingId ? updateCategory(editingId, payload) : createCategory(payload));

      showToast(editingId ? "อัปเดตหมวดหมู่สำเร็จ" : "สร้างหมวดหมู่สำเร็จ", "success");
      closeModal();

      if (!editingId) {
        await refreshAfterMutation(1);
        return;
      }

      await refreshAfterMutation();
    } catch (caughtError) {
      showToast(
        caughtError instanceof Error ? caughtError.message : "ไม่สามารถบันทึกหมวดหมู่ได้",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(category: CategoryRecord) {
    try {
      const response = await updateCategoryStatus(category.id, !category.isActive);

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                isActive: response.isActive,
                status: response.isActive ? "Active" : "Inactive",
                updatedAt: formatCategoryDate(response.updatedAt),
                processedBy: response.processedBy ?? item.processedBy,
                processedAt: formatCategoryDate(response.processedAt),
              }
            : item,
        ),
      );

      showToast(
        response.isActive ? "เปิดใช้งานหมวดหมู่แล้ว" : "ปิดใช้งานหมวดหมู่แล้ว",
        "success",
      );
    } catch (caughtError) {
      showToast(
        caughtError instanceof Error
          ? caughtError.message
          : "ไม่สามารถเปลี่ยนสถานะหมวดหมู่ได้",
        "error",
      );
    }
  }

  function handleSoftDelete(category: CategoryRecord) {
    setCategoryToDelete(category);
  }

  async function handleConfirmDelete() {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await softDeleteCategory(categoryToDelete.id);
      showToast("ลบหมวดหมู่สำเร็จ", "warning");
      setCategoryToDelete(null);
      const nextPage =
        categories.length === 1 && page > 1 ? page - 1 : page;
      await refreshAfterMutation(nextPage);
    } catch (caughtError) {
      showToast(
        caughtError instanceof Error ? caughtError.message : "ไม่สามารถลบหมวดหมู่ได้",
        "error",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard title="หมวดหมู่สินค้า">
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
                onChange={(event) => {
                  setPage(1);
                  setSearchTerm(event.target.value);
                }}
                placeholder="ค้นหาหมวดหมู่..."
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
                  onClick={() => { setPage(1); setStatusFilter(opt.value); }}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* Right: page size + add button */}
          <div className="flex shrink-0 items-center gap-2">
            <SelectField
              options={PAGE_SIZE_OPTIONS}
              onChange={(value) => { setPage(1); setPageSize(value); }}
              value={pageSize}
            />
            <button
              className="shrink-0 rounded-full bg-[#45745a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
              onClick={openCreateModal}
              type="button"
            >
              + เพิ่มหมวดหมู่
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="px-3 py-3 font-medium">รูป</th>
                <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">แบรนด์</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">แก้ไขล่าสุดโดย</th>
                <th className="px-4 py-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="w-8 px-3 py-3" />
                    <td className="px-3 py-3">
                      <div className="h-9 w-9 animate-pulse rounded-lg bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="h-4 w-20 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="h-6 w-12 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                        <div className="h-6 w-12 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2]">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">
                        {searchTerm || statusFilter !== "all" ? "ไม่พบหมวดหมู่" : "ยังไม่มีหมวดหมู่"}
                      </p>
                      <p className="mt-1 text-sm text-dark-5">
                        {searchTerm || statusFilter !== "all"
                          ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                          : "เพิ่มหมวดหมู่แรกเพื่อเริ่มจัดการสินค้า"}
                      </p>
                      {!searchTerm && statusFilter === "all" ? (
                        <button
                          className="mt-4 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#355846]"
                          onClick={openCreateModal}
                          type="button"
                        >
                          + เพิ่มหมวดหมู่แรก
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                tableRows.map((category, idx) => (
                  <tr
                    key={category.id}
                    className={`group border-t border-stroke text-sm transition-colors hover:bg-[#fafcfb] dark:border-dark-3 dark:hover:bg-dark-2/50 ${draggingIdx === idx ? "opacity-40" : ""} ${dragOverIdx === idx && draggingIdx !== idx ? "bg-[#eef8f1]" : ""}`}
                    draggable
                    onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                    onDragStart={() => setDraggingIdx(idx)}
                    onDrop={() => void handleCategoryDrop(idx)}
                  >
                    <td className="px-3 py-3 text-center cursor-grab select-none text-dark-5 opacity-30 transition-opacity group-hover:opacity-70">⠿</td>
                    <td className="px-3 py-3">
                      {category.imageUrl ? (
                        <img
                          alt={category.name}
                          className="h-9 w-9 rounded-lg border border-stroke object-cover"
                          src={toProxiedImageUrl(category.thumbnailUrl ?? category.imageUrl)}
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-stroke bg-[#f0f4f2]">
                          <svg className="h-4 w-4 text-[#a0b8ad]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-dark dark:text-white">{category.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-dark-5">{category.slug}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-sm text-dark-5 dark:text-dark-6">
                        {category.brandName ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        aria-label={category.isActive ? "คลิกเพื่อปิดใช้งาน" : "คลิกเพื่อเปิดใช้งาน"}
                        className="transition-opacity hover:opacity-75"
                        onClick={() => handleToggleStatus(category)}
                        type="button"
                      >
                        <StatusPill
                          label={category.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          tone={category.isActive ? "success" : "danger"}
                        />
                      </button>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <p className="text-sm text-dark dark:text-white">{category.processedBy}</p>
                      <p className="mt-0.5 text-xs text-dark-5">{category.processedAt}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                          onClick={() => startEdit(category)}
                          type="button"
                        >
                          แก้ไข
                        </button>
                        <button
                          className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4]"
                          onClick={() => handleSoftDelete(category)}
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

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-dark-5">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#d8e6dd] border-t-[#45745a]" />
                กำลังโหลด...
              </span>
            ) : (
              <>
                <span className="font-semibold text-dark dark:text-white">{meta.totalItems}</span>
                {" รายการ"}
                {meta.totalPages > 1 ? ` · หน้า ${meta.page}/${meta.totalPages}` : ""}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!meta.hasPreviousPage || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              ← ก่อนหน้า
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">
              {meta.page} / {meta.totalPages}
            </span>
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!meta.hasNextPage || isLoading}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </ContentCard>

      {categoryToDelete ? createPortal(
        <ConfirmDeleteModal
          categoryName={categoryToDelete.name}
          isDeleting={isDeleting}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={handleConfirmDelete}
        />,
        document.body
      ) : null}

      {isModalOpen ? createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/50 px-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
              <div>
                <h3 className="text-xl font-bold text-dark dark:text-white">
                  {editingId ? "แก้ไขหมวดหมู่" : "สร้างหมวดหมู่"}
                </h3>
                <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
                  {editingId ? "แก้ไขข้อมูลหมวดหมู่ที่ต้องการ" : "กรอกข้อมูลเพื่อเพิ่มหมวดหมู่ใหม่"}
                </p>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-dark-5 hover:bg-neutral-100"
                onClick={closeModal}
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Scrollable body */}
              <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
                {/* แบรนด์ — ต้องอยู่บนสุด */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">แบรนด์ <span className="text-[#c84b44]">*</span></label>
                  <select
                    className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                    onChange={(e) => setForm((c) => ({ ...c, brandId: e.target.value || null }))}
                    value={form.brandId ?? ""}
                  >
                    <option value="">ไม่ระบุแบรนด์</option>
                    {formBrands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* ชื่อ + Slug */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">ชื่อหมวดหมู่ <span className="text-[#c84b44]">*</span></label>
                    <input
                      className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                      onChange={(e) => setForm((c) => ({ ...c, name: e.target.value, slug: c.slug || slugify(e.target.value) }))}
                      placeholder="เช่น สีผม"
                      value={form.name ?? ""}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-dark dark:text-white">Slug <span className="text-[#c84b44]">*</span></label>
                    <input
                      className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm font-mono outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                      onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
                      placeholder="เช่น hair-color"
                      value={form.slug ?? ""}
                    />
                  </div>
                </div>

                {/* Eyebrow */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Eyebrow <span className="font-normal text-dark-5">(ป้ายเล็กเหนือชื่อในหน้าแรก)</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                    onChange={(e) => setForm((c) => ({ ...c, eyebrow: e.target.value }))}
                    placeholder="เช่น Daily Essentials, Color Collection"
                    value={form.eyebrow ?? ""}
                  />
                </div>

                {/* คำอธิบาย */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    คำอธิบาย <span className="font-normal text-dark-5">(แสดงเป็น body text ในหน้าแรก)</span>
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                    onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                    placeholder="อธิบายหมวดหมู่นี้..."
                    rows={2}
                    value={form.description ?? ""}
                  />
                </div>

                {/* รูปหมวดหมู่ */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">รูปหมวดหมู่</label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="relative">
                        <img alt="preview" className="h-20 w-20 rounded-xl border border-[#d8e6dd] object-cover" src={toProxiedImageUrl(imagePreview)} />
                        <button
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c84b44] text-xs text-white hover:bg-[#ad3d37]"
                          onClick={() => { setImagePreview(null); setForm((c) => ({ ...c, tempImageFile: undefined, imageUrl: undefined })); }}
                          type="button"
                        >
                          ×
                        </button>
                      </div>
                    ) : null}
                    <label className={`cursor-pointer rounded-xl border-2 border-dashed border-[#c8ddd1] px-4 py-3 text-sm text-[#45745a] transition-colors hover:border-[#5f8f74] hover:bg-[#f4fbf6] ${isUploadingImage ? "opacity-60" : ""}`}>
                      {isUploadingImage ? "กำลังอัปโหลด..." : imagePreview ? "เปลี่ยนรูป" : "เลือกรูป"}
                      <input
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={isUploadingImage}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageUpload(f); e.target.value = ""; }}
                        type="file"
                      />
                    </label>
                  </div>
                </div>

                {/* สถานะ */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">สถานะ</label>
                  <select
                    className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                    onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.value === "active" }))}
                    value={form.isActive ? "active" : "inactive"}
                  >
                    <option value="active">เปิดใช้งาน</option>
                    <option value="inactive">ปิดใช้งาน</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
                <button
                  className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                  onClick={closeModal}
                  type="button"
                >
                  ยกเลิก
                </button>
                <button
                  className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting || isUploadingImage}
                  type="submit"
                >
                  {isSubmitting ? (editingId ? "กำลังบันทึก..." : "กำลังสร้าง...") : editingId ? "บันทึก" : "สร้างหมวดหมู่"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
