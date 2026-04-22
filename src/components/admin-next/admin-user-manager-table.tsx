"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  AdminUserFormPayload,
  AdminUserRecord,
  ApiAdminUser,
  CategoryListMeta,
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";

type AdminUserManagerTableProps = {
  initialItems: AdminUserRecord[];
  initialMeta: CategoryListMeta;
};

type AdminUserApiResponse = {
  items: ApiAdminUser[];
  meta: CategoryListMeta;
};

type StatusFilter = "all" | "active" | "inactive";
type SelectOption<T extends string | number> = { label: string; value: T };

type AdminUserFormState = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
};

const INITIAL_FORM: AdminUserFormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  roleId: "",
};

const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { label: "ทุกสถานะ", value: "all" },
  { label: "ใช้งาน", value: "active" },
  { label: "ระงับ", value: "inactive" },
];

const PAGE_SIZE_OPTIONS: SelectOption<number>[] = [
  { label: "10 รายการ", value: 10 },
  { label: "20 รายการ", value: 20 },
  { label: "50 รายการ", value: 50 },
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function mapAdminUserRecord(user: ApiAdminUser): AdminUserRecord {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
    roleId: user.roleId ?? null,
    roleName: user.role?.name ?? "ไม่ระบุ",
    isActive: user.isActive,
    updatedAt: formatDate(user.updatedAt),
    source: "api",
  };
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
  userName,
  isDeleting,
  onClose,
  onConfirm,
}: {
  userName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="text-xl font-bold text-dark dark:text-white">ยืนยันการลบผู้ดูแลระบบ</h3>
        <p className="mt-3 text-sm leading-6 text-dark-5 dark:text-dark-6">
          ต้องการลบผู้ดูแลระบบ{" "}
          <span className="font-semibold text-dark dark:text-white">"{userName}"</span> ใช่หรือไม่?
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

function AdminUserFormModal({
  editingId,
  form,
  formRoles,
  isLoadingRoles,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: AdminUserFormState;
  formRoles: { id: string; name: string }[];
  isLoadingRoles: boolean;
  isSubmitting: boolean;
  onChange: (next: Partial<AdminUserFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const roleOptions: SelectOption<string>[] = [
    { label: isLoadingRoles ? "กำลังโหลด..." : "-- เลือกบทบาท --", value: "" },
    ...formRoles.map((r) => ({ label: r.name, value: r.id })),
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขผู้ดูแลระบบ" : "เพิ่มผู้ดูแลระบบ"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-dark-5 dark:text-dark-6">
              กรอกข้อมูลผู้ดูแลระบบและกำหนดสิทธิ์
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
              อีเมล <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="เช่น admin@beautyup.com"
              type="email"
              value={form.email}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              {editingId ? "เปลี่ยนรหัสผ่าน" : "รหัสผ่าน"}{" "}
              {!editingId && <span className="text-red-500">*</span>}
              {editingId && (
                <span className="ml-1 text-xs text-dark-5">(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>
              )}
            </label>
            <input
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => onChange({ password: e.target.value })}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              type="password"
              value={form.password}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">ชื่อ</label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ firstName: e.target.value })}
                placeholder="เช่น สมชาย"
                value={form.firstName}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">นามสกุล</label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ lastName: e.target.value })}
                placeholder="เช่น ใจดี"
                value={form.lastName}
              />
            </div>
          </div>

          <SelectField
            label="บทบาท *"
            options={roleOptions}
            onChange={(v) => onChange({ roleId: v })}
            value={form.roleId}
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
                  : "เพิ่มผู้ดูแลระบบ"}
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

export function AdminUserManagerTable({ initialItems, initialMeta }: AdminUserManagerTableProps) {
  const { showToast } = useToast();
  const isFirstLoad = useRef(true);
  const [users, setUsers] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminUserFormState>(INITIAL_FORM);
  const [formRoles, setFormRoles] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(initialMeta.page);
  const [pageSize, setPageSize] = useState(initialMeta.pageSize);
  const [userToDelete, setUserToDelete] = useState<AdminUserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tableRows = useMemo(
    () => users.map((u, i) => ({ ...u, no: (meta.page - 1) * meta.pageSize + i + 1 })),
    [users, meta.page, meta.pageSize],
  );

  async function loadUsers(
    overrides?: Partial<Record<"page" | "pageSize" | "searchTerm" | "statusFilter", string | number>>,
  ) {
    const nextPage = typeof overrides?.page === "number" ? overrides.page : page;
    const nextPageSize = typeof overrides?.pageSize === "number" ? overrides.pageSize : pageSize;
    const nextSearch = typeof overrides?.searchTerm === "string" ? overrides.searchTerm : searchTerm;
    const nextStatus = typeof overrides?.statusFilter === "string" ? overrides.statusFilter : statusFilter;

    const params = new URLSearchParams({ page: String(nextPage), pageSize: String(nextPageSize) });
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin-users?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as AdminUserApiResponse | { message?: string };

      if (!response.ok || !("items" in data)) {
        throw new Error(("message" in data && data.message) || "ไม่สามารถดึงข้อมูลผู้ดูแลระบบได้");
      }

      setUsers(data.items.map(mapAdminUserRecord));
      setMeta(data.meta);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลผู้ดูแลระบบได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormRoles() {
    setIsLoadingRoles(true);
    try {
      const response = await fetch("/api/roles?status=active&pageSize=100", { cache: "no-store" });
      const data = (await response.json()) as { items: { id: string; name: string }[] } | { message?: string };
      if (response.ok && "items" in data) {
        setFormRoles(data.items);
      }
    } catch {
      // keep formRoles as-is if fetch fails
    } finally {
      setIsLoadingRoles(false);
    }
  }

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    void loadUsers();
  }, [page, pageSize, searchTerm, statusFilter]);

  async function refreshAfterMutation(targetPage = page) {
    await loadUsers({ page: targetPage });
    setPage(targetPage);
  }

  function resetForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
  }

  function openCreateModal() {
    resetForm();
    setIsModalOpen(true);
    void loadFormRoles();
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  function startEdit(user: AdminUserRecord) {
    setEditingId(user.id);
    setForm({
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId ?? "",
    });
    setIsModalOpen(true);
    void loadFormRoles();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (!form.email.trim()) throw new Error("กรุณากรอกอีเมล");
      if (!editingId && !form.password.trim()) throw new Error("กรุณากรอกรหัสผ่าน");
      if (form.password && form.password.length < 6) throw new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");

      const payload: AdminUserFormPayload = {
        email: form.email.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        roleId: form.roleId || undefined,
      };

      if (editingId) {
        if (form.password.trim()) payload.password = form.password;
        await updateAdminUser(editingId, payload);
      } else {
        await createAdminUser({ ...payload, password: form.password });
      }

      showToast(editingId ? "อัปเดตผู้ดูแลระบบสำเร็จ" : "สร้างผู้ดูแลระบบสำเร็จ", "success");
      closeModal();
      await refreshAfterMutation(editingId ? page : 1);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(user: AdminUserRecord) {
    try {
      const response = await updateAdminUserStatus(user.id, !user.isActive);
      setUsers((current) =>
        current.map((u) =>
          u.id === user.id
            ? { ...u, isActive: response.isActive, updatedAt: formatDate(response.updatedAt) }
            : u,
        ),
      );
      showToast(response.isActive ? "เปิดใช้งานผู้ดูแลระบบแล้ว" : "ระงับผู้ดูแลระบบแล้ว", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะได้", "error");
    }
  }

  function handleDelete(user: AdminUserRecord) {
    setUserToDelete(user);
  }

  async function handleConfirmDelete() {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      await deleteAdminUser(userToDelete.id);
      showToast("ลบผู้ดูแลระบบสำเร็จ", "warning");
      setUserToDelete(null);
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      await refreshAfterMutation(nextPage);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถลบผู้ดูแลระบบได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard
        title="จัดการผู้ดูแลระบบ"
        description="ค้นหา กรองข้อมูล และแบ่งหน้าได้จากหน้าจัดการเดียว"
        aside={
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreateModal}
            type="button"
          >
            + เพิ่มผู้ดูแลระบบ
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 lg:max-w-2xl lg:grid-cols-[minmax(0,1fr)_180px_130px]">
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
              placeholder="ค้นหาชื่อหรืออีเมล"
              value={searchTerm}
            />
            <SelectField
              options={STATUS_OPTIONS}
              onChange={(v) => {
                setPage(1);
                setStatusFilter(v);
              }}
              value={statusFilter}
            />
            <SelectField
              options={PAGE_SIZE_OPTIONS}
              onChange={(v) => {
                setPage(1);
                setPageSize(v);
              }}
              value={pageSize}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[360px] text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="hidden px-5 py-4 font-medium md:table-cell">ลำดับ</th>
                <th className="px-5 py-4 font-medium">อีเมล</th>
                <th className="hidden px-5 py-4 font-medium sm:table-cell">ชื่อ</th>
                <th className="px-5 py-4 font-medium">บทบาท</th>
                <th className="px-5 py-4 font-medium">สถานะ</th>
                <th className="px-5 py-4 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="hidden px-5 py-4 md:table-cell">{user.no}</td>
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">{user.email}</td>
                  <td className="hidden px-5 py-4 sm:table-cell">{user.displayName}</td>
                  <td className="px-5 py-4">
                    <StatusPill label={user.roleName} tone="default" />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        aria-label={user.isActive ? "ระงับ" : "เปิดใช้งาน"}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          user.isActive ? "bg-[#58cf94]" : "bg-[#d7e2db]"
                        }`}
                        onClick={() => handleToggleStatus(user)}
                        type="button"
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                            user.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <StatusPill
                        label={user.isActive ? "ใช้งาน" : "ระงับ"}
                        tone={user.isActive ? "success" : "warning"}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                        onClick={() => startEdit(user)}
                        type="button"
                      >
                        แก้ไข
                      </button>
                      <button
                        className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4]"
                        onClick={() => handleDelete(user)}
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
                    ไม่พบข้อมูลผู้ดูแลระบบ
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

      {userToDelete
        ? createPortal(
            <ConfirmDeleteModal
              userName={userToDelete.displayName}
              isDeleting={isDeleting}
              onClose={() => setUserToDelete(null)}
              onConfirm={handleConfirmDelete}
            />,
            document.body,
          )
        : null}

      {isModalOpen
        ? createPortal(
            <AdminUserFormModal
              editingId={editingId}
              form={form}
              formRoles={formRoles}
              isLoadingRoles={isLoadingRoles}
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
