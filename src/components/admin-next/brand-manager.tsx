"use client";

import { useEffect, useState } from "react";
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

type BrandFormState = {
  name: string;
  isActive: boolean;
  sortOrder: string;
};

const INITIAL_FORM: BrandFormState = {
  name: "",
  isActive: true,
  sortOrder: "0",
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
                : editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มแบรนด์"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
    setForm({ name: brand.name, isActive: brand.isActive, sortOrder: String(brand.sortOrder) });
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
        });
        setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        showToast("อัปเดตแบรนด์สำเร็จ", "success");
      } else {
        const created = await createBrand({
          name: form.name.trim(),
          sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
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
      <ContentCard
        title="จัดการแบรนด์"
        aside={
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreateModal}
            type="button"
          >
            + เพิ่มแบรนด์
          </button>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
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

              {!isLoading && brands.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2]">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">ยังไม่มีแบรนด์</p>
                      <p className="mt-1 text-sm text-dark-5">เพิ่มแบรนด์แรกเพื่อเริ่มต้น</p>
                      <button
                        className="mt-4 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
                        onClick={openCreateModal}
                        type="button"
                      >
                        + เพิ่มแบรนด์แรก
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-t border-stroke text-sm transition-colors hover:bg-[#fafcfb] dark:border-dark-3 dark:hover:bg-dark-2/50"
                  >
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
                <span className="font-semibold text-dark dark:text-white">{brands.length}</span>
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
