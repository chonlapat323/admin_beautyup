"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type CreditTransaction = {
  id: string;
  type: "EARN" | "USE" | "WITHDRAW";
  amount: number | string;
  note?: string | null;
  refId?: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<CreditTransaction["type"], string> = {
  EARN: "รับเครดิต",
  USE: "ใช้เครดิต",
  WITHDRAW: "ถอน",
};

const TYPE_COLOR: Record<CreditTransaction["type"], string> = {
  EARN: "bg-[#eef8f1] text-[#2a7a4b]",
  USE: "bg-[#fef2f2] text-[#b42318]",
  WITHDRAW: "bg-[#fffbeb] text-[#92400e]",
};

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function fmtAmount(type: CreditTransaction["type"], amount: number | string) {
  const n = Number(amount);
  const sign = type === "EARN" ? "+" : "-";
  return `${sign}฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

export function MemberCreditModal({
  memberId,
  memberName,
  creditBalance,
  onClose,
}: {
  memberId: string;
  memberName: string;
  creditBalance: number;
  onClose: () => void;
}) {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/members/${memberId}/credit-transactions`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const data = await r.json() as CreditTransaction[];
        setTransactions(data);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, [memberId]);

  const modal = (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="w-full max-w-lg overflow-y-auto rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <div>
            <h3 className="text-2xl font-bold text-dark dark:text-white">เครดิต — {memberName}</h3>
            <p className="mt-1 text-sm text-dark-5 dark:text-dark-6">
              ยอดคงเหลือ:{" "}
              <span className="font-semibold text-[#2a7a4b]">
                ฿{creditBalance.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
          <button
            className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ปิด
          </button>
        </div>

        <div className="px-7 py-6">
          {isLoading ? (
            <p className="text-center text-sm text-dark-5">กำลังโหลดข้อมูล...</p>
          ) : error ? (
            <p className="text-center text-sm text-[#b42318]">ไม่สามารถโหลดประวัติเครดิตได้</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-sm text-dark-5">ยังไม่มีประวัติเครดิต</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between rounded-2xl border border-[#edf4ef] px-4 py-3 dark:border-dark-3"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLOR[tx.type]}`}
                    >
                      {TYPE_LABEL[tx.type]}
                    </span>
                    <div>
                      <p className="text-sm text-dark dark:text-white">{tx.note ?? "-"}</p>
                      <p className="mt-0.5 text-xs text-dark-5">{fmtDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span
                    className={`ml-4 shrink-0 text-sm font-semibold ${
                      tx.type === "EARN" ? "text-[#2a7a4b]" : "text-[#b42318]"
                    }`}
                  >
                    {fmtAmount(tx.type, tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
