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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div className="flex w-full max-w-md flex-col rounded-[24px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark" style={{ maxHeight: "90vh" }}>
        <div className="shrink-0 flex items-center justify-between border-b border-[#edf4ef] px-6 py-5 dark:border-dark-3">
          <h3 className="text-lg font-semibold text-dark dark:text-white">สร้างโค้ดซาลอน</h3>
          <button
            onClick={onClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e7dc] text-dark-5 transition-colors hover:bg-[#f4fbf6] dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form id="salon-code-form" onSubmit={onSubmit} className="space-y-4 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                โค้ด <span className="text-red-500">*</span>
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
              <span className="text-sm text-dark dark:text-white">{form.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
            </div>
          </form>
        </div>

        <div className="shrink-0 flex justify-end gap-3 border-t border-[#edf4ef] px-6 py-4 dark:border-dark-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="salon-code-form"
            disabled={isSubmitting}
            className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:opacity-70"
          >
            {isSubmitting ? "กำลังสร้าง..." : "สร้างโค้ด"}
          </button>
        </div>
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
  const [deleteTarget, setDeleteTarget] = useState<SalonCode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      showToast("สร้างโค้ดซาลอนสำเร็จ", "success");
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
      showToast(`${data.isActive ? "เปิด" : "ปิด"}ใช้งานโค้ดสำเร็จ`, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/salon-codes/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("ลบโค้ดสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <ContentCard
        title="โค้ดซาลอน"
        description="โค้ดสำหรับลงทะเบียนเป็นสมาชิกประเภทซาลอน"
        aside={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
          >
            + สร้างโค้ด
          </button>
        }
      >

        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">โค้ด</th>
                <th className="px-4 py-3 text-left font-semibold">คำอธิบาย</th>
                <th className="px-4 py-3 text-center font-semibold">ใช้แล้ว / จำกัด</th>
                <th className="px-4 py-3 text-left font-semibold">วันหมดอายุ</th>
                <th className="px-4 py-3 text-center font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-center font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4fbf6] dark:bg-dark-2">
                      <svg fill="none" height="28" stroke="#45745a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="28"><path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
                    </div>
                    <p className="mt-3 text-sm font-medium text-dark dark:text-white">ยังไม่มีโค้ดซาลอน</p>
                    <p className="mt-1 text-xs text-dark-5">สร้างโค้ดแรกเพื่อให้สมาชิกซาลอนลงทะเบียน</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
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
                      <button onClick={() => void toggleActive(item)} title="สลับสถานะ">
                        <StatusPill label={item.isActive ? "เปิด" : "ปิด"} tone={item.isActive ? "success" : "default"} />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setDeleteTarget(item)}
                        disabled={item._count.members > 0}
                        title={item._count.members > 0 ? "ไม่สามารถลบได้ (มีสมาชิกใช้งานแล้ว)" : "ลบ"}
                        className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      {deleteTarget ? createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-center justify-between gap-3 border-b border-[#f3e8e7] px-6 py-5 dark:border-dark-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
                  <svg fill="none" height="18" stroke="#c84b44" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
                </div>
                <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบโค้ด</h3>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3" onClick={() => setDeleteTarget(null)} type="button">✕</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">
                ต้องการลบโค้ด <strong className="font-mono text-dark dark:text-white">{deleteTarget.code}</strong> ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#f3e8e7] px-6 py-4 dark:border-dark-3">
              <button className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]" onClick={() => setDeleteTarget(null)} type="button">ยกเลิก</button>
              <button className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:opacity-70" disabled={isDeleting} onClick={() => void confirmDelete()} type="button">
                {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
