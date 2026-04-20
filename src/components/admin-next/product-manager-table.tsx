"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiProduct,
  CategoryListMeta,
  ProductFormPayload,
  ProductRecord,
  createProduct,
  deleteProduct,
  updateProduct,
  updateProductStatus,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";
import { PreviewImage, ProductImageManager } from "./product-image-manager";

type ProductManagerTableProps = {
  initialItems: ProductRecord[];
  initialMeta: CategoryListMeta;
};

type ProductApiResponse = {
  items: ApiProduct[];
  meta: CategoryListMeta;
};

type StatusFilter = "all" | "active" | "inactive" | "draft";
type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
type SelectOption<T extends string | number> = { label: string; value: T };

type ProductFormState = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  specialPrice: string;
  categoryId: string;
  stock: string;
  status: ProductStatus;
};

const INITIAL_FORM: ProductFormState = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: "",
  specialPrice: "",
  categoryId: "",
  stock: "0",
  status: "DRAFT",
};

const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { label: "ทุกสถานะ", value: "all" },
  { label: "เผยแพร่", value: "active" },
  { label: "ปิดใช้งาน", value: "inactive" },
  { label: "แบบร่าง", value: "draft" },
];

const PAGE_SIZE_OPTIONS: SelectOption<number>[] = [
  { label: "10 รายการ", value: 10 },
  { label: "20 รายการ", value: 20 },
  { label: "50 รายการ", value: 50 },
];

const PRODUCT_STATUS_OPTIONS: SelectOption<ProductStatus>[] = [
  { label: "แบบร่าง", value: "DRAFT" },
  { label: "เผยแพร่", value: "ACTIVE" },
  { label: "ปิดใช้งาน", value: "INACTIVE" },
];

function formatProductDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(value: number | null): string {
  if (value === null || value === 0) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(value);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapProductRecord(product: ApiProduct): ProductRecord {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: parseFloat(product.price) || 0,
    specialPrice: product.specialPrice ? parseFloat(product.specialPrice) : null,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? "ไม่ระบุหมวดหมู่",
    stock: product.stock,
    status: product.status,
    thumbnail: product.images?.[0]?.url ?? null,
    updatedAt: formatProductDate(product.updatedAt),
    source: "api",
  };
}

function statusLabel(status: ProductStatus) {
  if (status === "ACTIVE") return "เผยแพร่";
  if (status === "INACTIVE") return "ปิดใช้งาน";
  return "แบบร่าง";
}

function statusTone(status: ProductStatus): "success" | "warning" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "INACTIVE") return "warning";
  return "default";
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
      {label ? (
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{label}</label>
      ) : null}
      <button
        className="flex w-full items-center justify-between rounded-[20px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark transition-colors hover:border-[#bfd6c7] focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        onClick={() => setIsOpen((c) => !c)}
        type="button"
      >
        <span>{selectedOption?.label}</span>
        <span className={`text-xs text-dark-5 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
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

function ConfirmDeleteModal({
  productName,
  isDeleting,
  onClose,
  onConfirm,
}: {
  productName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="text-xl font-bold text-dark dark:text-white">ยืนยันการลบสินค้า</h3>
        <p className="mt-3 text-sm leading-6 text-dark-5 dark:text-dark-6">
          ต้องการลบสินค้า{" "}
          <span className="font-semibold text-dark dark:text-white">"{productName}"</span> ใช่หรือไม่?
          การลบจะไม่สามารถกู้คืนได้
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

function ProductFormModal({
  editingId,
  form,
  isSubmitting,
  categories,
  previewImages,
  onFilesDropped,
  onRemoveImage,
  onReorderImages,
  onChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: ProductFormState;
  isSubmitting: boolean;
  categories: { id: string; name: string }[];
  previewImages: PreviewImage[];
  onFilesDropped: (files: File[]) => void;
  onRemoveImage: (key: string) => void;
  onReorderImages: (from: number, to: number) => void;
  onChange: (next: Partial<ProductFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const categoryOptions: SelectOption<string>[] = [
    { label: "เลือกหมวดหมู่", value: "" },
    ...categories.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div className="w-full max-w-2xl overflow-y-auto rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark" style={{ maxHeight: "90vh" }}>
        <div className="flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-dark-5 dark:text-dark-6">
              กรอกข้อมูลพื้นฐานของสินค้าเพื่อเริ่มต้นใช้งาน
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
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="เช่น Koleston Perfect"
                value={form.name}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ sku: e.target.value })}
                placeholder="เช่น BU-CLR-001"
                value={form.sku}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => onChange({ slug: e.target.value })}
              placeholder="เช่น koleston-perfect"
              value={form.slug}
            />
          </div>

          <SelectField
            label="หมวดหมู่ *"
            options={categoryOptions}
            onChange={(v) => onChange({ categoryId: v })}
            value={form.categoryId}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                ราคา (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                min="0"
                onChange={(e) => onChange({ price: e.target.value })}
                placeholder="0"
                step="0.01"
                type="number"
                value={form.price}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                ราคาพิเศษ (บาท)
              </label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                min="0"
                onChange={(e) => onChange({ specialPrice: e.target.value })}
                placeholder="ไม่บังคับ"
                step="0.01"
                type="number"
                value={form.specialPrice}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">สต็อก</label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                min="0"
                onChange={(e) => onChange({ stock: e.target.value })}
                placeholder="0"
                type="number"
                value={form.stock}
              />
            </div>

            <SelectField
              label="สถานะ"
              options={PRODUCT_STATUS_OPTIONS}
              onChange={(v) => onChange({ status: v })}
              value={form.status}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">คำอธิบาย</label>
            <textarea
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="คำอธิบายสินค้า (ไม่บังคับ)"
              rows={3}
              value={form.description}
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-dark dark:text-white">รูปภาพสินค้า</label>
            <ProductImageManager
              images={previewImages}
              onFilesDropped={onFilesDropped}
              onRemove={onRemoveImage}
              onReorder={onReorderImages}
            />
            <p className="mt-2 text-xs text-dark-5">รองรับ JPG, PNG, WEBP, GIF ขนาดสูงสุด 5MB · ลากเพื่อเรียงลำดับ</p>
          </div>

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
                  : "เพิ่มสินค้า"}
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

export function ProductManagerTable({ initialItems, initialMeta }: ProductManagerTableProps) {
  const { showToast } = useToast();
  const isFirstLoad = useRef(true);
  const [products, setProducts] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(initialMeta.page);
  const [pageSize, setPageSize] = useState(initialMeta.pageSize);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formCategories, setFormCategories] = useState<{ id: string; name: string }[]>([]);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const tableRows = useMemo(
    () => products.map((p, i) => ({ ...p, no: (meta.page - 1) * meta.pageSize + i + 1 })),
    [products, meta.page, meta.pageSize],
  );

  async function loadProducts(overrides?: Partial<Record<"page" | "pageSize" | "searchTerm" | "statusFilter", string | number>>) {
    const nextPage = typeof overrides?.page === "number" ? overrides.page : page;
    const nextPageSize = typeof overrides?.pageSize === "number" ? overrides.pageSize : pageSize;
    const nextSearch = typeof overrides?.searchTerm === "string" ? overrides.searchTerm : searchTerm;
    const nextStatus = typeof overrides?.statusFilter === "string" ? overrides.statusFilter : statusFilter;

    const params = new URLSearchParams({ page: String(nextPage), pageSize: String(nextPageSize) });
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);

    setIsLoading(true);

    try {
      const response = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as ProductApiResponse | { message?: string };

      if (!response.ok || !("items" in data)) {
        throw new Error(("message" in data && data.message) || "ไม่สามารถดึงข้อมูลสินค้าได้");
      }

      setProducts(data.items.map(mapProductRecord));
      setMeta(data.meta);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลสินค้าได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormCategories() {
    try {
      const response = await fetch("/api/categories?status=active&pageSize=100", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { items?: { id: string; name: string }[] };
      setFormCategories(data.items ?? []);
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    void loadProducts();
  }, [page, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    if (isModalOpen) void loadFormCategories();
  }, [isModalOpen]);

  async function refreshAfterMutation(targetPage = page) {
    await loadProducts({ page: targetPage });
    setPage(targetPage);
  }

  function resetForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setPreviewImages([]);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
  }

  function closeModal() {
    // Clean up any temp files that were uploaded but not saved
    for (const img of previewImages) {
      if (img.kind === "temp" && img.tempFilename) {
        void fetch(`/api/uploads/temp/${img.tempFilename}`, { method: "DELETE" }).catch(() => {});
      }
    }
    setIsModalOpen(false);
    resetForm();
  }

  function startEdit(product: ProductRecord) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      price: String(product.price),
      specialPrice: product.specialPrice !== null ? String(product.specialPrice) : "",
      categoryId: product.categoryId,
      stock: String(product.stock),
      status: product.status,
    });
    setIsModalOpen(true);
    // Load existing images
    void fetch(`/api/products/${product.id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ApiProduct) => {
        setPreviewImages(
          (data.images ?? []).map((img) => ({
            key: img.id,
            url: img.url,
            kind: "existing" as const,
            existingId: img.id,
            uploading: false,
            error: false,
          })),
        );
      })
      .catch(() => {});
  }

  async function handleFilesDropped(files: File[]) {
    // Upload all files in parallel; each starts with a placeholder
    await Promise.all(
      files.map(async (file) => {
        const key = `temp-${Date.now()}-${Math.random()}`;
        const objectUrl = URL.createObjectURL(file);

        setPreviewImages((prev) => [
          ...prev,
          { key, url: objectUrl, kind: "temp", uploading: true, error: false },
        ]);

        try {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/uploads/temp", { method: "POST", body: formData });
          const data = (await response.json()) as { filename: string; url: string } | { message?: string };

          URL.revokeObjectURL(objectUrl);

          if (!response.ok || !("filename" in data)) throw new Error("อัปโหลดล้มเหลว");

          setPreviewImages((prev) =>
            prev.map((img) =>
              img.key === key
                ? { ...img, url: (data as { filename: string; url: string }).url, tempFilename: (data as { filename: string; url: string }).filename, uploading: false }
                : img,
            ),
          );
        } catch {
          setPreviewImages((prev) =>
            prev.map((img) => (img.key === key ? { ...img, uploading: false, error: true } : img)),
          );
        }
      }),
    );
  }

  function handleRemoveImage(key: string) {
    setPreviewImages((prev) => {
      const item = prev.find((img) => img.key === key);
      if (item?.kind === "temp" && item.tempFilename) {
        void fetch(`/api/uploads/temp/${item.tempFilename}`, { method: "DELETE" }).catch(() => {});
      }
      return prev.filter((img) => img.key !== key);
    });
  }

  function handleReorderImages(from: number, to: number) {
    setPreviewImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const price = parseFloat(form.price);
      const stock = parseInt(form.stock, 10);
      const specialPrice = form.specialPrice.trim() ? parseFloat(form.specialPrice) : undefined;

      if (!form.name.trim() || !form.sku.trim() || !form.slug.trim() || !form.categoryId) {
        throw new Error("กรุณากรอกชื่อสินค้า SKU Slug และหมวดหมู่");
      }

      if (isNaN(price) || price < 0) {
        throw new Error("กรุณากรอกราคาที่ถูกต้อง");
      }

      const readyImages = previewImages.filter((img) => !img.uploading && !img.error);

      const payload: ProductFormPayload = {
        name: form.name.trim(),
        slug: form.slug.trim() ? slugify(form.slug) : slugify(form.name),
        sku: form.sku.trim(),
        description: form.description.trim() || undefined,
        price,
        specialPrice,
        categoryId: form.categoryId,
        stock: isNaN(stock) ? 0 : stock,
        status: form.status,
      };

      if (editingId) {
        const orderedImages = readyImages.map((img) =>
          img.kind === "existing"
            ? { kind: "existing" as const, id: img.existingId! }
            : { kind: "temp" as const, filename: img.tempFilename! },
        );
        await updateProduct(editingId, { ...payload, orderedImages });
      } else {
        const tempFiles = readyImages
          .filter((img) => img.kind === "temp")
          .map((img) => img.tempFilename!);
        await createProduct({ ...payload, tempFiles });
      }

      showToast(editingId ? "อัปเดตสินค้าสำเร็จ" : "สร้างสินค้าสำเร็จ", "success");
      closeModal();
      await refreshAfterMutation(editingId ? page : 1);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถบันทึกสินค้าได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(product: ProductRecord) {
    const nextStatus: ProductStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const response = await updateProductStatus(product.id, nextStatus);
      const updatedStatus = response.status;

      setProducts((current) =>
        current.map((p) =>
          p.id === product.id ? { ...p, status: updatedStatus, updatedAt: formatProductDate(response.updatedAt) } : p,
        ),
      );

      showToast(updatedStatus === "ACTIVE" ? "เผยแพร่สินค้าแล้ว" : "ปิดใช้งานสินค้าแล้ว", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะสินค้าได้", "error");
    }
  }

  function handleDelete(product: ProductRecord) {
    setProductToDelete(product);
  }

  async function handleConfirmDelete() {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      await deleteProduct(productToDelete.id);
      showToast("ลบสินค้าสำเร็จ", "warning");
      setProductToDelete(null);
      const nextPage = products.length === 1 && page > 1 ? page - 1 : page;
      await refreshAfterMutation(nextPage);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถลบสินค้าได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard
        title="จัดการสินค้า"
        description="ค้นหา กรองข้อมูล และแบ่งหน้าได้จากหน้าจัดการเดียว"
        aside={
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreateModal}
            type="button"
          >
            + เพิ่มสินค้า
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 lg:max-w-3xl lg:grid-cols-[minmax(0,1fr)_200px_130px]">
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
              placeholder="ค้นหาชื่อสินค้าหรือ SKU"
              value={searchTerm}
            />
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
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">ลำดับ</th>
                <th className="px-5 py-4 font-medium">รูป</th>
                <th className="px-5 py-4 font-medium">SKU</th>
                <th className="px-5 py-4 font-medium">ชื่อสินค้า</th>
                <th className="px-5 py-4 font-medium">หมวดหมู่</th>
                <th className="px-5 py-4 font-medium">ราคา</th>
                <th className="px-5 py-4 font-medium">สต็อก</th>
                <th className="px-5 py-4 font-medium">สถานะ</th>
                <th className="px-5 py-4 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4">{product.no}</td>
                  <td className="px-3 py-2">
                    {product.thumbnail ? (
                      <button type="button" onClick={() => setLightboxUrl(product.thumbnail)}>
                        <img
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover border border-[#d8e6dd] cursor-zoom-in hover:opacity-80 transition-opacity"
                          src={product.thumbnail}
                        />
                      </button>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-[#c8ddd1] bg-[#f8fbf9] text-lg text-[#b8d4c1]">
                        🖼
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-dark dark:text-white">
                    {product.sku}
                  </td>
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">{product.name}</td>
                  <td className="px-5 py-4">{product.categoryName}</td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-dark dark:text-white">{formatPrice(product.price)}</div>
                    {product.specialPrice !== null ? (
                      <div className="mt-0.5 text-xs text-[#5f8f74]">{formatPrice(product.specialPrice)}</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">{product.stock}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        aria-label={product.status === "ACTIVE" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          product.status === "ACTIVE" ? "bg-[#58cf94]" : "bg-[#d7e2db]"
                        }`}
                        onClick={() => handleToggleStatus(product)}
                        type="button"
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                            product.status === "ACTIVE" ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <StatusPill label={statusLabel(product.status)} tone={statusTone(product.status)} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                        onClick={() => startEdit(product)}
                        type="button"
                      >
                        แก้ไข
                      </button>
                      <button
                        className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4]"
                        onClick={() => handleDelete(product)}
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
                  <td className="px-5 py-6 text-center" colSpan={9}>
                    ไม่พบข้อมูลสินค้า
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
              onClick={() => setPage((c) => Math.max(1, c - 1))}
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
              onClick={() => setPage((c) => c + 1)}
              type="button"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </ContentCard>

      {productToDelete ? createPortal(
        <ConfirmDeleteModal
          productName={productToDelete.name}
          isDeleting={isDeleting}
          onClose={() => setProductToDelete(null)}
          onConfirm={handleConfirmDelete}
        />,
        document.body,
      ) : null}

      {isModalOpen ? createPortal(
        <ProductFormModal
          editingId={editingId}
          form={form}
          isSubmitting={isSubmitting}
          categories={formCategories}
          previewImages={previewImages}
          onFilesDropped={handleFilesDropped}
          onRemoveImage={handleRemoveImage}
          onReorderImages={handleReorderImages}
          onChange={(next) => setForm((c) => ({ ...c, ...next }))}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />,
        document.body,
      ) : null}

      {lightboxUrl ? createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
            onClick={() => setLightboxUrl(null)}
            type="button"
          >
            ✕
          </button>
          <img
            alt="Product image"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            src={lightboxUrl}
          />
        </div>,
        document.body,
      ) : null}
    </>
  );
}
