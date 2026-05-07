"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard, StatusPill } from "./page-elements";

type WithdrawalItem = {
  id: string;
  memberId: string;
  member: { id: string; fullName: string; phone: string | null; email: string | null };
  amount: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  processedAt: string | null;
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

function formatAmount(v: string) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

export function WithdrawalManager() {
  const { showToast } = useToast();
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
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
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-medium">สมาชิก</th>
                <th className="px-4 py-3 font-medium">จำนวน</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">บัญชีรับเงิน</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
                <th className="px-4 py-3 font-medium">วันที่ขอ</th>
                <th className="px-4 py-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-dark-5" colSpan={6}>
                    ไม่พบรายการ
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-stroke text-sm dark:border-dark-3">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-dark dark:text-white">{item.member.fullName}</div>
                      <div className="text-xs text-dark-5">{item.member.phone ?? item.member.email}</div>
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
                        <div className="mt-1 text-xs text-dark-5">{item.note}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark-5">
                      <div>{new Date(item.createdAt).toLocaleDateString("th-TH")}</div>
                      <div className="text-xs">
                        {new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      {item.status !== "PENDING" && item.processedAt && (
                        <div className="mt-1 text-xs text-dark-5">
                          ดำเนินการ: {new Date(item.processedAt).toLocaleDateString("th-TH")}{" "}
                          {new Date(item.processedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "PENDING" && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => void handleApprove(item.id)}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

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
