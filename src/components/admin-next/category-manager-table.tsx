"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiCategory,
  CategoryFormPayload,
  CategoryListMeta,
  CategoryRecord,
  createCategory,
  softDeleteCategory,
  updateCategory,
  updateCategoryStatus,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";

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
  isActive: true,
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
    description: category.description ?? "",
    sortOrder: category.sortOrder ?? 0,
    status: category.isActive ? "Active" : "Inactive",
    isActive: category.isActive,
    products: String(category._count?.products ?? 0),
    updatedAt: formatCategoryDate(category.updatedAt),
    processedBy: category.processedBy ?? "system",
    processedAt: formatCategoryDate(category.processedAt),
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
        className="flex w-full items-center justify-between rounded-[20px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark transition-colors hover:border-[#bfd6c7] focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{selectedOption?.label}</span>
        <span
          className={`text-xs text-dark-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-[20px] border border-[#d8e6dd] bg-white shadow-1 dark:border-dark-3 dark:bg-dark-2">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
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
                {isSelected ? <span className="text-[#58cf94]">●</span> : null}
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
      <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="text-xl font-bold text-dark dark:text-white">
          ยืนยันการลบหมวดหมู่
        </h3>
        <p className="mt-3 text-sm leading-6 text-dark-5 dark:text-dark-6">
          ต้องการลบหมวดหมู่{" "}
          <span className="font-semibold text-dark dark:text-white">
            "{categoryName}"
          </span>{" "}
          ใช่หรือไม่
        </p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:cursor-not-allowed disabled:opacity-70"
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
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRecord | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

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

  function resetForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
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
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  }

  function slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

  async function handleSoftDelete(category: CategoryRecord) {
    const confirmed = window.confirm(`ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่`);

    if (!confirmed) {
      return;
    }

    try {
      await softDeleteCategory(category.id);
      showToast("ลบหมวดหมู่สำเร็จ", "warning");

      const nextPage =
        categories.length === 1 && page > 1 ? page - 1 : page;
      await refreshAfterMutation(nextPage);
    } catch (caughtError) {
      showToast(
        caughtError instanceof Error ? caughtError.message : "ไม่สามารถลบหมวดหมู่ได้",
        "error",
      );
    }
  }

  return (
    <>
      <ContentCard
        title="จัดการหมวดหมู่"
        description="ค้นหา กรองข้อมูล และแบ่งหน้าได้จากหน้าจัดการเดียว"
        aside={
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreateModal}
            type="button"
          >
            + เพิ่มหมวดหมู่
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 lg:max-w-3xl lg:grid-cols-[minmax(0,1fr)_180px_120px]">
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
              placeholder="ค้นหาชื่อหมวดหมู่หรือ slug"
              value={searchTerm}
            />

            <select
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value as "all" | "active" | "inactive");
              }}
              value={statusFilter}
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>

            <select
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(event) => {
                setPage(1);
                setPageSize(Number(event.target.value));
              }}
              value={pageSize}
            >
              <option value={10}>10 รายการ</option>
              <option value={20}>20 รายการ</option>
              <option value={50}>50 รายการ</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">ลำดับ</th>
                <th className="px-5 py-4 font-medium">ชื่อหมวดหมู่</th>
                <th className="px-5 py-4 font-medium">Slug</th>
                <th className="px-5 py-4 font-medium">สถานะ</th>
                <th className="px-5 py-4 font-medium">จัดการโดยล่าสุด</th>
                <th className="px-5 py-4 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((category) => (
                <tr
                  key={category.id}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4">{category.no}</td>
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                    {category.name}
                  </td>
                  <td className="px-5 py-4">{category.slug}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        aria-label={category.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          category.isActive ? "bg-[#58cf94]" : "bg-[#d7e2db]"
                        }`}
                        onClick={() => handleToggleStatus(category)}
                        type="button"
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                            category.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <StatusPill
                        label={category.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        tone={category.isActive ? "success" : "warning"}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-dark dark:text-white">
                      {category.processedBy}
                    </div>
                    <div className="mt-1 text-xs text-dark-5">{category.processedAt}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
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
              ))}

              {!isLoading && tableRows.length === 0 ? (
                <tr className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6">
                  <td className="px-5 py-6 text-center" colSpan={6}>
                    ไม่พบข้อมูลหมวดหมู่
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-dark-5">
            {isLoading
              ? "กำลังโหลดข้อมูล..."
              : `แสดง ${tableRows.length} จากทั้งหมด ${meta.totalItems} รายการ`}
          </p>

          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!meta.hasPreviousPage || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              ก่อนหน้า
            </button>
            <span className="text-sm font-medium text-dark dark:text-white">
              หน้า {meta.page} / {meta.totalPages}
            </span>
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!meta.hasNextPage || isLoading}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </ContentCard>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/50 px-4 py-8">
          <div className="w-full max-w-2xl rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-start justify-between gap-4 border-b border-stroke px-6 py-5 dark:border-dark-3">
              <div>
                <h3 className="text-2xl font-bold text-dark dark:text-white">
                  {editingId ? "แก้ไขหมวดหมู่" : "สร้างหมวดหมู่"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-dark-5 dark:text-dark-6">
                  ใช้เฉพาะข้อมูลพื้นฐานก่อน เพื่อให้เริ่มจัดการหมวดหมู่ได้เร็วและไม่ซับซ้อน
                </p>
              </div>
              <button
                className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                onClick={closeModal}
                type="button"
              >
                ปิด
              </button>
            </div>

            <form className="space-y-4 px-6 py-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  ชื่อหมวดหมู่
                </label>
                <input
                  className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="เช่น สีผม"
                  value={form.name ?? ""}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Slug
                </label>
                <input
                  className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  placeholder="เช่น hair-color"
                  value={form.slug ?? ""}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  สถานะ
                </label>
                <select
                  className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.value === "active",
                    }))
                  }
                  value={form.isActive ? "active" : "inactive"}
                >
                  <option value="active">เปิดใช้งาน</option>
                  <option value="inactive">ปิดใช้งาน</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? editingId
                      ? "กำลังบันทึก..."
                      : "กำลังสร้าง..."
                    : editingId
                      ? "บันทึกการเปลี่ยนแปลง"
                      : "สร้างหมวดหมู่"}
                </button>

                <button
                  className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                  onClick={closeModal}
                  type="button"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
