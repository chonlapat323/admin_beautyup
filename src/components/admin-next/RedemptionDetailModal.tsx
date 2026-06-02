"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type RedemptionStatus = "PENDING" | "PREPARING" | "SHIPPED" | "DELIVERED";

type RedemptionDetail = {
  id: string;
  pointsSpent: number;
  status: RedemptionStatus;
  trackingNumber: string | null;
  shippingRecipient: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  member: { id: string; fullName: string; email: string | null; phone: string | null };
  rewardProduct: { id: string; name: string };
};

const STATUS_OPTIONS: { value: RedemptionStatus; label: string }[] = [
  { value: "PENDING",   label: "รอดำเนินการ" },
  { value: "PREPARING", label: "กำลังเตรียมพัสดุ" },
  { value: "SHIPPED",   label: "จัดส่งแล้ว" },
  { value: "DELIVERED", label: "ส่งถึงแล้ว" },
];

const CARRIERS = [
  { id: "THPOST", name: "ไปรษณีย์ไทย", icon: "✉️", img: null,     trackingUrl: "https://track.thailandpost.co.th/?trackNumber=" },
  { id: "KERRY",  name: "Kerry Express", icon: null, img: "/images/icon/carrier/kerry.png", trackingUrl: "https://th.kerryexpress.com/en/track/?track=" },
  { id: "FLASH",  name: "Flash Express", icon: null, img: "/images/icon/carrier/Flash_Express_Logo.svg", trackingUrl: "https://www.flashexpress.co.th/en/fle/tracking?se=" },
  { id: "JNT",    name: "J&T Express",   icon: null, img: "/images/icon/carrier/jandt.png", trackingUrl: "https://www.jtexpress.co.th/trajectoryQuery" },
  { id: "DHL",    name: "DHL Express",   icon: null, img: "/images/icon/carrier/DHL_idxN0olXHn_1.png", trackingUrl: "https://www.dhl.com/th-en/home/tracking.html?tracking-id=" },
];

type Props = {
  redemptionId: string | null;
  onClose: () => void;
  onUpdated: () => void;
};

export function RedemptionDetailModal({ redemptionId, onClose, onUpdated }: Props) {
  const [detail, setDetail] = useState<RedemptionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<RedemptionStatus>("PENDING");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierId, setCarrierId] = useState<string>("THPOST");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!redemptionId) { setDetail(null); setMessage(null); return; }
    setLoading(true);
    fetch(`/api/reward-products/redemptions/${redemptionId}`)
      .then((r) => r.json())
      .then((data: RedemptionDetail) => {
        setDetail(data);
        setStatus(data.status);
        setTrackingNumber(data.trackingNumber ?? "");
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [redemptionId]);

  async function handleSave() {
    if (!detail) return;
    if (status === "SHIPPED" && !trackingNumber.trim()) {
      setMessage({ type: "error", text: "กรุณากรอกหมายเลขพัสดุก่อนเปลี่ยนสถานะเป็นจัดส่งแล้ว" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/reward-products/redemptions/${detail.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingNumber: trackingNumber.trim() || undefined, carrierId: carrierId || undefined }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      setMessage({ type: "success", text: "บันทึกเรียบร้อย" });
      setTimeout(() => { onUpdated(); onClose(); }, 800);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" });
    } finally {
      setSaving(false);
    }
  }

  if (!redemptionId) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-dark-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
          <h3 className="font-semibold text-dark dark:text-white">จัดการการแลกของรางวัล</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-dark-5 hover:bg-dark-5/10">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d8e6dd] border-t-[#45745a]" />
            </div>
          ) : !detail ? (
            <p className="py-8 text-center text-dark-5">ไม่พบข้อมูล</p>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Info */}
              <div className="rounded-xl border border-stroke bg-[#f8fbf9] p-4 dark:border-dark-3 dark:bg-dark-3">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="font-semibold text-dark dark:text-white">{detail.member.fullName}</p>
                  <p className="text-xs text-dark-5">{new Date(detail.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
                <p className="text-sm text-dark-5">{detail.member.email ?? detail.member.phone ?? ""}</p>
                <p className="mt-2 text-sm font-medium text-dark dark:text-white">{detail.rewardProduct.name}</p>
                <p className="text-sm text-[#45745a]">ใช้ {detail.pointsSpent.toLocaleString()} แต้ม</p>
              </div>

              {/* Shipping */}
              {detail.shippingRecipient && (
                <div className="rounded-xl border border-stroke p-4 dark:border-dark-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dark-5">ที่อยู่จัดส่ง</p>
                  <p className="font-medium text-dark dark:text-white">{detail.shippingRecipient}</p>
                  <p className="text-sm text-dark-5">{detail.shippingPhone}</p>
                  <p className="text-sm text-dark-5">{detail.shippingAddress}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-dark dark:text-white">สถานะ</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RedemptionStatus)}
                  className="rounded-xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2.5 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Carrier + Tracking — auto-sets SHIPPED */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-dark dark:text-white">
                  ขนส่ง &amp; หมายเลขพัสดุ
                  <span className="ml-2 text-xs font-normal text-[#6b7280]">กรอกแล้วสถานะจะเป็น "จัดส่งแล้ว" อัตโนมัติ</span>
                </label>
                {/* Carrier selector */}
                <div className="flex flex-wrap gap-2">
                  {CARRIERS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCarrierId(c.id)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        carrierId === c.id
                          ? "border-[#45745a] bg-[#45745a] text-white"
                          : "border-[#d8e6dd] bg-white text-dark-5 hover:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6"
                      }`}
                    >
                      {c.img ? (
                        <img src={c.img} alt={c.name} className="h-4 w-auto object-contain" />
                      ) : (
                        <span>{c.icon}</span>
                      )}
                      {c.name}
                    </button>
                  ))}
                </div>
                {/* Tracking input */}
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => {
                    setTrackingNumber(e.target.value);
                    if (e.target.value.trim() && status !== "DELIVERED") {
                      setStatus("SHIPPED");
                    }
                  }}
                  placeholder="เช่น TH123456789"
                  className="rounded-xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2.5 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white font-mono"
                />
              </div>

              {/* Message */}
              {message && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}>
                  {message.text}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && detail && (
          <div className="flex justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
            <button onClick={onClose} className="rounded-full border border-[#d7e7dc] px-5 py-2 text-sm font-semibold text-[#355846] hover:bg-[#f4fbf6]">
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-[#45745a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-60"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
