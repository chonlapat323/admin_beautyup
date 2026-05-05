"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/shared/toast-provider";
import { ProductImageManager, type PreviewImage } from "./product-image-manager";
import { ContentCard, StatusPill } from "./page-elements";

type RewardProductImage = {
  id: string;
  url: string;
  sortOrder: number;
};

type RewardProduct = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  images: RewardProductImage[];
  pointCost: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
};

type FormState = {
  name: string;
  description: string;
  pointCost: string;
  stock: string;
  isActive: boolean;
};

const INITIAL_FORM: FormState = {
  name: "",
  description: "",
  pointCost: "",
  stock: "",
  isActive: true,
};

function RewardProductModal({
  title,
  form,
  images,
  isSubmitting,
  onChange,
  onImagesChange,
  onClose,
  onSubmit,
}: {
  title: string;
  form: FormState;
  images: PreviewImage[];
  isSubmitting: boolean;
  onChange: (next: Partial<FormState>) => void;
  onImagesChange: React.Dispatch<React.SetStateAction<PreviewImage[]>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}) {
  const inputCls =
    "w-full rounded-[14px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark focus:border-[#5f8f74] focus:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white";

  async function handleFilesDropped(files: File[]) {
    const pending: PreviewImage[] = files.map((f) => ({
      key: `${Date.now()}-${f.name}`,
      url: URL.createObjectURL(f),
      kind: "temp",
      uploading: true,
      error: false,
    }));
    onImagesChange([...images, ...pending]);

    const results = await Promise.allSettled(
      files.map(async (f, i) => {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch("/api/uploads/temp", { method: "POST", body: fd });
        const data = await res.json() as { filename: string; url: string };
        if (!res.ok) throw new Error("upload failed");
        return { key: pending[i].key, filename: data.filename, url: data.url };
      }),
    );

    onImagesChange((prev: PreviewImage[]) =>
      prev.map((img) => {
        const idx = pending.findIndex((p) => p.key === img.key);
        if (idx === -1) return img;
        const r = results[idx];
        if (r.status === "fulfilled") {
          return { ...img, url: r.value.url, tempFilename: r.value.filename, uploading: false };
        }
        return { ...img, uploading: false, error: true };
      }),
    );
  }

  async function handleRemove(key: string) {
    const img = images.find((i) => i.key === key);
    if (img?.kind === "temp" && img.tempFilename) {
      void fetch(`/api/uploads/temp/${img.tempFilename}`, { method: "DELETE" });
    }
    onImagesChange(images.filter((i) => i.key !== key));
  }

  function handleReorder(from: number, to: number) {
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onImagesChange(next);
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4">
      <div className="w-full max-w-lg rounded-[24px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
        <div className="flex items-center justify-between border-b border-[#edf4ef] px-6 py-5 dark:border-dark-3">
          <h3 className="text-lg font-semibold text-dark dark:text-white">{title}</h3>
          <button onClick={onClose} type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2]">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">ชื่อสินค้า <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="เช่น ครีมบำรุงผม" required />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">รายละเอียด</label>
            <input className={inputCls} value={form.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="รายละเอียดสั้นๆ" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">รูปภาพ</label>
            <ProductImageManager
              images={images}
              onFilesDropped={handleFilesDropped}
              onRemove={handleRemove}
              onReorder={handleReorder}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">แต้มที่ใช้ <span className="text-red-500">*</span></label>
              <input className={inputCls} type="number" min={1} value={form.pointCost} onChange={(e) => onChange({ pointCost: e.target.value })} placeholder="500" required />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-dark dark:text-white">จำนวนสต็อก <span className="text-red-500">*</span></label>
              <input className={inputCls} type="number" min={0} value={form.stock} onChange={(e) => onChange({ stock: e.target.value })} placeholder="10" required />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onChange({ isActive: !form.isActive })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? "bg-[#5f8f74]" : "bg-dark-4"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm text-dark dark:text-white">{form.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full border border-[#d8e6dd] px-5 py-2.5 text-sm font-medium text-dark hover:bg-[#f8fbf9]">
              ยกเลิก
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-full bg-[#5f8f74] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4e7a61] disabled:opacity-60">
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export function RewardProductManager({ initialItems }: { initialItems: RewardProduct[] }) {
  const [items, setItems] = useState(initialItems);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<RewardProduct | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [modalImages, setModalImages] = useState<PreviewImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => { setItems(initialItems); }, [initialItems]);

  function updateForm(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function openEdit(item: RewardProduct) {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      pointCost: String(item.pointCost),
      stock: String(item.stock),
      isActive: item.isActive,
    });
    setModalImages(
      item.images.map((img) => ({
        key: img.id,
        url: img.url,
        kind: "existing" as const,
        existingId: img.id,
        uploading: false,
        error: false,
      })),
    );
  }

  function closeModal() {
    setShowCreate(false);
    setEditItem(null);
    setForm(INITIAL_FORM);
    setModalImages([]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const readyImages = modalImages.filter((i) => !i.uploading && !i.error);
      const tempFiles = readyImages
        .filter((i) => i.kind === "temp")
        .map((i) => i.tempFilename!);

      const body: Record<string, unknown> = {
        name: form.name,
        pointCost: Number(form.pointCost),
        stock: Number(form.stock),
        isActive: form.isActive,
      };
      if (form.description) body.description = form.description;
      if (tempFiles.length > 0) body.tempFiles = tempFiles;

      const res = await fetch("/api/reward-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => [data, ...prev]);
      closeModal();
      showToast("สร้างสินค้าแลกแต้มสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setIsSubmitting(true);
    try {
      const readyImages = modalImages.filter((i) => !i.uploading && !i.error);
      const orderedImages = readyImages.map((img) =>
        img.kind === "existing"
          ? { kind: "existing" as const, id: img.existingId! }
          : { kind: "temp" as const, filename: img.tempFilename! },
      );

      const body: Record<string, unknown> = {
        name: form.name,
        pointCost: Number(form.pointCost),
        stock: Number(form.stock),
        isActive: form.isActive,
        description: form.description || null,
        orderedImages,
      };

      const res = await fetch(`/api/reward-products/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => prev.map((i) => (i.id === editItem.id ? data : i)));
      closeModal();
      showToast("แก้ไขสินค้าแลกแต้มสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: RewardProduct) {
    if (!confirm(`ยืนยันการลบ "${item.name}"?`)) return;
    try {
      const res = await fetch(`/api/reward-products/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast("ลบสินค้าแลกแต้มสำเร็จ", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    }
  }

  return (
    <>
      <ContentCard
        title="สินค้าแลกแต้ม"
        description="จัดการสินค้าที่สมาชิกสามารถแลกด้วยแต้มสะสม"
        aside={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-full bg-[#5f8f74] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4e7a61]"
          >
            + เพิ่มสินค้า
          </button>
        }
      >
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8e6dd] py-16 text-center dark:border-dark-3">
            <p className="text-dark-5 dark:text-dark-6">ยังไม่มีสินค้าแลกแต้ม</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fbf9] dark:bg-dark-2">
                  <th className="px-5 py-4 text-left font-semibold text-dark dark:text-white">สินค้า</th>
                  <th className="px-5 py-4 text-center font-semibold text-dark dark:text-white">แต้มที่ใช้</th>
                  <th className="px-5 py-4 text-center font-semibold text-dark dark:text-white">สต็อก</th>
                  <th className="px-5 py-4 text-center font-semibold text-dark dark:text-white">สถานะ</th>
                  <th className="px-5 py-4 text-center font-semibold text-dark dark:text-white">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-stroke dark:border-dark-3">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {item.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover border border-[#d8e6dd] flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-[#f0f7f2] flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-dark dark:text-white">{item.name}</p>
                          {item.description && <p className="text-xs text-dark-5 dark:text-dark-6">{item.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-semibold text-[#5f8f74]">{item.pointCost.toLocaleString()} pts</td>
                    <td className="px-5 py-4 text-center text-dark dark:text-white">{item.stock}</td>
                    <td className="px-5 py-4 text-center">
                      <StatusPill label={item.isActive ? "เปิด" : "ปิด"} tone={item.isActive ? "success" : "default"} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-full px-3 py-1 text-xs font-medium text-[#5f8f74] hover:bg-[#f0f7f2]"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="rounded-full px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
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
        )}
      </ContentCard>

      {showCreate && (
        <RewardProductModal
          title="เพิ่มสินค้าแลกแต้ม"
          form={form}
          images={modalImages}
          isSubmitting={isSubmitting}
          onChange={updateForm}
          onImagesChange={setModalImages}
          onClose={closeModal}
          onSubmit={handleCreate}
        />
      )}
      {editItem && (
        <RewardProductModal
          title="แก้ไขสินค้าแลกแต้ม"
          form={form}
          images={modalImages}
          isSubmitting={isSubmitting}
          onChange={updateForm}
          onImagesChange={setModalImages}
          onClose={closeModal}
          onSubmit={handleEdit}
        />
      )}
    </>
  );
}
