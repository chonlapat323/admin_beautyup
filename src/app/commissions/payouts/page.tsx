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

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/commissions/payouts?page=${page}&pageSize=20`)
      .then((r) => r.json())
      .then((data: { items: PayoutLog[]; meta: Meta }) => {
        setItems(data.items ?? []);
        if (data.meta) setMeta(data.meta);
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <ContentCard title="ประวัติการจ่ายคอมมิชชัน" description="รายการจ่ายคอมมิชชันที่ผ่านมาทั้งหมด">
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
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-dark-5" colSpan={7}>
                    ยังไม่มีประวัติการจ่ายคอมมิชชัน
                  </td>
                </tr>
              ) : (
                items.map((p) => (
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
              แสดง {items.length} จากทั้งหมด{" "}
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
