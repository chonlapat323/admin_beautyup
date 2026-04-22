"use client";

import { useCallback, useEffect, useState } from "react";
import { ContentCard } from "./content-card";
import { SelectField } from "./select-field";
import { StatusPill } from "./status-pill";

type CommissionItem = {
  id: string;
  earner: { id: string; fullName: string; memberType: "REGULAR" | "SALON" };
  order: { orderNumber: string; totalAmount: string };
  orderAmount: string;
  rate: string;
  amount: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  paidAt: string | null;
  createdAt: string;
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
  if (s === "CANCELLED") return "error" as const;
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

export function CommissionManager() {
  const [items, setItems] = useState<CommissionItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState("20");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

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
    await fetch("/api/commissions/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected] }),
    });
    setSelected(new Set());
    showToast(`จ่าย commission ${selected.size} รายการสำเร็จ`);
    void load();
  }

  async function handleCancel(id: string) {
    if (!confirm("ยืนยันยกเลิก commission นี้?")) return;
    await fetch(`/api/commissions/${id}/cancel`, { method: "PATCH" });
    showToast("ยกเลิก commission แล้ว");
    void load();
  }

  const pendingItems = items.filter((i) => i.status === "PENDING");
  const pendingTotal = pendingItems.reduce((s, i) => s + Number(i.amount), 0);
  const selectedPending = items.filter((i) => selected.has(i.id));
  const selectedTotal = selectedPending.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#45745a] px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <ContentCard
        title="จัดการ Commission"
        description="ค่าแนะนำจากการสั่งซื้อ — SALON 10%, REGULAR 5% (1 ระดับ)"
      >
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
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
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
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-dark-5" colSpan={8}>
                    กำลังโหลด...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-dark-5" colSpan={8}>
                    ไม่พบข้อมูล commission
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
                    <td className="px-4 py-3 font-mono text-xs">{item.order.orderNumber}</td>
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
                          onClick={() => void handleCancel(item.id)}
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
            {isLoading ? "กำลังโหลด..." : `แสดง ${items.length} จากทั้งหมด ${meta.totalItems} รายการ`}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            <span className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white">
              หน้า {page} / {meta.totalPages}
            </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </ContentCard>
    </>
  );
}
