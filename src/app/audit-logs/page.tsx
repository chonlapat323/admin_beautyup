"use client";

import { useCallback, useEffect, useState } from "react";
import { ContentCard } from "@/components/admin-next/page-elements";

type AuditLogEntry = {
  id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  detail?: string | null;
  createdAt: string;
};

type Meta = { page: number; limit: number; total: number; totalPages: number };

const ACTION_LABELS: Record<string, string> = {
  "member.update": "แก้ไขสมาชิก",
  "member.status_change": "เปลี่ยนสถานะสมาชิก",
  "member.delete": "ลบสมาชิก",
  "order.status_change": "เปลี่ยนสถานะออเดอร์",
  "stock.adjust": "ปรับ stock",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function DetailCell({ detail }: { detail?: string | null }) {
  if (!detail) return <span className="text-dark-5">-</span>;
  try {
    const obj = JSON.parse(detail);
    return (
      <span className="font-mono text-xs text-dark-5">
        {Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(", ")}
      </span>
    );
  } catch {
    return <span className="text-xs text-dark-5">{detail}</span>;
  }
}

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback((p: number) => {
    setIsLoading(true);
    fetch(`/api/audit-logs?page=${p}&limit=50`)
      .then((r) => r.json())
      .then((data: { items: AuditLogEntry[]; meta: Meta }) => {
        setItems(data.items ?? []);
        if (data.meta) setMeta(data.meta);
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div className="space-y-6">
      <ContentCard title="Audit Log" description="ประวัติการกระทำของผู้ดูแลระบบ">
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">ผู้ดำเนินการ</th>
                <th className="px-4 py-3 font-semibold">การกระทำ</th>
                <th className="px-4 py-3 font-semibold">ประเภท</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">รายละเอียด</th>
                <th className="px-4 py-3 font-semibold">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-dark-5" colSpan={5}>
                    ยังไม่มี audit log
                  </td>
                </tr>
              ) : (
                items.map((entry) => (
                  <tr key={entry.id} className="border-t border-stroke text-sm dark:border-dark-3">
                    <td className="px-4 py-3 text-dark dark:text-white">{entry.adminEmail}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#eef8f1] px-2 py-0.5 text-xs font-semibold text-[#2d6a4f]">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{entry.entityType}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <DetailCell detail={entry.detail} />
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{formatDate(entry.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-dark-5">
              ทั้งหมด <span className="font-bold text-dark dark:text-white">{meta.total}</span> รายการ
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:opacity-40">
                ← ก่อนหน้า
              </button>
              <span className="text-sm font-medium text-dark dark:text-white">{page} / {meta.totalPages}</span>
              <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:opacity-40">
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </ContentCard>
    </div>
  );
}
