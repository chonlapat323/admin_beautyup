"use client";

import { useCallback, useEffect, useState } from "react";
import { ContentCard } from "@/components/admin-next/page-elements";

type StockItem = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  reserveStock: number;
  sellableStock: number;
  status: string;
};

type Movement = {
  id: string;
  productId: string;
  delta: number;
  type: string;
  reason: string;
  createdAt: string;
  product: { name: string; sku: string };
};

const TYPE_LABELS: Record<string, string> = {
  SALE: "ขาย",
  ADJUSTMENT: "ปรับ manual",
  RETURN: "คืนสินค้า",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">หมด</span>;
  if (stock <= 10) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">ใกล้หมด</span>;
  return <span className="rounded-full bg-[#e8f5ee] px-2 py-0.5 text-xs font-semibold text-[#2d6a4f]">ปกติ</span>;
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movLoading, setMovLoading] = useState(true);

  const [adjusting, setAdjusting] = useState<StockItem | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = useCallback(() => {
    setIsLoading(true);
    fetch("/api/stock/summary")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  const loadMovements = useCallback(() => {
    setMovLoading(true);
    fetch("/api/stock/movements")
      .then((r) => r.json())
      .then((data) => setMovements(Array.isArray(data) ? data : []))
      .catch(() => setMovements([]))
      .finally(() => setMovLoading(false));
  }, []);

  useEffect(() => {
    loadSummary();
    loadMovements();
  }, [loadSummary, loadMovements]);

  async function handleAdjust() {
    if (!adjusting) return;
    const deltaNum = parseInt(delta, 10);
    if (isNaN(deltaNum) || deltaNum === 0) { setError("กรุณาใส่จำนวนที่ไม่ใช่ 0"); return; }
    if (!reason.trim()) { setError("กรุณาใส่เหตุผล"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/stock/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: adjusting.id, delta: deltaNum, reason: reason.trim() }),
      });
      if (!res.ok) throw new Error("ปรับ stock ไม่สำเร็จ");
      setAdjusting(null);
      setDelta("");
      setReason("");
      loadSummary();
      loadMovements();
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ContentCard title="สต็อกสินค้า" description="จำนวนสินค้าคงเหลือและ reserve stock ทั้งหมด">
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">สินค้า</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">stock จริง</th>
                <th className="px-4 py-3 font-semibold">reserve (10%)</th>
                <th className="px-4 py-3 font-semibold">ขายได้</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-dark-5" colSpan={7}>
                    ไม่พบข้อมูลสินค้า
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-stroke text-sm dark:border-dark-3">
                    <td className="px-4 py-3 font-semibold text-dark dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{item.sku}</td>
                    <td className="px-4 py-3 font-semibold text-dark dark:text-white">{item.stock}</td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{item.reserveStock}</td>
                    <td className="px-4 py-3 font-semibold text-dark dark:text-white">{item.sellableStock}</td>
                    <td className="px-4 py-3"><StatusBadge stock={item.stock} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setAdjusting(item); setDelta(""); setReason(""); setError(""); }}
                        className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                      >
                        ปรับ stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      <ContentCard title="ประวัติการเคลื่อนไหว stock" description="รายการเปลี่ยนแปลง stock ทั้งหมด">
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[600px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">สินค้า</th>
                <th className="px-4 py-3 font-semibold">ประเภท</th>
                <th className="px-4 py-3 font-semibold">จำนวน</th>
                <th className="px-4 py-3 font-semibold">เหตุผล</th>
                <th className="px-4 py-3 font-semibold">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {movLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : movements.length === 0 ? (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-dark-5" colSpan={5}>
                    ยังไม่มีประวัติการเคลื่อนไหว
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="border-t border-stroke text-sm dark:border-dark-3">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-dark dark:text-white">{m.product.name}</p>
                      <p className="text-xs text-dark-5">{m.product.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{TYPE_LABELS[m.type] ?? m.type}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${m.delta > 0 ? "text-[#2d6a4f]" : "text-red-600"}`}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{m.reason}</td>
                    <td className="px-4 py-3 text-dark-5 dark:text-dark-6">{formatDate(m.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>

      {/* Adjust Modal */}
      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h2 className="mb-1 text-lg font-bold text-dark dark:text-white">ปรับ Stock</h2>
            <p className="mb-5 text-sm text-dark-5">{adjusting.name} — stock ปัจจุบัน: {adjusting.stock}</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-dark dark:text-white">
                  จำนวน (+ เพิ่ม / - ลด)
                </label>
                <input
                  type="number"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  placeholder="เช่น 50 หรือ -10"
                  className="w-full rounded-xl border border-stroke px-4 py-2.5 text-sm text-dark outline-none focus:border-[#4a9e72] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-dark dark:text-white">เหตุผล</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="เช่น รับสินค้าเข้าคลัง, ตรวจนับสต็อก"
                  className="w-full rounded-xl border border-stroke px-4 py-2.5 text-sm text-dark outline-none focus:border-[#4a9e72] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setAdjusting(null)}
                className="rounded-full border border-[#d7e7dc] px-5 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAdjust}
                disabled={saving}
                className="rounded-full bg-[#2d6a4f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1b4332] disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
