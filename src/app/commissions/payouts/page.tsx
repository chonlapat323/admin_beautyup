"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "@/components/admin-next/page-elements";

type PayoutLog = {
  id: string;
  member: { id: string; fullName: string };
  totalAmount: number;
  method: string;
  reference?: string | null;
  note?: string | null;
  commissions: { id: string; amount: number; orderId: string }[];
  createdAt: string;
};

type Meta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "โอนธนาคาร",
  CASH: "เงินสด",
  PROMPTPAY: "พร้อมเพย์",
};

function thb(n: number) {
  return `฿${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PayoutsPage() {
  const [items, setItems] = useState<PayoutLog[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [preset, setPreset] = useState<"today" | "week" | "month" | "custom" | "">("");

  useEffect(() => {
    setIsLoading(true);
    const url =
      `/api/commissions/payouts?page=${page}&pageSize=20` +
      (appliedFrom ? `&from=${appliedFrom}` : "") +
      (appliedTo ? `&to=${appliedTo}` : "");
    fetch(url)
      .then((r) => r.json())
      .then((data: { items: PayoutLog[]; meta: Meta }) => {
        setItems(data.items ?? []);
        if (data.meta) setMeta(data.meta);
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, [page, appliedFrom, appliedTo]);

  function handleSearch() {
    setAppliedFrom(from);
    setAppliedTo(to);
    setPage(1);
  }

  function handleClear() {
    setFrom("");
    setTo("");
    setSearch("");
    setAppliedFrom("");
    setAppliedTo("");
    setPreset("");
    setPage(1);
  }

  function handlePreset(p: "today" | "week" | "month") {
    const now = new Date();
    const toStr = now.toISOString().slice(0, 10);
    let fromStr = toStr;
    if (p === "week") {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      fromStr = d.toISOString().slice(0, 10);
    } else if (p === "month") {
      fromStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    }
    setFrom(fromStr);
    setTo(toStr);
    setAppliedFrom(fromStr);
    setAppliedTo(toStr);
    setPreset(p);
    setPage(1);
  }

  const btnBase = "rounded-full px-3.5 py-2 text-xs font-semibold transition-colors border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]";
  const btnActive = "bg-[#45745a] text-white border-[#45745a] hover:bg-[#355846]";

  const filtered = items.filter(
    (p) => !search || p.member.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-2xl border border-[#b7ddc7] bg-[#f0faf4] px-5 py-4 text-sm text-[#2d6a4f]">
        <p className="mb-2 font-semibold">หน้านี้แสดงอะไร?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>แสดงรายการ "ชุดการจ่าย" commission ที่ Admin อนุมัติและโอนเงินไปแล้ว</li>
          <li>1 รายการ = 1 ครั้งที่ Admin กดจ่าย (อาจรวมหลาย commission หลาย order)</li>
          <li>แตกต่างจาก "รายงานคอมมิชชัน" ที่แสดงรายละเอียดแต่ละ order</li>
        </ul>
      </div>

      <ContentCard title="ประวัติการจ่าย" description="รายการชุดการจ่ายคอมมิชชันทั้งหมดที่ Admin อนุมัติแล้ว">
        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <button type="button" onClick={() => handlePreset("today")} className={`${btnBase} ${preset === "today" ? btnActive : ""}`}>วันนี้</button>
          <button type="button" onClick={() => handlePreset("week")} className={`${btnBase} ${preset === "week" ? btnActive : ""}`}>7 วันล่าสุด</button>
          <button type="button" onClick={() => handlePreset("month")} className={`${btnBase} ${preset === "month" ? btnActive : ""}`}>เดือนนี้</button>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }}
              className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
            <span className="text-sm text-dark-5">—</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPreset("custom"); }}
              className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            />
          </div>
          <div className="relative w-full sm:w-56">
            <svg
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสมาชิก..."
              value={search}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
          >
            ค้นหา
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
          >
            ล้าง
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">ผู้รับ</th>
                <th className="px-4 py-3 font-semibold">คอมมิชชัน</th>
                <th className="px-4 py-3 font-semibold">ยอดรวม</th>
                <th className="px-4 py-3 font-semibold">วิธีโอน</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">อ้างอิง</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">หมายเหตุ</th>
                <th className="px-4 py-3 font-semibold">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="hidden px-4 py-3 lg:table-cell"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    <td className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-dark-5" colSpan={7}>
                    ยังไม่มีประวัติการจ่ายคอมมิชชัน
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t border-stroke text-sm dark:border-dark-3">
                    <td className="px-4 py-3 font-semibold text-dark dark:text-white">
                      {p.member.fullName}
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">
                      {p.commissions.length} รายการ
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#2d6a4f]">
                      {thb(p.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">
                      {METHOD_LABELS[p.method] ?? p.method}
                    </td>
                    <td className="hidden px-4 py-3 text-dark-5 dark:text-dark-6 md:table-cell">
                      {p.reference ?? "-"}
                    </td>
                    <td className="hidden px-4 py-3 text-dark-5 dark:text-dark-6 lg:table-cell">
                      {p.note ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">
                      {formatDate(p.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-dark-5">
              แสดง {filtered.length} จากทั้งหมด{" "}
              <span className="font-bold text-dark dark:text-white">{meta.totalItems}</span> รายการ
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← ก่อนหน้า
              </button>
              <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">
                {page} / {meta.totalPages}
              </span>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </ContentCard>
    </div>
  );
}
