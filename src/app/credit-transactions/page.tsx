"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContentCard } from "@/components/admin-next/page-elements";

type Member = { id: string; fullName: string; email: string };

type CreditTx = {
  id: string;
  memberId: string;
  member: Member;
  type: "EARN" | "USE" | "WITHDRAW";
  amount: string;
  note?: string | null;
  refId?: string | null;
  createdAt: string;
};

type Meta = { page: number; limit: number; total: number; totalPages: number };

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  EARN:     { label: "ได้รับ",  className: "bg-[#eef8f1] text-[#2d6a4f]" },
  USE:      { label: "ใช้จ่าย", className: "bg-[#fff8ec] text-[#b45309]" },
  WITHDRAW: { label: "ถอน",    className: "bg-[#fef2f2] text-[#b91c1c]" },
};

const TYPE_FILTERS = [
  { label: "ทั้งหมด", value: "" },
  { label: "ได้รับ", value: "EARN" },
  { label: "ใช้จ่าย", value: "USE" },
  { label: "ถอน", value: "WITHDRAW" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatAmount(amount: string, type: string) {
  const n = parseFloat(amount);
  const sign = type === "EARN" ? "+" : "-";
  const color = type === "EARN" ? "text-[#2d6a4f]" : "text-red-500";
  return (
    <span className={`font-semibold ${color}`}>
      {sign}฿{n.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
    </span>
  );
}

export default function CreditTransactionsPage() {
  const [items, setItems] = useState<CreditTx[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((p: number, params: { search: string; type: string; dateFrom: string; dateTo: string }) => {
    setIsLoading(true);
    const qs = new URLSearchParams({ page: String(p), limit: "50" });
    if (params.search) qs.set("memberId", params.search);
    if (params.type) qs.set("type", params.type);
    if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params.dateTo) qs.set("dateTo", params.dateTo);

    fetch(`/api/credit-transactions?${qs.toString()}`)
      .then((r) => r.json())
      .then((data: { items: CreditTx[]; meta: Meta }) => {
        setItems(data.items ?? []);
        if (data.meta) setMeta(data.meta);
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load(page, { search, type, dateFrom, dateTo });
  }, [page, type, dateFrom, dateTo, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(1, { search: value, type, dateFrom, dateTo });
    }, 400);
  };

  const handleType = (value: string) => { setType(value); setPage(1); };
  const handleDateFrom = (value: string) => { setDateFrom(value); setPage(1); };
  const handleDateTo = (value: string) => { setDateTo(value); setPage(1); };

  const handleReset = () => {
    setSearch(""); setType(""); setDateFrom(""); setDateTo(""); setPage(1);
    load(1, { search: "", type: "", dateFrom: "", dateTo: "" });
  };

  const hasFilter = search || type || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <ContentCard title="Transaction Log" description="ประวัติการเคลื่อนไหวเครดิตของสมาชิกทุกคน">
        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ค้นหา Member ID..."
            className="h-10 w-56 rounded-xl border border-stroke bg-white px-4 text-sm text-dark placeholder:text-dark-5 focus:border-[#4caf82] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />

          <div className="flex items-center gap-2">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.value}
                onClick={() => handleType(t.value)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  type === t.value
                    ? "border-[#4caf82] bg-[#4caf82] text-white"
                    : "border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="h-10 rounded-xl border border-stroke bg-white px-3 text-sm text-dark focus:border-[#4caf82] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <span className="text-sm text-dark-5">ถึง</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateTo(e.target.value)}
              className="h-10 rounded-xl border border-stroke bg-white px-3 text-sm text-dark focus:border-[#4caf82] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>

          {hasFilter && (
            <button
              onClick={handleReset}
              className="h-10 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              ล้าง filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">สมาชิก</th>
                <th className="px-4 py-3 font-semibold">ประเภท</th>
                <th className="px-4 py-3 font-semibold">จำนวน</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">หมายเหตุ</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">อ้างอิง</th>
                <th className="px-4 py-3 font-semibold">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
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
                  <td className="px-4 py-16 text-center text-sm text-dark-5" colSpan={6}>
                    ไม่พบรายการ
                  </td>
                </tr>
              ) : (
                items.map((tx) => {
                  const typeInfo = TYPE_LABELS[tx.type] ?? { label: tx.type, className: "" };
                  return (
                    <tr key={tx.id} className="border-t border-stroke text-sm dark:border-dark-3">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-dark dark:text-white">{tx.member.fullName}</p>
                        <p className="text-xs text-dark-5">{tx.member.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeInfo.className}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatAmount(tx.amount, tx.type)}</td>
                      <td className="hidden px-4 py-3 text-dark-5 dark:text-dark-6 md:table-cell">
                        {tx.note ?? "-"}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-dark-5 dark:text-dark-6 md:table-cell">
                        {tx.refId ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{formatDate(tx.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-dark-5">
            แสดง{" "}
            <span className="font-bold text-dark dark:text-white">
              {Math.min((page - 1) * 50 + items.length, meta.total)}
            </span>{" "}
            จาก{" "}
            <span className="font-bold text-dark dark:text-white">{meta.total}</span>{" "}
            รายการ
          </p>
          {meta.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:opacity-40"
              >
                ← ก่อนหน้า
              </button>
              <span className="text-sm font-medium text-dark dark:text-white">
                {page} / {meta.totalPages}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:opacity-40"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </div>
      </ContentCard>
    </div>
  );
}
