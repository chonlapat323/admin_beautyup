"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ContentCard } from "./page-elements";

type ReportRow = {
  bucket: string;
  earnerId: string;
  earnerName: string;
  memberType: string;
  referralCode: string | null;
  count: number;
  totalAmount: number;
};

type CommissionDetail = {
  id: string;
  amount: number;
  rate: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  note: string | null;
  createdAt: string;
  order: { orderNumber: string; totalAmount: number };
};

type Period = "day" | "week" | "month";
type Preset = "today" | "week" | "month" | "custom";

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: Preset) {
  const now = new Date();
  const to = toDateString(now);
  if (preset === "today") return { from: to, to };
  if (preset === "week") {
    const d = new Date(now); d.setDate(d.getDate() - 6);
    return { from: toDateString(d), to };
  }
  if (preset === "month") {
    return { from: toDateString(new Date(now.getFullYear(), now.getMonth(), 1)), to };
  }
  return { from: "", to: "" };
}

function autoPeriod(from: string, to: string): Period {
  if (!from || !to) return "day";
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / 86400000;
  return diff > 31 ? "month" : "day";
}

const PRESET_OPTIONS: { key: Preset; label: string }[] = [
  { key: "today", label: "วันนี้" },
  { key: "week", label: "7 วันล่าสุด" },
  { key: "month", label: "เดือนนี้" },
  { key: "custom", label: "กำหนดเอง" },
];

function formatBucket(bucket: string, period: Period) {
  if (period === "day") {
    return new Date(bucket).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
  }
  if (period === "week") {
    return `สัปดาห์ ${new Date(bucket).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })}`;
  }
  const [year, month] = bucket.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

function formatAmount(v: number) {
  return `฿${v.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function CommissionReport() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [period, setPeriod] = useState<Period>("day");
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(() => getPresetRange("month").from);
  const [to, setTo] = useState(() => getPresetRange("month").to);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<ReportRow | null>(null);
  const [details, setDetails] = useState<CommissionDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const load = useCallback(async (f: string, t: string, p: Period) => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ period: p });
      if (f) qs.set("from", f);
      if (t) qs.set("to", t);
      const res = await fetch(`/api/commissions/report?${qs}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(from, to, period); }, []);

  function handlePreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const range = getPresetRange(p);
      const auto = autoPeriod(range.from, range.to);
      setFrom(range.from);
      setTo(range.to);
      setPeriod(auto);
      void load(range.from, range.to, auto);
    }
  }

  function handleSearch() {
    setPreset("custom");
    const auto = autoPeriod(from, to);
    setPeriod(auto);
    void load(from, to, auto);
  }

  const grandTotal = rows.reduce((s, r) => s + r.totalAmount, 0);
  const grandCount = rows.reduce((s, r) => s + r.count, 0);

  const filteredRows = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    return !q || r.earnerName.toLowerCase().includes(q) || (r.referralCode ?? "").toLowerCase().includes(q);
  });
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  async function openDetail(row: ReportRow) {
    setSelectedRow(row);
    setDetailLoading(true);
    setDetails([]);
    const qs = new URLSearchParams({ earnerId: row.earnerId, pageSize: "100" });
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const res = await fetch(`/api/commissions?${qs}`);
    const data = await res.json();
    setDetails(data.items ?? []);
    setDetailLoading(false);
  }

  const btnBase = "rounded-full px-3.5 py-2 text-xs font-semibold transition-colors border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]";
  const btnActive = "bg-[#45745a] text-white border-[#45745a] hover:bg-[#355846]";

  return (
    <ContentCard title="รายงานคอมมิชชัน" description="ยอดคอมมิชชันแยกตามช่วงเวลาและผู้รับ">

      {/* Date filter */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {PRESET_OPTIONS.map((opt) => (
          <button key={opt.key} type="button" onClick={() => handlePreset(opt.key)}
            className={`${btnBase} ${preset === opt.key ? btnActive : ""}`}>
            {opt.label}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <input type="date" value={from}
            onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }}
            className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
          <span className="text-sm text-dark-5">—</span>
          <input type="date" value={to}
            onChange={(e) => { setTo(e.target.value); setPreset("custom"); }}
            className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
          <button type="button" onClick={handleSearch}
            className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#355846]">
            ค้นหา
          </button>
        </div>
      </div>

      {/* Search + page size */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-60">
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหาชื่อ / รหัสแนะนำ..."
            value={search}
          />
        </div>
        <select
          className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          value={pageSize}
        >
          {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n} รายการ</option>)}
        </select>
      </div>

      {/* Summary */}
      {!isLoading && rows.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-5 py-3 dark:border-dark-3 dark:bg-dark-2">
            <p className="text-xs text-dark-5 dark:text-dark-6">ยอดรวม</p>
            <p className="text-xl font-bold text-[#5f8f74]">{formatAmount(grandTotal)}</p>
            <p className="text-xs text-dark-5">{grandCount} รายการ</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="bg-[#f8fbf9] text-dark-5 dark:bg-dark-2 dark:text-dark-6">
            <tr>
              <th className="px-4 py-3 font-semibold">ช่วงเวลา</th>
              <th className="px-4 py-3 font-semibold">ผู้รับ</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">รหัสแนะนำ</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell">ประเภท</th>
              <th className="px-4 py-3 font-semibold text-right">จำนวน</th>
              <th className="px-4 py-3 font-semibold text-right">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-stroke dark:border-dark-3">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pagedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                      <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>
                    </div>
                    <p className="font-semibold text-dark dark:text-white">{search.trim() ? "ไม่พบรายการ" : "ไม่มีข้อมูลในช่วงที่เลือก"}</p>
                    <p className="mt-1 text-sm text-dark-5">{search.trim() ? "ลองเปลี่ยนคำค้นหา" : "ลองเปลี่ยนช่วงวันที่"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedRows.map((row, i) => (
                <tr key={i} onClick={() => openDetail(row)} className="border-t border-stroke text-sm dark:border-dark-3 cursor-pointer hover:bg-[#f8fbf9] dark:hover:bg-dark-2">
                  <td className="px-4 py-3 font-medium text-dark dark:text-white">{formatBucket(row.bucket, period)}</td>
                  <td className="px-4 py-3 font-semibold text-dark dark:text-white">{row.earnerName}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="font-mono text-xs text-[#5f8f74]">{row.referralCode ?? "-"}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.memberType === "SALON" ? "bg-[#fef3c7] text-[#92400e]" : "bg-[#e0f2fe] text-[#0369a1]"
                    }`}>
                      {row.memberType === "SALON" ? "ร้านซาลอน" : "ลูกค้าทั่วไป"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-dark-5">{row.count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#5f8f74]">{formatAmount(row.totalAmount)}</td>
                </tr>
              ))
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
          <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">{page} / {totalPages}</span>
          <button
            className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => p + 1)}
            type="button"
          >ถัดไป →</button>
        </div>
      </div>
      {selectedRow && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedRow(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl dark:bg-dark-2 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
              <div>
                <h3 className="font-semibold text-dark dark:text-white">{selectedRow.earnerName}</h3>
                <p className="text-sm text-dark-5">{formatBucket(selectedRow.bucket, period)} · {selectedRow.count} รายการ · {formatAmount(selectedRow.totalAmount)}</p>
              </div>
              <button onClick={() => setSelectedRow(null)} className="rounded-lg p-1 text-dark-5 hover:bg-dark-5/10">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {detailLoading ? (
                <div className="flex justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d8e6dd] border-t-[#45745a]" />
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2">
                    <tr>
                      <th className="px-4 py-3 font-semibold">เลขออเดอร์</th>
                      <th className="px-4 py-3 font-semibold text-right">ยอด Order</th>
                      <th className="px-4 py-3 font-semibold text-right">อัตรา</th>
                      <th className="px-4 py-3 font-semibold text-right">คอมมิชชัน</th>
                      <th className="px-4 py-3 font-semibold">สถานะ</th>
                      <th className="px-4 py-3 font-semibold">วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-dark-5">ไม่พบข้อมูล</td></tr>
                    ) : details.map((d) => (
                      <tr key={d.id} className="border-t border-stroke dark:border-dark-3">
                        <td className="px-4 py-3 font-mono text-xs text-dark dark:text-white">{d.order.orderNumber}</td>
                        <td className="px-4 py-3 text-right text-dark-5">{formatAmount(d.order.totalAmount)}</td>
                        <td className="px-4 py-3 text-right text-dark-5">{d.rate}%</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#5f8f74]">{formatAmount(d.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            d.status === "PAID" ? "bg-green-100 text-green-700" :
                            d.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {d.status === "PAID" ? "จ่ายแล้ว" : d.status === "CANCELLED" ? "ยกเลิก" : "รอจ่าย"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-dark-5 text-xs">
                          {new Date(d.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </ContentCard>
  );
}
