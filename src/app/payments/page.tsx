"use client";

import { ContentCard } from "@/components/admin-next/page-elements";
import { useEffect, useState } from "react";

type ApiPayment = {
  method: string;
  status: string;
  amount?: number;
};

type PaymentSummary = {
  method: string;
  orders: number;
  successCount: number;
  totalAmount: number;
};

const METHOD_LABELS: Record<string, string> = {
  CARD: "บัตรเครดิต / เดบิต",
  PROMPTPAY: "พร้อมเพย์ QR",
  CREDIT: "กระเป๋าเครดิต",
  TRUEMONEY: "TrueMoney Wallet",
};

const SUCCESS_STATUSES = new Set(["SUCCESS", "PAID", "COMPLETED", "success", "paid", "completed"]);

function thb(n: number) {
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function methodLabel(method: string) {
  return METHOD_LABELS[method] ?? method;
}

function successRateText(successCount: number, total: number) {
  if (total === 0) return "-";
  return `${Math.round((successCount / total) * 100)}%`;
}

function groupPayments(raw: ApiPayment[]): PaymentSummary[] {
  const grouped = new Map<string, PaymentSummary>();
  for (const p of raw) {
    const isSuccess = SUCCESS_STATUSES.has(p.status);
    const amount = typeof p.amount === "number" ? p.amount : 0;
    const cur = grouped.get(p.method);
    if (cur) {
      cur.orders += 1;
      if (isSuccess) cur.successCount += 1;
      cur.totalAmount += amount;
    } else {
      grouped.set(p.method, {
        method: p.method,
        orders: 1,
        successCount: isSuccess ? 1 : 0,
        totalAmount: amount,
      });
    }
  }
  return Array.from(grouped.values());
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetch("/api/payments")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<ApiPayment[]>;
      })
      .then((data) => setPayments(groupPayments(Array.isArray(data) ? data : [])))
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const totalOrders = payments.reduce((s, p) => s + p.orders, 0);
  const totalSuccess = payments.reduce((s, p) => s + p.successCount, 0);
  const totalAmount = payments.reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {isError && (
        <div className="rounded-2xl border border-[#ffe4b5] bg-[#fffbf0] px-5 py-4 text-sm text-[#9a6a12] dark:border-[#6b4c00] dark:bg-[#2a2000]">
          ไม่สามารถโหลดข้อมูลการชำระเงินได้ในขณะนี้
        </div>
      )}

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[22px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dark-5 dark:text-dark-6">รายการทั้งหมด</p>
          <p className="mt-2 text-3xl font-bold text-dark dark:text-white">
            {isLoading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /> : thb(totalOrders)}
          </p>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">รายการชำระเงิน</p>
        </div>
        <div className="rounded-[22px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dark-5 dark:text-dark-6">อัตราสำเร็จรวม</p>
          <p className="mt-2 text-3xl font-bold text-dark dark:text-white">
            {isLoading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /> : successRateText(totalSuccess, totalOrders)}
          </p>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">{totalSuccess} / {totalOrders} รายการสำเร็จ</p>
        </div>
        <div className="rounded-[22px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dark-5 dark:text-dark-6">ยอดรวม</p>
          <p className="mt-2 text-3xl font-bold text-dark dark:text-white">
            {isLoading ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /> : totalAmount > 0 ? `฿${thb(totalAmount)}` : "-"}
          </p>
          <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">มูลค่ารายการชำระเงิน</p>
        </div>
      </div>

      <ContentCard title="ช่องทางการชำระเงิน" description="สรุปตามช่องทางที่ใช้ชำระเงิน">
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">ช่องทาง</th>
                <th className="px-4 py-3 font-semibold">จำนวนรายการ</th>
                <th className="px-4 py-3 font-semibold">สำเร็จ</th>
                <th className="px-4 py-3 font-semibold">อัตราสำเร็จ</th>
                <th className="px-4 py-3 font-semibold">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-dark-5 dark:text-dark-6" colSpan={5}>
                    ไม่พบข้อมูลการชำระเงิน
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.method} className="border-t border-stroke text-sm dark:border-dark-3">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-dark dark:text-white">{methodLabel(p.method)}</span>
                      <span className="ml-2 rounded-full bg-[#f0f4f2] px-2 py-0.5 text-xs text-dark-5">{p.method}</span>
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{thb(p.orders)}</td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{thb(p.successCount)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.successCount === p.orders ? "text-[#2d6a4f]" : "text-dark dark:text-white"}`}>
                        {successRateText(p.successCount, p.orders)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-dark dark:text-white">
                      {p.totalAmount > 0 ? `฿${thb(p.totalAmount)}` : "-"}
                    </td>
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
