"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard, StatusPill } from "./page-elements";

type SalonCode = {
  id: string;
  code: string;
  description?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  isActive: boolean;
  _count: { members: number };
  createdAt: string;
};

type FormState = {
  code: string;
  description: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
};

const INITIAL_FORM: FormState = {
  code: "",
  description: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function CreateModal({
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  form: FormState;
  isSubmitting: boolean;
  onChange: (next: Partial<FormState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}) {
  const inputCls =
    "w-full rounded-[14px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white";

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-md rounded-[24px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex items-center justify-between border-b border-[#edf4ef] px-6 py-5 dark:border-dark-3">
          <h3 className="text-lg font-semibold text-dark dark:text-white">สร้าง Salon Code</h3>
          <button
            onClick={onClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              className={`${inputCls} uppercase`}
              value={form.code}
              onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
              placeholder="เช่น SALON2025"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">คำอธิบาย</label>
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="เช่น แจกในงาน expo 2025"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              จำนวนสิทธิ์ (ว่างเปล่า = ไม่จำกัด)
            </label>
            <input
              className={inputCls}
              type="number"
              min={1}
              value={form.usageLimit}
              onChange={(e) => onChange({ usageLimit: e.target.value })}
              placeholder="เช่น 50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
              วันหมดอายุ (ว่างเปล่า = ไม่มีวันหมดอายุ)
            </label>
            <input
              className={inputCls}
              type="date"
              value={form.expiresAt}
              onChange={(e) => onChange({ expiresAt: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onChange({ isActive: !form.isActive })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? "bg-[#5f8f74]" : "bg-dark-4"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
            <span className="text-sm text-dark dark:text-white">{form.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#d8e6dd] px-5 py-2.5 text-sm font-medium text-dark hover:bg-[#f8fbf9] dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#5f8f74] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4e7a61] disabled:opacity-60"
            >
              {isSubmitting ? "กำลังสร้าง..." : "สร้าง Code"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export function SalonCodeManager({ initialItems }: { initialItems: SalonCode[] }) {
  const [items, setItems] = useState(initialItems);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  function updateForm(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = { code: form.code };
      if (form.description) body.description = form.description;
      if (form.usageLimit) body.usageLimit = Number(form.usageLimit);
      if (form.expiresAt) body.expiresAt = form.expiresAt;
      body.isActive = form.isActive;

      const res = await fetch("/api/salon-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => [data, ...prev]);
      setShowCreate(false);
      setForm(INITIAL_FORM);
      showToast("สร้าง Salon Code สำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleActive(item: SalonCode) {
    try {
      const res = await fetch(`/api/salon-codes/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => prev.map((c) => (c.id === item.id ? data : c)));
      showToast(`${data.isActive ? "เปิด" : "ปิด"}ใช้งาน Code สำเร็จ`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  async function handleDelete(item: SalonCode) {
    if (!confirm(`ยืนยันการลบ Code "${item.code}"?`)) return;
    try {
      const res = await fetch(`/api/salon-codes/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => prev.filter((c) => c.id !== item.id));
      showToast("ลบ Code สำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  return (
    <>
      <ContentCard
        title="Salon Code"
        description="โค้ดสำหรับลงทะเบียนเป็นสมาชิกประเภท Salon"
        aside={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-full bg-[#5f8f74] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4e7a61]"
          >
            + สร้าง Code
          </button>
        }
      >

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8e6dd] py-16 text-center dark:border-dark-3">
            <p className="text-dark-5 dark:text-dark-6">ยังไม่มี Salon Code</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fbf9] dark:bg-dark-2">
                  <th className="px-5 py-4 text-left font-semibold text-dark dark:text-white">Code</th>
                  <th className="px-5 py-4 text-left font-semibold text-dark dark:text-white">คำอธิบาย</th>
                  <th className="px-5 py-4 text-center font-semibold text-dark dark:text-white">ใช้แล้ว / จำกัด</th>
                  <th className="px-5 py-4 text-left font-semibold text-dark dark:text-white">วันหมดอายุ</th>
                  <th className="px-5 py-4 text-center font-semibold text-dark dark:text-white">สถานะ</th>
                  <th className="px-5 py-4 text-center font-semibold text-dark dark:text-white">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-dark dark:text-white">{item.code}</span>
                    </td>
                    <td className="px-5 py-4 text-dark-5 dark:text-dark-6">{item.description || "-"}</td>
                    <td className="px-5 py-4 text-center text-dark dark:text-white">
                      {item.usedCount} / {item.usageLimit ?? "∞"}
                    </td>
                    <td className="px-5 py-4 text-dark-5 dark:text-dark-6">{formatDate(item.expiresAt)}</td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => toggleActive(item)} title="สลับสถานะ">
                        <StatusPill label={item.isActive ? "เปิด" : "ปิด"} tone={item.isActive ? "success" : "default"} />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={item._count.members > 0}
                        title={item._count.members > 0 ? "ไม่สามารถลบได้ (มีสมาชิกใช้งานแล้ว)" : "ลบ"}
                        className="rounded-full px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/20"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {showCreate && (
        <CreateModal
          form={form}
          isSubmitting={isSubmitting}
          onChange={updateForm}
          onClose={() => { setShowCreate(false); setForm(INITIAL_FORM); }}
          onSubmit={handleCreate}
        />
      )}
    </>
  );
}
