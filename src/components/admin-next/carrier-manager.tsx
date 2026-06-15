"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/shared/toast-provider";
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
  isActive: boolean;
  tempImageFile: string;
  previewUrl: string;
};

const EMPTY_FORM: FormState = {
  name: "", shortName: "", color: "#000000", textColor: "#FFFFFF",
  trackingUrl: "", sortOrder: 0, isActive: true, tempImageFile: "", previewUrl: "",
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
  const { showToast } = useToast();
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
      trackingUrl: c.trackingUrl ?? "", sortOrder: c.sortOrder, isActive: c.isActive,
      tempImageFile: "", previewUrl: c.logoUrl ?? "",
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
      showToast("อัปโหลดรูปไม่สำเร็จ", "error");
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
      textColor: form.textColor, trackingUrl: form.trackingUrl,
      sortOrder: Number(form.sortOrder), isActive: form.isActive,
    };
    if (form.tempImageFile) payload.tempImageFile = form.tempImageFile;
    const res = editingId
      ? await fetch(`/api/carriers/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/carriers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      const msg = d.message ?? "เกิดข้อผิดพลาด";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    showToast(editingId ? "อัปเดตผู้ให้บริการสำเร็จ" : "เพิ่มผู้ให้บริการสำเร็จ", "success");
    setModalOpen(false);
    load();
  }

  async function handleDelete(c: Carrier) {
    if (!window.confirm(`ลบ "${c.name}" ใช่หรือไม่?`)) return;
    const res = await fetch(`/api/carriers/${c.id}`, { method: "DELETE" });
    if (res.ok) showToast(`ลบ "${c.name}" สำเร็จ`, "warning");
    else showToast("ไม่สามารถลบได้", "error");
    load();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={openCreate}
          className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
        >
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
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : carriers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-dark-5">ยังไม่มีผู้ให้บริการขนส่ง</td>
              </tr>
            ) : carriers.map((c) => (
              <tr key={c.id} className="hover:bg-[#f8fbf9]">
                <td className="px-4 py-3">
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logoUrl} alt={c.name} className="h-8 w-8 rounded object-contain" />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold"
                      style={{ backgroundColor: c.color, color: c.textColor }}
                    >
                      {c.shortName.slice(0, 2)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold"
                    style={{ backgroundColor: c.color, color: c.textColor }}
                  >
                    {c.shortName}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-dark">{c.name}</td>
                <td className="max-w-xs truncate px-4 py-3 text-dark-5">{c.trackingUrl ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill label={c.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"} tone={c.isActive ? "success" : "danger"} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEdit(c)}
                      className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] transition-colors hover:bg-[#fff5f4]"
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-6">
          <div
            className="flex w-full max-w-md flex-col rounded-[28px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
            style={{ maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
              <div>
                <h3 className="text-lg font-bold text-dark dark:text-white">
                  {editingId ? "แก้ไขผู้ให้บริการ" : "เพิ่มผู้ให้บริการใหม่"}
                </h3>
                <p className="mt-0.5 text-xs text-dark-5 dark:text-dark-6">
                  {editingId ? "แก้ไขข้อมูลผู้ให้บริการขนส่ง" : "กรอกข้อมูลเพื่อเพิ่มผู้ให้บริการใหม่"}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-dark-5 transition-colors hover:bg-neutral-100 dark:hover:bg-dark-2"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 px-6 py-5">
                {error && (
                  <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
                )}

                {/* Logo upload */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">โลโก้</label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {form.previewUrl ? (
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.previewUrl}
                        alt="carrier logo preview"
                        className="h-24 w-40 rounded-xl border border-[#d8e6dd] object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, previewUrl: "", tempImageFile: "" }))}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c84b44] text-xs text-white hover:bg-[#ad3d37]"
                      >
                        ×
                      </button>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="mt-2 block text-xs text-[#45745a] underline"
                      >
                        เปลี่ยนรูป
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex h-24 w-40 items-center justify-center rounded-xl border-2 border-dashed border-[#d8e6dd] bg-[#f8fbf9] text-sm text-dark-5 transition-colors hover:border-[#5f8f74] hover:bg-[#f0f8f4] disabled:opacity-50"
                    >
                      {uploading ? "กำลังอัปโหลด..." : "+ เพิ่มรูป"}
                    </button>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    ชื่อเต็ม <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="เช่น Kerry Express"
                    className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                {/* Short name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">
                    ชื่อย่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.shortName}
                    onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
                    placeholder="เช่น KERRY"
                    className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                {/* Colors */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">สีพื้นหลัง</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-[#d8e6dd] p-0.5"
                    />
                    <input
                      value={form.color}
                      onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      className="min-w-0 flex-1 rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">สีตัวอักษร</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.textColor}
                      onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))}
                      className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-[#d8e6dd] p-0.5"
                    />
                    <input
                      value={form.textColor}
                      onChange={e => setForm(f => ({ ...f, textColor: e.target.value }))}
                      className="min-w-0 flex-1 rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>

                {/* Badge preview */}
                <div className="flex items-center gap-3 rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3">
                  <span className="text-xs text-dark-5">ตัวอย่าง</span>
                  {form.previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.previewUrl} alt="" className="h-6 w-6 rounded object-contain" />
                  )}
                  <span
                    className="rounded-md px-3 py-1 text-sm font-bold"
                    style={{ backgroundColor: form.color, color: form.textColor }}
                  >
                    {form.shortName || "DEMO"}
                  </span>
                </div>

                {/* Tracking URL */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">URL ติดตามพัสดุ</label>
                  <input
                    value={form.trackingUrl}
                    onChange={e => setForm(f => ({ ...f, trackingUrl: e.target.value }))}
                    placeholder="https://... ใส่ {tracking} แทนเลขพัสดุ"
                    className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                {/* Sort order */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">ลำดับการแสดง</label>
                  <input
                    type="number"
                    min="0"
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">สถานะ</label>
                  <select
                    value={form.isActive ? "active" : "inactive"}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.value === "active" }))}
                    className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  >
                    <option value="active">เปิดใช้งาน</option>
                    <option value="inactive">ปิดใช้งาน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-stroke px-6 py-4 dark:border-dark-3">
              <button
                onClick={() => setModalOpen(false)}
                type="button"
                className="rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                type="button"
                className="rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มผู้ให้บริการ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
