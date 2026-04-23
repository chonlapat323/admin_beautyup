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
      // reload detail to get fresh statusLogs
      const fresh = await fetch(`/api/orders/${detail.id}`).then((r) => r.json()) as OrderDetail;
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => { if (!saving) { setDetail(null); setSaveError(""); } }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-xl dark:bg-gray-dark"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !detail ? (
              <div className="p-10 text-center text-sm text-dark-5">กำลังโหลด...</div>
            ) : (
              <div className="flex flex-col gap-0 overflow-hidden rounded-2xl">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-stroke p-6 dark:border-dark-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#5f8f74]">คำสั่งซื้อ</p>
                    <h3 className="mt-1 text-xl font-bold text-dark dark:text-white">{detail.orderNumber}</h3>
                    <p className="mt-0.5 text-sm text-dark-5">{fmtDate(detail.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => { setDetail(null); setSaveError(""); }}
                    className="rounded-full p-1 text-dark-5 hover:bg-[#f1f5f3] hover:text-dark dark:hover:bg-dark-2"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6">
                  {/* Member & shipping */}
                  <div className="mb-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-stroke bg-[#f8fbf9] p-4 dark:border-dark-3 dark:bg-dark-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dark-5">ผู้สั่งซื้อ</p>
                      <p className="font-semibold text-dark dark:text-white">{detail.member?.fullName ?? "-"}</p>
                      {detail.member?.phone && <p className="text-sm text-dark-5">{detail.member.phone}</p>}
                      {detail.member?.email && <p className="text-sm text-dark-5">{detail.member.email}</p>}
                    </div>
                    <div className="rounded-xl border border-stroke bg-[#f8fbf9] p-4 dark:border-dark-3 dark:bg-dark-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dark-5">ที่อยู่จัดส่ง</p>
                      <p className="font-semibold text-dark dark:text-white">{detail.shippingName}</p>
                      <p className="text-sm text-dark-5">{detail.shippingPhone}</p>
                      <p className="text-sm text-dark-5">{detail.shippingAddr}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-5">
                    <p className="mb-3 text-sm font-semibold text-dark dark:text-white">รายการสินค้า</p>
                    <div className="flex flex-col gap-2">
                      {detail.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-stroke bg-white px-4 py-3 text-sm dark:border-dark-3 dark:bg-gray-dark">
                          <div>
                            <span className="font-medium text-dark dark:text-white">{item.name}</span>
                            <span className="ml-2 text-dark-5">× {item.quantity}</span>
                          </div>
                          <span className="font-semibold text-dark dark:text-white">{fmt(item.totalPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-5 rounded-xl border border-stroke bg-[#f8fbf9] p-4 dark:border-dark-3 dark:bg-dark-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-5">ยอดสินค้า</span>
                      <span className="text-dark dark:text-white">{fmt(detail.subtotalAmount)}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-sm">
                      <span className="text-dark-5">ค่าจัดส่ง</span>
                      <span className="text-dark dark:text-white">{fmt(detail.shippingAmount)}</span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-stroke pt-2 text-sm font-semibold dark:border-dark-3">
                      <span className="text-dark dark:text-white">รวมทั้งหมด</span>
                      <span className="text-[#2f7a4f]">{fmt(detail.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Status change */}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-dark dark:text-white">เปลี่ยนสถานะ</p>
                    <div className="flex gap-3">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                        className="flex-1 rounded-xl border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-[#45745a] focus:outline-none dark:border-dark-3 dark:bg-gray-dark dark:text-white"
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <button
                        disabled={saving || selectedStatus === detail.status}
                        onClick={() => void saveStatus()}
                        className="rounded-xl bg-[#45745a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-40"
                      >
                        {saving ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </div>
                    {saveError && <p className="mt-2 text-xs text-red-500">{saveError}</p>}
                  </div>

                  {/* Status log */}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-dark dark:text-white">ประวัติการเปลี่ยนสถานะ</p>
                    {detail.statusLogs.length === 0 ? (
                      <p className="text-xs text-dark-5">ยังไม่มีการเปลี่ยนสถานะ</p>
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-stroke dark:border-dark-3">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#f8fbf9] text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                            <tr>
                              <th className="px-3 py-2 font-medium">เวลา</th>
                              <th className="px-3 py-2 font-medium">จาก</th>
                              <th className="px-3 py-2 font-medium">ไป</th>
                              <th className="px-3 py-2 font-medium">โดย</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail.statusLogs.map((log) => (
                              <tr key={log.id} className="border-t border-stroke dark:border-dark-3">
                                <td className="px-3 py-2 text-dark-5 dark:text-dark-6">{fmtDate(log.createdAt)}</td>
                                <td className="px-3 py-2">
                                  <span className="rounded-full bg-[#f1f5f3] px-2 py-0.5 text-[#456955]">
                                    {STATUS_LABELS[log.fromStatus] ?? log.fromStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <span className="rounded-full bg-[#ecf9f0] px-2 py-0.5 text-[#2f7a4f]">
                                    {STATUS_LABELS[log.toStatus] ?? log.toStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-dark dark:text-white">{log.changedByName}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
