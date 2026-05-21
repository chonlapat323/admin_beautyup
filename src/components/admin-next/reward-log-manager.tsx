"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "./page-elements";
import { RedemptionDetailModal } from "./RedemptionDetailModal";

type RedemptionStatus = "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED";

type Redemption = {
  id: string;
  pointsSpent: number;
  status: RedemptionStatus;
  trackingNumber: string | null;
  createdAt: string;
  member: { id: string; fullName: string; email: string | null; phone: string | null };
  rewardProduct: { id: string; name: string };
};

const STATUS_LABELS: Record<RedemptionStatus, { label: string; className: string }> = {
  PENDING:   { label: "รอดำเนินการ",    className: "bg-gray-100 text-gray-600" },
  PREPARING: { label: "กำลังเตรียม",    className: "bg-amber-100 text-amber-700" },
  SHIPPED:   { label: "จัดส่งแล้ว",     className: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "ส่งถึงแล้ว",     className: "bg-green-100 text-green-700" },
};

type Preset = "today" | "week" | "month" | "custom";

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const to = toDateString(now);
  if (preset === "today") return { from: to, to };
  if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: toDateString(d), to };
  }
  if (preset === "month") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toDateString(d), to };
  }
  return { from: "", to: "" };
}

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function RewardLogManager() {
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState(() => getPresetRange("month").from);
  const [to, setTo] = useState(() => getPresetRange("month").to);
  const [rows, setRows] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RedemptionStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedRedemptionId, setSelectedRedemptionId] = useState<string | null>(null);

  async function load(f: string, t: string) {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (f) qs.set("from", f);
      if (t) qs.set("to", t);
      const res = await fetch(`/api/reward-products/redemptions?${qs}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(from, to);
  }, []);

  function handlePreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const range = getPresetRange(p);
      setFrom(range.from);
      setTo(range.to);
      load(range.from, range.to);
    }
  }

  function handleSearch() {
    setPreset("custom");
    load(from, to);
  }

  const totalPoints = rows.reduce((s, r) => s + r.pointsSpent, 0);

  const filteredRows = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      r.member.fullName.toLowerCase().includes(q) ||
      (r.member.email ?? "").toLowerCase().includes(q) ||
      r.rewardProduct.name.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const presetBtns: { key: Preset; label: string }[] = [
    { key: "today", label: "วันนี้" },
    { key: "week", label: "7 วันล่าสุด" },
    { key: "month", label: "เดือนนี้" },
    { key: "custom", label: "กำหนดเอง" },
  ];

  return (
    <>
    <RedemptionDetailModal
      redemptionId={selectedRedemptionId}
      onClose={() => setSelectedRedemptionId(null)}
      onUpdated={() => { setSelectedRedemptionId(null); load(from, to); }}
    />
    <ContentCard
      title="Log การแลกแต้ม"
      description="บันทึกการแลกสินค้าด้วยแต้มสะสมของสมาชิก"
    >
      {/* Date filter */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {presetBtns.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handlePreset(btn.key)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              preset === btn.key
                ? "bg-[#45745a] text-white"
                : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
            }`}
          >
            {btn.label}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <input
            type="date" value={from}
            onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }}
            className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <span className="text-sm text-dark-5">—</span>
          <input
            type="date" value={to}
            onChange={(e) => { setTo(e.target.value); setPreset("custom"); }}
            className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          />
          <button
            onClick={handleSearch}
            className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
          >
            ค้นหา
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {([
          { value: "ALL",       label: "ทั้งหมด" },
          { value: "PENDING",   label: "รอดำเนินการ" },
          { value: "PREPARING", label: "กำลังเตรียม" },
          { value: "SHIPPED",   label: "จัดส่งแล้ว" },
          { value: "DELIVERED", label: "ส่งถึงแล้ว" },
        ] as { value: RedemptionStatus | "ALL"; label: string }[]).map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              statusFilter === opt.value
                ? "bg-[#45745a] text-white"
                : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
            }`}
          >
            {opt.label}
          </button>
        ))}
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
            placeholder="ค้นหาชื่อสมาชิก / สินค้า..."
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
      <div className="mb-4 flex gap-4">
        <div className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-5 py-3 dark:border-dark-3 dark:bg-dark-2">
          <p className="text-xs text-dark-5 dark:text-dark-6">รายการทั้งหมด</p>
          <p className="text-xl font-bold text-dark dark:text-white">{rows.length.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-5 py-3 dark:border-dark-3 dark:bg-dark-2">
          <p className="text-xs text-dark-5 dark:text-dark-6">แต้มที่ใช้ไปทั้งหมด</p>
          <p className="text-xl font-bold text-[#45745a]">{totalPoints.toLocaleString()} pts</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">วันที่</th>
              <th className="px-4 py-3 text-left font-semibold">สมาชิก</th>
              <th className="px-4 py-3 text-left font-semibold">สินค้าที่แลก</th>
              <th className="px-4 py-3 text-center font-semibold">แต้มที่ใช้</th>
              <th className="px-4 py-3 text-center font-semibold">สถานะ</th>
              <th className="px-4 py-3 text-left font-semibold">Tracking</th>
              <th className="px-4 py-3 text-center font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-dark-5/20" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-36 animate-pulse rounded bg-dark-5/20" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-28 animate-pulse rounded bg-dark-5/20" /></td>
                  <td className="px-4 py-3"><div className="mx-auto h-4 w-16 animate-pulse rounded bg-dark-5/20" /></td>
                </tr>
              ))
            ) : pagedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                      <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg>
                    </div>
                    <p className="font-semibold text-dark dark:text-white">{search.trim() ? "ไม่พบรายการ" : "ไม่มีข้อมูลในช่วงที่เลือก"}</p>
                    <p className="mt-1 text-sm text-dark-5">{search.trim() ? "ลองเปลี่ยนคำค้นหา" : "ลองเปลี่ยนช่วงวันที่เพื่อดูข้อมูล"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row.id} className="border-t border-stroke dark:border-dark-3">
                  <td className="px-4 py-3 whitespace-nowrap text-dark-5 dark:text-dark-6">
                    {new Date(row.createdAt).toLocaleDateString("th-TH", {
                      day: "2-digit", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-dark dark:text-white">{row.member.fullName}</p>
                    <p className="text-xs text-dark-5 dark:text-dark-6">{row.member.email ?? row.member.phone ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-dark dark:text-white">{row.rewardProduct.name}</td>
                  <td className="px-4 py-3 text-center font-semibold text-[#45745a]">{row.pointsSpent.toLocaleString()} pts</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_LABELS[row.status].className}`}>
                      {STATUS_LABELS[row.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-5 dark:text-dark-6">
                    {row.trackingNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedRedemptionId(row.id)}
                      className="rounded-full border border-[#d7e7dc] px-3 py-1.5 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                    >
                      จัดการ
                    </button>
                  </td>
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
    </ContentCard>
    </>
  );
}
