"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type StockFilter = "all" | "normal" | "low" | "empty";
type MovType = "all" | "SALE" | "ADJUSTMENT";

const TYPE_LABELS: Record<string, string> = {
  SALE: "ขาย",
  ADJUSTMENT: "ปรับ manual",
  RETURN: "คืนสินค้า",
};

const STOCK_FILTER_OPTIONS: { label: string; value: StockFilter }[] = [
  { label: "ทั้งหมด", value: "all" },
  { label: "ปกติ", value: "normal" },
  { label: "ใกล้หมด", value: "low" },
  { label: "หมด", value: "empty" },
];

const MOV_TYPE_OPTIONS: { label: string; value: MovType }[] = [
  { label: "ทั้งหมด", value: "all" },
  { label: "ขาย", value: "SALE" },
  { label: "ปรับ manual", value: "ADJUSTMENT" },
];

const STOCK_PAGE_SIZE = 10;
const MOV_PAGE_SIZE = 10;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">หมด</span>;
  if (stock <= 10) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">ใกล้หมด</span>;
  return <span className="rounded-full bg-[#e8f5ee] px-2 py-0.5 text-xs font-semibold text-[#2d6a4f]">ปกติ</span>;
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-between">
      <p className="text-sm text-dark-5">หน้า {page} / {totalPages}</p>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)}
          className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40">
          ← ก่อนหน้า
        </button>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}
          className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40">
          ถัดไป →
        </button>
      </div>
    </div>
  );
}

export default function StockPage() {
  const [allItems, setAllItems] = useState<StockItem[]>([]);
  const [allMovements, setAllMovements] = useState<Movement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movLoading, setMovLoading] = useState(true);

  // Stock filters
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [stockPage, setStockPage] = useState(1);

  // Movement filters
  const [movSearch, setMovSearch] = useState("");
  const [movType, setMovType] = useState<MovType>("all");
  const [movPage, setMovPage] = useState(1);

  // Adjust modal
  const [adjusting, setAdjusting] = useState<StockItem | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = useCallback(() => {
    setIsLoading(true);
    fetch("/api/stock/summary")
      .then((r) => r.json())
      .then((data) => setAllItems(Array.isArray(data) ? data : []))
      .catch(() => setAllItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  const loadMovements = useCallback(() => {
    setMovLoading(true);
    fetch("/api/stock/movements")
      .then((r) => r.json())
      .then((data) => setAllMovements(Array.isArray(data) ? data : []))
      .catch(() => setAllMovements([]))
      .finally(() => setMovLoading(false));
  }, []);

  useEffect(() => { loadSummary(); loadMovements(); }, [loadSummary, loadMovements]);

  // Filtered + paginated stock
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase();
    return allItems.filter((item) => {
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      const matchFilter =
        stockFilter === "all" ? true :
        stockFilter === "empty" ? item.stock === 0 :
        stockFilter === "low" ? item.stock > 0 && item.stock <= 10 :
        item.stock > 10;
      return matchSearch && matchFilter;
    });
  }, [allItems, search, stockFilter]);

  const stockTotalPages = Math.max(1, Math.ceil(filteredItems.length / STOCK_PAGE_SIZE));
  const pagedItems = filteredItems.slice((stockPage - 1) * STOCK_PAGE_SIZE, stockPage * STOCK_PAGE_SIZE);

  // Filtered + paginated movements
  const filteredMovements = useMemo(() => {
    const q = movSearch.toLowerCase();
    return allMovements.filter((m) => {
      const matchSearch = !q || m.product.name.toLowerCase().includes(q) || m.product.sku.toLowerCase().includes(q);
      const matchType = movType === "all" || m.type === movType;
      return matchSearch && matchType;
    });
  }, [allMovements, movSearch, movType]);

  const movTotalPages = Math.max(1, Math.ceil(filteredMovements.length / MOV_PAGE_SIZE));
  const pagedMovements = filteredMovements.slice((movPage - 1) * MOV_PAGE_SIZE, movPage * MOV_PAGE_SIZE);

  function handleSearchChange(val: string) { setSearch(val); setStockPage(1); }
  function handleStockFilterChange(val: StockFilter) { setStockFilter(val); setStockPage(1); }
  function handleMovSearchChange(val: string) { setMovSearch(val); setMovPage(1); }
  function handleMovTypeChange(val: MovType) { setMovType(val); setMovPage(1); }

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

      {/* Stock Summary */}
      <ContentCard title="สต็อกสินค้า" description="จำนวนสินค้าคงเหลือและ reserve stock ทั้งหมด">
        {/* Filter bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
            className="w-full rounded-xl border border-stroke bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none focus:border-[#4a9e72] dark:border-dark-3 dark:bg-dark-2 dark:text-white sm:max-w-xs"
          />
          <div className="flex gap-2">
            {STOCK_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStockFilterChange(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  stockFilter === opt.value
                    ? "border-[#2d6a4f] bg-[#2d6a4f] text-white"
                    : "border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

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
                      <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    ))}
                  </tr>
                ))
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-dark-5" colSpan={7}>ไม่พบสินค้า</td>
                </tr>
              ) : (
                pagedItems.map((item) => (
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

        {!isLoading && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-dark-5">
              แสดง {pagedItems.length} จาก{" "}
              <span className="font-bold text-dark dark:text-white">{filteredItems.length}</span> รายการ
            </p>
            <Pagination page={stockPage} totalPages={stockTotalPages} onChange={setStockPage} />
          </div>
        )}
      </ContentCard>

      {/* Movement History */}
      <ContentCard title="ประวัติการเคลื่อนไหว stock" description="รายการเปลี่ยนแปลง stock ทั้งหมด">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            value={movSearch}
            onChange={(e) => handleMovSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
            className="w-full rounded-xl border border-stroke bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none focus:border-[#4a9e72] dark:border-dark-3 dark:bg-dark-2 dark:text-white sm:max-w-xs"
          />
          <div className="flex gap-2">
            {MOV_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleMovTypeChange(opt.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  movType === opt.value
                    ? "border-[#2d6a4f] bg-[#2d6a4f] text-white"
                    : "border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

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
                      <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" /></td>
                    ))}
                  </tr>
                ))
              ) : pagedMovements.length === 0 ? (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-dark-5" colSpan={5}>ยังไม่มีประวัติการเคลื่อนไหว</td>
                </tr>
              ) : (
                pagedMovements.map((m) => (
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

        {!movLoading && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-dark-5">
              แสดง {pagedMovements.length} จาก{" "}
              <span className="font-bold text-dark dark:text-white">{filteredMovements.length}</span> รายการ
            </p>
            <Pagination page={movPage} totalPages={movTotalPages} onChange={setMovPage} />
          </div>
        )}
      </ContentCard>

      {/* Adjust Modal */}
      {adjusting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-dark">
            <h2 className="mb-1 text-lg font-bold text-dark dark:text-white">ปรับ Stock</h2>
            <p className="mb-5 text-sm text-dark-5">{adjusting.name} — stock ปัจจุบัน: {adjusting.stock}</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-dark dark:text-white">จำนวน (+ เพิ่ม / - ลด)</label>
                <input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="เช่น 50 หรือ -10"
                  className="w-full rounded-xl border border-stroke px-4 py-2.5 text-sm text-dark outline-none focus:border-[#4a9e72] dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-dark dark:text-white">เหตุผล</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น รับสินค้าเข้าคลัง, ตรวจนับสต็อก"
                  className="w-full rounded-xl border border-stroke px-4 py-2.5 text-sm text-dark outline-none focus:border-[#4a9e72] dark:border-dark-3 dark:bg-dark-2 dark:text-white" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setAdjusting(null)}
                className="rounded-full border border-[#d7e7dc] px-5 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]">
                ยกเลิก
              </button>
              <button onClick={handleAdjust} disabled={saving}
                className="rounded-full bg-[#2d6a4f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1b4332] disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
