"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiCategory,
  ApiShadeGroup,
  ApiShadeItem,
  CategoryFormPayload,
  CategoryListMeta,
  CategoryRecord,
  createCategory,
  createShadeGroup,
  createShadeItem,
  deleteShadeGroup,
  deleteShadeItem,
  getShadeGroups,
  softDeleteCategory,
  updateCategory,
  updateCategoryStatus,
  updateShadeGroup,
  updateShadeItem,
  uploadShadeItemImage,
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
  description: "",
  imageUrl: undefined,
  requiresShadeSelection: false,
  tempImageFile: undefined,
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
    imageUrl: category.imageUrl ?? null,
    requiresShadeSelection: category.requiresShadeSelection ?? false,
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

function ShadeManagerModal({ category, onClose }: { category: CategoryRecord; onClose: () => void }) {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<ApiShadeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"groups" | "shades">("groups");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState<{ name: string; sortOrder: number } | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [isGroupSubmitting, setIsGroupSubmitting] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const [shadeForm, setShadeForm] = useState<{ name: string; imageFile?: File | null; imagePreview?: string | null } | null>(null);
  const [editingShadeId, setEditingShadeId] = useState<string | null>(null);
  const [isShadeSubmitting, setIsShadeSubmitting] = useState(false);
  const [uploadingShadeId, setUploadingShadeId] = useState<string | null>(null);
  const [deletingShadeId, setDeletingShadeId] = useState<string | null>(null);
  const [draggingGroupIdx, setDraggingGroupIdx] = useState<number | null>(null);
  const [dragOverGroupIdx, setDragOverGroupIdx] = useState<number | null>(null);
  const [draggingShadeIdx, setDraggingShadeIdx] = useState<number | null>(null);
  const [dragOverShadeIdx, setDragOverShadeIdx] = useState<number | null>(null);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;

  useEffect(() => {
    setIsLoading(true);
    getShadeGroups(category.id)
      .then(setGroups)
      .catch(() => showToast("ไม่สามารถโหลดกลุ่มเฉดสีได้", "error"))
      .finally(() => setIsLoading(false));
  }, [category.id]);

  function patchGroupShades(groupId: string, updater: (s: ApiShadeItem[]) => ApiShadeItem[]) {
    setGroups((g) => g.map((gr) => (gr.id === groupId ? { ...gr, shades: updater(gr.shades) } : gr)));
  }

  async function handleGroupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupForm?.name.trim()) { showToast("กรุณากรอกชื่อกลุ่ม", "error"); return; }
    setIsGroupSubmitting(true);
    try {
      if (editingGroupId) {
        const updated = await updateShadeGroup(category.id, editingGroupId, groupForm);
        setGroups((g) => g.map((gr) => (gr.id === updated.id ? { ...updated, shades: gr.shades } : gr)));
        showToast("อัปเดตกลุ่มสำเร็จ", "success");
      } else {
        const created = await createShadeGroup(category.id, groupForm);
        setGroups((g) => [...g, { ...created, shades: [] }]);
        showToast("เพิ่มกลุ่มสำเร็จ", "success");
      }
      setGroupForm(null); setEditingGroupId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally { setIsGroupSubmitting(false); }
  }

  async function handleDeleteGroup(groupId: string) {
    setDeletingGroupId(groupId);
    try {
      await deleteShadeGroup(category.id, groupId);
      setGroups((g) => g.filter((gr) => gr.id !== groupId));
      showToast("ลบกลุ่มสำเร็จ", "warning");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally { setDeletingGroupId(null); }
  }

  async function handleShadeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shadeForm?.name.trim() || !selectedGroupId) return;
    setIsShadeSubmitting(true);
    try {
      let result: ApiShadeItem;
      if (editingShadeId) {
        result = await updateShadeItem(category.id, selectedGroupId, editingShadeId, { name: shadeForm.name });
      } else {
        result = await createShadeItem(category.id, selectedGroupId, { name: shadeForm.name });
      }
      if (shadeForm.imageFile) {
        result = await uploadShadeItemImage(category.id, selectedGroupId, result.id, shadeForm.imageFile);
      }
      if (editingShadeId) {
        patchGroupShades(selectedGroupId, (s) => s.map((sh) => (sh.id === result.id ? result : sh)));
        showToast("อัปเดตเฉดสีสำเร็จ", "success");
      } else {
        patchGroupShades(selectedGroupId, (s) => [...s, result]);
        showToast("เพิ่มเฉดสีสำเร็จ", "success");
      }
      setShadeForm(null); setEditingShadeId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally { setIsShadeSubmitting(false); }
  }

  async function handleShadeToggle(shade: ApiShadeItem) {
    if (!selectedGroupId) return;
    try {
      const updated = await updateShadeItem(category.id, selectedGroupId, shade.id, { isActive: !shade.isActive });
      patchGroupShades(selectedGroupId, (s) => s.map((sh) => (sh.id === updated.id ? updated : sh)));
    } catch (err) { showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error"); }
  }

  async function handleShadeImageUpload(shade: ApiShadeItem, file: File) {
    if (!selectedGroupId) return;
    setUploadingShadeId(shade.id);
    try {
      const updated = await uploadShadeItemImage(category.id, selectedGroupId, shade.id, file);
      patchGroupShades(selectedGroupId, (s) => s.map((sh) => (sh.id === updated.id ? updated : sh)));
      showToast("อัปโหลดรูปสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "อัปโหลดล้มเหลว", "error");
    } finally { setUploadingShadeId(null); }
  }

  async function handleGroupDrop(targetIdx: number) {
    if (draggingGroupIdx === null || draggingGroupIdx === targetIdx) {
      setDraggingGroupIdx(null); setDragOverGroupIdx(null); return;
    }
    const reordered = [...groups];
    const [moved] = reordered.splice(draggingGroupIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const updated = reordered.map((g, i) => ({ ...g, sortOrder: i }));
    setGroups(updated);
    setDraggingGroupIdx(null); setDragOverGroupIdx(null);
    try {
      await Promise.all(updated.map((g) => updateShadeGroup(category.id, g.id, { sortOrder: g.sortOrder })));
    } catch {
      showToast("บันทึกลำดับไม่สำเร็จ", "error");
      getShadeGroups(category.id).then(setGroups).catch(() => {});
    }
  }

  async function handleShadeDrop(targetIdx: number) {
    if (!selectedGroupId || draggingShadeIdx === null || draggingShadeIdx === targetIdx) {
      setDraggingShadeIdx(null); setDragOverShadeIdx(null); return;
    }
    const currentShades = groups.find((g) => g.id === selectedGroupId)?.shades ?? [];
    const reordered = [...currentShades];
    const [moved] = reordered.splice(draggingShadeIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, sortOrder: i }));
    patchGroupShades(selectedGroupId, () => updated);
    setDraggingShadeIdx(null); setDragOverShadeIdx(null);
    try {
      await Promise.all(updated.map((s) => updateShadeItem(category.id, selectedGroupId, s.id, { sortOrder: s.sortOrder })));
    } catch {
      showToast("บันทึกลำดับไม่สำเร็จ", "error");
      getShadeGroups(category.id).then(setGroups).catch(() => {});
    }
  }

  async function handleShadeDelete(shadeId: string) {
    if (!selectedGroupId) return;
    setDeletingShadeId(shadeId);
    try {
      await deleteShadeItem(category.id, selectedGroupId, shadeId);
      patchGroupShades(selectedGroupId, (s) => s.filter((sh) => sh.id !== shadeId));
      showToast("ลบเฉดสีสำเร็จ", "warning");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally { setDeletingShadeId(null); }
  }

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stroke px-6 py-5 dark:border-dark-3">
          <div className="flex items-center gap-3">
            {view === "shades" ? (
              <button className="rounded-full border border-[#d7e7dc] px-3 py-1.5 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                onClick={() => { setView("groups"); setSelectedGroupId(null); setShadeForm(null); setEditingShadeId(null); }} type="button">
                ← กลับ
              </button>
            ) : null}
            <div>
              <h3 className="text-xl font-bold text-dark dark:text-white">
                {view === "groups" ? "จัดการเฉดสี" : `กลุ่ม: ${selectedGroup?.name ?? ""}`}
              </h3>
              <p className="mt-0.5 text-sm text-dark-5">{category.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === "groups" && !groupForm ? (
              <button className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#355846]"
                onClick={() => { setGroupForm({ name: "", sortOrder: groups.length }); setEditingGroupId(null); }} type="button">
                + เพิ่มกลุ่ม
              </button>
            ) : null}
            {view === "shades" && !shadeForm ? (
              <button className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#355846]"
                onClick={() => { setShadeForm({ name: "" }); setEditingShadeId(null); }} type="button">
                + เพิ่มเฉดสี
              </button>
            ) : null}
            <button className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]" onClick={onClose} type="button">ปิด</button>
          </div>
        </div>

        {/* Inline form */}
        {groupForm || shadeForm ? (
          <div className="shrink-0 border-b border-stroke bg-[#f8fbf9] px-6 py-4 dark:border-dark-3 dark:bg-dark-2">
            {groupForm ? (
              <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => void handleGroupSubmit(e)}>
                <div className="flex-1 min-w-[160px]">
                  <label className="mb-1 block text-xs font-medium text-dark-5">ชื่อกลุ่ม *</label>
                  <input autoFocus className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                    onChange={(e) => setGroupForm((f) => f ? { ...f, name: e.target.value } : f)}
                    placeholder="เช่น NB Natural Brown" value={groupForm.name} />
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-xs font-medium text-dark-5">ลำดับ</label>
                  <input className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                    min={0} type="number"
                    onChange={(e) => setGroupForm((f) => f ? { ...f, sortOrder: Number(e.target.value) } : f)}
                    value={groupForm.sortOrder} />
                </div>
                <button className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-70" disabled={isGroupSubmitting} type="submit">
                  {isGroupSubmitting ? "..." : editingGroupId ? "บันทึก" : "เพิ่ม"}
                </button>
                <button className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                  onClick={() => { setGroupForm(null); setEditingGroupId(null); }} type="button">ยกเลิก</button>
              </form>
            ) : shadeForm ? (
              <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => void handleShadeSubmit(e)}>
                <div className="flex items-end gap-3">
                  <label className="cursor-pointer">
                    <div className="mb-1 text-xs font-medium text-dark-5">รูป</div>
                    {shadeForm.imagePreview ? (
                      <img alt="preview" className="h-14 w-14 rounded-xl border border-stroke object-cover hover:opacity-80" src={shadeForm.imagePreview} title="คลิกเพื่อเปลี่ยนรูป" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-[#c8ddd1] text-xs text-[#45745a] hover:border-[#5f8f74]">
                        + รูป
                      </div>
                    )}
                    <input accept="image/jpeg,image/png,image/webp" className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setShadeForm((prev) => prev ? { ...prev, imageFile: f, imagePreview: URL.createObjectURL(f) } : prev);
                        e.target.value = "";
                      }} type="file" />
                  </label>
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="mb-1 block text-xs font-medium text-dark-5">ชื่อเฉดสี *</label>
                  <input autoFocus className="w-full rounded-xl border border-stroke bg-white px-3 py-2 text-sm outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
                    onChange={(e) => setShadeForm((prev) => prev ? { ...prev, name: e.target.value } : prev)}
                    placeholder="เช่น NB 3" value={shadeForm.name} />
                </div>
                <button className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-70" disabled={isShadeSubmitting} type="submit">
                  {isShadeSubmitting ? "..." : editingShadeId ? "บันทึก" : "เพิ่ม"}
                </button>
                <button className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                  onClick={() => { setShadeForm(null); setEditingShadeId(null); }} type="button">ยกเลิก</button>
              </form>
            ) : null}
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-dark-5">กำลังโหลด...</p>
          ) : view === "groups" ? (
            groups.length === 0 ? (
              <p className="py-10 text-center text-sm text-dark-5">ยังไม่มีกลุ่มเฉดสี — กด "+ เพิ่มกลุ่ม" เพื่อเริ่มต้น</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-[#f8fbf9] dark:border-dark-3 dark:bg-dark-2">
                    <th className="w-8 px-3 py-3" />
                    <th className="px-6 py-3 font-medium text-dark-5">ชื่อกลุ่ม</th>
                    <th className="px-6 py-3 font-medium text-dark-5">เฉดสี</th>
                    <th className="px-6 py-3 font-medium text-dark-5">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group, idx) => (
                    <tr
                      key={group.id}
                      className={`border-b border-stroke dark:border-dark-3 transition-colors ${draggingGroupIdx === idx ? "opacity-40" : ""} ${dragOverGroupIdx === idx && draggingGroupIdx !== idx ? "bg-[#eef8f1]" : ""}`}
                      draggable
                      onDragEnd={() => { setDraggingGroupIdx(null); setDragOverGroupIdx(null); }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverGroupIdx(idx); }}
                      onDragStart={() => setDraggingGroupIdx(idx)}
                      onDrop={() => void handleGroupDrop(idx)}
                    >
                      <td className="px-3 py-4 text-dark-5 cursor-grab select-none text-center">⠿</td>
                      <td className="px-6 py-4 font-semibold text-dark dark:text-white">{group.name}</td>
                      <td className="px-6 py-4 text-dark-5">{group.shades.length} เฉด</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5">
                          <button className="rounded-full bg-[#45745a] px-3 py-1 text-xs font-semibold text-white hover:bg-[#355846]"
                            onClick={() => { setSelectedGroupId(group.id); setView("shades"); }} type="button">
                            เฉดสี →
                          </button>
                          <button className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                            onClick={() => { setEditingGroupId(group.id); setGroupForm({ name: group.name, sortOrder: group.sortOrder }); }} type="button">
                            แก้ไข
                          </button>
                          <button className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4] disabled:opacity-50"
                            disabled={deletingGroupId === group.id}
                            onClick={() => void handleDeleteGroup(group.id)} type="button">
                            {deletingGroupId === group.id ? "..." : "ลบ"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : selectedGroup ? (
            selectedGroup.shades.length === 0 && !shadeForm ? (
              <p className="py-10 text-center text-sm text-dark-5">ยังไม่มีเฉดสีในกลุ่มนี้ — กด "+ เพิ่มเฉดสี"</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stroke bg-[#f8fbf9] dark:border-dark-3 dark:bg-dark-2">
                    <th className="w-8 px-3 py-3" />
                    <th className="px-6 py-3 font-medium text-dark-5">รูป</th>
                    <th className="px-6 py-3 font-medium text-dark-5">ชื่อ</th>
                    <th className="px-6 py-3 font-medium text-dark-5">สถานะ</th>
                    <th className="px-6 py-3 font-medium text-dark-5">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.shades.map((shade, idx) => (
                    <tr
                      key={shade.id}
                      className={`border-b border-stroke dark:border-dark-3 transition-colors ${draggingShadeIdx === idx ? "opacity-40" : ""} ${dragOverShadeIdx === idx && draggingShadeIdx !== idx ? "bg-[#eef8f1]" : ""}`}
                      draggable
                      onDragEnd={() => { setDraggingShadeIdx(null); setDragOverShadeIdx(null); }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverShadeIdx(idx); }}
                      onDragStart={() => setDraggingShadeIdx(idx)}
                      onDrop={() => void handleShadeDrop(idx)}
                    >
                      <td className="px-3 py-3 text-dark-5 cursor-grab select-none text-center">⠿</td>
                      <td className="px-6 py-3">
                        <label className="cursor-pointer">
                          {shade.imageUrl ? (
                            <img alt={shade.name} className="h-12 w-12 rounded-xl border border-stroke object-cover hover:opacity-80" src={shade.imageUrl} title="คลิกเพื่อเปลี่ยนรูป" />
                          ) : (
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-[#c8ddd1] text-xs text-[#45745a] hover:border-[#5f8f74] ${uploadingShadeId === shade.id ? "opacity-60" : ""}`}>
                              {uploadingShadeId === shade.id ? "..." : "+ รูป"}
                            </div>
                          )}
                          <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingShadeId === shade.id}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleShadeImageUpload(shade, f); e.target.value = ""; }} type="file" />
                        </label>
                      </td>
                      <td className="px-6 py-3 font-medium text-dark dark:text-white">{shade.name}</td>
                      <td className="px-6 py-3">
                        <button className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${shade.isActive ? "bg-[#58cf94]" : "bg-[#d7e2db]"}`}
                          onClick={() => void handleShadeToggle(shade)} type="button">
                          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${shade.isActive ? "translate-x-5" : "translate-x-1"}`} />
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-1">
                          <button className="rounded-full border border-[#d7e7dc] px-2 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                            onClick={() => { setEditingShadeId(shade.id); setShadeForm({ name: shade.name, imagePreview: shade.imageUrl ?? null }); }} type="button">แก้ไข</button>
                          <button className="rounded-full border border-[#f1d0cf] px-2 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4] disabled:opacity-50"
                            disabled={deletingShadeId === shade.id}
                            onClick={() => void handleShadeDelete(shade.id)} type="button">
                            {deletingShadeId === shade.id ? "..." : "ลบ"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : null}
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
  const [shadeManagerCategory, setShadeManagerCategory] = useState<CategoryRecord | null>(null);

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
      description: category.description,
      imageUrl: category.imageUrl ?? undefined,
      requiresShadeSelection: category.requiresShadeSelection,
      isActive: category.isActive,
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

            <SelectField
              options={STATUS_OPTIONS}
              onChange={(value) => {
                setPage(1);
                setStatusFilter(value);
              }}
              value={statusFilter}
            />

            <SelectField
              options={PAGE_SIZE_OPTIONS}
              onChange={(value) => {
                setPage(1);
                setPageSize(value);
              }}
              value={pageSize}
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
                      {category.requiresShadeSelection ? (
                        <button
                          className="rounded-full border border-[#c8ddd1] px-3 py-1 text-xs font-semibold text-[#45745a] transition-colors hover:bg-[#eef8f1]"
                          onClick={() => setShadeManagerCategory(category)}
                          type="button"
                        >
                          เฉดสี
                        </button>
                      ) : null}
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

      {shadeManagerCategory ? createPortal(
        <ShadeManagerModal
          category={shadeManagerCategory}
          onClose={() => setShadeManagerCategory(null)}
        />,
        document.body,
      ) : null}

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

              {/* คำอธิบาย */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">คำอธิบาย</label>
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
                      <img alt="preview" className="h-20 w-20 rounded-xl border border-[#d8e6dd] object-cover" src={imagePreview} />
                      <button
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c84b44] text-xs text-white hover:bg-[#ad3d37]"
                        onClick={() => { setImagePreview(null); setForm((c) => ({ ...c, tempImageFile: undefined, imageUrl: undefined })); }}
                        type="button"
                      >×</button>
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

              {/* ต้องเลือกเฉดสี */}
              <div className="flex items-center gap-3 rounded-xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3">
                <button
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${form.requiresShadeSelection ? "bg-[#58cf94]" : "bg-[#d7e2db]"}`}
                  onClick={() => setForm((c) => ({ ...c, requiresShadeSelection: !c.requiresShadeSelection }))}
                  type="button"
                >
                  <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${form.requiresShadeSelection ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">ต้องเลือกเฉดสีก่อน</p>
                  <p className="text-xs text-dark-5">เปิดเมื่อเป็นหมวดหมู่สีผม ลูกค้าต้องเลือกเฉดก่อนดูสินค้า</p>
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

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting || isUploadingImage}
                  type="submit"
                >
                  {isSubmitting ? (editingId ? "กำลังบันทึก..." : "กำลังสร้าง...") : editingId ? "บันทึกการเปลี่ยนแปลง" : "สร้างหมวดหมู่"}
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
        </div>,
        document.body
      ) : null}
    </>
  );
}
