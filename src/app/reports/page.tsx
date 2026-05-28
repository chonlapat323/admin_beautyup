"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "@/components/admin-next/page-elements";
import { ReportManager } from "@/components/admin-next/report-manager";

// ---------- types ----------
type ProductRow = { productId: string; name: string; sku: string; quantity: number; revenue: number };
type MemberRow  = { memberId: string; name: string; email: string; memberType: string; orderCount: number; totalSpent: number };
type StockRow   = { id: string; name: string; sku: string; stock: number; brandId: string | null; brandName: string | null; soldQuantity: number; status: "NORMAL" | "LOW" | "OUT_OF_STOCK" };
type BrandItem  = { id: string; name: string };

// ---------- helpers ----------
function thb(n: number) {
  return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "วันนี้", days: 0 },
  { label: "7 วัน", days: 7 },
  { label: "30 วัน", days: 30 },
];

const STOCK_STATUS: Record<string, { label: string; className: string }> = {
  NORMAL:       { label: "ปกติ",    className: "bg-[#eef8f1] text-[#2d6a4f]" },
  LOW:          { label: "ใกล้หมด", className: "bg-[#fff8ec] text-[#b45309]" },
  OUT_OF_STOCK: { label: "หมด",     className: "bg-[#fef2f2] text-[#b91c1c]" },
};

// ---------- date filter bar (shared) ----------
function DateFilterBar({
  from, to, preset,
  onFrom, onTo, onPreset,
}: {
  from: string; to: string; preset: number;
  onFrom: (v: string) => void; onTo: (v: string) => void; onPreset: (i: number) => void;
}) {
  const today = toDateStr(new Date());
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {PRESETS.map((p, i) => (
        <button
          key={p.label}
          onClick={() => onPreset(i)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            preset === i
              ? "bg-[#45745a] text-white"
              : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
          }`}
        >
          {p.label}
        </button>
      ))}
      <input
        type="date" value={from} max={to}
        onChange={(e) => onFrom(e.target.value)}
        className="h-10 rounded-xl border border-stroke bg-white px-3 text-sm text-dark focus:border-[#4caf82] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
      />
      <span className="text-sm text-dark-5">ถึง</span>
      <input
        type="date" value={to} min={from} max={today}
        onChange={(e) => onTo(e.target.value)}
        className="h-10 rounded-xl border border-stroke bg-white px-3 text-sm text-dark focus:border-[#4caf82] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
      />
    </div>
  );
}

// ---------- skeleton row ----------
function SkeletonRows({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-stroke dark:border-dark-3">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-neutral-100 dark:bg-dark-2" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------- Sales by product ----------
function SalesByProduct() {
  const today = toDateStr(new Date());
  const [from, setFrom] = useState(toDateStr(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(today);
  const [preset, setPreset] = useState(2);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  function applyPreset(i: number) {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - PRESETS[i].days);
    setFrom(toDateStr(f)); setTo(toDateStr(t)); setPreset(i);
  }

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/reports/sales-by-product?dateFrom=${from}&dateTo=${to}`)
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setIsLoading(false));
  }, [from, to]);

  return (
    <ContentCard title="ยอดขายรายสินค้า" description="รวมจาก order ที่ชำระแล้ว (PAID)">
      <DateFilterBar from={from} to={to} preset={preset} onFrom={setFrom} onTo={setTo} onPreset={applyPreset} />
      <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
        <table className="w-full min-w-[600px] text-left">
          <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">สินค้า</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold text-right">จำนวนขาย</th>
              <th className="px-4 py-3 font-semibold text-right">รายได้รวม</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <SkeletonRows cols={5} /> : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-dark-5">ไม่มีข้อมูลในช่วงที่เลือก</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.productId} className="border-t border-stroke text-sm dark:border-dark-3">
                <td className="px-4 py-3 text-dark-5">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-dark dark:text-white">{r.name}</td>
                <td className="px-4 py-3 text-dark-5">{r.sku}</td>
                <td className="px-4 py-3 text-right tabular-nums text-dark">{r.quantity.toLocaleString("th-TH")}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#2d6a4f]">{thb(r.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLoading && rows.length > 0 && (
        <div className="mt-3 text-right text-sm text-dark-5">
          รวมรายได้{" "}
          <span className="font-bold text-dark dark:text-white">
            {thb(rows.reduce((s, r) => s + r.revenue, 0))}
          </span>
        </div>
      )}
    </ContentCard>
  );
}

const MEMBER_TYPE_FILTERS = [
  { label: "ทั้งหมด", value: "" },
  { label: "ซาลอน", value: "SALON" },
  { label: "ทั่วไป", value: "REGULAR" },
  { label: "เซลล์", value: "SALES" },
];

function memberTypeLabel(t: string) {
  if (t === "SALON") return "ซาลอน";
  if (t === "SALES") return "เซลล์";
  return "ทั่วไป";
}

function memberTypeClass(t: string) {
  if (t === "SALON") return "bg-purple-100 text-purple-700";
  if (t === "SALES") return "bg-blue-100 text-blue-700";
  return "bg-neutral-100 text-neutral-600";
}

// ---------- Sales by member ----------
function SalesByMember() {
  const today = toDateStr(new Date());
  const [from, setFrom] = useState(toDateStr(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(today);
  const [preset, setPreset] = useState(2);
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  function applyPreset(i: number) {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - PRESETS[i].days);
    setFrom(toDateStr(f)); setTo(toDateStr(t)); setPreset(i);
  }

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/reports/sales-by-member?dateFrom=${from}&dateTo=${to}`)
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setIsLoading(false));
  }, [from, to]);

  const filtered = rows.filter((r) => {
    if (typeFilter && r.memberType !== typeFilter) return false;
    if (search.trim() && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ContentCard title="ยอดขายรายสมาชิก" description="รวมจาก order ที่ชำระแล้ว (PAID)">
      <DateFilterBar from={from} to={to} preset={preset} onFrom={setFrom} onTo={setTo} onPreset={applyPreset} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ หรือ email..."
          className="h-10 w-56 rounded-xl border border-stroke bg-white px-4 text-sm text-dark placeholder:text-dark-5 focus:border-[#4caf82] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
        <div className="flex items-center gap-2">
          {MEMBER_TYPE_FILTERS.map((f) => (
            <button
              key={f.value} onClick={() => setTypeFilter(f.value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                typeFilter === f.value
                  ? "border-[#4caf82] bg-[#4caf82] text-white"
                  : "border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
        <table className="w-full min-w-[600px] text-left">
          <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">สมาชิก</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">ประเภท</th>
              <th className="px-4 py-3 font-semibold text-right">จำนวน order</th>
              <th className="px-4 py-3 font-semibold text-right">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <SkeletonRows cols={5} /> : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-dark-5">ไม่มีข้อมูลในช่วงที่เลือก</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.memberId} className="border-t border-stroke text-sm dark:border-dark-3">
                <td className="px-4 py-3 text-dark-5">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-dark dark:text-white">{r.name}</p>
                  <p className="text-xs text-dark-5">{r.email}</p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${memberTypeClass(r.memberType)}`}>
                    {memberTypeLabel(r.memberType)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-dark">{r.orderCount}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#2d6a4f]">{thb(r.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLoading && filtered.length > 0 && (
        <div className="mt-3 text-right text-sm text-dark-5">
          รวมรายได้{" "}
          <span className="font-bold text-dark dark:text-white">
            {thb(filtered.reduce((s, r) => s + r.totalSpent, 0))}
          </span>
        </div>
      )}
    </ContentCard>
  );
}

// ---------- Stock report ----------
function StockReport() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => setBrands(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const qs = brandFilter ? `?brandId=${encodeURIComponent(brandFilter)}` : "";
    fetch(`/api/reports/stock${qs}`)
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setIsLoading(false));
  }, [brandFilter]);

  const STATUS_FILTERS = [
    { label: "ทั้งหมด", value: "" },
    { label: "ปกติ", value: "NORMAL" },
    { label: "ใกล้หมด", value: "LOW" },
    { label: "หมด", value: "OUT_OF_STOCK" },
  ];

  const filtered = rows
    .filter((r) => !statusFilter || r.status === statusFilter)
    .filter((r) => !search.trim() || r.name.toLowerCase().includes(search.toLowerCase()) || r.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <ContentCard title="รายงาน Stock" description="จำนวน stock คงเหลือทุกสินค้า">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ หรือ SKU..."
          className="h-10 w-56 rounded-xl border border-stroke bg-white px-4 text-sm text-dark placeholder:text-dark-5 focus:border-[#4caf82] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
        {brands.length > 0 && (
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="h-10 rounded-xl border border-stroke bg-white px-3 text-sm text-dark focus:border-[#4caf82] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          >
            <option value="">ทุก Brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                statusFilter === f.value
                  ? "border-[#4caf82] bg-[#4caf82] text-white"
                  : "border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
        <table className="w-full min-w-[600px] text-left">
          <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
            <tr>
              <th className="px-4 py-3 font-semibold">สินค้า</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Brand</th>
              <th className="px-4 py-3 font-semibold text-right">คงเหลือ</th>
              <th className="px-4 py-3 font-semibold text-right">ขายได้</th>
              <th className="px-4 py-3 font-semibold">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <SkeletonRows cols={6} /> : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-dark-5">ไม่พบรายการ</td></tr>
            ) : filtered.map((r) => {
              const s = STOCK_STATUS[r.status] ?? { label: r.status, className: "" };
              return (
                <tr key={r.id} className="border-t border-stroke text-sm dark:border-dark-3">
                  <td className="px-4 py-3 font-semibold text-dark dark:text-white">{r.name}</td>
                  <td className="px-4 py-3 text-dark-5">{r.sku}</td>
                  <td className="hidden px-4 py-3 text-dark-5 md:table-cell">{r.brandName ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-dark dark:text-white">{r.stock}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#2d6a4f]">{r.soldQuantity}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.className}`}>{s.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!isLoading && (
        <div className="mt-3 text-sm text-dark-5">
          แสดง <span className="font-bold text-dark dark:text-white">{filtered.length}</span>{" "}
          จาก <span className="font-bold text-dark dark:text-white">{rows.length}</span> รายการ
        </div>
      )}
    </ContentCard>
  );
}

// ---------- Main page ----------
const TABS = [
  { key: "commission",  label: "คอมมิชชัน" },
  { key: "product",     label: "ยอดขายรายสินค้า" },
  { key: "member",      label: "ยอดขายรายสมาชิก" },
  { key: "stock",       label: "รายงาน Stock" },
];

export default function ReportsPage() {
  const [tab, setTab] = useState("commission");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "bg-[#45745a] text-white"
                : "border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "commission" && <ReportManager />}
      {tab === "product"    && <SalesByProduct />}
      {tab === "member"     && <SalesByMember />}
      {tab === "stock"      && <StockReport />}
    </div>
  );
}
