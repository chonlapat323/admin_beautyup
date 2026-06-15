"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiBrand,
  ApiCollection,
  ApiProduct,
  CategoryListMeta,
  ProductFormPayload,
  ProductRecord,
  createProduct,
  deleteProduct,
  generateProductSku,
  getBrands,
  getCollections,
  updateProduct,
  updateProductStatus,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";
import { PreviewImage, ProductImageManager } from "./product-image-manager";
import { toProxiedImageUrl } from "@/lib/utils";

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
type FormCategory = { id: string; name: string; requiresShadeSelection: boolean; brandId: string | null };

type ProductFormState = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  specialPrice: string;
  categoryId: string;
  brandId: string;
  collectionId: string;
  colorCode: string;
  colorName: string;
  stock: string;
  status: ProductStatus;
  isFeatured: boolean;
  tag: string;
};

const INITIAL_FORM: ProductFormState = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: "",
  specialPrice: "",
  categoryId: "",
  brandId: "",
  collectionId: "",
  colorCode: "",
  colorName: "",
  stock: "0",
  status: "DRAFT",
  isFeatured: false,
  tag: "",
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

// Number of always-visible + responsive columns
const NUM_COLS = 8;

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
    brandId: product.brandId ?? null,
    brandName: product.brand?.name ?? null,
    collectionId: product.collectionId ?? null,
    collectionName: product.collection?.name ?? null,
    colorCode: product.colorCode ?? null,
    colorName: product.colorName ?? null,
    stock: product.stock,
    status: product.status,
    isFeatured: product.isFeatured ?? false,
    tag: product.tag ?? null,
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
        className="flex w-full items-center justify-between rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark transition-colors hover:border-[#bfd6c7] focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        onClick={() => setIsOpen((c) => !c)}
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
      <div className="w-full max-w-md rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
              <svg className="h-5 w-5 text-[#b42318]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบสินค้า</h3>
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
            ต้องการลบสินค้า{" "}
            <span className="font-semibold text-dark dark:text-white">"{productName}"</span>{" "}
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

const INPUT_CLS = "w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white";
const LABEL_CLS = "mb-1.5 block text-sm font-medium text-dark dark:text-white";

function ProductFormModal({
  editingId,
  form,
  isSubmitting,
  isGeneratingSku,
  categories,
  brands,
  collections,
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
  isGeneratingSku: boolean;
  categories: FormCategory[];
  brands: ApiBrand[];
  collections: ApiCollection[];
  previewImages: PreviewImage[];
  onFilesDropped: (files: File[]) => void;
  onRemoveImage: (key: string) => void;
  onReorderImages: (from: number, to: number) => void;
  onChange: (next: Partial<ProductFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  // Cascading: filter categories by selected brand, filter collections by selected category
  const filteredCategories = form.brandId
    ? categories.filter((c) => c.brandId === form.brandId)
    : categories;

  const filteredCollections = form.categoryId
    ? collections.filter((c) => c.categoryId === form.categoryId)
    : collections;

  const brandOptions: SelectOption<string>[] = [
    { label: "ไม่ระบุแบรนด์", value: "" },
    ...brands.map((b) => ({ label: b.name, value: b.id })),
  ];

  const categoryOptions: SelectOption<string>[] = [
    { label: "เลือกหมวดหมู่", value: "" },
    ...filteredCategories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const collectionOptions: SelectOption<string>[] = [
    { label: "ไม่ระบุคอลเลกชัน", value: "" },
    ...filteredCollections.map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-6">
      <div
        className="flex w-full max-w-2xl flex-col rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "92vh" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
            </h3>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">
              {editingId ? "แก้ไขข้อมูลสินค้าที่เลือก" : "กรอกข้อมูลพื้นฐานเพื่อสร้างสินค้า"}
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

        {/* Scrollable body */}
        <form
          className="flex-1 space-y-4 overflow-y-auto px-6 py-5"
          id="product-form"
          onSubmit={onSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                className={INPUT_CLS}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="เช่น Koleston Perfect"
                value={form.name}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>
                รหัสสินค้า (SKU) <span className="text-red-500">*</span>
              </label>
              <input
                className={INPUT_CLS}
                onChange={(e) => onChange({ sku: e.target.value })}
                placeholder={isGeneratingSku ? "กำลังสร้าง..." : "เช่น BU-CLR-001"}
                value={form.sku}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              className={INPUT_CLS}
              onChange={(e) => onChange({ slug: e.target.value })}
              placeholder="เช่น koleston-perfect"
              value={form.slug}
            />
          </div>

          <SelectField
            label="แบรนด์"
            options={brandOptions}
            onChange={(v) => onChange({ brandId: v, categoryId: "", collectionId: "" })}
            value={form.brandId}
          />

          <SelectField
            label="หมวดหมู่ *"
            options={categoryOptions}
            onChange={(v) => onChange({ categoryId: v, collectionId: "" })}
            value={form.categoryId}
          />

          <SelectField
            label="คอลเลกชัน"
            options={collectionOptions}
            onChange={(v) => onChange({ collectionId: v })}
            value={form.collectionId}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>รหัสสี</label>
              <input
                className={INPUT_CLS}
                onChange={(e) => onChange({ colorCode: e.target.value })}
                placeholder="เช่น #FF5733, NB-03"
                value={form.colorCode}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>ชื่อสี</label>
              <input
                className={INPUT_CLS}
                onChange={(e) => onChange({ colorName: e.target.value })}
                placeholder="เช่น Natural Brown"
                value={form.colorName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={LABEL_CLS}>
                ราคา (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                className={INPUT_CLS}
                min="0"
                onChange={(e) => onChange({ price: e.target.value })}
                placeholder="0"
                step="0.01"
                type="number"
                value={form.price}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>ราคาพิเศษ (บาท)</label>
              <input
                className={INPUT_CLS}
                min="0"
                onChange={(e) => onChange({ specialPrice: e.target.value })}
                placeholder="ไม่บังคับ"
                step="0.01"
                type="number"
                value={form.specialPrice}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>สต็อก</label>
              <input
                className={INPUT_CLS}
                min="0"
                onChange={(e) => onChange({ stock: e.target.value })}
                placeholder="0"
                type="number"
                value={form.stock}
              />
            </div>
          </div>

          <SelectField
            label="สถานะ"
            options={PRODUCT_STATUS_OPTIONS}
            onChange={(v) => onChange({ status: v })}
            value={form.status}
          />

          <div>
            <label className={LABEL_CLS}>คำอธิบาย</label>
            <textarea
              className={INPUT_CLS}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="คำอธิบายสินค้า (ไม่บังคับ)"
              rows={3}
              value={form.description}
            />
          </div>

          {/* Featured toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 dark:border-dark-3 dark:bg-dark-2">
            <div>
              <p className="text-sm font-medium text-dark dark:text-white">แนะนำในหน้าแรก</p>
              <p className="mt-0.5 text-xs text-dark-5">แสดงในส่วน "The Selection" ของ mobile app</p>
            </div>
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isFeatured ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
              onClick={() => onChange({ isFeatured: !form.isFeatured })}
              type="button"
            >
              <span className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform ${form.isFeatured ? "translate-x-5.5" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Badge */}
          <div>
            <label className={LABEL_CLS}>Badge สินค้า</label>
            <select
              className={INPUT_CLS}
              onChange={(e) => onChange({ tag: e.target.value })}
              value={form.tag}
            >
              <option value="">ไม่มี Badge</option>
              <option value="NEW">NEW — สินค้าใหม่</option>
              <option value="BEST SELLER">BEST SELLER — ขายดี</option>
            </select>
          </div>

          {/* Images */}
          <div>
            <label className={LABEL_CLS}>รูปภาพสินค้า</label>
            <ProductImageManager
              images={previewImages}
              onFilesDropped={onFilesDropped}
              onRemove={onRemoveImage}
              onReorder={onReorderImages}
            />
            <p className="mt-2 text-xs text-dark-5">
              รองรับ JPG, PNG, WEBP, GIF ขนาดสูงสุด 5MB · ลากเพื่อเรียงลำดับ
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
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
            form="product-form"
            type="submit"
          >
            {isSubmitting
              ? editingId ? "กำลังบันทึก..." : "กำลังเพิ่ม..."
              : editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มสินค้า"}
          </button>
        </div>
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
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured">("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [page, setPage] = useState(initialMeta.page);
  const [pageSize, setPageSize] = useState(initialMeta.pageSize);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formCategories, setFormCategories] = useState<FormCategory[]>([]);
  const [formBrands, setFormBrands] = useState<ApiBrand[]>([]);
  const [formCollections, setFormCollections] = useState<ApiCollection[]>([]);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);

  const tableRows = useMemo(
    () => products.map((p, i) => ({ ...p, no: (meta.page - 1) * meta.pageSize + i + 1 })),
    [products, meta.page, meta.pageSize],
  );

  async function loadProducts(overrides?: Partial<Record<"page" | "pageSize" | "searchTerm" | "statusFilter" | "featuredFilter" | "brandFilter" | "collectionFilter", string | number>>) {
    const nextPage = typeof overrides?.page === "number" ? overrides.page : page;
    const nextPageSize = typeof overrides?.pageSize === "number" ? overrides.pageSize : pageSize;
    const nextSearch = typeof overrides?.searchTerm === "string" ? overrides.searchTerm : searchTerm;
    const nextStatus = typeof overrides?.statusFilter === "string" ? overrides.statusFilter : statusFilter;
    const nextFeatured = typeof overrides?.featuredFilter === "string" ? overrides.featuredFilter : featuredFilter;
    const nextBrand = typeof overrides?.brandFilter === "string" ? overrides.brandFilter : brandFilter;
    const nextCollection = typeof overrides?.collectionFilter === "string" ? overrides.collectionFilter : collectionFilter;

    const params = new URLSearchParams({ page: String(nextPage), pageSize: String(nextPageSize) });
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextFeatured === "featured") params.set("isFeatured", "true");
    if (nextBrand !== "all") params.set("brandId", nextBrand);
    if (nextCollection !== "all") params.set("collectionId", nextCollection);

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
      const data = await response.json() as { items?: { id: string; name: string; requiresShadeSelection?: boolean; brandId?: string | null }[] };
      setFormCategories((data.items ?? []).map((c) => ({ id: c.id, name: c.name, requiresShadeSelection: c.requiresShadeSelection ?? false, brandId: c.brandId ?? null })));
    } catch {
      // silently fail
    }
  }

  async function loadFormBrandsAndCollections() {
    try {
      const [brandsData, collectionsData] = await Promise.all([getBrands(), getCollections()]);
      setFormBrands(brandsData);
      setFormCollections(collectionsData);
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    void loadProducts();
  }, [page, pageSize, searchTerm, statusFilter, featuredFilter, brandFilter, collectionFilter]);

  useEffect(() => {
    void loadFormBrandsAndCollections();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      void loadFormCategories();
      void loadFormBrandsAndCollections();
    }
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
    void handleGenerateSku();
  }

  function closeModal() {
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
      brandId: product.brandId ?? "",
      collectionId: product.collectionId ?? "",
      colorCode: product.colorCode ?? "",
      colorName: product.colorName ?? "",
      stock: String(product.stock),
      status: product.status,
      isFeatured: product.isFeatured,
      tag: product.tag ?? "",
    });
    setIsModalOpen(true);
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
        throw new Error("กรุณากรอกชื่อสินค้า รหัสสินค้า Slug และหมวดหมู่");
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
        brandId: form.brandId || null,
        collectionId: form.collectionId || null,
        colorCode: form.colorCode.trim() || null,
        colorName: form.colorName.trim() || null,
        stock: isNaN(stock) ? 0 : stock,
        status: form.status,
        isFeatured: form.isFeatured,
        tag: form.tag.trim() || null,
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

  async function handleGenerateSku() {
    setIsGeneratingSku(true);
    try {
      const sku = await generateProductSku({
        brandId: form.brandId || undefined,
        categoryId: form.categoryId || undefined,
        collectionId: form.collectionId || undefined,
      });
      setForm((c) => ({ ...c, sku }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถสร้างรหัสสินค้าได้", "error");
    } finally {
      setIsGeneratingSku(false);
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
        aside={
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreateModal}
            type="button"
          >
            + เพิ่มสินค้า
          </button>
        }
      >
        {/* Filter bar */}
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_160px_160px_160px_130px]">
          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
              placeholder="ค้นหาชื่อสินค้าหรือรหัสสินค้า"
              value={searchTerm}
            />
          </div>
          <SelectField
            options={STATUS_OPTIONS}
            onChange={(v) => { setPage(1); setStatusFilter(v); }}
            value={statusFilter}
          />
          <SelectField
            options={[{ label: "ทุกประเภท", value: "all" }, { label: "แนะนำหน้าแรก", value: "featured" }]}
            onChange={(v: "all" | "featured") => { setPage(1); setFeaturedFilter(v); }}
            value={featuredFilter}
          />
          <SelectField
            options={[
              { label: "ทุกแบรนด์", value: "all" },
              ...formBrands.map((b) => ({ label: b.name, value: b.id })),
            ]}
            onChange={(v: string) => { setPage(1); setBrandFilter(v); }}
            value={brandFilter}
          />
          <SelectField
            options={[
              { label: "ทุกคอลเลกชัน", value: "all" },
              ...formCollections.map((c) => ({ label: c.name, value: c.id })),
            ]}
            onChange={(v: string) => { setPage(1); setCollectionFilter(v); }}
            value={collectionFilter}
          />
          <SelectField
            options={PAGE_SIZE_OPTIONS}
            onChange={(v) => { setPage(1); setPageSize(v); }}
            value={pageSize}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">รูป</th>
                <th className="px-4 py-3 font-semibold">สินค้า / รหัสสินค้า</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">ราคา</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">สต็อก</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">หมวดหมู่</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell">แนะนำ / Badge</th>
                <th className="px-4 py-3 font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading skeleton */}
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-dark-2" />
                  </td>
                  <td className="w-full px-4 py-3">
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-14 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="h-3.5 w-10 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="h-3.5 w-20 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" />
                  </td>
                </tr>
              ))}

              {/* Data rows */}
              {!isLoading && tableRows.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-stroke text-sm transition-colors hover:bg-[#fafcfb] dark:border-dark-3 dark:hover:bg-dark-2/50"
                >
                  {/* Thumbnail */}
                  <td className="px-4 py-3">
                    {product.thumbnail ? (
                      <button
                        className="block transition-opacity hover:opacity-80"
                        onClick={() => setLightboxUrl(product.thumbnail)}
                        type="button"
                      >
                        <img
                          alt={product.name}
                          className="h-10 w-10 cursor-zoom-in rounded-lg border border-[#d8e6dd] object-cover"
                          src={toProxiedImageUrl(product.thumbnail)}
                        />
                      </button>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-[#c8ddd1] bg-[#f8fbf9] dark:border-dark-3 dark:bg-dark-2">
                        <svg className="h-4 w-4 text-[#b8d4c1]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </div>
                    )}
                  </td>

                  {/* Name + SKU */}
                  <td className="min-w-0 px-4 py-3">
                    <p className="truncate font-semibold text-dark dark:text-white">{product.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-dark-5 dark:text-dark-6">{product.sku}</p>
                  </td>

                  {/* Price */}
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    <p className="font-medium text-dark dark:text-white">{formatPrice(product.price)}</p>
                    {product.specialPrice !== null ? (
                      <p className="mt-0.5 text-xs text-[#5f8f74]">{formatPrice(product.specialPrice)}</p>
                    ) : null}
                  </td>

                  {/* Stock */}
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className={`tabular-nums text-sm ${product.stock <= 10 ? "font-semibold text-[#9a6a12]" : "text-dark-5 dark:text-dark-6"}`}>
                      {product.stock}
                    </span>
                    {product.stock <= 10 && product.stock > 0 ? (
                      <p className="text-xs text-[#9a6a12]">ใกล้หมด</p>
                    ) : product.stock === 0 ? (
                      <p className="text-xs text-[#b42318]">หมด</p>
                    ) : null}
                  </td>

                  {/* Category / Brand / Collection */}
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <p className="text-sm text-dark-5 dark:text-dark-6">{product.categoryName}</p>
                    {product.brandName ? (
                      <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{product.brandName}</p>
                    ) : null}
                    {product.collectionName ? (
                      <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{product.collectionName}</p>
                    ) : null}
                    {product.colorName ? (
                      <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">{product.colorName}</p>
                    ) : null}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {product.status !== "DRAFT" ? (
                      <button
                        aria-label={product.status === "ACTIVE" ? "คลิกเพื่อปิดใช้งาน" : "คลิกเพื่อเปิดใช้งาน"}
                        className="transition-opacity hover:opacity-75"
                        onClick={() => handleToggleStatus(product)}
                        type="button"
                      >
                        <StatusPill label={statusLabel(product.status)} tone={statusTone(product.status)} />
                      </button>
                    ) : (
                      <StatusPill label={statusLabel(product.status)} tone={statusTone(product.status)} />
                    )}
                  </td>

                  {/* Featured + Badge */}
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <div className="flex flex-col gap-1.5">
                      {product.isFeatured ? (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#fef9c3] px-2.5 py-1 text-xs font-semibold text-[#854d0e]">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" /></svg>
                          แนะนำ
                        </span>
                      ) : null}
                      {product.tag === "NEW" && (
                        <span className="inline-flex w-fit items-center rounded-full bg-[#e0f2fe] px-2.5 py-1 text-xs font-semibold text-[#0369a1]">
                          NEW
                        </span>
                      )}
                      {product.tag === "BEST SELLER" && (
                        <span className="inline-flex w-fit items-center rounded-full bg-[#fff7ed] px-2.5 py-1 text-xs font-semibold text-[#c2410c]">
                          BEST SELLER
                        </span>
                      )}
                      {!product.isFeatured && !product.tag && (
                        <span className="text-xs text-dark-5">—</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:opacity-50"
                        onClick={() => startEdit(product)}
                        type="button"
                      >
                        แก้ไข
                      </button>
                      <button
                        className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4] disabled:opacity-50"
                        onClick={() => handleDelete(product)}
                        type="button"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {!isLoading && tableRows.length === 0 && (
                <tr>
                  <td colSpan={NUM_COLS} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2]">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">
                        {searchTerm || statusFilter !== "all" || featuredFilter !== "all" ? "ไม่พบสินค้า" : "ยังไม่มีสินค้า"}
                      </p>
                      <p className="mt-1 text-sm text-dark-5">
                        {searchTerm || statusFilter !== "all" || featuredFilter !== "all"
                          ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
                          : "เพิ่มสินค้าแรกเพื่อเริ่มต้น"}
                      </p>
                      {!searchTerm && statusFilter === "all" && featuredFilter === "all" ? (
                        <button
                          className="mt-4 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
                          onClick={openCreateModal}
                          type="button"
                        >
                          + เพิ่มสินค้าแรก
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
              onClick={() => setPage((c) => Math.max(1, c - 1))}
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
              onClick={() => setPage((c) => c + 1)}
              type="button"
            >
              ถัดไป →
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
          isGeneratingSku={isGeneratingSku}
          categories={formCategories}
          brands={formBrands}
          collections={formCollections}
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
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/40"
            onClick={() => setLightboxUrl(null)}
            type="button"
          >
            ✕
          </button>
          <img
            alt="Product image"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            src={toProxiedImageUrl(lightboxUrl)}
          />
        </div>,
        document.body,
      ) : null}
    </>
  );
}
