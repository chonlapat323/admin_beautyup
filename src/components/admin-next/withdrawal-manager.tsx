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
  if (t === "SALON") return "Salon";
  return "Regular";
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
          >
            ✕
          </button>
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
                className="rounded-full border border-[#f1d0cf] px-5 py-2.5 text-sm font-semibold text-[#b42318] hover:bg-[#fff5f4] disabled:opacity-50"
                type="button"
              >
                ปฏิเสธ
              </button>
              <button
                onClick={() => onApprove(item.id)}
                disabled={actionId === item.id}
                className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-50"
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

  const pendingCount = items.filter((i) => i.status === "PENDING").length;
  const pendingTotal = items
    .filter((i) => i.status === "PENDING")
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      <ContentCard title="จัดการการถอน Credit" description="รายการขอถอน credit จากสมาชิก">
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
        <div className="mb-5 flex flex-wrap gap-2">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
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

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-medium">ลูกค้า</th>
                <th className="px-4 py-3 font-medium">จำนวน</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">บัญชีรับเงิน</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">ผู้ดำเนินการ</th>
                <th className="px-4 py-3 font-medium">วันที่ขอ</th>
                <th className="px-4 py-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-dark-5" colSpan={7}>
                    ไม่พบรายการ
                  </td>
                </tr>
              ) : (
                items.map((item) => {
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
                              className="rounded-full bg-[#45745a] px-3 py-1 text-xs font-semibold text-white hover:bg-[#355846] disabled:opacity-50"
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => { setRejectTargetId(item.id); setRejectNote(""); }}
                              disabled={actionId === item.id}
                              className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4] disabled:opacity-50"
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
          <div className="w-full max-w-md rounded-[28px] border border-[#b7ddc7] bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <h3 className="text-xl font-bold text-dark dark:text-white">ยืนยันการอนุมัติ</h3>
            <p className="mt-1 text-sm text-dark-5">ตรวจสอบข้อมูลก่อนยืนยันการโอนเงิน</p>

            {/* Amount */}
            <div className="mt-4 rounded-2xl bg-[#f0faf4] border border-[#b7ddc7] px-5 py-4 text-center">
              <div className="text-xs text-[#2f7a4f] font-semibold uppercase tracking-wide">จำนวนที่ต้องโอน</div>
              <div className="mt-1 text-3xl font-bold text-[#45745a]">{formatAmount(confirmApproveItem.amount)}</div>
              <div className="mt-1 text-sm text-dark-5">ให้กับ {confirmApproveItem.member.fullName}</div>
            </div>

            {/* Bank details */}
            <div className="mt-4 rounded-2xl border border-stroke bg-neutral-50 px-4 py-3 space-y-2 dark:border-dark-3 dark:bg-dark-2">
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

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                className="rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                onClick={() => setConfirmApproveItem(null)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-70"
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
          <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <h3 className="text-xl font-bold text-dark dark:text-white">ยืนยันการปฏิเสธ</h3>
            <p className="mt-2 text-sm text-dark-5">
              credit จะถูกคืนให้สมาชิกโดยอัตโนมัติ
            </p>
            <div className="mt-4">
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
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                className="rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                onClick={() => setRejectTargetId(null)}
                type="button"
              >
                ยกเลิก
              </button>
              <button
                className="rounded-full bg-[#c84b44] px-5 py-3 text-sm font-semibold text-white hover:bg-[#ad3d37] disabled:opacity-70"
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
