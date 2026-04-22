"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import {
  ApiMember,
  CategoryListMeta,
  MemberFormPayload,
  MemberRecord,
  createMember,
  deleteMember,
  updateMember,
  updateMemberStatus,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";

type MemberManagerTableProps = {
  initialItems: MemberRecord[];
  initialMeta: CategoryListMeta;
};

type MemberApiResponse = {
  items: ApiMember[];
  meta: CategoryListMeta;
};

type StatusFilter = "all" | "active" | "inactive";
type SelectOption<T extends string | number> = { label: string; value: T };

type MemberFormState = {
  fullName: string;
  phone: string;
  email: string;
  referredById: string;
};

const INITIAL_FORM: MemberFormState = {
  fullName: "",
  phone: "",
  email: "",
  referredById: "",
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

function formatMemberDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function mapMemberRecord(member: ApiMember): MemberRecord {
  return {
    id: member.id,
    fullName: member.fullName,
    phone: member.phone ?? "",
    email: member.email ?? "",
    isActive: member.isActive,
    pointBalance: member.pointBalance,
    orders: member._count?.orders ?? 0,
    referrals: member._count?.referrals ?? 0,
    updatedAt: formatMemberDate(member.updatedAt),
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
  memberName,
  isDeleting,
  onClose,
  onConfirm,
}: {
  memberName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="text-xl font-bold text-dark dark:text-white">ยืนยันการลบสมาชิก</h3>
        <p className="mt-3 text-sm leading-6 text-dark-5 dark:text-dark-6">
          ต้องการลบสมาชิก{" "}
          <span className="font-semibold text-dark dark:text-white">"{memberName}"</span> ใช่หรือไม่?
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

function MemberFormModal({
  editingId,
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: MemberFormState;
  isSubmitting: boolean;
  onChange: (next: Partial<MemberFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขสมาชิก" : "เพิ่มสมาชิก"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-dark-5 dark:text-dark-6">
              กรอกข้อมูลพื้นฐานของสมาชิก
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
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => onChange({ fullName: e.target.value })}
              placeholder="เช่น สมชาย ใจดี"
              value={form.fullName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">เบอร์โทร</label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="เช่น 0812345678"
                value={form.phone}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">อีเมล</label>
              <input
                className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => onChange({ email: e.target.value })}
                placeholder="เช่น member@example.com"
                type="email"
                value={form.email}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
              รหัสสมาชิกผู้แนะนำ
            </label>
            <input
              className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => onChange({ referredById: e.target.value })}
              placeholder="ID สมาชิกผู้แนะนำ (ไม่บังคับ)"
              value={form.referredById}
            />
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
                  : "เพิ่มสมาชิก"}
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

export function MemberManagerTable({ initialItems, initialMeta }: MemberManagerTableProps) {
  const { showToast } = useToast();
  const isFirstLoad = useRef(true);
  const [members, setMembers] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MemberFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(initialMeta.page);
  const [pageSize, setPageSize] = useState(initialMeta.pageSize);
  const [memberToDelete, setMemberToDelete] = useState<MemberRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tableRows = useMemo(
    () => members.map((m, i) => ({ ...m, no: (meta.page - 1) * meta.pageSize + i + 1 })),
    [members, meta.page, meta.pageSize],
  );

  async function loadMembers(
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
      const response = await fetch(`/api/members?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as MemberApiResponse | { message?: string };

      if (!response.ok || !("items" in data)) {
        throw new Error(("message" in data && data.message) || "ไม่สามารถดึงข้อมูลสมาชิกได้");
      }

      setMembers(data.items.map(mapMemberRecord));
      setMeta(data.meta);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลสมาชิกได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    void loadMembers();
  }, [page, pageSize, searchTerm, statusFilter]);

  async function refreshAfterMutation(targetPage = page) {
    await loadMembers({ page: targetPage });
    setPage(targetPage);
  }

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

  function startEdit(member: MemberRecord) {
    setEditingId(member.id);
    setForm({
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      referredById: "",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (!form.fullName.trim()) {
        throw new Error("กรุณากรอกชื่อ-นามสกุล");
      }

      const payload: MemberFormPayload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        referredById: form.referredById.trim() || undefined,
      };

      await (editingId ? updateMember(editingId, payload) : createMember(payload));

      showToast(editingId ? "อัปเดตสมาชิกสำเร็จ" : "สร้างสมาชิกสำเร็จ", "success");
      closeModal();
      await refreshAfterMutation(editingId ? page : 1);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลสมาชิกได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(member: MemberRecord) {
    try {
      const response = await updateMemberStatus(member.id, !member.isActive);
      setMembers((current) =>
        current.map((m) =>
          m.id === member.id
            ? { ...m, isActive: response.isActive, updatedAt: formatMemberDate(response.updatedAt) }
            : m,
        ),
      );
      showToast(response.isActive ? "เปิดใช้งานสมาชิกแล้ว" : "ระงับสมาชิกแล้ว", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะสมาชิกได้", "error");
    }
  }

  function handleDelete(member: MemberRecord) {
    setMemberToDelete(member);
  }

  async function handleConfirmDelete() {
    if (!memberToDelete) return;
    setIsDeleting(true);

    try {
      await deleteMember(memberToDelete.id);
      showToast("ลบสมาชิกสำเร็จ", "warning");
      setMemberToDelete(null);
      const nextPage = members.length === 1 && page > 1 ? page - 1 : page;
      await refreshAfterMutation(nextPage);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ไม่สามารถลบสมาชิกได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard
        title="จัดการสมาชิก"
        description="ค้นหา กรองข้อมูล และแบ่งหน้าได้จากหน้าจัดการเดียว"
        aside={
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
            onClick={openCreateModal}
            type="button"
          >
            + เพิ่มสมาชิก
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-[minmax(0,1fr)_180px_130px]">
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => {
                setPage(1);
                setSearchTerm(e.target.value);
              }}
              placeholder="ค้นหาชื่อ เบอร์โทร หรืออีเมล"
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
                <th className="px-5 py-4 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-5 py-4 font-medium">เบอร์โทร</th>
                <th className="hidden px-5 py-4 font-medium lg:table-cell">อีเมล</th>
                <th className="hidden px-5 py-4 font-medium lg:table-cell">แต้ม</th>
                <th className="px-5 py-4 font-medium">สถานะ</th>
                <th className="px-5 py-4 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((member) => (
                <tr
                  key={member.id}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="hidden px-5 py-4 md:table-cell">{member.no}</td>
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">{member.fullName}</td>
                  <td className="px-5 py-4">{member.phone || "-"}</td>
                  <td className="hidden px-5 py-4 lg:table-cell">{member.email || "-"}</td>
                  <td className="hidden px-5 py-4 lg:table-cell">{member.pointBalance.toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        aria-label={member.isActive ? "ระงับ" : "เปิดใช้งาน"}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          member.isActive ? "bg-[#58cf94]" : "bg-[#d7e2db]"
                        }`}
                        onClick={() => handleToggleStatus(member)}
                        type="button"
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                            member.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <StatusPill
                        label={member.isActive ? "ใช้งาน" : "ระงับ"}
                        tone={member.isActive ? "success" : "warning"}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                        onClick={() => startEdit(member)}
                        type="button"
                      >
                        แก้ไข
                      </button>
                      <button
                        className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4]"
                        onClick={() => handleDelete(member)}
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
                  <td className="px-5 py-6 text-center" colSpan={7}>
                    ไม่พบข้อมูลสมาชิก
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

      {memberToDelete
        ? createPortal(
            <ConfirmDeleteModal
              memberName={memberToDelete.fullName}
              isDeleting={isDeleting}
              onClose={() => setMemberToDelete(null)}
              onConfirm={handleConfirmDelete}
            />,
            document.body,
          )
        : null}

      {isModalOpen
        ? createPortal(
            <MemberFormModal
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
