"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "./page-elements";

type CommissionRow = {
  bucket: string;
  earnerId: string;
  earnerName: string;
  memberType: string;
  referralCode: string | null;
  count: number;
  totalAmount: number;
};

type OrderItem = {
  id: string;
  status: string;
  totalAmount: number | string;
};

const PRESETS = [
  { label: "วันนี้", days: 0 },
  { label: "7 วันล่าสุด", days: 7 },
  { label: "30 วันล่าสุด", days: 30 },
];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function thb(n: number) {
  return `฿${n.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`;
}

function getPeriod(from: string, to: string): "day" | "week" | "month" {
  const days = (new Date(to).getTime() - new Date(from).getTime()) / 86400000;
  if (days <= 1) return "day";
  if (days <= 60) return "week";
  return "month";
}

function formatBucket(bucket: string): string {
  // bucket is "YYYY-MM-DD" or "YYYY-MM"
  const parts = bucket.split("-");
  if (parts.length === 2) {
    // month bucket
    return new Date(`${bucket}-01`).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  }
  return new Date(bucket).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function StatBox({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="rounded-[22px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <p className="text-xs font-semibold uppercase tracking-widest text-dark-5 dark:text-dark-6">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-dark dark:text-white">
        {loading
          ? <span className="inline-block h-8 w-32 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
          : value}
      </p>
      <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">{sub}</p>
    </div>
  );
}

export function ReportManager() {
  const today = toDateStr(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [preset, setPreset] = useState(0);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  function applyPreset(idx: number) {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - PRESETS[idx].days);
    setFrom(toDateStr(f));
    setTo(toDateStr(t));
    setPreset(idx);
  }

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const period = getPeriod(from, to);
        const [commRes, ordRes] = await Promise.all([
          fetch(`/api/commissions/report?period=${period}&from=${from}&to=${to}`),
          fetch("/api/orders"),
        ]);
        const commData = (await commRes.json()) as CommissionRow[];
        const ordData = (await ordRes.json()) as OrderItem[];
        setCommissions(Array.isArray(commData) ? commData : []);
        setOrders(Array.isArray(ordData) ? ordData : []);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [from, to]);

  const commTotal = commissions.reduce((s, r) => s + Number(r.totalAmount), 0);
  const commCount = commissions.reduce((s, r) => s + r.count, 0);
  const orderRevenue = orders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const orderPending = orders.filter((o) => o.status === "PENDING" || o.status === "PAID").length;

  const filtered = commissions.filter(
    (r) => !search.trim() || r.earnerName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                preset === i
                  ? "bg-[#45745a] text-white"
                  : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
              }`}
              onClick={() => applyPreset(i)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            max={to}
            onChange={(e) => { setFrom(e.target.value); setPreset(-1); }}
            type="date"
            value={from}
          />
          <span className="text-sm text-dark-5">—</span>
          <input
            className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            min={from}
            max={today}
            onChange={(e) => { setTo(e.target.value); setPreset(-1); }}
            type="date"
            value={to}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox
          label="ค่าคอมมิชชัน"
          value={thb(commTotal)}
          sub={`${commCount} รายการในช่วงที่เลือก`}
          loading={isLoading}
        />
        <StatBox
          label="รายได้รวม (ทั้งหมด)"
          value={thb(orderRevenue)}
          sub={`${orders.length} คำสั่งซื้อ`}
          loading={isLoading}
        />
        <StatBox
          label="รอดำเนินการ"
          value={String(orderPending)}
          sub="คำสั่งซื้อ PENDING / PAID"
          loading={isLoading}
        />
      </div>

      {/* Commission table */}
      <ContentCard
        title="ผู้รับค่าคอมมิชชันสูงสุด"
        description={`ช่วง ${from} ถึง ${to}`}
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-60">
            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ..."
              value={search}
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">วันที่</th>
                <th className="px-4 py-3 font-semibold">ชื่อ</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ประเภท</th>
                <th className="px-4 py-3 font-semibold text-right">รายการ</th>
                <th className="px-4 py-3 font-semibold text-right">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><div className="h-5 w-16 animate-pulse rounded-full bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-8 animate-pulse rounded bg-neutral-100 dark:bg-dark-2 ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-neutral-100 dark:bg-dark-2 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                        </svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">{search.trim() ? "ไม่พบรายการ" : "ไม่มีข้อมูลในช่วงที่เลือก"}</p>
                      <p className="mt-1 text-sm text-dark-5">{search.trim() ? "ลองเปลี่ยนคำค้นหา" : "ลองเปลี่ยนช่วงวันที่"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={`${r.bucket}-${r.earnerId}`} className="border-t border-stroke text-sm dark:border-dark-3">
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{formatBucket(r.bucket)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#eef8f1] text-xs font-bold text-[#45745a]">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-dark dark:text-white">{r.earnerName}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {r.memberType === "SALON" ? (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">ซาลอน</span>
                      ) : (
                        <span className="rounded-full bg-[#f0f4f2] px-2 py-0.5 text-xs font-semibold text-dark-5">ทั่วไป</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right text-dark-5">{r.count}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#2f7a4f]">{thb(Number(r.totalAmount))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
