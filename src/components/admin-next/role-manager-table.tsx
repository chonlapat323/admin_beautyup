"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiRole,
  CategoryListMeta,
  MenuPermission,
  RoleFormPayload,
  RoleRecord,
  createRole,
  deleteRole,
  updateRole,
  updateRoleStatus,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";

type RoleManagerTableProps = {
  initialItems: RoleRecord[];
  initialMeta: CategoryListMeta;
};

type RoleApiResponse = { items: ApiRole[]; meta: CategoryListMeta };
type SelectOption<T extends string | number> = { label: string; value: T };
type StatusFilter = "all" | "active" | "inactive";

const MENUS: { menu: string; label: string }[] = [
  { menu: "dashboard", label: "ภาพรวม" },
  { menu: "categories", label: "หมวดหมู่" },
  { menu: "products", label: "สินค้า" },
  { menu: "members", label: "สมาชิก" },
  { menu: "admin-users", label: "ผู้ดูแลระบบ" },
  { menu: "roles", label: "สิทธิ์การใช้งาน" },
  { menu: "orders", label: "คำสั่งซื้อ" },
  { menu: "payments", label: "การชำระเงิน" },
  { menu: "reports", label: "รายงาน" },
  { menu: "settings", label: "ตั้งค่า" },
];

function buildInitialPermissions(partial: Partial<MenuPermission>[] = []): MenuPermission[] {
  return MENUS.map((m) => {
    const found = partial.find((p) => p.menu === m.menu);
    return { menu: m.menu, label: m.label, canView: found?.canView ?? false, canEdit: found?.canEdit ?? false, canDelete: found?.canDelete ?? false };
  });
}

const INITIAL_PERMISSIONS = buildInitialPermissions();

type RoleFormState = { name: string; permissions: MenuPermission[] };
const INITIAL_FORM: RoleFormState = { name: "", permissions: INITIAL_PERMISSIONS };

const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { label: "ทุกสถานะ", value: "all" },
  { label: "ใช้งาน", value: "active" },
  { label: "ปิดใช้งาน", value: "inactive" },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function mapRoleRecord(role: ApiRole): RoleRecord {
  return {
    id: role.id,
    name: role.name,
    permissions: role.permissions,
    isActive: role.isActive,
    adminCount: role._count?.admins ?? 0,
    updatedAt: formatDate(role.updatedAt),
    source: "api",
  };
}

function SelectField<T extends string | number>({
  options, value, onChange, className = "",
}: { options: SelectOption<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        className="flex w-full items-center justify-between rounded-[20px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark transition-colors hover:border-[#bfd6c7] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        onClick={() => setIsOpen((c) => !c)}
        type="button"
      >
        <span>{selected?.label}</span>
        <span className={`text-xs text-dark-5 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-[20px] border border-[#d8e6dd] bg-white shadow-1 dark:border-dark-3 dark:bg-dark-2">
          {options.map((o) => (
            <button
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${o.value === value ? "bg-[#eef8f1] font-semibold text-[#355846]" : "text-dark hover:bg-[#f8fbf9] dark:text-white dark:hover:bg-dark-3"}`}
              key={String(o.value)}
              onClick={() => { onChange(o.value); setIsOpen(false); }}
              type="button"
            >
              <span>{o.label}</span>
              {o.value === value ? <span className="text-[#58cf94]">●</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      className={`inline-flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
        checked ? "border-[#45745a] bg-[#45745a]" : "border-[#c8d9cf] bg-white dark:border-dark-3 dark:bg-dark-2"
      }`}
      onClick={onChange}
      type="button"
    >
      {checked ? <span className="text-[10px] font-bold leading-none text-white">✓</span> : null}
    </button>
  );
}

function PermissionsMatrix({
  permissions,
  onChange,
}: {
  permissions: MenuPermission[];
  onChange: (updated: MenuPermission[]) => void;
}) {
  function toggle(menu: string, field: "canView" | "canEdit" | "canDelete") {
    onChange(permissions.map((p) => (p.menu === menu ? { ...p, [field]: !p[field] } : p)));
  }

  function toggleColumn(field: "canView" | "canEdit" | "canDelete") {
    const allOn = permissions.every((p) => p[field]);
    onChange(permissions.map((p) => ({ ...p, [field]: !allOn })));
  }

  const cols: { field: "canView" | "canEdit" | "canDelete"; label: string }[] = [
    { field: "canView", label: "ดูได้" },
    { field: "canEdit", label: "แก้ไขได้" },
    { field: "canDelete", label: "ลบได้" },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
      <table className="w-full text-sm">
        <thead className="bg-[#f8fbf9] dark:bg-dark-2">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-dark-5 dark:text-dark-6">เมนู</th>
            {cols.map((c) => (
              <th className="px-4 py-3 text-center font-medium text-dark-5 dark:text-dark-6" key={c.field}>
                <div className="flex flex-col items-center gap-1">
                  <span>{c.label}</span>
                  <button
                    className="text-[10px] text-[#5f8f74] underline"
                    onClick={() => toggleColumn(c.field)}
                    type="button"
                  >
                    {permissions.every((p) => p[c.field]) ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((p) => (
            <tr className="border-t border-stroke dark:border-dark-3" key={p.menu}>
              <td className="px-4 py-3 font-medium text-dark dark:text-white">{p.label}</td>
              {cols.map((c) => (
                <td className="px-4 py-3 text-center" key={c.field}>
                  <Checkbox checked={p[c.field]} onChange={() => toggle(p.menu, c.field)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmDeleteModal({
  roleName, isDeleting, onClose, onConfirm,
}: { roleName: string; isDeleting: boolean; onClose: () => void; onConfirm: () => Promise<void> }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="text-xl font-bold text-dark dark:text-white">ยืนยันการลบสิทธิ์</h3>
        <p className="mt-3 text-sm leading-6 text-dark-5 dark:text-dark-6">
          ต้องการลบสิทธิ์{" "}
          <span className="font-semibold text-dark dark:text-white">"{roleName}"</span> ใช่หรือไม่?
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]" onClick={onClose} type="button">ยกเลิก</button>
          <button className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:opacity-70" disabled={isDeleting} onClick={() => void onConfirm()} type="button">
            {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleFormModal({
  editingId, form, isSubmitting, onChange, onClose, onSubmit,
}: {
  editingId: string | null;
  form: RoleFormState;
  isSubmitting: boolean;
  onChange: (next: Partial<RoleFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div className="w-full max-w-2xl overflow-y-auto rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark" style={{ maxHeight: "90vh" }}>
        <div className="flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขสิทธิ์การใช้งาน" : "เพิ่มสิทธิ์การใช้งาน"}
            </h3>
            <p className="mt-2 text-sm text-dark-5 dark:text-dark-6">กำหนดชื่อและสิทธิ์แต่ละเมนู</p>
          </div>
          <button className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]" onClick={onClose} type="button">ปิด</button>
        </div>

        <form className="space-y-6 px-7 py-7" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              ชื่อสิทธิ์ <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="เช่น แคชเชียร์, ผู้จัดการสาขา"
              value={form.name}
            />
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-dark dark:text-white">สิทธิ์การเข้าถึงเมนู</p>
            <PermissionsMatrix
              permissions={form.permissions}
              onChange={(p) => onChange({ permissions: p })}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (editingId ? "กำลังบันทึก..." : "กำลังเพิ่ม...") : (editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มสิทธิ์")}
            </button>
            <button className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]" onClick={onClose} type="button">ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RoleManagerTable({ initialItems, initialMeta }: RoleManagerTableProps) {
  const { showToast } = useToast();
  const isFirstLoad = useRef(true);
  const [roles, setRoles] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(initialMeta.page);
  const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tableRows = useMemo(
    () => roles.map((r, i) => ({ ...r, no: (meta.page - 1) * meta.pageSize + i + 1 })),
    [roles, meta],
  );

  async function loadRoles(overrides?: Partial<Record<"page" | "searchTerm" | "statusFilter", string | number>>) {
    const nextPage = typeof overrides?.page === "number" ? overrides.page : page;
    const nextSearch = typeof overrides?.searchTerm === "string" ? overrides.searchTerm : searchTerm;
    const nextStatus = typeof overrides?.statusFilter === "string" ? overrides.statusFilter : statusFilter;

    const params = new URLSearchParams({ page: String(nextPage), pageSize: "20" });
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);

    setIsLoading(true);
    try {
      const response = await fetch(`/api/roles?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as RoleApiResponse | { message?: string };
      if (!response.ok || !("items" in data)) throw new Error(("message" in data && data.message) || "ไม่สามารถดึงข้อมูลสิทธิ์ได้");
      setRoles(data.items.map(mapRoleRecord));
      setMeta(data.meta);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลสิทธิ์ได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    void loadRoles();
  }, [page, searchTerm, statusFilter]);

  async function refreshAfterMutation(targetPage = page) {
    await loadRoles({ page: targetPage });
    setPage(targetPage);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
  }

  function startEdit(role: RoleRecord) {
    setEditingId(role.id);
    setForm({ name: role.name, permissions: buildInitialPermissions(role.permissions) });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!form.name.trim()) throw new Error("กรุณากรอกชื่อสิทธิ์");
      const payload: RoleFormPayload = { name: form.name.trim(), permissions: form.permissions };
      await (editingId ? updateRole(editingId, payload) : createRole(payload));
      showToast(editingId ? "อัปเดตสิทธิ์สำเร็จ" : "สร้างสิทธิ์สำเร็จ", "success");
      closeModal();
      await refreshAfterMutation(editingId ? page : 1);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถบันทึกสิทธิ์ได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(role: RoleRecord) {
    try {
      const response = await updateRoleStatus(role.id, !role.isActive);
      setRoles((current) => current.map((r) => r.id === role.id ? { ...r, isActive: response.isActive, updatedAt: formatDate(response.updatedAt) } : r));
      showToast(response.isActive ? "เปิดใช้งานสิทธิ์แล้ว" : "ปิดใช้งานสิทธิ์แล้ว", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะสิทธิ์ได้", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRole(roleToDelete.id);
      showToast("ลบสิทธิ์สำเร็จ", "warning");
      setRoleToDelete(null);
      const nextPage = roles.length === 1 && page > 1 ? page - 1 : page;
      await refreshAfterMutation(nextPage);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถลบสิทธิ์ได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard
        title="จัดการสิทธิ์การใช้งาน"
        description="กำหนดสิทธิ์การเข้าถึงแต่ละเมนูสำหรับแต่ละบทบาท"
        aside={
          <button className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846]" onClick={openCreateModal} type="button">
            + เพิ่มสิทธิ์
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="grid w-full gap-3 lg:max-w-xl lg:grid-cols-[minmax(0,1fr)_180px]">
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
              placeholder="ค้นหาชื่อสิทธิ์"
              value={searchTerm}
            />
            <SelectField options={STATUS_OPTIONS} onChange={(v) => { setPage(1); setStatusFilter(v); }} value={statusFilter} />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">ลำดับ</th>
                <th className="px-5 py-4 font-medium">ชื่อสิทธิ์</th>
                <th className="px-5 py-4 font-medium">เมนูที่เข้าถึงได้</th>
                <th className="px-5 py-4 font-medium">ผู้ดูแล</th>
                <th className="px-5 py-4 font-medium">สถานะ</th>
                <th className="px-5 py-4 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((role) => {
                const viewable = role.permissions.filter((p) => p.canView).map((p) => p.label);
                return (
                  <tr key={role.id} className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6">
                    <td className="px-5 py-4">{role.no}</td>
                    <td className="px-5 py-4 font-semibold text-dark dark:text-white">{role.name}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {viewable.length === MENUS.length ? (
                          <span className="rounded-full bg-[#eef8f1] px-2 py-0.5 text-xs font-medium text-[#355846]">ทั้งหมด</span>
                        ) : viewable.length === 0 ? (
                          <span className="text-dark-5">-</span>
                        ) : (
                          viewable.slice(0, 4).map((label) => (
                            <span className="rounded-full bg-[#f0f4f2] px-2 py-0.5 text-xs text-dark-5" key={label}>{label}</span>
                          ))
                        )}
                        {viewable.length > 4 ? <span className="rounded-full bg-[#f0f4f2] px-2 py-0.5 text-xs text-dark-5">+{viewable.length - 4}</span> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4">{role.adminCount} คน</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          aria-label={role.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${role.isActive ? "bg-[#58cf94]" : "bg-[#d7e2db]"}`}
                          onClick={() => handleToggleStatus(role)}
                          type="button"
                        >
                          <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${role.isActive ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                        <StatusPill label={role.isActive ? "ใช้งาน" : "ปิดใช้งาน"} tone={role.isActive ? "success" : "warning"} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]" onClick={() => startEdit(role)} type="button">แก้ไข</button>
                        <button className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4]" onClick={() => setRoleToDelete(role)} type="button">ลบ</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && tableRows.length === 0 ? (
                <tr className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6">
                  <td className="px-5 py-6 text-center" colSpan={6}>ไม่พบข้อมูลสิทธิ์การใช้งาน</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-dark-5">
            {isLoading ? "กำลังโหลดข้อมูล..." : `แสดง ${tableRows.length} จากทั้งหมด ${meta.totalItems} รายการ`}
          </p>
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:opacity-50" disabled={!meta.hasPreviousPage || isLoading} onClick={() => setPage((c) => Math.max(1, c - 1))} type="button">ก่อนหน้า</button>
            <span className="text-sm font-medium text-dark dark:text-white">หน้า {meta.page} / {meta.totalPages}</span>
            <button className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:opacity-50" disabled={!meta.hasNextPage || isLoading} onClick={() => setPage((c) => c + 1)} type="button">ถัดไป</button>
          </div>
        </div>
      </ContentCard>

      {roleToDelete ? createPortal(<ConfirmDeleteModal roleName={roleToDelete.name} isDeleting={isDeleting} onClose={() => setRoleToDelete(null)} onConfirm={handleConfirmDelete} />, document.body) : null}
      {isModalOpen ? createPortal(<RoleFormModal editingId={editingId} form={form} isSubmitting={isSubmitting} onChange={(next) => setForm((c) => ({ ...c, ...next }))} onClose={closeModal} onSubmit={handleSubmit} />, document.body) : null}
    </>
  );
}
