"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "CANCELLED";

type OrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  paymentMethod?: string | null;
  member?: { fullName: string; email: string | null; phone: string | null; storeName?: string | null } | null;
};

type StatusLog = {
  id: string;
  fromStatus: string;
  toStatus: string;
  changedByName: string;
  createdAt: string;
};

type OrderDetail = OrderListItem & {
  subtotalAmount: number | string;
  shippingAmount: number | string;
  gatewayFee: number | string;
  shippingName: string;
  shippingPhone: string;
  shippingAddr: string;
  trackingNumber?: string | null;
  note?: string | null;
  items: {
    id: string;
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number | string;
    totalPrice: number | string;
    product?: { images?: { url: string }[] } | null;
  }[];
  statusLogs: StatusLog[];
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  PROCESSING: "รอจัดส่ง",
  SHIPPED: "จัดส่งแล้ว",
  CANCELLED: "ยกเลิก",
};

const ALL_STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "CANCELLED"];

function statusTone(s: string): "success" | "warning" | "default" {
  if (s === "PAID") return "success";
  if (s === "PROCESSING" || s === "SHIPPED") return "warning";
  return "default";
}

function fmt(n: number | string) {
  return `THB ${Number(n).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

function fmtDate(s: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s));
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CARD: "บัตรเครดิต",
  PROMPTPAY: "พร้อมเพย์",
  CREDIT: "เครดิต",
};

const PAYMENT_METHOD_CLASS: Record<string, string> = {
  CARD: "bg-[#eff6ff] text-[#1d4ed8]",
  PROMPTPAY: "bg-[#f0fdf4] text-[#15803d]",
  CREDIT: "bg-[#fefce8] text-[#92400e]",
};

function PaymentBadge({ method }: { method?: string | null }) {
  if (!method) return <span className="text-dark-5">-</span>;
  const label = PAYMENT_METHOD_LABEL[method] ?? method;
  const cls = PAYMENT_METHOD_CLASS[method] ?? "bg-[#f3f4f6] text-[#374151]";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">
      {children}
    </p>
  );
}

function ItemRow({ item }: { item: OrderDetail["items"][number] }) {
  const [open, setOpen] = useState(false);
  const imageUrl = item.product?.images?.[0]?.url;

  return (
    <div className="overflow-hidden rounded-xl border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fbf9] dark:hover:bg-dark-2"
      >
        <div className="flex items-center gap-3 min-w-0">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={imageUrl} alt={item.name} className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#eef8f1] text-xs font-bold text-[#2f7a4f]">
              {item.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-dark dark:text-white">{item.name}</p>
            <p className="text-xs text-dark-5">× {item.quantity} ชิ้น</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <span className="text-sm font-semibold text-dark dark:text-white">{fmt(item.totalPrice)}</span>
          <svg
            className={`h-4 w-4 flex-shrink-0 text-dark-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="border-t border-stroke bg-[#f8fbf9] px-4 py-3 dark:border-dark-3 dark:bg-dark-2">
          <div className="flex gap-4">
            {imageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imageUrl} alt={item.name} className="h-20 w-20 flex-shrink-0 rounded-xl object-cover" />
            )}
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-dark-5">รหัสสินค้า</span>
                <p className="mt-0.5 font-mono font-semibold text-dark dark:text-white">{item.sku}</p>
              </div>
              <div>
                <span className="text-dark-5">ราคาต่อชิ้น</span>
                <p className="mt-0.5 font-semibold text-dark dark:text-white">{fmt(item.unitPrice)}</p>
              </div>
              <div>
                <span className="text-dark-5">จำนวน</span>
                <p className="mt-0.5 font-semibold text-dark dark:text-white">{item.quantity} ชิ้น</p>
              </div>
              <div>
                <span className="text-dark-5">รวม</span>
                <p className="mt-0.5 font-semibold text-[#2f7a4f]">{fmt(item.totalPrice)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function isOrderListItem(value: unknown): value is OrderListItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<OrderListItem>;
  return (
    typeof item.id === "string" &&
    typeof item.orderNumber === "string" &&
    typeof item.status === "string" &&
    "totalAmount" in item &&
    typeof item.createdAt === "string"
  );
}

function isOrderList(value: unknown): value is OrderListItem[] {
  return Array.isArray(value) && value.every(isOrderListItem);
}

function isOrderDetail(value: unknown): value is OrderDetail {
  if (!value || typeof value !== "object") return false;
  const detail = value as Partial<OrderDetail>;
  return (
    typeof detail.id === "string" &&
    typeof detail.orderNumber === "string" &&
    typeof detail.status === "string" &&
    "totalAmount" in detail &&
    typeof detail.createdAt === "string" &&
    Array.isArray(detail.items) &&
    Array.isArray(detail.statusLogs)
  );
}

export function OrderManager() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("PAID");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [savingTracking, setSavingTracking] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  // Admin create order states
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [createMemberSearch, setCreateMemberSearch] = useState("");
  const [createMemberResults, setCreateMemberResults] = useState<{ id: string; fullName: string; phone: string | null; email: string | null }[]>([]);
  const [createMemberId, setCreateMemberId] = useState("");
  const [createMemberName, setCreateMemberName] = useState("");
  const [createProductSearch, setCreateProductSearch] = useState("");
  const [createProductResults, setCreateProductResults] = useState<{ id: string; name: string; sku: string; price: number }[]>([]);
  const [createItems, setCreateItems] = useState<{ productId: string; quantity: number; name: string; price: number }[]>([]);
  const [createShippingName, setCreateShippingName] = useState("");
  const [createShippingPhone, setCreateShippingPhone] = useState("");
  const [createShippingAddr, setCreateShippingAddr] = useState("");
  const [createNote, setCreateNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState<"today" | "week" | "month" | "custom" | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [staleWarning, setStaleWarning] = useState(false);
  const detailRef = useRef<OrderDetail | null>(null);

  // Keep detailRef in sync with detail state (for use inside polling callback)
  useEffect(() => { detailRef.current = detail; }, [detail]);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const r = await fetch("/api/orders");
      const data = (await r.json().catch(() => null)) as unknown;
      if (r.ok && isOrderList(data)) {
        setOrders(data);
        setLastUpdated(new Date());
        setSecondsAgo(0);
        // Check if currently-open modal order was changed by someone else
        const open = detailRef.current;
        if (open) {
          const fresh = data.find((o) => o.id === open.id);
          if (fresh && fresh.status !== open.status) {
            setStaleWarning(true);
          }
        }
      }
    } catch { /* ignore */ } finally {
      if (!silent) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // SSE real-time updates
  useEffect(() => {
    const controller = new AbortController();

    async function connectSSE() {
      try {
        const r = await fetch("/api/orders/events", { signal: controller.signal });
        if (!r.ok || !r.body) return;
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          if (text.includes("data:")) {
            void loadOrders(true);
          }
        }
      } catch {
        // Reconnect on disconnect (if not aborted)
        if (!controller.signal.aborted) {
          setTimeout(() => void connectSSE(), 5_000);
        }
      }
    }

    void connectSSE();
    return () => controller.abort();
  }, [loadOrders]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") void loadOrders(true);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [loadOrders]);

  // Tick "X วินาทีที่แล้ว" every second
  useEffect(() => {
    const t = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1_000);
    return () => clearInterval(t);
  }, []);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setSaveError("");
    setStaleWarning(false);
    try {
      const r = await fetch(`/api/orders/${id}`);
      const d = (await r.json().catch(() => null)) as unknown;
      if (!r.ok || !isOrderDetail(d)) {
        setDetail(null);
        setSaveError("ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้");
        return;
      }
      setDetail(d);
      setSelectedStatus((d.status as OrderStatus) ?? "PAID");
      setTrackingInput(d.trackingNumber ?? "");
      setNoteInput(d.note ?? "");
    } catch {
      setDetail(null);
      setSaveError("ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeModal() {
    if (saving) return;
    setDetail(null);
    setSaveError("");
    setStaleWarning(false);
  }

  async function saveStatus() {
    if (!detail) return;
    setSaving(true);
    setSaveError("");
    try {
      const r = await fetch(`/api/orders/${detail.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });
      if (!r.ok) {
        const e = (await r.json().catch(() => null)) as { message?: string } | null;
        setSaveError(e?.message ?? "ไม่สามารถบันทึกได้");
        return;
      }
      const freshResponse = await fetch(`/api/orders/${detail.id}`);
      const fresh = (await freshResponse.json().catch(() => null)) as unknown;
      if (!freshResponse.ok || !isOrderDetail(fresh)) {
        setSaveError("บันทึกสำเร็จ แต่ไม่สามารถโหลดข้อมูลล่าสุดได้");
        return;
      }
      setDetail(fresh);
      setOrders((prev) => prev.map((o) => (o.id === detail.id ? { ...o, status: selectedStatus } : o)));
    } finally {
      setSaving(false);
    }
  }

  async function saveTracking() {
    if (!detail) return;
    setSavingTracking(true);
    try {
      const r = await fetch(`/api/orders/${detail.id}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: trackingInput }),
      });
      if (!r.ok) return;
      const freshResponse = await fetch(`/api/orders/${detail.id}`);
      const fresh = (await freshResponse.json().catch(() => null)) as unknown;
      if (freshResponse.ok && isOrderDetail(fresh)) {
        setDetail(fresh);
        setSelectedStatus(fresh.status as OrderStatus);
        setOrders((prev) => prev.map((o) => o.id === detail.id ? { ...o, status: fresh.status } : o));
      } else {
        setDetail((prev) => prev ? { ...prev, trackingNumber: trackingInput } : prev);
      }
    } finally {
      setSavingTracking(false);
    }
  }

  async function saveNote() {
    if (!detail) return;
    setSavingNote(true);
    try {
      await fetch(`/api/orders/${detail.id}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteInput || null }),
      });
      setDetail((prev) => prev ? { ...prev, note: noteInput || null } : prev);
    } finally {
      setSavingNote(false);
    }
  }

  async function searchMembers(q: string) {
    if (!q.trim()) { setCreateMemberResults([]); return; }
    try {
      const r = await fetch(`/api/members?search=${encodeURIComponent(q)}&pageSize=10`);
      if (!r.ok) return;
      const data = await r.json() as unknown;
      if (data && typeof data === "object" && "items" in data && Array.isArray((data as { items: unknown[] }).items)) {
        setCreateMemberResults((data as { items: { id: string; fullName: string; phone: string | null; email: string | null }[] }).items.slice(0, 8));
      }
    } catch { /* ignore */ }
  }

  async function searchProducts(q: string) {
    if (!q.trim()) { setCreateProductResults([]); return; }
    try {
      const r = await fetch(`/api/products?search=${encodeURIComponent(q)}&pageSize=10`);
      if (!r.ok) return;
      const data = await r.json() as unknown;
      if (Array.isArray(data)) {
        setCreateProductResults((data as { id: string; name: string; sku: string; price: number }[]).slice(0, 8));
      }
    } catch { /* ignore */ }
  }

  async function submitAdminCreate() {
    if (!createMemberId || createItems.length === 0 || !createShippingName || !createShippingPhone || !createShippingAddr) return;
    setCreating(true);
    setCreateError("");
    try {
      const r = await fetch("/api/orders/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: createMemberId,
          items: createItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingName: createShippingName,
          shippingPhone: createShippingPhone,
          shippingAddr: createShippingAddr,
          note: createNote || undefined,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null) as { message?: string } | null;
        setCreateError(e?.message ?? "ไม่สามารถสร้างคำสั่งซื้อได้");
        return;
      }
      // Refresh order list
      await loadOrders(true);
      // Reset and close
      setShowCreateOrder(false);
      setCreateMemberId(""); setCreateMemberName(""); setCreateMemberSearch(""); setCreateMemberResults([]);
      setCreateItems([]); setCreateProductSearch(""); setCreateProductResults([]);
      setCreateShippingName(""); setCreateShippingPhone(""); setCreateShippingAddr(""); setCreateNote("");
    } finally {
      setCreating(false);
    }
  }

  function handleDatePreset(p: "today" | "week" | "month") {
    const now = new Date();
    const toStr = now.toISOString().slice(0, 10);
    let fromStr = toStr;
    if (p === "week") {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      fromStr = d.toISOString().slice(0, 10);
    } else if (p === "month") {
      fromStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    }
    setDateFrom(fromStr);
    setDateTo(toStr);
    setDatePreset(p);
    setPage(1);
  }

  function clearDateFilter() {
    setDateFrom("");
    setDateTo("");
    setDatePreset("");
    setPage(1);
  }

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((o) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.member?.fullName ?? "").toLowerCase().includes(q) ||
      (o.member?.email ?? "").toLowerCase().includes(q) ||
      (o.member?.phone ?? "").toLowerCase().includes(q) ||
      (o.member?.storeName ?? "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || o.status === statusFilter;
    let matchDate = true;
    if (dateFrom || dateTo) {
      const d = o.createdAt ? o.createdAt.slice(0, 10) : "";
      if (dateFrom && d < dateFrom) matchDate = false;
      if (dateTo && d > dateTo) matchDate = false;
    }
    return matchSearch && matchStatus && matchDate;
  });
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);
  const hasFilter = search.trim() !== "" || statusFilter !== "" || dateFrom !== "" || dateTo !== "";
  const btnBase = "rounded-full px-3.5 py-2 text-xs font-semibold transition-colors border border-[#d7e7dc] text-[#355846] hover:bg-[#f4fbf6]";
  const btnActive = "!bg-[#45745a] !text-white !border-[#45745a] hover:!bg-[#355846]";

  return (
    <>
      <ContentCard title="คำสั่งซื้อทั้งหมด" description="คลิกที่แถวเพื่อดูรายละเอียดและเปลี่ยนสถานะ">
        <div className="mb-5 flex flex-col gap-3">
          {/* Date filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => handleDatePreset("today")} className={`${btnBase} ${datePreset === "today" ? btnActive : ""}`}>วันนี้</button>
            <button type="button" onClick={() => handleDatePreset("week")} className={`${btnBase} ${datePreset === "week" ? btnActive : ""}`}>7 วันล่าสุด</button>
            <button type="button" onClick={() => handleDatePreset("month")} className={`${btnBase} ${datePreset === "month" ? btnActive : ""}`}>เดือนนี้</button>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setDatePreset("custom"); setPage(1); }}
                className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
              <span className="text-sm text-dark-5">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setDatePreset("custom"); setPage(1); }}
                className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button type="button" onClick={clearDateFilter} className={btnBase}>✕ ล้างวันที่</button>
            )}
          </div>
          {/* Search + status + page size row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-60">
                <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="ค้นหาเลขออเดอร์ / ชื่อ / เบอร์โทร / ชื่อร้าน..."
                  value={search}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`${btnBase} ${statusFilter === "" ? btnActive : ""}`}
                  onClick={() => { setStatusFilter(""); setPage(1); }}
                  type="button"
                >ทั้งหมด</button>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`${btnBase} ${statusFilter === s ? btnActive : ""}`}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    type="button"
                  >{STATUS_LABELS[s]}</button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <select
                className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                value={pageSize}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n} รายการ</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void loadOrders()}
                disabled={refreshing}
                title="รีเฟรชรายการ"
                className="flex items-center gap-1.5 rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2.5 text-sm text-[#45745a] transition-colors hover:bg-[#edf7f1] disabled:opacity-50 dark:border-dark-3 dark:bg-dark-2"
              >
                <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {lastUpdated ? (
                  <span className="hidden sm:inline text-xs text-dark-5">
                    {secondsAgo < 5 ? "เพิ่งอัปเดต" : `${secondsAgo} วิที่แล้ว`}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateOrder(true)}
                className="rounded-2xl bg-[#45745a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#355846]"
              >
                + สร้างคำสั่งซื้อ
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 font-semibold">คำสั่งซื้อ</th>
                <th className="px-4 py-3 font-semibold">สมาชิก</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">ชื่อร้าน</th>
                <th className="px-4 py-3 font-semibold">ยอดรวม</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ช่องทาง</th>
                <th className="px-4 py-3 font-semibold">วันที่</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="hidden px-4 py-3 lg:table-cell"><div className="h-4 w-28 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><div className="h-6 w-20 animate-pulse rounded-full bg-dark-5/20" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-3"><div className="h-6 w-20 animate-pulse rounded-full bg-dark-5/20" /></td>
                  </tr>
                ))
              ) : pagedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" x2="21" y1="6" y2="6" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 10a4 4 0 0 1-8 0" /></svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">{hasFilter ? "ไม่พบรายการ" : "ยังไม่มีคำสั่งซื้อ"}</p>
                      <p className="mt-1 text-sm text-dark-5">{hasFilter ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง" : "คำสั่งซื้อจากลูกค้าจะแสดงที่นี่"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => void openDetail(order.id)}
                    className="cursor-pointer border-t border-stroke text-sm text-dark-5 transition-colors hover:bg-[#f4faf6] dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2"
                  >
                    <td className="px-4 py-3 font-semibold text-dark dark:text-white">{order.orderNumber}</td>
                    <td className="px-4 py-3">{order.member?.fullName ?? order.member?.email ?? "-"}</td>
                    <td className="hidden px-4 py-3 text-dark dark:text-white lg:table-cell">{order.member?.storeName ?? "-"}</td>
                    <td className="px-4 py-3">{fmt(order.totalAmount)}</td>
                    <td className="hidden px-4 py-3 md:table-cell"><PaymentBadge method={order.paymentMethod} /></td>
                    <td className="px-4 py-3">{order.createdAt ? fmtDate(order.createdAt) : "-"}</td>
                    <td className="px-4 py-3">
                      <StatusPill label={STATUS_LABELS[order.status] ?? order.status} tone={statusTone(order.status)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-dark-5">
            {loading ? (
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
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >← ก่อนหน้า</button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >ถัดไป →</button>
          </div>
        </div>
      </ContentCard>

      {/* Detail modal */}
      {(detailLoading || detail) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-dark"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !detail ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#45745a] border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between bg-gradient-to-r from-[#f0faf4] to-[#f8fbf9] px-6 py-5 dark:from-dark-2 dark:to-dark-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">คำสั่งซื้อ</p>
                    <div className="mt-1 flex items-center gap-3">
                      <h3 className="text-xl font-bold text-dark dark:text-white">{detail.orderNumber}</h3>
                      <StatusPill label={STATUS_LABELS[detail.status] ?? detail.status} tone={statusTone(detail.status)} />
                    </div>
                    <p className="mt-1 text-xs text-dark-5">{fmtDate(detail.createdAt)}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-white hover:text-dark dark:hover:bg-dark-3"
                  >✕</button>
                </div>

                {/* Stale warning banner */}
                {staleWarning && (
                  <div className="flex items-center justify-between gap-3 bg-amber-50 px-5 py-3 dark:bg-amber-900/20">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        สถานะถูกอัปเดตโดยผู้ดูแลอื่น — ข้อมูลที่แสดงอาจไม่ใช่ล่าสุด
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void openDetail(detail.id)}
                      className="flex-shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
                    >
                      โหลดใหม่
                    </button>
                  </div>
                )}

                {/* Scrollable body */}
                <div className="max-h-[65vh] overflow-y-auto">
                  <div className="space-y-6 p-6">

                    {/* Member & shipping */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-stroke bg-[#f8fbf9] p-4 dark:border-dark-3 dark:bg-dark-2">
                        <SectionLabel>ผู้สั่งซื้อ</SectionLabel>
                        <p className="font-semibold text-dark dark:text-white">{detail.member?.fullName ?? "-"}</p>
                        {detail.member?.phone && <p className="mt-0.5 text-sm text-dark-5">{detail.member.phone}</p>}
                        {detail.member?.email && <p className="mt-0.5 text-sm text-dark-5">{detail.member.email}</p>}
                      </div>
                      <div className="rounded-xl border border-stroke bg-[#f8fbf9] p-4 dark:border-dark-3 dark:bg-dark-2">
                        <SectionLabel>ที่อยู่จัดส่ง</SectionLabel>
                        <p className="font-semibold text-dark dark:text-white">{detail.shippingName || "-"}</p>
                        {detail.shippingPhone && <p className="mt-0.5 text-sm text-dark-5">{detail.shippingPhone}</p>}
                        {detail.shippingAddr && <p className="mt-0.5 text-sm text-dark-5">{detail.shippingAddr}</p>}
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <SectionLabel>รายการสินค้า ({detail.items.length} รายการ)</SectionLabel>
                      <div className="flex flex-col gap-2">
                        {detail.items.map((item) => (
                          <ItemRow key={item.id} item={item} />
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
                      <SectionLabel>สรุปยอดชำระ</SectionLabel>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-5">ยอดสินค้า</span>
                          <span className="text-dark dark:text-white">{fmt(detail.subtotalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-5">ค่าจัดส่ง</span>
                          <span className="text-dark dark:text-white">{fmt(detail.shippingAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-dark-5">ค่าธรรมเนียมการชำระเงิน</span>
                          <span className="text-dark dark:text-white">{fmt(detail.gatewayFee ?? 0)}</span>
                        </div>
                        <div className="flex justify-between border-t border-stroke pt-3 dark:border-dark-3">
                          <span className="font-semibold text-dark dark:text-white">รวมทั้งหมด</span>
                          <span className="text-lg font-bold text-[#2f7a4f]">{fmt(detail.totalAmount)}</span>
                        </div>
                        {detail.paymentMethod && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-sm text-dark-5">ช่องทางชำระเงิน</span>
                            <PaymentBadge method={detail.paymentMethod} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Note */}
                    <div className="rounded-xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
                      <SectionLabel>หมายเหตุ</SectionLabel>
                      <div className="flex gap-3">
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          rows={3}
                          placeholder="หมายเหตุคำสั่งซื้อ..."
                          className="flex-1 resize-none rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                        />
                        <button
                          disabled={savingNote || noteInput === (detail.note ?? "")}
                          onClick={() => void saveNote()}
                          className="flex-shrink-0 self-start rounded-xl bg-[#45745a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#355846] disabled:opacity-70"
                        >
                          {savingNote ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                      </div>
                    </div>

                    {/* Tracking number */}
                    <div className="rounded-xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
                      <SectionLabel>เลขพัสดุ / Tracking</SectionLabel>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          placeholder="เช่น TH123456789"
                          className="flex-1 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                        />
                        <button
                          disabled={savingTracking || trackingInput === (detail.trackingNumber ?? "")}
                          onClick={() => void saveTracking()}
                          className="flex-shrink-0 rounded-xl bg-[#45745a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#355846] disabled:opacity-70"
                        >
                          {savingTracking ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                      </div>
                    </div>

                    {/* Status change */}
                    <div className="rounded-xl border border-stroke bg-[#f8fbf9] px-5 py-4 dark:border-dark-3 dark:bg-dark-2">
                      <SectionLabel>เปลี่ยนสถานะ</SectionLabel>
                      <div className="flex gap-3">
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                          className="flex-1 rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark shadow-sm focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        <button
                          disabled={saving || selectedStatus === detail.status}
                          onClick={() => void saveStatus()}
                          className="flex-shrink-0 rounded-xl bg-[#45745a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#355846] disabled:opacity-70"
                        >
                          {saving ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                      </div>
                      {saveError && (
                        <p className="mt-2 text-xs text-red-500">{saveError}</p>
                      )}
                    </div>

                    {/* Status log */}
                    <div>
                      <SectionLabel>ประวัติการเปลี่ยนสถานะ</SectionLabel>
                      {detail.statusLogs.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-stroke py-6 text-center">
                          <p className="text-sm text-dark-5">ยังไม่มีประวัติการเปลี่ยนสถานะ</p>
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
                          <table className="w-full text-left">
                            <thead className="bg-[#f8fbf9] dark:bg-dark-2">
                              <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-dark-5 dark:text-dark-6">วันที่ / เวลา</th>
                                <th className="px-4 py-3 text-xs font-semibold text-dark-5 dark:text-dark-6">การเปลี่ยนแปลง</th>
                                <th className="px-4 py-3 text-xs font-semibold text-dark-5 dark:text-dark-6">โดย</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stroke dark:divide-dark-3">
                              {detail.statusLogs.map((log) => (
                                <tr key={log.id} className="bg-white dark:bg-gray-dark">
                                  <td className="px-4 py-3 text-xs text-dark-5 dark:text-dark-6 whitespace-nowrap">
                                    {fmtDate(log.createdAt)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="rounded-full bg-[#f1f5f3] px-2.5 py-0.5 text-xs font-medium text-[#456955] dark:bg-dark-2">
                                        {STATUS_LABELS[log.fromStatus] ?? log.fromStatus}
                                      </span>
                                      <svg className="h-3 w-3 flex-shrink-0 text-dark-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                      </svg>
                                      <span className="rounded-full bg-[#ecf9f0] px-2.5 py-0.5 text-xs font-medium text-[#2f7a4f] dark:bg-dark-2">
                                        {STATUS_LABELS[log.toStatus] ?? log.toStatus}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-xs font-medium text-dark dark:text-white whitespace-nowrap">
                                    {log.changedByName}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Admin Create Order Modal */}
      {showCreateOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => { if (!creating) setShowCreateOrder(false); }}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-dark"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between bg-gradient-to-r from-[#f0faf4] to-[#f8fbf9] px-6 py-5 dark:from-dark-2 dark:to-dark-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">Admin</p>
                <h3 className="mt-1 text-xl font-bold text-dark dark:text-white">สร้างคำสั่งซื้อ</h3>
                <p className="mt-0.5 text-xs text-dark-5">ข้ามขั้นตอนชำระเงิน — ส่วนลด 100%</p>
              </div>
              <button
                onClick={() => { if (!creating) setShowCreateOrder(false); }}
                className="ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-white hover:text-dark dark:hover:bg-dark-3"
              >✕</button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <div className="space-y-5 p-6">

                {/* Member */}
                <div>
                  <SectionLabel>สมาชิก</SectionLabel>
                  {createMemberName ? (
                    <div className="flex items-center justify-between rounded-xl border border-[#45745a] bg-[#f0faf4] px-4 py-3">
                      <span className="font-semibold text-[#2f7a4f]">{createMemberName}</span>
                      <button type="button" onClick={() => { setCreateMemberId(""); setCreateMemberName(""); setCreateMemberSearch(""); setCreateMemberResults([]); }} className="text-xs text-dark-5 hover:text-dark">เปลี่ยน</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={createMemberSearch}
                        onChange={(e) => { setCreateMemberSearch(e.target.value); void searchMembers(e.target.value); }}
                        placeholder="ค้นหาชื่อ / เบอร์โทรสมาชิก..."
                        className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                      />
                      {createMemberResults.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-gray-dark">
                          {createMemberResults.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => { setCreateMemberId(m.id); setCreateMemberName(m.fullName); setCreateMemberResults([]); setCreateMemberSearch(""); }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#f4faf6] dark:hover:bg-dark-2"
                            >
                              <span className="font-semibold text-dark dark:text-white">{m.fullName}</span>
                              <span className="text-dark-5">{m.phone ?? m.email ?? ""}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Products */}
                <div>
                  <SectionLabel>สินค้า</SectionLabel>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={createProductSearch}
                      onChange={(e) => { setCreateProductSearch(e.target.value); void searchProducts(e.target.value); }}
                      placeholder="ค้นหาสินค้า..."
                      className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                    />
                    {createProductResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-gray-dark">
                        {createProductResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              if (!createItems.find((i) => i.productId === p.id)) {
                                setCreateItems((prev) => [...prev, { productId: p.id, quantity: 1, name: p.name, price: p.price }]);
                              }
                              setCreateProductSearch(""); setCreateProductResults([]);
                            }}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[#f4faf6] dark:hover:bg-dark-2"
                          >
                            <span className="font-semibold text-dark dark:text-white">{p.name}</span>
                            <span className="text-dark-5 font-mono">{p.sku}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {createItems.length > 0 && (
                    <div className="space-y-2">
                      {createItems.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3 rounded-xl border border-stroke bg-[#f8fbf9] px-4 py-2.5 dark:border-dark-3 dark:bg-dark-2">
                          <span className="flex-1 text-sm font-semibold text-dark dark:text-white">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setCreateItems((prev) => prev.map((i) => i.productId === item.productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="flex h-6 w-6 items-center justify-center rounded-full border border-stroke text-sm text-dark-5 hover:bg-white">−</button>
                            <span className="w-6 text-center text-sm font-semibold text-dark dark:text-white">{item.quantity}</span>
                            <button type="button" onClick={() => setCreateItems((prev) => prev.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i))} className="flex h-6 w-6 items-center justify-center rounded-full border border-stroke text-sm text-dark-5 hover:bg-white">+</button>
                          </div>
                          <button type="button" onClick={() => setCreateItems((prev) => prev.filter((i) => i.productId !== item.productId))} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {createItems.length === 0 && <p className="text-sm text-dark-5">ยังไม่มีสินค้า</p>}
                </div>

                {/* Shipping */}
                <div>
                  <SectionLabel>ที่อยู่จัดส่ง</SectionLabel>
                  <div className="space-y-2">
                    <input type="text" value={createShippingName} onChange={(e) => setCreateShippingName(e.target.value)} placeholder="ชื่อผู้รับ *" className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
                    <input type="text" value={createShippingPhone} onChange={(e) => setCreateShippingPhone(e.target.value)} placeholder="เบอร์โทร *" className="w-full rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
                    <textarea rows={2} value={createShippingAddr} onChange={(e) => setCreateShippingAddr(e.target.value)} placeholder="ที่อยู่ *" className="w-full resize-none rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <SectionLabel>หมายเหตุ</SectionLabel>
                  <textarea rows={2} value={createNote} onChange={(e) => setCreateNote(e.target.value)} placeholder="หมายเหตุ เช่น สาเหตุที่สร้าง order นี้..." className="w-full resize-none rounded-xl border border-stroke bg-white px-4 py-2.5 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white" />
                </div>

                {createError && <p className="text-sm text-red-500">{createError}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
              <button type="button" onClick={() => { if (!creating) setShowCreateOrder(false); }} className="rounded-xl border border-stroke px-5 py-2.5 text-sm font-semibold text-dark-5 hover:bg-[#f4faf6] dark:border-dark-3 dark:hover:bg-dark-2">ยกเลิก</button>
              <button
                type="button"
                disabled={creating || !createMemberId || createItems.length === 0 || !createShippingName || !createShippingPhone || !createShippingAddr}
                onClick={() => void submitAdminCreate()}
                className="rounded-xl bg-[#45745a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#355846] disabled:opacity-50"
              >
                {creating ? "กำลังสร้าง..." : "สร้างคำสั่งซื้อ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
