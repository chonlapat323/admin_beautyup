"use client";

import { useEffect, useState } from "react";
import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";

type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

type OrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  member?: { fullName: string; email: string | null; phone: string | null } | null;
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
  shippingName: string;
  shippingPhone: string;
  shippingAddr: string;
  items: {
    id: string;
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number | string;
    totalPrice: number | string;
  }[];
  statusLogs: StatusLog[];
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  PAID: "ชำระแล้ว",
  PROCESSING: "กำลังเตรียม",
  SHIPPED: "จัดส่งแล้ว",
  DELIVERED: "ส่งสำเร็จ",
  CANCELLED: "ยกเลิก",
};

const ALL_STATUSES: OrderStatus[] = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

function statusTone(s: string): "success" | "warning" | "default" {
  if (s === "PAID" || s === "DELIVERED") return "success";
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#5f8f74]">
      {children}
    </p>
  );
}

function ItemRow({ item }: { item: OrderDetail["items"][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-stroke bg-white dark:border-dark-3 dark:bg-gray-dark">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fbf9] dark:hover:bg-dark-2"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef8f1] text-xs font-bold text-[#2f7a4f]">
            {item.quantity}
          </span>
          <span className="truncate text-sm font-medium text-dark dark:text-white">{item.name}</span>
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
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-dark-5">SKU</span>
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
      )}
    </div>
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

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data: OrderListItem[]) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setSaveError("");
    try {
      const r = await fetch(`/api/orders/${id}`);
      const d = (await r.json()) as OrderDetail;
      setDetail(d);
      setSelectedStatus((d.status as OrderStatus) ?? "PAID");
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  }

  function closeModal() {
    if (saving) return;
    setDetail(null);
    setSaveError("");
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
      const fresh = (await fetch(`/api/orders/${detail.id}`).then((r) => r.json())) as OrderDetail;
      setDetail(fresh);
      setOrders((prev) => prev.map((o) => (o.id === detail.id ? { ...o, status: selectedStatus } : o)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ContentCard title="คำสั่งซื้อทั้งหมด" description="คลิกที่แถวเพื่อดูรายละเอียดและเปลี่ยนสถานะ">
        {loading ? (
          <p className="py-10 text-center text-sm text-dark-5">กำลังโหลด...</p>
        ) : orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-dark-5">ยังไม่มีคำสั่งซื้อ</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left">
              <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="px-5 py-4 font-medium">คำสั่งซื้อ</th>
                  <th className="px-5 py-4 font-medium">สมาชิก</th>
                  <th className="px-5 py-4 font-medium">ยอดรวม</th>
                  <th className="px-5 py-4 font-medium">วันที่</th>
                  <th className="px-5 py-4 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => void openDetail(order.id)}
                    className="cursor-pointer border-t border-stroke text-sm text-dark-5 transition-colors hover:bg-[#f4faf6] dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2"
                  >
                    <td className="px-5 py-4 font-semibold text-dark dark:text-white">{order.orderNumber}</td>
                    <td className="px-5 py-4">{order.member?.fullName ?? order.member?.email ?? "-"}</td>
                    <td className="px-5 py-4">{fmt(order.totalAmount)}</td>
                    <td className="px-5 py-4">{order.createdAt ? fmtDate(order.createdAt) : "-"}</td>
                    <td className="px-5 py-4">
                      <StatusPill label={STATUS_LABELS[order.status] ?? order.status} tone={statusTone(order.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

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
                        <div className="flex justify-between border-t border-stroke pt-3 dark:border-dark-3">
                          <span className="font-semibold text-dark dark:text-white">รวมทั้งหมด</span>
                          <span className="text-lg font-bold text-[#2f7a4f]">{fmt(detail.totalAmount)}</span>
                        </div>
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
                          className="flex-shrink-0 rounded-xl bg-[#45745a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#355846] disabled:opacity-40"
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
    </>
  );
}
