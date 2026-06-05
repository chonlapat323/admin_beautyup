"use client";
import { useEffect, useState } from "react";
import { StatusPill } from "./page-elements";

type Carrier = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  trackingUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

type FormState = {
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  trackingUrl: string;
  sortOrder: number;
};

const EMPTY_FORM: FormState = { name: "", shortName: "", color: "#000000", textColor: "#FFFFFF", trackingUrl: "", sortOrder: 0 };

export function CarrierManager() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/carriers");
    const data = await res.json();
    setCarriers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(c: Carrier) {
    setEditingId(c.id);
    setForm({ name: c.name, shortName: c.shortName, color: c.color, textColor: c.textColor, trackingUrl: c.trackingUrl ?? "", sortOrder: c.sortOrder });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.shortName.trim()) { setError("กรุณากรอกชื่อและชื่อย่อ"); return; }
    setSaving(true);
    setError(null);
    const payload = { ...form, sortOrder: Number(form.sortOrder) };
    const res = editingId
      ? await fetch(`/api/carriers/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/carriers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.message ?? "เกิดข้อผิดพลาด"); return; }
    setModalOpen(false);
    load();
  }

  async function handleToggle(c: Carrier) {
    await fetch(`/api/carriers/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !c.isActive }) });
    load();
  }

  async function handleDelete(c: Carrier) {
    if (!window.confirm(`ลบ "${c.name}" ใช่หรือไม่?`)) return;
    await fetch(`/api/carriers/${c.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={openCreate} className="rounded-full bg-[#45745a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#355846]">
          + เพิ่มผู้ให้บริการ
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stroke">
        <table className="w-full text-sm">
          <thead className="bg-[#f8fbf9] text-left text-xs font-semibold uppercase tracking-wider text-dark-5">
            <tr>
              <th className="px-4 py-3">ผู้ให้บริการ</th>
              <th className="px-4 py-3">ชื่อเต็ม</th>
              <th className="px-4 py-3">URL ติดตาม</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : carriers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-dark-5">ยังไม่มีผู้ให้บริการขนส่ง</td></tr>
            ) : carriers.map((c) => (
              <tr key={c.id} className="hover:bg-[#f8fbf9]">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: c.color, color: c.textColor }}>
                    {c.shortName}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-dark">{c.name}</td>
                <td className="px-4 py-3 max-w-xs truncate text-dark-5">{c.trackingUrl ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill label={c.isActive ? "เปิดใช้งาน" : "ปิด"} tone={c.isActive ? "success" : "default"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-[#f4fbf6]">แก้ไข</button>
                    <button onClick={() => handleToggle(c)} className="rounded-md border border-stroke px-3 py-1.5 text-xs font-medium text-dark hover:bg-[#f4fbf6]">
                      {c.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                    <button onClick={() => handleDelete(c)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-dark">{editingId ? "แก้ไขผู้ให้บริการ" : "เพิ่มผู้ให้บริการใหม่"}</h3>
            {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-dark">ชื่อเต็ม <span className="text-red-500">*</span>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-[#45745a]" placeholder="เช่น Kerry Express" />
              </label>
              <label className="block text-sm font-medium text-dark">ชื่อย่อ <span className="text-red-500">*</span>
                <input value={form.shortName} onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))} className="mt-1 w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-[#45745a]" placeholder="เช่น KERRY" />
              </label>
              <div className="flex gap-3">
                <label className="flex-1 text-sm font-medium text-dark">สีพื้นหลัง
                  <div className="mt-1 flex items-center gap-2">
                    <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-stroke p-0.5" />
                    <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="flex-1 rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-[#45745a]" placeholder="#000000" />
                  </div>
                </label>
                <label className="flex-1 text-sm font-medium text-dark">สีตัวอักษร
                  <div className="mt-1 flex items-center gap-2">
                    <input type="color" value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded border border-stroke p-0.5" />
                    <input value={form.textColor} onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))} className="flex-1 rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-[#45745a]" placeholder="#FFFFFF" />
                  </div>
                </label>
              </div>
              <div className="mt-2 flex items-center justify-center">
                <span className="rounded-md px-4 py-1.5 text-sm font-bold" style={{ backgroundColor: form.color, color: form.textColor }}>
                  {form.shortName || "ตัวอย่าง"}
                </span>
              </div>
              <label className="block text-sm font-medium text-dark">URL ติดตามพัสดุ
                <input value={form.trackingUrl} onChange={e => setForm(f => ({ ...f, trackingUrl: e.target.value }))} className="mt-1 w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-[#45745a]" placeholder="https://... ใส่ {tracking} แทนเลขพัสดุ" />
              </label>
              <label className="block text-sm font-medium text-dark">ลำดับการแสดง
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-stroke px-3 py-2 text-sm outline-none focus:border-[#45745a]" />
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-full border border-stroke py-2 text-sm font-semibold text-dark hover:bg-[#f4fbf6]">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-full bg-[#45745a] py-2 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
