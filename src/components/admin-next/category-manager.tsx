"use client";

import { useToast } from "@/components/shared/toast-provider";
import {
  CategoryFormPayload,
  CategoryRecord,
  createCategory,
  softDeleteCategory,
  updateCategory,
  updateCategoryStatus,
} from "@/lib/admin-api";
import { useMemo, useState } from "react";
import { ContentCard, StatusPill } from "./page-elements";

type CategoryManagerProps = {
  initialCategories: CategoryRecord[];
};

const INITIAL_FORM: CategoryFormPayload = {
  name: "",
  slug: "",
  isActive: true,
};

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormPayload>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name);
      }),
    [categories],
  );

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

      const response = editingId
        ? await updateCategory(editingId, payload)
        : await createCategory(payload);

      const nextRecord: CategoryRecord = {
        id: response.id,
        name: response.name,
        slug: response.slug,
        description: response.description ?? "",
        imageUrl: response.imageUrl ?? null,
        requiresShadeSelection: response.requiresShadeSelection ?? false,
        sortOrder: response.sortOrder ?? 0,
        status: response.isActive ? "Active" : "Inactive",
        isActive: response.isActive,
        products: String(response._count?.products ?? 0),
        updatedAt: response.updatedAt
          ? new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(response.updatedAt))
          : "Just now",
        processedBy: response.processedBy ?? "system",
        processedAt: response.processedAt
          ? new Intl.DateTimeFormat("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(response.processedAt))
          : "Just now",
        source: "api",
      };

      setCategories((current) => {
        if (editingId) {
          return current.map((item) => (item.id === editingId ? nextRecord : item));
        }

        return [nextRecord, ...current];
      });

      showToast(editingId ? "อัปเดตหมวดหมู่สำเร็จ" : "สร้างหมวดหมู่สำเร็จ", "success");
      closeModal();
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
                updatedAt: response.updatedAt
                  ? new Intl.DateTimeFormat("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(response.updatedAt))
                  : item.updatedAt,
              }
            : item,
        ),
      );

      showToast(response.isActive ? "เปิดใช้งานหมวดหมู่แล้ว" : "ปิดใช้งานหมวดหมู่แล้ว", "success");
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
    const confirmed = window.confirm(`Archive "${category.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      await softDeleteCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));

      if (editingId === category.id) {
        resetForm();
      }

      showToast("ลบหมวดหมู่สำเร็จ", "warning");
    } catch (caughtError) {
      showToast(
        caughtError instanceof Error ? caughtError.message : "ไม่สามารถลบหมวดหมู่ได้",
        "error",
      );
    }
  }

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return sortedCategories;
    }

    return sortedCategories.filter((category) =>
      [category.name, category.slug].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [searchTerm, sortedCategories]);

  return (
    <>
      <ContentCard
        title="จัดการหมวดหมู่"
        description=""
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
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="w-full max-w-sm">
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="ค้นหาหมวดหมู่"
              value={searchTerm}
            />
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
                <th className="px-5 py-4 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category, index) => (
                <tr
                  key={category.id}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4">{index + 1}</td>
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                    <div>{category.name}</div>
                  </td>
                  <td className="px-5 py-4">{category.slug}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        aria-label={category.isActive ? "Set inactive" : "Set active"}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          category.isActive ? "bg-[#58cf94]" : "bg-[#d7e2db]"
                        }`}
                        onClick={() => handleToggleStatus(category)}
                        type="button"
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
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
              {filteredCategories.length === 0 ? (
                <tr className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6">
                  <td className="px-5 py-6 text-center" colSpan={5}>
                    ไม่พบข้อมูลหมวดหมู่
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
