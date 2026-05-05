"use client";

import { useCallback, useEffect, useState } from "react";
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

export function CommissionReport() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [period, setPeriod] = useState<Period>("day");
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(() => getPresetRange("month").from);
  const [to, setTo] = useState(() => getPresetRange("month").to);
  const [isLoading, setIsLoading] = useState(false);

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

  const btnBase = "rounded-full px-4 py-2 text-sm font-medium transition-colors border border-[#d8e6dd] text-dark hover:bg-[#f0f7f2] dark:border-dark-3 dark:text-white";
  const btnActive = "bg-[#5f8f74] text-white border-[#5f8f74] hover:bg-[#4e7a61]";

  return (
    <ContentCard title="รายงาน Commission" description="ยอด commission แยกตามช่วงเวลาและผู้รับ">

      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {PRESET_OPTIONS.map((opt) => (
            <button key={opt.key} type="button" onClick={() => handlePreset(opt.key)}
              className={`${btnBase} ${preset === opt.key ? btnActive : ""}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from}
            onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }}
            className="rounded-[10px] border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
          <span className="text-sm text-dark-5">ถึง</span>
          <input type="date" value={to}
            onChange={(e) => { setTo(e.target.value); setPreset("custom"); }}
            className="rounded-[10px] border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
          <button type="button" onClick={handleSearch}
            className="rounded-full bg-[#5f8f74] px-4 py-2 text-sm font-medium text-white hover:bg-[#4e7a61]">
            ค้นหา
          </button>
        </div>
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
              <th className="px-4 py-3 font-medium">ช่วงเวลา</th>
              <th className="px-4 py-3 font-medium">ผู้รับ</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">รหัสแนะนำ</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">ประเภท</th>
              <th className="px-4 py-3 font-medium text-right">จำนวน</th>
              <th className="px-4 py-3 font-medium text-right">ยอดรวม</th>
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
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-dark-5" colSpan={6}>ไม่มีข้อมูลในช่วงที่เลือก</td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-t border-stroke text-sm dark:border-dark-3">
                  <td className="px-4 py-3 font-medium text-dark dark:text-white">{formatBucket(row.bucket, period)}</td>
                  <td className="px-4 py-3 font-semibold text-dark dark:text-white">{row.earnerName}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="font-mono text-xs text-[#5f8f74]">{row.referralCode ?? "-"}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.memberType === "SALON" ? "bg-[#fef3c7] text-[#92400e]" : "bg-[#e0f2fe] text-[#0369a1]"
                    }`}>
                      {row.memberType === "SALON" ? "Salon" : "Regular"}
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
    </ContentCard>
  );
}
