"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard, StatusPill } from "./page-elements";

type WithdrawalItem = {
  id: string;
  memberId: string;
  member: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    memberType: string | null;
  };
  amount: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  processedAt: string | null;
  processedByEmail: string | null;
  createdAt: string;
};

const STATUS_FILTER_OPTIONS = [
  { label: "ทุกสถานะ", value: "all" },
  { label: "รอดำเนินการ", value: "PENDING" },
  { label: "อนุมัติแล้ว", value: "APPROVED" },
  { label: "ปฏิเสธแล้ว", value: "REJECTED" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function statusTone(s: string) {
  if (s === "APPROVED") return "success" as const;
  if (s === "REJECTED") return "default" as const;
  return "warning" as const;
}

function statusLabel(s: string) {
  if (s === "APPROVED") return "อนุมัติแล้ว";
  if (s === "REJECTED") return "ปฏิเสธแล้ว";
  return "รอดำเนินการ";
}

function memberTypeLabel(t: string | null) {
  if (t === "SALON") return "ซาลอน";
  return "ทั่วไป";
}

function formatAmount(v: string) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" }),
    time: d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
  };
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-36 shrink-0 text-xs text-dark-5">{label}</span>
      <span className="text-sm font-medium text-dark dark:text-white">{value}</span>
    </div>
  );
}

function WithdrawalDetailModal({
  item,
  onClose,
  onApprove,
  onReject,
  actionId,
}: {
  item: WithdrawalItem;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionId: string | null;
}) {
  const req = formatDateTime(item.createdAt);
  const proc = item.processedAt ? formatDateTime(item.processedAt) : null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-lg rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white">รายละเอียดคำขอถอน</h3>
            <p className="text-xs text-dark-5 font-mono mt-0.5">{item.id}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-dark-5 hover:bg-neutral-100 dark:hover:bg-dark-2"
          >✕</button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Customer info */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-5">ข้อมูลลูกค้า</p>
            <div className="rounded-2xl border border-stroke bg-[#f8fbf9] px-4 py-3 space-y-2 dark:border-dark-3 dark:bg-dark-2">
              <DetailRow label="ชื่อ" value={item.member.fullName} />
              {item.member.phone && <DetailRow label="เบอร์โทร" value={item.member.phone} />}
              {item.member.email && <DetailRow label="อีเมล" value={item.member.email} />}
              <DetailRow
                label="ประเภทสมาชิก"
                value={
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.member.memberType === "SALON"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}>
                    {memberTypeLabel(item.member.memberType)}
                  </span>
                }
              />
            </div>
          </div>

          {/* Withdrawal info */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-5">รายละเอียดการถอน</p>
            <div className="rounded-2xl border border-stroke bg-[#f8fbf9] px-4 py-3 space-y-2 dark:border-dark-3 dark:bg-dark-2">
              <DetailRow
                label="จำนวนเงิน"
                value={<span className="text-base font-bold text-[#45745a]">{formatAmount(item.amount)}</span>}
              />
              <DetailRow label="สถานะ" value={<StatusPill label={statusLabel(item.status)} tone={statusTone(item.status)} />} />
              <DetailRow label="วันที่ขอ" value={`${req.date} เวลา ${req.time} น.`} />
              {proc && (
                <DetailRow label="วันที่ดำเนินการ" value={`${proc.date} เวลา ${proc.time} น.`} />
              )}
              {item.processedByEmail && (
                <DetailRow label="ดำเนินการโดย" value={item.processedByEmail} />
              )}
              {item.note && (
                <DetailRow label="หมายเหตุ" value={<span className="text-[#c84b44]">{item.note}</span>} />
              )}
            </div>
          </div>

          {/* Bank info */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-5">บัญชีรับเงิน</p>
            <div className="rounded-2xl border border-stroke bg-[#f8fbf9] px-4 py-3 space-y-2 dark:border-dark-3 dark:bg-dark-2">
              {item.bankName ? (
                <>
                  <DetailRow label="ธนาคาร" value={item.bankName} />
                  <DetailRow label="เลขที่บัญชี" value={<span className="font-mono">{item.bankAccountNumber}</span>} />
                  <DetailRow label="ชื่อบัญชี" value={item.bankAccountName} />
                </>
              ) : (
                <p className="text-sm text-dark-5">ไม่มีข้อมูลบัญชี</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
          <button
            className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ปิด
          </button>
          {item.status === "PENDING" && (
            <>
              <button
                onClick={() => onReject(item.id)}
                disabled={actionId === item.id}
                className="rounded-full border border-[#f1d0cf] px-5 py-2.5 text-sm font-semibold text-[#b42318] hover:bg-[#fff5f4] disabled:opacity-70"
                type="button"
              >
                ปฏิเสธ
              </button>
              <button
                onClick={() => onApprove(item.id)}
                disabled={actionId === item.id}
                className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-70"
                type="button"
              >
                {actionId === item.id ? "กำลังดำเนินการ..." : "อนุมัติ"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function WithdrawalManager() {
  const { showToast } = useToast();
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<WithdrawalItem | null>(null);
  const [confirmApproveItem, setConfirmApproveItem] = useState<WithdrawalItem | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/withdrawals${params}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  async function handleApprove(id: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/withdrawals/${id}/approve`, { method: "PATCH" });
      if (!res.ok) throw new Error("ไม่สามารถอนุมัติได้");
      showToast("อนุมัติการถอน credit แล้ว", "success");
      setConfirmApproveItem(null);
      setSelectedItem(null);
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject() {
    if (!rejectTargetId) return;
    setActionId(rejectTargetId);
    try {
      const res = await fetch(`/api/withdrawals/${rejectTargetId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rejectNote || undefined }),
      });
      if (!res.ok) throw new Error("ไม่สามารถปฏิเสธได้");
      showToast("ปฏิเสธการถอน credit แล้ว (credit ถูกคืนให้สมาชิก)", "warning");
      setRejectTargetId(null);
      setRejectNote("");
      setSelectedItem(null);
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setActionId(null);
    }
  }

  const filteredItems = items.filter((i) => {
    const q = search.trim().toLowerCase();
    return !q ||
      i.member.fullName.toLowerCase().includes(q) ||
      (i.member.phone ?? "").toLowerCase().includes(q) ||
      (i.member.email ?? "").toLowerCase().includes(q);
  });
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);
  const hasSearch = search.trim() !== "";

  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const pendingTotal = items
    .filter((i) => i.status === "PENDING")
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      <ContentCard title="จัดการการถอนเครดิต" description="รายการขอถอนเครดิตจากสมาชิก">
        {/* Summary */}
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px] rounded-2xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
            <div className="text-xs text-dark-5">รอดำเนินการ</div>
            <div className="mt-1 text-lg font-bold text-[#45745a]">
              {formatAmount(String(pendingTotal))}
            </div>
            <div className="text-xs text-dark-5">{pendingCount} รายการ</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-60">
              <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ค้นหาชื่อ / เบอร์โทร / อีเมล..."
                value={search}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                    statusFilter === opt.value
                      ? "bg-[#45745a] text-white"
                      : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
                  }`}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              value={pageSize}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} รายการ</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">ลูกค้า</th>
                <th className="px-4 py-3 font-semibold">จำนวน</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">บัญชีรับเงิน</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ผู้ดำเนินการ</th>
                <th className="px-4 py-3 font-semibold">วันที่ขอ</th>
                <th className="px-4 py-3 font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><div className="h-4 w-24 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-3"><div className="h-6 w-20 animate-pulse rounded-full bg-dark-5/20" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><div className="h-4 w-28 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-3"><div className="h-7 w-16 animate-pulse rounded-full bg-dark-5/20" /></td>
                  </tr>
                ))
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">{hasSearch ? "ไม่พบรายการ" : "ไม่พบรายการถอน"}</p>
                      <p className="mt-1 text-sm text-dark-5">{hasSearch ? "ลองเปลี่ยนคำค้นหา" : "ยังไม่มีคำขอถอน credit ในสถานะนี้"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => {
                  const req = formatDateTime(item.createdAt);
                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-t border-stroke text-sm hover:bg-[#f8fbf9] dark:border-dark-3 dark:hover:bg-dark-2"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-dark dark:text-white">{item.member.fullName}</div>
                        <div className="text-xs text-dark-5">{item.member.phone ?? item.member.email}</div>
                        <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          item.member.memberType === "SALON"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {memberTypeLabel(item.member.memberType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#45745a]">
                        {formatAmount(item.amount)}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {item.bankName ? (
                          <div>
                            <div className="font-medium text-dark dark:text-white">{item.bankName}</div>
                            <div className="font-mono text-xs text-dark-5">{item.bankAccountNumber}</div>
                            <div className="text-xs text-dark-5">{item.bankAccountName}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-dark-5">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill label={statusLabel(item.status)} tone={statusTone(item.status)} />
                        {item.note && (
                          <div className="mt-0.5 max-w-[140px] truncate text-xs text-[#c84b44]">{item.note}</div>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {item.processedByEmail ? (
                          <div className="text-sm font-medium text-dark dark:text-white">{item.processedByEmail}</div>
                        ) : (
                          <span className="text-xs text-dark-5">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-dark-5">
                        <div>{req.date}</div>
                        <div className="text-xs">{req.time} น.</div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {item.status === "PENDING" && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setConfirmApproveItem(item)}
                              disabled={actionId === item.id}
                              className="rounded-full bg-[#45745a] px-3 py-1 text-xs font-semibold text-white hover:bg-[#355846] disabled:opacity-70"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => { setRejectTargetId(item.id); setRejectNote(""); }}
                              disabled={actionId === item.id}
                              className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4] disabled:opacity-70"
                            >
                              ปฏิเสธ
                            </button>
                          </div>
                        )}
                        {item.status !== "PENDING" && (
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="text-xs text-[#45745a] underline"
                          >
                            รายละเอียด
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-dark-5">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#d8e6dd] border-t-[#45745a]" />
                กำลังโหลด...
              </span>
            ) : (
              <>
                <span className="font-semibold text-dark dark:text-white">{totalItems}</span>
                {" รายการ"}
                {totalPages > 1 ? ` · หน้า ${page}/${totalPages}` : ""}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >← ก่อนหน้า</button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >ถัดไป →</button>
          </div>
        </div>
      </ContentCard>

      {/* Detail modal */}
      {selectedItem && (
        <WithdrawalDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onApprove={(id) => { const it = items.find((i) => i.id === id); if (it) setConfirmApproveItem(it); setSelectedItem(null); }}
          onReject={(id) => { setRejectTargetId(id); setRejectNote(""); setSelectedItem(null); }}
          actionId={actionId}
        />
      )}

      {/* Approve confirm modal */}
      {confirmApproveItem && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#b7ddc7] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-center justify-between gap-3 border-b border-[#d4eddd] px-6 py-5 dark:border-dark-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0faf4]">
                  <svg fill="none" height="18" stroke="#45745a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการอนุมัติ</h3>
                  <p className="text-xs text-dark-5">ตรวจสอบข้อมูลก่อนยืนยันการโอนเงิน</p>
                </div>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3" onClick={() => setConfirmApproveItem(null)} type="button">✕</button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl bg-[#f0faf4] border border-[#b7ddc7] px-5 py-4 text-center">
                <div className="text-xs text-[#2f7a4f] font-semibold uppercase tracking-wide">จำนวนที่ต้องโอน</div>
                <div className="mt-1 text-3xl font-bold text-[#45745a]">{formatAmount(confirmApproveItem.amount)}</div>
                <div className="mt-1 text-sm text-dark-5">ให้กับ {confirmApproveItem.member.fullName}</div>
              </div>
              <div className="rounded-2xl border border-stroke bg-neutral-50 px-4 py-3 space-y-2 dark:border-dark-3 dark:bg-dark-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-dark-5">บัญชีปลายทาง</div>
                {confirmApproveItem.bankName ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-dark-5">ธนาคาร</span>
                      <span className="text-sm font-semibold text-dark dark:text-white">{confirmApproveItem.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-dark-5">เลขที่บัญชี</span>
                      <span className="font-mono text-sm font-semibold text-dark dark:text-white">{confirmApproveItem.bankAccountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-dark-5">ชื่อบัญชี</span>
                      <span className="text-sm font-semibold text-dark dark:text-white">{confirmApproveItem.bankAccountName}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#c84b44]">ไม่มีข้อมูลบัญชีธนาคาร</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#d4eddd] px-6 py-4 dark:border-dark-3">
              <button
                className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                onClick={() => setConfirmApproveItem(null)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-70"
                disabled={actionId === confirmApproveItem.id}
                onClick={() => void handleApprove(confirmApproveItem.id)}
                type="button"
              >
                {actionId === confirmApproveItem.id ? "กำลังดำเนินการ..." : "ยืนยันอนุมัติ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectTargetId && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-center justify-between gap-3 border-b border-[#f3e8e7] px-6 py-5 dark:border-dark-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
                  <svg fill="none" height="18" stroke="#c84b44" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการปฏิเสธ</h3>
                  <p className="text-xs text-dark-5">credit จะถูกคืนให้สมาชิกโดยอัตโนมัติ</p>
                </div>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3" onClick={() => setRejectTargetId(null)} type="button">✕</button>
            </div>
            <div className="px-6 py-5">
              <label className="mb-1 block text-sm font-medium text-dark dark:text-white">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <input
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="เหตุผลที่ปฏิเสธ..."
                className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#f3e8e7] px-6 py-4 dark:border-dark-3">
              <button
                className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                onClick={() => setRejectTargetId(null)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="rounded-full bg-[#c84b44] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ad3d37] disabled:opacity-70"
                disabled={actionId === rejectTargetId}
                onClick={() => void handleReject()}
                type="button"
              >
                {actionId === rejectTargetId ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
