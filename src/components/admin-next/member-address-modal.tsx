"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";

export type MemberAddress = {
  id: string;
  label?: string | null;
  recipient: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  isDefault: boolean;
};

type AddressFormState = {
  label: string;
  recipient: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  district: string;
  province: string;
  postalCode: string;
};

const EMPTY_FORM: AddressFormState = {
  label: "",
  recipient: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  district: "",
  province: "",
  postalCode: "",
};

function formFromAddress(addr: MemberAddress): AddressFormState {
  return {
    label: addr.label ?? "",
    recipient: addr.recipient,
    phone: addr.phone,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2 ?? "",
    district: addr.district ?? "",
    province: addr.province ?? "",
    postalCode: addr.postalCode ?? "",
  };
}

const inputCls =
  "w-full rounded-[14px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white";

function AddressForm({
  form,
  isSubmitting,
  editingId,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: AddressFormState;
  isSubmitting: boolean;
  editingId: string | null;
  onChange: (next: Partial<AddressFormState>) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] p-5 dark:border-dark-3 dark:bg-dark-2">
      <p className="text-sm font-semibold text-dark dark:text-white">
        {editingId ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-dark-5">ชื่อที่อยู่ (เช่น บ้าน, ที่ทำงาน)</label>
          <input className={inputCls} value={form.label} onChange={(e) => onChange({ label: e.target.value })} placeholder="บ้าน" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-dark-5">ชื่อผู้รับ *</label>
          <input className={inputCls} value={form.recipient} onChange={(e) => onChange({ recipient: e.target.value })} placeholder="ชื่อ-นามสกุลผู้รับ" required />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-dark-5">เบอร์โทรผู้รับ *</label>
        <input className={inputCls} value={form.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="0812345678" required />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-dark-5">ที่อยู่บรรทัด 1 *</label>
        <input className={inputCls} value={form.addressLine1} onChange={(e) => onChange({ addressLine1: e.target.value })} placeholder="บ้านเลขที่ / ถนน / ซอย" required />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-dark-5">ที่อยู่บรรทัด 2</label>
        <input className={inputCls} value={form.addressLine2} onChange={(e) => onChange({ addressLine2: e.target.value })} placeholder="อาคาร / ห้อง / หมู่บ้าน (ถ้ามี)" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-dark-5">เขต/อำเภอ</label>
          <input className={inputCls} value={form.district} onChange={(e) => onChange({ district: e.target.value })} placeholder="คลองเตย" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-dark-5">จังหวัด</label>
          <input className={inputCls} value={form.province} onChange={(e) => onChange({ province: e.target.value })} placeholder="กรุงเทพมหานคร" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-dark-5">รหัสไปรษณีย์</label>
          <input className={inputCls} value={form.postalCode} onChange={(e) => onChange({ postalCode: e.target.value })} placeholder="10110" maxLength={5} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="rounded-full border border-[#d8e6dd] px-4 py-2 text-sm font-medium text-dark hover:bg-white dark:border-dark-3 dark:text-white">
          ยกเลิก
        </button>
        <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#5f8f74] px-4 py-2 text-sm font-medium text-white hover:bg-[#4e7a61] disabled:opacity-60">
          {isSubmitting ? "กำลังบันทึก..." : editingId ? "บันทึก" : "เพิ่มที่อยู่"}
        </button>
      </div>
    </form>
  );
}

function AddressCard({
  addr,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  addr: MemberAddress;
  onEdit: (addr: MemberAddress) => void;
  onDelete: (addr: MemberAddress) => void;
  onSetDefault: (addr: MemberAddress) => void;
}) {
  const lines = [
    addr.addressLine1,
    addr.addressLine2,
    [addr.district, addr.province].filter(Boolean).join(" "),
    addr.postalCode,
  ].filter(Boolean);

  return (
    <div className={`rounded-2xl border p-4 ${addr.isDefault ? "border-[#5f8f74] bg-[#f0faf3]" : "border-[#e2ede6] bg-white"} dark:bg-dark-2 dark:border-dark-3`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            {addr.label && <span className="text-xs font-semibold uppercase tracking-wide text-[#5f8f74]">{addr.label}</span>}
            {addr.isDefault && (
              <span className="rounded-full bg-[#5f8f74] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                ที่อยู่หลัก
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-semibold text-dark dark:text-white">{addr.recipient}</p>
          <p className="text-xs text-dark-5">{addr.phone}</p>
        </div>
      </div>
      <p className="text-sm text-dark-5 dark:text-dark-6">{lines.join(", ")}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {!addr.isDefault && (
          <button
            onClick={() => onSetDefault(addr)}
            className="rounded-full border border-[#d8e6dd] px-3 py-1 text-xs font-medium text-[#5f8f74] hover:bg-[#f0faf3]"
          >
            ตั้งเป็นที่อยู่หลัก
          </button>
        )}
        <button
          onClick={() => onEdit(addr)}
          className="rounded-full border border-[#d8e6dd] px-3 py-1 text-xs font-medium text-dark hover:bg-[#f8fbf9] dark:text-white"
        >
          แก้ไข
        </button>
        <button
          onClick={() => onDelete(addr)}
          className="rounded-full px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          ลบ
        </button>
      </div>
    </div>
  );
}

export function MemberAddressModal({
  memberId,
  memberName,
  onClose,
}: {
  memberId: string;
  memberName: string;
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<MemberAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void loadAddresses();
  }, []);

  async function loadAddresses() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}/addresses`);
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch {
      showToast("โหลดที่อยู่ไม่สำเร็จ", "error");
    } finally {
      setIsLoading(false);
    }
  }

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function startEdit(addr: MemberAddress) {
    setEditingId(addr.id);
    setForm(formFromAddress(addr));
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const body = {
        label: form.label || undefined,
        recipient: form.recipient,
        phone: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        district: form.district || undefined,
        province: form.province || undefined,
        postalCode: form.postalCode || undefined,
      };

      const url = editingId
        ? `/api/members/${memberId}/addresses/${editingId}`
        : `/api/members/${memberId}/addresses`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");

      showToast(editingId ? "แก้ไขที่อยู่สำเร็จ" : "เพิ่มที่อยู่สำเร็จ", "success");
      cancelForm();
      await loadAddresses();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(addr: MemberAddress) {
    if (!confirm(`ลบที่อยู่ "${addr.label || addr.addressLine1}"?`)) return;
    try {
      const res = await fetch(`/api/members/${memberId}/addresses/${addr.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      showToast("ลบที่อยู่สำเร็จ", "success");
      await loadAddresses();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  async function handleSetDefault(addr: MemberAddress) {
    try {
      const res = await fetch(`/api/members/${memberId}/addresses/${addr.id}/default`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      showToast("ตั้งที่อยู่หลักสำเร็จ", "success");
      await loadAddresses();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="w-full max-w-xl overflow-y-auto rounded-[28px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between border-b border-[#edf4ef] px-6 py-5 dark:border-dark-3">
          <div>
            <h3 className="text-lg font-bold text-dark dark:text-white">ที่อยู่ของ {memberName}</h3>
            <p className="mt-0.5 text-sm text-dark-5">{addresses.length} ที่อยู่</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-6">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-dark-5">กำลังโหลด...</div>
          ) : (
            <>
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  addr={addr}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                />
              ))}

              {addresses.length === 0 && !showForm && (
                <div className="rounded-2xl border border-dashed border-[#d8e6dd] py-10 text-center dark:border-dark-3">
                  <p className="text-sm text-dark-5">ยังไม่มีที่อยู่</p>
                </div>
              )}

              {showForm ? (
                <AddressForm
                  form={form}
                  isSubmitting={isSubmitting}
                  editingId={editingId}
                  onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
                  onSubmit={handleSubmit}
                  onCancel={cancelForm}
                />
              ) : (
                <button
                  onClick={startAdd}
                  className="w-full rounded-2xl border border-dashed border-[#5f8f74] py-3 text-sm font-medium text-[#5f8f74] hover:bg-[#f0faf3] dark:hover:bg-dark-2"
                >
                  + เพิ่มที่อยู่
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
