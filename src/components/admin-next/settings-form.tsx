"use client";

import { useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard } from "./page-elements";

type Settings = {
  shipping: { freeShippingThreshold: number; defaultShippingFee: number };
  points: { threshold: number; earnedPoint: number };
  payment: { gatewayFee: number };
};

type FormState = {
  freeShippingThreshold: string;
  defaultShippingFee: string;
  pointThreshold: string;
  earnedPoint: string;
  gatewayFee: string;
};

function toForm(s: Settings): FormState {
  return {
    freeShippingThreshold: String(s.shipping.freeShippingThreshold),
    defaultShippingFee: String(s.shipping.defaultShippingFee),
    pointThreshold: String(s.points.threshold),
    earnedPoint: String(s.points.earnedPoint),
    gatewayFee: String(s.payment.gatewayFee),
  };
}

const inputCls =
  "w-full rounded-[14px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white";

const labelCls = "block text-sm font-medium text-dark-5 dark:text-dark-6 mb-1.5";

function Field({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: string;
  unit?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          type="number"
          min={0}
          className={inputCls + (unit ? " pr-14" : "")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-dark-5">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<FormState>(toForm(initial));
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  function set(key: keyof FormState) {
    return (v: string) => setForm((prev) => ({ ...prev, [key]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeShippingThreshold: Number(form.freeShippingThreshold),
          defaultShippingFee: Number(form.defaultShippingFee),
          pointThreshold: Number(form.pointThreshold),
          earnedPoint: Number(form.earnedPoint),
          gatewayFee: Number(form.gatewayFee),
        }),
      });
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ");
      showToast("บันทึกการตั้งค่าสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSave(e)}>
      <div className="space-y-6">
        <ContentCard title="การชำระเงิน" description="ค่าธรรมเนียมที่เรียกเก็บต่อคำสั่งซื้อ">
          <div className="max-w-xs">
            <Field label="ค่าธรรมเนียมการชำระเงิน" value={form.gatewayFee} unit="บาท" onChange={set("gatewayFee")} />
          </div>
        </ContentCard>

        <ContentCard title="การจัดส่ง" description="เงื่อนไขการคิดค่าจัดส่ง">
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <Field label="ฟรีค่าจัดส่งเมื่อยอดถึง" value={form.freeShippingThreshold} unit="บาท" onChange={set("freeShippingThreshold")} />
            <Field label="ค่าจัดส่งปกติ" value={form.defaultShippingFee} unit="บาท" onChange={set("defaultShippingFee")} />
          </div>
        </ContentCard>

        <ContentCard title="แต้มสะสม" description="เงื่อนไขการได้รับและใช้แต้ม">
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <Field label="ยอดขั้นต่ำต่อการได้แต้ม" value={form.pointThreshold} unit="บาท" onChange={set("pointThreshold")} />
            <Field label="แต้มที่ได้รับ" value={form.earnedPoint} unit="แต้ม" onChange={set("earnedPoint")} />
          </div>
        </ContentCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-[14px] bg-[#2f7a4f] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1f5236] disabled:opacity-60 transition-colors"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>
      </div>
    </form>
  );
}
