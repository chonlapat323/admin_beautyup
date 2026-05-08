"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard, StatusPill } from "./page-elements";

type SelectOption<T extends string | number> = { label: string; value: T };

function SelectField<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
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
    <div className="relative" ref={containerRef}>
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
      {isOpen && (
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
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                type="button"
              >
                <span>{option.label}</span>
                {isSelected ? <svg className="h-4 w-4 shrink-0 text-[#45745a]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type CommissionItem = {
  id: string;
  orderId: string;
  earner: { id: string; fullName: string; memberType: "REGULAR" | "SALON" };
  order: { orderNumber: string; totalAmount: string };
  orderAmount: string;
  rate: string;
  amount: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  paidAt: string | null;
  createdAt: string;
};

type OrderDetail = {
  orderNumber: string;
  subtotalAmount: number | string;
  shippingAmount: number | string;
  gatewayFee: number | string;
  totalAmount: number | string;
  items: {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number | string;
    totalPrice: number | string;
    product?: { images: { url: string }[] };
  }[];
};

type Meta = { page: number; pageSize: number; totalItems: number; totalPages: number };

const STATUS_OPTIONS = [
  { label: "ทุกสถานะ", value: "all" },
  { label: "รอจ่าย", value: "PENDING" },
  { label: "จ่ายแล้ว", value: "PAID" },
  { label: "ยกเลิก", value: "CANCELLED" },
];

const PAGE_SIZE_OPTIONS = [
  { label: "20 รายการ", value: "20" },
  { label: "50 รายการ", value: "50" },
];

function statusTone(s: string) {
  if (s === "PAID") return "success" as const;
  if (s === "CANCELLED") return "default" as const;
  return "warning" as const;
}

function statusLabel(s: string) {
  if (s === "PAID") return "จ่ายแล้ว";
  if (s === "CANCELLED") return "ยกเลิก";
  return "รอจ่าย";
}

function formatAmount(v: string) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

function ConfirmCancelModal({
  isCancelling,
  onClose,
  onConfirm,
}: {
  isCancelling: boolean;
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
            <h3 className="text-lg font-semibold text-dark dark:text-white">ยืนยันการยกเลิก</h3>
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3" onClick={onClose} type="button">✕</button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">
            ต้องการยกเลิก commission รายการนี้ใช่หรือไม่?
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
          <button
            className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ไม่ยกเลิก
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:opacity-70"
            disabled={isCancelling}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isCancelling ? "กำลังยกเลิก..." : "ยืนยันยกเลิก"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommissionManager() {
  const { showToast } = useToast();
  const [items, setItems] = useState<CommissionItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState("20");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [orderDetail, setOrderDetail] = useState<{ commission: CommissionItem; order: OrderDetail } | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);

  // settings
  const [salonRate, setSalonRate] = useState<number>(10);
  const [regularRate, setRegularRate] = useState<number>(5);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingRates, setIsSavingRates] = useState(false);

  useEffect(() => {
    void fetch("/api/commissions/settings")
      .then((r) => r.json())
      .then((d: { salon?: number; regular?: number }) => {
        if (d.salon != null) setSalonRate(d.salon);
        if (d.regular != null) setRegularRate(d.regular);
      })
      .catch(() => null);
  }, []);

  async function handleSaveRates() {
    setIsSavingRates(true);
    try {
      await fetch("/api/commissions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon: salonRate, regular: regularRate }),
      });
      showToast("บันทึกอัตรา commission แล้ว", "success");
      setShowSettings(false);
    } finally {
      setIsSavingRates(false);
    }
  }

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/commissions?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setMeta(data.meta ?? { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => { void load(); }, [load]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const pendingIds = items.filter((i) => i.status === "PENDING").map((i) => i.id);
    if (pendingIds.every((id) => selected.has(id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingIds));
    }
  }

  async function handlePay() {
    if (selected.size === 0) return;
    try {
      const res = await fetch("/api/commissions/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      });
      if (!res.ok) throw new Error("ไม่สามารถจ่าย commission ได้");
      setSelected(new Set());
      showToast(`จ่าย commission ${selected.size} รายการสำเร็จ`, "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  async function handleConfirmCancel() {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/commissions/${cancelTargetId}/cancel`, { method: "PATCH" });
      if (!res.ok) throw new Error("ไม่สามารถยกเลิก commission ได้");
      showToast("ยกเลิก commission แล้ว", "warning");
      setCancelTargetId(null);
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsCancelling(false);
    }
  }

  async function openOrderDetail(item: CommissionItem) {
    setIsLoadingOrder(true);
    try {
      const r = await fetch(`/api/orders/${item.orderId}`);
      const data = await r.json() as OrderDetail;
      setOrderDetail({ commission: item, order: data });
    } catch {
      showToast("ไม่สามารถโหลดรายละเอียดออเดอร์ได้", "error");
    } finally {
      setIsLoadingOrder(false);
    }
  }

  const pendingItems = items.filter((i) => i.status === "PENDING");
  const pendingTotal = pendingItems.reduce((s, i) => s + Number(i.amount), 0);
  const selectedPending = items.filter((i) => selected.has(i.id));
  const selectedTotal = selectedPending.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      <ContentCard
        title="จัดการ Commission"
        description={`ค่าแนะนำจากการสั่งซื้อ — SALON ${salonRate}%, REGULAR ${regularRate}% (1 ระดับ)`}
      >
        {/* Rate settings */}
        <div className="mb-5">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#45745a] hover:underline"
            type="button"
          >
            ⚙ ตั้งค่าอัตรา commission {showSettings ? "▲" : "▼"}
          </button>
          {showSettings && (
            <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
              <div>
                <label className="mb-1 block text-xs text-dark-5">SALON (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={salonRate}
                  onChange={(e) => setSalonRate(Number(e.target.value))}
                  className="w-24 rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-dark-5">REGULAR (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={regularRate}
                  onChange={(e) => setRegularRate(Number(e.target.value))}
                  className="w-24 rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
              <button
                onClick={() => void handleSaveRates()}
                disabled={isSavingRates}
                className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-70"
                type="button"
              >
                {isSavingRates ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          )}
        </div>

        {/* Summary strip */}
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px] rounded-2xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
            <div className="text-xs text-dark-5">รอจ่ายทั้งหมด</div>
            <div className="mt-1 text-lg font-bold text-[#45745a]">
              {formatAmount(String(pendingTotal))}
            </div>
            <div className="text-xs text-dark-5">{pendingItems.length} รายการ</div>
          </div>
          {selected.size > 0 && (
            <div className="flex-1 min-w-[140px] rounded-2xl border border-[#45745a] bg-white px-5 py-4 dark:bg-dark-2">
              <div className="text-xs text-dark-5">เลือกแล้ว</div>
              <div className="mt-1 text-lg font-bold text-dark dark:text-white">
                {formatAmount(String(selectedTotal))}
              </div>
              <div className="text-xs text-dark-5">{selected.size} รายการ</div>
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-lg lg:grid-cols-[minmax(0,1fr)_150px]">
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

          {selected.size > 0 && (
            <button
              onClick={() => void handlePay()}
              className="ml-auto rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#355846]"
            >
              จ่าย {selected.size} รายการ ({formatAmount(String(selectedTotal))})
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[360px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={pendingItems.length > 0 && pendingItems.every((i) => selected.has(i.id))}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 font-medium">ผู้รับ</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">ประเภท</th>
                <th className="px-4 py-3 font-medium">ออเดอร์</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">อัตรา</th>
                <th className="px-4 py-3 font-medium">commission</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-4 py-3 sm:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-16 text-center" colSpan={8}>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f7f2] dark:bg-dark-2">
                      <svg className="h-7 w-7 text-[#5f8f74]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                      </svg>
                    </div>
                    <p className="mt-4 text-sm font-medium text-dark dark:text-white">
                      {statusFilter !== "all" ? "ไม่พบ commission ที่ตรงกับเงื่อนไข" : "ยังไม่มีข้อมูล commission"}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                  >
                    <td className="px-4 py-3">
                      {item.status === "PENDING" && (
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-dark dark:text-white">
                      {item.earner.fullName}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.earner.memberType === "SALON"
                          ? "bg-[#fef3c7] text-[#92400e]"
                          : "bg-[#e0f2fe] text-[#0369a1]"
                      }`}>
                        {item.earner.memberType === "SALON" ? "Salon" : "Regular"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void openOrderDetail(item)}
                        disabled={isLoadingOrder}
                        className="font-mono text-xs text-[#2563a8] underline-offset-2 hover:underline disabled:opacity-50"
                        type="button"
                      >
                        {item.order.orderNumber}
                      </button>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">{Number(item.rate)}%</td>
                    <td className="px-4 py-3 font-semibold text-[#45745a]">
                      {formatAmount(item.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill label={statusLabel(item.status)} tone={statusTone(item.status)} />
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "PENDING" && (
                        <button
                          onClick={() => setCancelTargetId(item.id)}
                          className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4]"
                        >
                          ยกเลิก
                        </button>
                      )}
                      {item.status === "PAID" && item.paidAt && (
                        <span className="text-xs text-dark-5">
                          {new Date(item.paidAt).toLocaleDateString("th-TH")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-dark-5">
            {isLoading ? (
              <span className="inline-block h-4 w-40 animate-pulse rounded bg-dark-5/20" />
            ) : (
              <>แสดง {items.length} จากทั้งหมด <strong className="text-dark dark:text-white">{meta.totalItems}</strong> รายการ</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← ก่อนหน้า
            </button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">
              {page} / {meta.totalPages}
            </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ถัดไป →
            </button>
          </div>
        </div>
      </ContentCard>

      {cancelTargetId
        ? createPortal(
            <ConfirmCancelModal
              isCancelling={isCancelling}
              onClose={() => setCancelTargetId(null)}
              onConfirm={handleConfirmCancel}
            />,
            document.body,
          )
        : null}

      {orderDetail
        ? createPortal(
            <OrderDetailModal
              commission={orderDetail.commission}
              order={orderDetail.order}
              onClose={() => setOrderDetail(null)}
            />,
            document.body,
          )
        : null}
    </>
  );
}

function fmt(n: number | string) {
  return `฿${Number(n).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

function OrderDetailModal({
  commission,
  order,
  onClose,
}: {
  commission: CommissionItem;
  order: OrderDetail;
  onClose: () => void;
}) {
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const rate = Number(commission.rate);
  const commissionAmt = Number(commission.amount);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">รายละเอียดออเดอร์</p>
            <h3 className="mt-1 font-mono text-xl font-bold text-dark dark:text-white">{order.orderNumber}</h3>
            <p className="mt-0.5 text-sm text-dark-5">Commission ของ {commission.earner.fullName}</p>
          </div>
          <button
            className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ปิด
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          {/* Order items */}
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">
              รายการสินค้า ({order.items.length} รายการ)
            </p>
            <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="w-12 px-4 py-3" />
                    <th className="px-4 py-3 font-medium">สินค้า</th>
                    <th className="px-4 py-3 font-medium text-right">จำนวน</th>
                    <th className="px-4 py-3 font-medium text-right">ราคา/ชิ้น</th>
                    <th className="px-4 py-3 font-medium text-right">รวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke dark:divide-dark-3">
                  {order.items.map((item) => {
                    const imgUrl = item.product?.images?.[0]?.url ?? null;
                    return (
                      <tr key={item.id} className="text-dark-5 dark:text-dark-6">
                        <td className="px-4 py-3">
                          {imgUrl ? (
                            <button
                              type="button"
                              onClick={() => setZoomImage(imgUrl)}
                              className="block h-10 w-10 overflow-hidden rounded-xl border border-stroke bg-[#f8fbf9] transition-opacity hover:opacity-80 dark:border-dark-3"
                            >
                              <img src={imgUrl} alt={item.name} className="h-full w-full object-cover" />
                            </button>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stroke bg-[#f8fbf9] text-xs text-dark-5 dark:border-dark-3">
                              –
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-dark dark:text-white">{item.name}</p>
                          <p className="text-xs text-dark-5">{item.sku}</p>
                        </td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{fmt(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-dark dark:text-white">{fmt(item.totalPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order summary */}
          <div className="rounded-2xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">สรุปยอดออเดอร์</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-5">ยอดสินค้า</span>
                <span className="text-dark dark:text-white">{fmt(order.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-5">ค่าจัดส่ง</span>
                <span className="text-dark dark:text-white">{fmt(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-5">ค่าธรรมเนียม</span>
                <span className="text-dark dark:text-white">{fmt(order.gatewayFee ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t border-stroke pt-2 dark:border-dark-3">
                <span className="font-semibold text-dark dark:text-white">ยอดรวม</span>
                <span className="font-bold text-dark dark:text-white">{fmt(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Commission calculation */}
          <div className="rounded-2xl border border-[#b7ddc7] bg-[#f0faf4] px-5 py-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">การคำนวณ Commission</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-5">ยอดออเดอร์ที่ใช้คำนวณ</span>
                <span className="font-medium text-dark">{fmt(commission.orderAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-5">
                  อัตรา ({commission.earner.memberType === "SALON" ? "Salon" : "Regular"})
                </span>
                <span className="font-medium text-dark">{rate}%</span>
              </div>
              <div className="flex justify-between border-t border-[#b7ddc7] pt-2">
                <span className="font-semibold text-dark">
                  {fmt(commission.orderAmount)} × {rate}% =
                </span>
                <span className="text-lg font-bold text-[#2a7a4b]">{fmt(commissionAmt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-[#0f172a]/80 px-4"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            alt="product"
            className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
