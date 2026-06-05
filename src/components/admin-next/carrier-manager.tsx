"use client";
import { useEffect, useRef, useState } from "react";
import { StatusPill } from "./page-elements";

type Carrier = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  logoUrl: string | null;
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
  tempImageFile: string;
  previewUrl: string;
  logoUrl: string;
};

const EMPTY_FORM: FormState = {
  name: "", shortName: "", color: "#000000", textColor: "#FFFFFF",
  trackingUrl: "", sortOrder: 0, tempImageFile: "", previewUrl: "", logoUrl: "",
};

export function CarrierManager() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    setForm({
      name: c.name, shortName: c.shortName, color: c.color, textColor: c.textColor,
      trackingUrl: c.trackingUrl ?? "", sortOrder: c.sortOrder,
      tempImageFile: "", previewUrl: c.logoUrl ?? "", logoUrl: c.logoUrl ?? "",
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/temp", { method: "POST", body: fd });
      const data = await res.json() as { filename: string; url: string };
      setForm(f => ({ ...f, tempImageFile: data.filename, previewUrl: data.url }));
    } catch {
      setError("อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.shortName.trim()) { setError("กรุณากรอกชื่อและชื่อย่อ"); return; }
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = {
      name: form.name, shortName: form.shortName, color: form.color,
      textColor: form.textColor, trackingUrl: form.trackingUrl, sortOrder: Number(form.sortOrder),
    };
    if (form.tempImageFile) payload.tempImageFile = form.tempImageFile;
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
              <th className="px-4 py-3">โลโก้</th>
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
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : carriers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-dark-5">ยังไม่มีผู้ให้บริการขนส่ง</td></tr>
            ) : carriers.map((c) => (
              <tr key={c.id} className="hover:bg-[#f8fbf9]">
                <td className="px-4 py-3">
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logoUrl} alt={c.name} className="h-8 w-8 rounded object-contain" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: c.color, color: c.textColor }}>
                      {c.shortName.slice(0, 2)}
                    </div>
                  )}
                </td>
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
              {/* Logo upload */}
              <div className="text-sm font-medium text-dark">โลโก้
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {form.previewUrl ? (
                  <div className="mt-1 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.previewUrl} alt="preview" className="h-14 w-14 rounded-lg border border-stroke object-contain p-1" />
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => fileRef.current?.click()} className="rounded-md border border-stroke px-3 py-1 text-xs font-medium text-dark hover:bg-[#f4fbf6]">
                        {uploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูป"}
                      </button>
                      <button type="button" onClick={() => setForm(f => ({ ...f, previewUrl: "", tempImageFile: "", logoUrl: "" }))} className="rounded-md border border-red-100 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50">
                        ลบรูป
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="mt-1 flex h-14 w-full items-center justify-center rounded-lg border border-dashed border-stroke bg-[#f8fbf9] text-xs text-dark-5 hover:border-[#45745a] hover:text-[#45745a] disabled:opacity-50"
                  >
                    {uploading ? "กำลังอัปโหลด..." : "+ เพิ่มรูปโลโก้"}
                  </button>
                )}
              </div>

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
              <div className="flex items-center justify-center gap-3">
                {form.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.previewUrl} alt="logo" className="h-8 w-8 rounded object-contain" />
                )}
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
              <button onClick={handleSave} disabled={saving || uploading} className="flex-1 rounded-full bg-[#45745a] py-2 text-sm font-semibold text-white hover:bg-[#355846] disabled:opacity-50">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
