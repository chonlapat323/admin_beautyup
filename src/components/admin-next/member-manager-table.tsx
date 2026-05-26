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
  getMemberOrders,
  updateMember,
  updateMemberStatus,
} from "@/lib/admin-api";
import { ContentCard, StatusPill } from "./page-elements";
import { MemberAddressModal } from "./member-address-modal";
import { MemberCreditModal } from "./member-credit-modal";

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
  memberType: "REGULAR" | "SALON" | "SALES";
  facebook: string;
  tiktok: string;
  shopee: string;
  lazada: string;
};

type MemberTypeFilter = "all" | "REGULAR" | "SALON" | "SALES";

const INITIAL_FORM: MemberFormState = {
  fullName: "",
  phone: "",
  email: "",
  referredById: "",
  memberType: "REGULAR",
  facebook: "",
  tiktok: "",
  shopee: "",
  lazada: "",
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
  const fmt = (d?: string) =>
    d ? new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d)) : "-";
  return {
    id: member.id,
    fullName: member.fullName,
    phone: member.phone ?? "",
    email: member.email ?? "",
    memberType: member.memberType ?? "REGULAR",
    referralCode: member.referralCode ?? "",
    isActive: member.isActive,
    pointBalance: member.pointBalance,
    creditBalance: Number(member.creditBalance ?? 0),
    orders: member._count?.orders ?? 0,
    referrals: member._count?.referrals ?? 0,
    referredByName: member.referredBy?.fullName,
    createdAt: fmt(member.createdAt),
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
        <svg className={`h-4 w-4 text-dark-5 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-[#d8e6dd] bg-white shadow-1 dark:border-dark-3 dark:bg-dark-2">
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
                {isSelected ? <svg className="h-4 w-4 shrink-0 text-[#45745a]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : null}
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
      <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex items-center justify-between gap-3 border-b border-[#f3e5e4] px-6 py-5 dark:border-dark-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
              <svg className="h-4 w-4 text-[#c84b44]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark dark:text-white">ยืนยันการลบสมาชิก</h3>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3" onClick={onClose} type="button">✕</button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">
            ต้องการลบสมาชิก{" "}
            <span className="font-semibold text-dark dark:text-white">"{memberName}"</span> ใช่หรือไม่?
            การลบจะไม่สามารถกู้คืนได้
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
          <button
            className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:opacity-70"
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
  referredByName,
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  referredByName?: string;
  form: MemberFormState;
  isSubmitting: boolean;
  onChange: (next: Partial<MemberFormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="flex w-full max-w-lg flex-col rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        <div className="shrink-0 flex items-center justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">
              {editingId ? "แก้ไขสมาชิก" : "เพิ่มสมาชิก"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-dark-5 dark:text-dark-6">
              กรอกข้อมูลพื้นฐานของสมาชิก
            </p>
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3"
            onClick={onClose}
            type="button"
          >✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
        <form className="space-y-5 px-7 py-7" id="member-form" onSubmit={onSubmit}>
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

          {editingId ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">เบอร์โทร</label>
                <div className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f0f5f2] px-4 py-3 text-sm text-dark-5 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6">
                  {form.phone || "-"}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">อีเมล</label>
                <div className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f0f5f2] px-4 py-3 text-sm text-dark-5 dark:border-dark-3 dark:bg-dark-3 dark:text-dark-6">
                  {form.email || "-"}
                </div>
              </div>
            </div>
          ) : (
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
          )}

          {editingId && referredByName && (
            <div className="rounded-xl border border-[#d8e6dd] bg-[#f4fbf6] px-4 py-3">
              <p className="text-xs font-semibold text-dark-5 dark:text-dark-6">ผู้แนะนำ</p>
              <p className="mt-1 text-sm font-semibold text-[#2d6a4f]">{referredByName}</p>
            </div>
          )}

          {!editingId && (
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
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">ประเภทสมาชิก</label>
            <div className="flex gap-3">
              {(["REGULAR", "SALON", "SALES"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ memberType: type })}
                  className={`flex-1 rounded-[18px] border px-4 py-3 text-sm font-medium transition-colors ${
                    form.memberType === type
                      ? "border-[#5f8f74] bg-[#eef8f1] text-[#355846]"
                      : "border-[#d8e6dd] bg-[#f8fbf9] text-dark-5 hover:border-[#bfd6c7]"
                  }`}
                >
                  {type === "SALON" ? "สมาชิกซาลอน" : type === "SALES" ? "พนักงานเซล" : "สมาชิกทั่วไป"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#d8e6dd] bg-[#f4fbf6] p-4 dark:border-dark-3 dark:bg-dark-2">
            <p className="mb-3 text-sm font-semibold text-dark dark:text-white">ช่องทางติดต่อ</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-dark-6">Facebook URL / Username</label>
                <input
                  className="w-full rounded-[14px] border border-[#d8e6dd] bg-white px-3 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  onChange={(e) => onChange({ facebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                  value={form.facebook}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-dark-6">TikTok URL / Username</label>
                <input
                  className="w-full rounded-[14px] border border-[#d8e6dd] bg-white px-3 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  onChange={(e) => onChange({ tiktok: e.target.value })}
                  placeholder="https://tiktok.com/@..."
                  value={form.tiktok}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-dark-6">Shopee URL / Username</label>
                <input
                  className="w-full rounded-[14px] border border-[#d8e6dd] bg-white px-3 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  onChange={(e) => onChange({ shopee: e.target.value })}
                  placeholder="https://shopee.co.th/..."
                  value={form.shopee}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-dark-5 dark:text-dark-6">Lazada URL / Username</label>
                <input
                  className="w-full rounded-[14px] border border-[#d8e6dd] bg-white px-3 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  onChange={(e) => onChange({ lazada: e.target.value })}
                  placeholder="https://lazada.co.th/..."
                  value={form.lazada}
                />
              </div>
            </div>
          </div>

        </form>
        </div>
        <div className="shrink-0 flex flex-wrap gap-3 border-t border-[#edf4ef] px-7 py-5 dark:border-dark-3">
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            form="member-form"
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
      </div>
    </div>
  );
}

const NUM_COLS = 10;

export function MemberManagerTable({ initialItems, initialMeta }: MemberManagerTableProps) {
  const { showToast } = useToast();
  const isFirstLoad = useRef(true);
  const [members, setMembers] = useState(initialItems);
  const [meta, setMeta] = useState(initialMeta);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingReferredByName, setEditingReferredByName] = useState<string | undefined>();
  const [form, setForm] = useState<MemberFormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [memberTypeFilter, setMemberTypeFilter] = useState<MemberTypeFilter>("all");
  const [page, setPage] = useState(initialMeta.page);
  const [pageSize, setPageSize] = useState(initialMeta.pageSize);
  const [memberToDelete, setMemberToDelete] = useState<MemberRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addressMember, setAddressMember] = useState<{ id: string; name: string } | null>(null);
  const [creditMember, setCreditMember] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [detailMember, setDetailMember] = useState<MemberRecord | null>(null);
  const [memberOrders, setMemberOrders] = useState<{ id: string; orderNumber: string; status: string; totalAmount: number | string; createdAt?: string }[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const tableRows = useMemo(
    () => members.map((m, i) => ({ ...m, no: (meta.page - 1) * meta.pageSize + i + 1 })),
    [members, meta.page, meta.pageSize],
  );

  async function loadMembers(
    overrides?: Partial<Record<"page" | "pageSize" | "searchTerm" | "statusFilter" | "memberTypeFilter", string | number>>,
  ) {
    const nextPage = typeof overrides?.page === "number" ? overrides.page : page;
    const nextPageSize = typeof overrides?.pageSize === "number" ? overrides.pageSize : pageSize;
    const nextSearch = typeof overrides?.searchTerm === "string" ? overrides.searchTerm : searchTerm;
    const nextStatus = typeof overrides?.statusFilter === "string" ? overrides.statusFilter : statusFilter;
    const nextMemberType = typeof overrides?.memberTypeFilter === "string" ? overrides.memberTypeFilter : memberTypeFilter;

    const params = new URLSearchParams({ page: String(nextPage), pageSize: String(nextPageSize) });
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextMemberType !== "all") params.set("memberType", nextMemberType);

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
  }, [page, pageSize, searchTerm, statusFilter, memberTypeFilter]);

  async function refreshAfterMutation(targetPage = page) {
    await loadMembers({ page: targetPage });
    setPage(targetPage);
  }

  async function openDetail(member: MemberRecord) {
    setDetailMember(member);
    setMemberOrders([]);
    setIsLoadingOrders(true);
    try {
      const data = await getMemberOrders(member.id);
      const orders = Array.isArray(data) ? data : (data as { items?: unknown[] }).items ?? [];
      setMemberOrders(orders.slice(0, 10) as typeof memberOrders);
    } catch {
      setMemberOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
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
    setEditingReferredByName(member.referredByName);
    setForm({
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      referredById: "",
      memberType: member.memberType,
      facebook: member.facebook ?? "",
      tiktok: member.tiktok ?? "",
      shopee: member.shopee ?? "",
      lazada: member.lazada ?? "",
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

      const socialFields = {
        facebook: form.facebook.trim() || null,
        tiktok: form.tiktok.trim() || null,
        shopee: form.shopee.trim() || null,
        lazada: form.lazada.trim() || null,
      };

      const payload: MemberFormPayload = editingId
        ? {
            fullName: form.fullName.trim(),
            memberType: form.memberType,
            ...socialFields,
          }
        : {
            fullName: form.fullName.trim(),
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
            referredById: form.referredById.trim() || undefined,
            memberType: form.memberType,
            ...socialFields,
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
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_160px_180px_180px_130px]">
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
            options={[
              { label: "ทุกประเภท", value: "all" as MemberTypeFilter },
              { label: "ลูกค้าทั่วไป", value: "REGULAR" as MemberTypeFilter },
              { label: "ร้านซาลอน", value: "SALON" as MemberTypeFilter },
              { label: "พนักงานเซล", value: "SALES" as MemberTypeFilter },
            ]}
            onChange={(v: MemberTypeFilter) => {
              setPage(1);
              setMemberTypeFilter(v);
            }}
            value={memberTypeFilter}
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

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[360px] text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-5 py-4 font-medium">เบอร์โทร / อีเมล</th>
                <th className="hidden px-5 py-4 font-medium lg:table-cell">รหัสแนะนำ</th>
                <th className="hidden px-5 py-4 font-medium lg:table-cell">ประเภท</th>
                <th className="hidden px-5 py-4 font-medium xl:table-cell">ออเดอร์</th>
                <th className="hidden px-5 py-4 font-medium xl:table-cell">แนะนำ</th>
                <th className="hidden px-5 py-4 font-medium xl:table-cell">แต้ม</th>
                <th className="hidden px-5 py-4 font-medium xl:table-cell">เครดิต</th>
                <th className="px-5 py-4 font-medium">สถานะ</th>
                <th className="px-5 py-4 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-5 py-4 lg:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-5 py-4 lg:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-5 py-4 xl:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-5 py-4 xl:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-5 py-4 xl:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-5 py-4 xl:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                  </tr>
                ))
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={NUM_COLS} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f7f2] dark:bg-dark-2">
                      <svg className="h-7 w-7 text-[#5f8f74]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <p className="mt-4 text-sm font-medium text-dark dark:text-white">
                      {searchTerm || statusFilter !== "all" ? "ไม่พบสมาชิกที่ตรงกับเงื่อนไข" : "ยังไม่มีสมาชิก"}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <button
                        className="mt-3 inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
                        onClick={openCreateModal}
                        type="button"
                      >
                        + เพิ่มสมาชิก
                      </button>
                    )}
                  </td>
                </tr>
              ) : tableRows.map((member) => (
                <tr
                  key={member.id}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-dark dark:text-white">{member.fullName}</div>
                    <div className="mt-0.5 text-xs text-dark-5">{member.createdAt}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{member.phone || "-"}</div>
                    <div className="mt-0.5 text-xs text-dark-5">{member.email || "-"}</div>
                  </td>
                  <td className="hidden px-5 py-4 lg:table-cell">
                    {member.referralCode ? (
                      <span className="font-mono text-xs text-[#45745a]">{member.referralCode}</span>
                    ) : "-"}
                  </td>
                  <td className="hidden px-5 py-4 lg:table-cell">
                    <StatusPill
                      label={member.memberType === "SALON" ? "ซาลอน" : member.memberType === "SALES" ? "พนักงานเซล" : "ทั่วไป"}
                      tone={member.memberType === "SALON" ? "success" : member.memberType === "SALES" ? "warning" : "default"}
                    />
                  </td>
                  <td className="hidden px-5 py-4 text-center xl:table-cell">{member.orders}</td>
                  <td className="hidden px-5 py-4 text-center xl:table-cell">{member.referrals}</td>
                  <td className="hidden px-5 py-4 xl:table-cell">{member.pointBalance.toLocaleString()}</td>
                  <td className="hidden px-5 py-4 xl:table-cell">
                    {member.creditBalance > 0 ? (
                      <span className="font-semibold text-[#2a7a4b]">
                        ฿{member.creditBalance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-dark-5">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => void handleToggleStatus(member)} type="button">
                      <StatusPill
                        label={member.isActive ? "ใช้งาน" : "ระงับ"}
                        tone={member.isActive ? "success" : "warning"}
                      />
                    </button>
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
                        className="rounded-full border border-[#dde8f5] px-3 py-1 text-xs font-semibold text-[#4a6fa8] transition-colors hover:bg-[#f0f5ff]"
                        onClick={() => void openDetail(member)}
                        type="button"
                      >
                        รายละเอียด
                      </button>
                      <button
                        className="rounded-full border border-[#d0e0f0] px-3 py-1 text-xs font-semibold text-[#2563a8] transition-colors hover:bg-[#f0f7ff]"
                        onClick={() => setAddressMember({ id: member.id, name: member.fullName })}
                        type="button"
                      >
                        ที่อยู่
                      </button>
                      <button
                        className="rounded-full border border-[#c6e2d2] px-3 py-1 text-xs font-semibold text-[#2a7a4b] transition-colors hover:bg-[#eef8f1]"
                        onClick={() => setCreditMember({ id: member.id, name: member.fullName, balance: member.creditBalance })}
                        type="button"
                      >
                        เครดิต
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
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-dark-5">
            {isLoading ? (
              <span className="inline-block h-4 w-40 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
            ) : (
              <>แสดง {tableRows.length} จากทั้งหมด <strong className="font-semibold text-dark dark:text-white">{meta.totalItems}</strong> รายการ</>
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
              referredByName={editingReferredByName}
              form={form}
              isSubmitting={isSubmitting}
              onChange={(next) => setForm((c) => ({ ...c, ...next }))}
              onClose={closeModal}
              onSubmit={handleSubmit}
            />,
            document.body,
          )
        : null}

      {addressMember ? (
        <MemberAddressModal
          memberId={addressMember.id}
          memberName={addressMember.name}
          onClose={() => setAddressMember(null)}
        />
      ) : null}

      {creditMember ? (
        <MemberCreditModal
          memberId={creditMember.id}
          memberName={creditMember.name}
          creditBalance={creditMember.balance}
          onClose={() => setCreditMember(null)}
        />
      ) : null}

      {detailMember ? createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
          <div
            className="flex w-full max-w-xl flex-col rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
            style={{ maxHeight: "88vh" }}
          >
            <div className="shrink-0 flex items-center justify-between border-b border-stroke px-6 py-5 dark:border-dark-3">
              <div>
                <h3 className="text-lg font-bold text-dark dark:text-white">{detailMember.fullName}</h3>
                <p className="mt-0.5 text-xs text-dark-5">{detailMember.phone || detailMember.email || "-"}</p>
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full text-dark-5 hover:bg-neutral-100 dark:hover:bg-dark-2"
                onClick={() => setDetailMember(null)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 px-6 py-5">
              {/* Orders section */}
              <div>
                <p className="mb-3 text-sm font-semibold text-dark dark:text-white">ออเดอร์ล่าสุด (สูงสุด 10 รายการ)</p>
                {isLoadingOrders ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-10 animate-pulse rounded-xl bg-neutral-100 dark:bg-dark-2" />
                    ))}
                  </div>
                ) : memberOrders.length === 0 ? (
                  <p className="rounded-xl border border-stroke px-4 py-4 text-sm text-dark-5 dark:border-dark-3">ยังไม่มีออเดอร์</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
                    <table className="w-full text-sm">
                      <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold">เลขออเดอร์</th>
                          <th className="px-4 py-2.5 text-left font-semibold">สถานะ</th>
                          <th className="px-4 py-2.5 text-right font-semibold">ยอด</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberOrders.map((order) => (
                          <tr key={order.id} className="border-t border-stroke text-sm dark:border-dark-3">
                            <td className="px-4 py-2.5 font-mono text-xs text-dark dark:text-white">{order.orderNumber}</td>
                            <td className="px-4 py-2.5 text-dark-5 dark:text-dark-6">{order.status}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-dark dark:text-white">
                              ฿{Number(order.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Referrals section */}
              <div>
                <p className="mb-3 text-sm font-semibold text-dark dark:text-white">ผู้ที่แนะนำ ({detailMember.referrals} คน)</p>
                <div className="rounded-xl border border-stroke px-4 py-3 text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6">
                  {detailMember.referrals > 0
                    ? `สมาชิกรายนี้แนะนำสมาชิกใหม่ทั้งหมด ${detailMember.referrals} คน`
                    : "ยังไม่มีผู้ถูกแนะนำ"}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex justify-end border-t border-stroke px-6 py-4 dark:border-dark-3">
              <button
                className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                onClick={() => setDetailMember(null)}
                type="button"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
