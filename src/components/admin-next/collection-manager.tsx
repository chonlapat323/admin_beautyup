"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiBrand,
  ApiCollection,
  CategoryRecord,
  createCollection,
  deleteCollection,
  getBrands,
  getCollections,
  getCategories,
  updateCollection,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";

type CollectionFormState = {
  name: string;
  isActive: boolean;
  sortOrder: string;
  brandId: string;
  categoryId: string;
};

const INITIAL_FORM: CollectionFormState = {
  name: "",
  isActive: true,
  sortOrder: "0",
  brandId: "",
  categoryId: "",
};

function ConfirmDeleteModal({
  collectionName,
  isDeleting,
  onClose,
  onConfirm,
}: {
  collectionName: string;
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
            <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบคอลเลกชัน</h3>
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
            ต้องการลบคอลเลกชัน{" "}
            <span className="font-semibold text-dark dark:text-white">"{collectionName}"</span>{" "}
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

function CollectionFormModal({
  editingId,
  form,
  isSubmitting,
  brands,
  categories,
  onChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: CollectionFormState;
  isSubmitting: boolean;
  brands: ApiBrand[];
  categories: CategoryRecord[];
  onChange: (next: Partial<CollectionFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const filteredCategories = form.brandId
    ? categories.filter((c) => (c as CategoryRecord & { brandId?: string }).brandId === form.brandId)
    : categories;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-6">
      <div className="w-full max-w-md rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขคอลเลกชัน" : "เพิ่มคอลเลกชัน"}
            </h3>
            <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">
              {editingId ? "แก้ไขข้อมูลคอลเลกชันที่เลือก" : "กรอกข้อมูลเพื่อเพิ่มคอลเลกชันใหม่"}
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
          {/* แบรนด์ */}
          <div>
            <label className={LABEL_CLS}>แบรนด์ <span className="text-red-500">*</span></label>
            <select
              className={INPUT_CLS}
              onChange={(e) => onChange({ brandId: e.target.value, categoryId: "" })}
              value={form.brandId}
              required
            >
              <option value="">เลือกแบรนด์</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* หมวดหมู่ */}
          <div>
            <label className={LABEL_CLS}>หมวดหมู่</label>
            <select
              className={INPUT_CLS}
              onChange={(e) => onChange({ categoryId: e.target.value })}
              value={form.categoryId}
            >
              <option value="">ไม่ระบุหมวดหมู่</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLS}>
              ชื่อคอลเลกชัน <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              className={INPUT_CLS}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="เช่น Summer Collection, Pro Series"
              value={form.name}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>ลำดับ</label>
            <input
              className={INPUT_CLS}
              min="0"
              onChange={(e) => onChange({ sortOrder: e.target.value })}
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
                : editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มคอลเลกชัน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CollectionManager() {
  const { showToast } = useToast();
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<ApiCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filteredCollections = collections.filter((c) => {
    const matchSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && c.isActive) ||
      (statusFilter === "inactive" && !c.isActive);
    const matchCategory = !categoryFilter || c.categoryId === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const hasActiveFilter = !!searchTerm || statusFilter !== "all" || !!categoryFilter;

  async function loadCollections() {
    setIsLoading(true);
    try {
      const data = await getCollections();
      setCollections(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลคอลเลกชันได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBrandsAndCategories() {
    try {
      const [brandsData, catsData] = await Promise.all([getBrands(), getCategories()]);
      setBrands(brandsData);
      setCategories(catsData);
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    void loadCollections();
    void loadBrandsAndCategories();
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(collection: ApiCollection) {
    setEditingId(collection.id);
    setForm({
      name: collection.name,
      isActive: collection.isActive,
      sortOrder: String(collection.sortOrder),
      brandId: collection.brandId ?? "",
      categoryId: collection.categoryId ?? "",
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
      showToast("กรุณากรอกชื่อคอลเลกชัน", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      if (!form.brandId) {
        showToast("กรุณาเลือกแบรนด์", "error");
        setIsSubmitting(false);
        return;
      }
      const sortOrder = parseInt(form.sortOrder, 10);
      const brandId = form.brandId || null;
      const categoryId = form.categoryId || null;
      if (editingId) {
        const updated = await updateCollection(editingId, {
          name: form.name.trim(),
          isActive: form.isActive,
          sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
          brandId,
          categoryId,
        });
        setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        showToast("อัปเดตคอลเลกชันสำเร็จ", "success");
      } else {
        const created = await createCollection({
          name: form.name.trim(),
          sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
          brandId,
          categoryId,
        });
        setCollections((prev) => [...prev, created]);
        showToast("เพิ่มคอลเลกชันสำเร็จ", "success");
      }
      closeModal();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถบันทึกคอลเลกชันได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!collectionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCollection(collectionToDelete.id);
      setCollections((prev) => prev.filter((c) => c.id !== collectionToDelete.id));
      showToast("ลบคอลเลกชันสำเร็จ", "warning");
      setCollectionToDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถลบคอลเลกชันได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard title="จัดการคอลเลกชัน">
        {/* Filter bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {/* Left: search + status pills + category dropdown */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
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
                placeholder="ค้นหาคอลเลกชัน..."
                value={searchTerm}
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "active", "inactive"] as const).map((value) => (
                <button
                  key={value}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                    statusFilter === value
                      ? "bg-[#45745a] text-white"
                      : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
                  }`}
                  onClick={() => setStatusFilter(value)}
                  type="button"
                >
                  {value === "all" ? "ทุกสถานะ" : value === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </button>
              ))}
            </div>
            <select
              className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => setCategoryFilter(e.target.value)}
              value={categoryFilter}
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {/* Right: add button */}
          <button
            className="shrink-0 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreateModal}
            type="button"
          >
            + เพิ่มคอลเลกชัน
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">ชื่อคอลเลกชัน</th>
                <th className="px-4 py-3 font-semibold">หมวดหมู่</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">ลำดับ</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3">
                      <div className="h-4 w-36 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
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

              {!isLoading && filteredCollections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2]">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.75m13.5-2.872A2.25 2.25 0 0 1 19.5 9v.75M4.5 9.75v9a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-9M4.5 9.75h15" />
                        </svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">
                        {hasActiveFilter ? "ไม่พบคอลเลกชันที่ตรงกัน" : "ยังไม่มีคอลเลกชัน"}
                      </p>
                      <p className="mt-1 text-sm text-dark-5">
                        {hasActiveFilter ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "เพิ่มคอลเลกชันแรกเพื่อเริ่มต้น"}
                      </p>
                      {!hasActiveFilter && (
                        <button
                          className="mt-4 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
                          onClick={openCreateModal}
                          type="button"
                        >
                          + เพิ่มคอลเลกชันแรก
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredCollections.map((collection) => (
                  <tr
                    key={collection.id}
                    className="border-t border-stroke text-sm transition-colors hover:bg-[#fafcfb] dark:border-dark-3 dark:hover:bg-dark-2/50"
                  >
                    <td className="px-4 py-3 font-semibold text-dark dark:text-white">
                      {collection.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-dark-5 dark:text-dark-6">
                      {collection.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-dark-5 dark:text-dark-6">
                      {collection.slug}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-dark-5 dark:text-dark-6">
                      {collection.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={collection.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        tone={collection.isActive ? "success" : "danger"}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                          onClick={() => openEditModal(collection)}
                          type="button"
                        >
                          แก้ไข
                        </button>
                        <button
                          className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4]"
                          onClick={() => setCollectionToDelete(collection)}
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

        <div className="mt-4">
          <p className="text-sm text-dark-5">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#d8e6dd] border-t-[#45745a]" />
                กำลังโหลด...
              </span>
            ) : (
              <>
                <span className="font-semibold text-dark dark:text-white">{filteredCollections.length}</span>
                {filteredCollections.length !== collections.length ? ` / ${collections.length} คอลเลกชัน` : " คอลเลกชัน"}
              </>
            )}
          </p>
        </div>
      </ContentCard>

      {collectionToDelete
        ? createPortal(
            <ConfirmDeleteModal
              collectionName={collectionToDelete.name}
              isDeleting={isDeleting}
              onClose={() => setCollectionToDelete(null)}
              onConfirm={handleConfirmDelete}
            />,
            document.body,
          )
        : null}

      {isModalOpen
        ? createPortal(
            <CollectionFormModal
              editingId={editingId}
              form={form}
              isSubmitting={isSubmitting}
              brands={brands}
              categories={categories}
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
