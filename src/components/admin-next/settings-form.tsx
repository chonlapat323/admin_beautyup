"use client";

import { useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard } from "./page-elements";
import type { PointTier } from "@/lib/admin-api";

type Settings = {
  shipping: { freeShippingThreshold: number; defaultShippingFee: number };
  points: { tiers: PointTier[] };
  payment: { gatewayFee: number };
  social?: { youtubeUrl?: string; tiktokUrl?: string };
};

type FormState = {
  freeShippingThreshold: string;
  defaultShippingFee: string;
  gatewayFee: string;
  pointTiers: PointTier[];
  youtubeUrl: string;
  tiktokUrl: string;
};

function toForm(s: Settings): FormState {
  return {
    freeShippingThreshold: String(s.shipping.freeShippingThreshold),
    defaultShippingFee: String(s.shipping.defaultShippingFee),
    gatewayFee: String(s.payment.gatewayFee),
    pointTiers: [...s.points.tiers].sort((a, b) => a.minSpend - b.minSpend),
    youtubeUrl: s.social?.youtubeUrl ?? "",
    tiktokUrl: s.social?.tiktokUrl ?? "",
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

function UrlField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="url"
        className={inputCls}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TierEditor({
  tiers,
  onChange,
}: {
  tiers: PointTier[];
  onChange: (tiers: PointTier[]) => void;
}) {
  function updateTier(index: number, field: keyof PointTier, value: string) {
    const updated = tiers.map((t, i) =>
      i === index ? { ...t, [field]: Number(value) || 0 } : t,
    );
    onChange(updated);
  }

  function removeTier(index: number) {
    onChange(tiers.filter((_, i) => i !== index));
  }

  function addTier() {
    onChange([...tiers, { minSpend: 0, points: 0 }]);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-dark-5 dark:text-dark-6 px-1">
        <span>ยอดซื้อตั้งแต่ (บาท)</span>
        <span>แต้มที่ได้รับ</span>
        <span />
      </div>

      {tiers.map((tier, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
          <div className="relative">
            <input
              type="number"
              min={0}
              className={inputCls + " pr-12"}
              value={tier.minSpend}
              onChange={(e) => updateTier(i, "minSpend", e.target.value)}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-dark-5">บาท</span>
          </div>
          <div className="relative">
            <input
              type="number"
              min={0}
              className={inputCls + " pr-14"}
              value={tier.points}
              onChange={(e) => updateTier(i, "points", e.target.value)}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-dark-5">แต้ม</span>
          </div>
          <button
            type="button"
            onClick={() => removeTier(i)}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 transition-colors"
            aria-label="ลบ tier"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addTier}
        className="mt-1 rounded-[10px] border border-dashed border-[#5f8f74] px-4 py-2 text-sm text-[#2f7a4f] hover:bg-[#f0f9f4] dark:hover:bg-dark-2 transition-colors"
      >
        + เพิ่ม tier
      </button>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<FormState>(toForm(initial));
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  function set(key: keyof Omit<FormState, "pointTiers">) {
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
          gatewayFee: Number(form.gatewayFee),
          pointTiers: form.pointTiers,
          youtubeUrl: form.youtubeUrl,
          tiktokUrl: form.tiktokUrl,
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

        <ContentCard title="Social Media" description="ลิงก์ YouTube และ TikTok จะแสดงในแอปลูกค้า — เว้นว่างหากยังไม่ต้องการแสดง">
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <UrlField
              label="YouTube URL"
              value={form.youtubeUrl}
              placeholder="https://youtube.com/@beautyup"
              onChange={set("youtubeUrl")}
            />
            <UrlField
              label="TikTok URL"
              value={form.tiktokUrl}
              placeholder="https://tiktok.com/@beautyup"
              onChange={set("tiktokUrl")}
            />
          </div>
        </ContentCard>

        <ContentCard title="แต้มสะสม" description="กำหนดแต้มที่ได้รับตามระดับยอดซื้อ สามารถเพิ่ม/ลบ tier ได้">
          <div className="max-w-md">
            <TierEditor
              tiers={form.pointTiers}
              onChange={(tiers) => setForm((prev) => ({ ...prev, pointTiers: tiers }))}
            />
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
