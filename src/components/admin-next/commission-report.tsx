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

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: "รายวัน (30 วัน)", value: "day" },
  { label: "รายสัปดาห์ (13 สัปดาห์)", value: "week" },
  { label: "รายเดือน (12 เดือน)", value: "month" },
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
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/commissions/report?period=${period}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  const grandTotal = rows.reduce((s, r) => s + r.totalAmount, 0);
  const grandCount = rows.reduce((s, r) => s + r.count, 0);

  return (
    <ContentCard
      title="รายงาน Commission"
      description="ยอด commission แยกตามช่วงเวลาและผู้รับ"
    >
      {/* Period selector */}
      <div className="mb-5 flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              period === opt.value
                ? "bg-[#45745a] text-white"
                : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
            }`}
            type="button"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {!isLoading && rows.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px] rounded-2xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
            <div className="text-xs text-dark-5">ยอดรวม</div>
            <div className="mt-1 text-lg font-bold text-[#45745a]">{formatAmount(grandTotal)}</div>
            <div className="text-xs text-dark-5">{grandCount} รายการ</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
        <table className="w-full min-w-[360px] text-left">
          <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
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
              <tr>
                <td className="px-4 py-6 text-center text-sm text-dark-5" colSpan={6}>กำลังโหลด...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-dark-5" colSpan={6}>ไม่มีข้อมูล commission ในช่วงนี้</td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-t border-stroke text-sm dark:border-dark-3">
                  <td className="px-4 py-3 text-dark dark:text-white font-medium">
                    {formatBucket(row.bucket, period)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-dark dark:text-white">{row.earnerName}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="font-mono text-xs text-[#45745a]">{row.referralCode ?? "-"}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.memberType === "SALON"
                        ? "bg-[#fef3c7] text-[#92400e]"
                        : "bg-[#e0f2fe] text-[#0369a1]"
                    }`}>
                      {row.memberType === "SALON" ? "Salon" : "Regular"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-dark-5">{row.count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#45745a]">{formatAmount(row.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ContentCard>
  );
}
