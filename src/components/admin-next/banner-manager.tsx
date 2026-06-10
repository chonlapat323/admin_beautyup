"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useToast } from "@/components/shared/toast-provider";
import { ContentCard } from "./page-elements";

type ApiBanner = {
  id: string;
  eyebrow: string;
  title: string;
  body?: string | null;
  tag?: string | null;
  buttonLabel: string;
  imageUrl?: string | null;
  linkType: string;
  linkId?: string | null;
  sortOrder: number;
  isActive: boolean;
};

type BannerFormState = {
  eyebrow: string;
  title: string;
  body: string;
  tag: string;
  buttonLabel: string;
  linkType: string;
  linkId: string;
  isActive: boolean;
};

const INITIAL_FORM: BannerFormState = {
  eyebrow: "",
  title: "",
  body: "",
  tag: "",
  buttonLabel: "Shop Now",
  linkType: "none",
  linkId: "",
  isActive: true,
};

const LINK_TYPE_OPTIONS = [
  { label: "ไม่มีลิงก์", value: "none" },
  { label: "สินค้า (ProductDetail)", value: "product" },
  { label: "หมวดหมู่ (Category)", value: "category" },
];

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-sm transition-colors
        ${active
          ? "bg-[#45745a] text-white"
          : "text-dark hover:bg-[#eef7f2] dark:text-white dark:hover:bg-dark-2"
        }`}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function RichBodyEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[96px] px-4 py-3 text-sm text-dark dark:text-white outline-none",
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] focus-within:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#d8e6dd] bg-white px-2.5 py-2 dark:border-dark-3 dark:bg-dark-3">
        <ToolbarBtn active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} title="ตัวหนา (Bold)">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} title="ตัวเอียง (Italic)">
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="ขีดเส้นใต้ (Underline)">
          <span style={{ textDecoration: "underline" }}>U</span>
        </ToolbarBtn>
        <ToolbarBtn active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()} title="ขีดฆ่า (Strike)">
          <span style={{ textDecoration: "line-through" }}>S</span>
        </ToolbarBtn>
        <div className="mx-1 h-4 w-px bg-[#d8e6dd] dark:bg-dark-3" />
        <ToolbarBtn active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="รายการ (Bullet list)">
          <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
            <line x1="9" x2="20" y1="6" y2="6" /><line x1="9" x2="20" y1="12" y2="12" /><line x1="9" x2="20" y1="18" y2="18" />
            <circle cx="4" cy="6" fill="currentColor" r="1.5" /><circle cx="4" cy="12" fill="currentColor" r="1.5" /><circle cx="4" cy="18" fill="currentColor" r="1.5" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn active={false} onClick={() => editor?.chain().focus().undo().run()} title="ย้อนกลับ (Undo)">
          <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
            <path d="M3 7v6h6" /><path d="M3 13C5.4 7.4 12 4 18 7.5" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn active={false} onClick={() => editor?.chain().focus().redo().run()} title="ทำซ้ำ (Redo)">
          <svg fill="none" height="14" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14">
            <path d="M21 7v6h-6" /><path d="M21 13C18.6 7.4 12 4 6 7.5" />
          </svg>
        </ToolbarBtn>
      </div>
      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}

function BannerPreview({ form, imagePreview }: { form: BannerFormState; imagePreview: string | null }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dark-5 dark:text-dark-6">
        Live Preview — iPhone 11 (414px)
      </p>
      {/* iPhone 11: 414px logical width */}
      <div className="mx-auto" style={{ width: 360 }}>
        <div
          className="relative bg-[#1c1c1e]"
          style={{
            borderRadius: 46,
            padding: "14px 7px 24px",
            boxShadow: "0 0 0 2px #3a3a3c, inset 0 0 0 2px #2c2c2e, 0 28px 56px rgba(0,0,0,0.65)",
          }}
        >
          {/* Notch */}
          <div className="absolute left-1/2 -translate-x-1/2 bg-[#1c1c1e]" style={{ top: 14, width: 125, height: 25, borderRadius: "0 0 18px 18px", zIndex: 10 }} />
          {/* Side buttons */}
          <div className="absolute -left-[4px] top-24 h-9 w-[4px] rounded-l-sm bg-[#3a3a3c]" />
          <div className="absolute -left-[4px] top-36 h-9 w-[4px] rounded-l-sm bg-[#3a3a3c]" />
          <div className="absolute -right-[4px] top-28 h-14 w-[4px] rounded-r-sm bg-[#3a3a3c]" />

          {/* Screen */}
          <div className="overflow-hidden" style={{ borderRadius: 37, height: 470, backgroundColor: "#046340", fontFamily: "'Noto Sans Thai', sans-serif" }}>
            {/* Status bar */}
            <div className="flex items-center justify-between px-6" style={{ height: 52, paddingTop: 16 }}>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>9:41</span>
              <div className="flex items-center gap-1.5">
                <svg fill="white" height="11" viewBox="0 0 15 10" width="17"><rect height="7" rx="0.5" width="3" x="0" y="3" /><rect height="8" rx="0.5" width="3" x="4" y="2" /><rect height="9" rx="0.5" width="3" x="8" y="1" /><rect height="10" rx="0.5" width="3" x="12" y="0" /></svg>
                <svg fill="white" height="11" viewBox="0 0 14 10" width="15"><path d="M7 2.5C4.5 2.5 2.3 3.5.8 5.2L0 4.3C1.8 2.3 4.3 1 7 1s5.2 1.3 7 3.3l-.8.9C11.7 3.5 9.5 2.5 7 2.5z" /><path d="M7 5c-1.5 0-2.8.6-3.8 1.5L2.4 5.7C3.6 4.5 5.2 3.7 7 3.7s3.4.8 4.6 2L10.8 6.5C9.8 5.6 8.5 5 7 5z" /><circle cx="7" cy="8" r="1.5" /></svg>
                <svg fill="none" height="13" viewBox="0 0 25 12" width="27"><rect height="10" rx="3.5" strokeOpacity=".35" stroke="white" width="21" x="0.5" y="1" /><rect fill="white" height="7" rx="2" width="16" x="2" y="2.5" /><path d="M23 4.5v3a1.5 1.5 0 000-3z" fill="white" fillOpacity=".4" /></svg>
              </div>
            </div>

            {/* App content — px:16 matches RN spacing.lg */}
            <div style={{ padding: "0 16px 24px" }}>
              {/* App header row */}
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500, margin: 0 }}>สวัสดีตอนเช้า</p>
                  <p style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>BeautyUp</p>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg fill="white" height="18" viewBox="0 0 24 24" width="18"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                </div>
              </div>

              {/* HeroSlide card — exact values from HeroSlide.tsx + theme/tokens.ts */}
              {/* card: padding 24, borderRadius 28, bg #fff, border rgba(255,255,255,0.12), shadow */}
              <div
                className="relative overflow-hidden"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  padding: 24,
                  borderRadius: 28,
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 10px 18px rgba(138,104,112,0.08)",
                  gap: 0,
                }}
              >
                {/* copy — flex:1, paddingRight:16, gap:12 */}
                <div style={{ flex: 1, paddingRight: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* eyebrow: color #D4AF37, fontSize 11, letterSpacing 1.8, semiBold, uppercase */}
                  <p style={{ color: form.eyebrow ? "#D4AF37" : "rgba(212,175,55,0.25)", fontSize: 11, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase", margin: 0 }}>
                    {form.eyebrow || "EYEBROW"}
                  </p>
                  {/* title: color #1a1a1a, fontSize 26, lineHeight 32, fontWeight 600, maxWidth 180 */}
                  <p style={{ color: form.title ? "#1a1a1a" : "rgba(26,26,26,0.2)", fontSize: 26, lineHeight: "32px", fontWeight: 600, maxWidth: 180, margin: 0 }}>
                    {form.title || "หัวข้อหลัก"}
                  </p>
                  {/* body: color #6b7280, fontSize 15, lineHeight 22 */}
                  {form.body ? (
                    <div
                      style={{ color: "#6b7280", fontSize: 15, lineHeight: "22px", margin: 0 }}
                      className="[&_b]:font-bold [&_strong]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_s]:line-through [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: form.body }}
                    />
                  ) : null}
                  {/* button: bg #D4AF37, px 20, py 12, borderRadius pill, color #1A0F00, fontSize 13, fontWeight 700 */}
                  <div style={{ marginTop: 8 }}>
                    <span style={{
                      display: "inline-block",
                      backgroundColor: "#D4AF37",
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 12,
                      paddingBottom: 12,
                      borderRadius: 999,
                      color: "#1A0F00",
                      fontSize: 13,
                      fontWeight: 700,
                      boxShadow: "0 4px 8px rgba(212,175,55,0.35)",
                    }}>
                      {form.buttonLabel || "Shop Now"}
                    </span>
                  </div>
                </div>

                {/* visual — width 128, borderRadius 20 */}
                <div style={{ width: 128, borderRadius: 20, overflow: "hidden", backgroundColor: "#eef8f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {imagePreview ? (
                    <img alt="banner" src={imagePreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 36, opacity: 0.2 }}>🖼</span>
                  )}
                </div>

                {/* tag badge */}
                {form.tag ? (
                  <div style={{ position: "absolute", top: 10, right: 10, backgroundColor: "#D4AF37", paddingLeft: 10, paddingRight: 10, paddingTop: 4, paddingBottom: 4, borderRadius: 999 }}>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{form.tag}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="mt-3 flex justify-center">
            <div className="h-1.5 w-24 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BannerFormModal({
  editingId,
  form,
  isSubmitting,
  categories,
  products,
  imageFile,
  imagePreview,
  onChange,
  onImageChange,
  onClose,
  onSubmit,
}: {
  editingId: string | null;
  form: BannerFormState;
  isSubmitting: boolean;
  categories: { id: string; name: string }[];
  products: { id: string; name: string; sku: string }[];
  imageFile: File | null;
  imagePreview: string | null;
  onChange: (next: Partial<BannerFormState>) => void;
  onImageChange: (file: File) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/55 px-4 py-8">
      <div
        className="flex w-full max-w-xl flex-col rounded-[30px] border border-[#dce9e1] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[#edf4ef] px-7 py-6 dark:border-dark-3">
          <h3 className="text-2xl font-bold text-dark dark:text-white">
            {editingId ? "แก้ไขแบนเนอร์" : "เพิ่มแบนเนอร์"}
          </h3>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e7dc] text-dark-5 transition-colors hover:bg-[#f4fbf6] dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-2"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body: Form */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <form className="space-y-5 px-7 py-7" id="banner-form" onSubmit={onSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Eyebrow <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  onChange={(e) => onChange({ eyebrow: e.target.value })}
                  placeholder="เช่น Spring Ritual"
                  value={form.eyebrow}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  หัวข้อหลัก <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  onChange={(e) => onChange({ title: e.target.value })}
                  placeholder="เช่น Care That Feels Premium"
                  value={form.title}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">คำอธิบาย</label>
                <RichBodyEditor
                  key={editingId ?? "new"}
                  onChange={(v) => onChange({ body: v })}
                  placeholder="คำอธิบายสั้นๆ (ไม่บังคับ)"
                  value={form.body}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  Badge <span className="text-xs font-normal text-dark-5">(เช่น NEW, BEST SELLER — แสดงมุมบนขวาของ banner)</span>
                </label>
                <input
                  className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  onChange={(e) => onChange({ tag: e.target.value })}
                  placeholder="NEW / BEST SELLER (ไม่บังคับ)"
                  value={form.tag}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">ชื่อปุ่ม</label>
                <input
                  className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  onChange={(e) => onChange({ buttonLabel: e.target.value })}
                  placeholder="Shop Now"
                  value={form.buttonLabel}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">ลิงก์ปุ่ม</label>
                <select
                  className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  onChange={(e) => onChange({ linkType: e.target.value, linkId: "" })}
                  value={form.linkType}
                >
                  {LINK_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {form.linkType === "product" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    เลือกสินค้า <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    onChange={(e) => onChange({ linkId: e.target.value })}
                    value={form.linkId}
                  >
                    <option value="">เลือกสินค้า</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                    ))}
                  </select>
                </div>
              ) : form.linkType === "category" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    เลือกหมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-[18px] border border-[#d8e6dd] bg-[#f8fbf9] px-4 py-3 text-sm text-dark outline-none focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    onChange={(e) => onChange({ linkId: e.target.value })}
                    value={form.linkId}
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">รูปภาพ</label>
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageChange(f); }}
                  ref={fileRef}
                  type="file"
                />
                <button
                  className="flex h-14 w-full items-center justify-center rounded-[18px] border-2 border-dashed border-[#c8ddd1] bg-[#f8fbf9] text-sm text-[#5f8f74] transition-colors hover:border-[#5f8f74]"
                  onClick={() => fileRef.current?.click()}
                  type="button"
                >
                  {imagePreview ? (
                    <img alt="preview" className="h-12 w-auto rounded-lg object-cover" src={imagePreview} />
                  ) : (
                    "คลิกเพื่อเลือกรูป"
                  )}
                </button>
                {imageFile ? (
                  <p className="mt-1 text-xs text-dark-5">{imageFile.name}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
                  onClick={() => onChange({ isActive: !form.isActive })}
                  type="button"
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <span className="text-sm text-dark dark:text-white">{form.isActive ? "เผยแพร่" : "ซ่อน"}</span>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-wrap gap-3 border-t border-[#edf4ef] px-7 py-5 dark:border-dark-3">
          <button
            className="inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:opacity-70"
            disabled={isSubmitting}
            form="banner-form"
            type="submit"
          >
            {isSubmitting ? "กำลังบันทึก..." : editingId ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มแบนเนอร์"}
          </button>
          <button
            className="inline-flex items-center gap-1.5 justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={() => setIsPreviewOpen(true)}
            type="button"
          >
            <svg fill="none" height="15" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            ดูตัวอย่าง
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-3 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]"
            onClick={onClose}
            type="button"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>

    {/* Preview overlay */}
    {isPreviewOpen && (
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/70 px-4"
        onClick={() => setIsPreviewOpen(false)}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <BannerPreview form={form} imagePreview={imagePreview} />
          <button
            className="mt-4 mx-auto flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            onClick={() => setIsPreviewOpen(false)}
            type="button"
          >
            ปิดตัวอย่าง
          </button>
        </div>
      </div>
    )}
    </>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function BannerManager() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerFormState>(INITIAL_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewBanner, setPreviewBanner] = useState<ApiBanner | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  async function loadBanners() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/banners", { cache: "no-store" });
      const data = await res.json() as ApiBanner[];
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      showToast("ไม่สามารถโหลดแบนเนอร์ได้", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFormData() {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/categories?status=active&pageSize=100", { cache: "no-store" }),
        fetch("/api/products?status=active&pageSize=200", { cache: "no-store" }),
      ]);
      const catData = await catRes.json() as { items?: { id: string; name: string }[] };
      const prodData = await prodRes.json() as { items?: { id: string; name: string; sku: string }[] };
      setCategories(catData.items ?? []);
      setProducts(prodData.items ?? []);
    } catch {
      // silently fail
    }
  }

  useEffect(() => { void loadBanners(); }, []);
  useEffect(() => { if (isModalOpen) void loadFormData(); }, [isModalOpen]);

  function resetForm() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setImageFile(null);
    setImagePreview(null);
  }

  function startEdit(banner: ApiBanner) {
    setEditingId(banner.id);
    setForm({
      eyebrow: banner.eyebrow,
      title: banner.title,
      body: banner.body ?? "",
      tag: banner.tag ?? "",
      buttonLabel: banner.buttonLabel,
      linkType: banner.linkType,
      linkId: banner.linkId ?? "",
      isActive: banner.isActive,
    });
    setImagePreview(banner.imageUrl ?? null);
    setImageFile(null);
    setIsModalOpen(true);
  }

  function handleImageChange(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.eyebrow.trim() || !form.title.trim()) {
      showToast("กรุณากรอก Eyebrow และหัวข้อหลัก", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        eyebrow: form.eyebrow.trim(),
        title: form.title.trim(),
        body: form.body.replace(/^(<br\s*\/?>|\s)+$/i, "").trim() || undefined,
        tag: form.tag.trim() || null,
        buttonLabel: form.buttonLabel.trim() || "Shop Now",
        linkType: form.linkType,
        linkId: form.linkId || null,
        isActive: form.isActive,
      };

      let savedId = editingId;

      if (editingId) {
        await fetch(`/api/banners/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json() as ApiBanner;
        savedId = data.id;
      }

      if (imageFile && savedId) {
        const fd = new FormData();
        fd.append("file", imageFile);
        await fetch(`/api/banners/${savedId}/image`, { method: "POST", body: fd });
      }

      showToast(editingId ? "อัปเดตแบนเนอร์สำเร็จ" : "สร้างแบนเนอร์สำเร็จ", "success");
      setIsModalOpen(false);
      resetForm();
      await loadBanners();
    } catch {
      showToast("ไม่สามารถบันทึกแบนเนอร์ได้", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(banner: ApiBanner) {
    try {
      await fetch(`/api/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      setBanners((prev) => prev.map((b) => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
    } catch {
      showToast("ไม่สามารถเปลี่ยนสถานะได้", "error");
    }
  }

  async function handleConfirmDelete() {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/banners/${bannerToDelete}`, { method: "DELETE" });
      showToast("ลบแบนเนอร์สำเร็จ", "warning");
      setBannerToDelete(null);
      await loadBanners();
    } catch {
      showToast("ไม่สามารถลบแบนเนอร์ได้", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDrop(toIdx: number) {
    if (draggingIdx === null || draggingIdx === toIdx) return;
    const next = [...banners];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(toIdx, 0, moved);
    const reordered = next.map((b, i) => ({ ...b, sortOrder: i }));
    setBanners(reordered);
    setDraggingIdx(null);
    setDragOverIdx(null);
    try {
      await fetch("/api/banners/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reordered.map((b) => ({ id: b.id, sortOrder: b.sortOrder })) }),
      });
    } catch {
      showToast("ไม่สามารถบันทึกลำดับได้", "error");
      await loadBanners();
    }
  }

  const linkLabel = (b: ApiBanner) => {
    if (b.linkType === "product") return `สินค้า: ${products.find((p) => p.id === b.linkId)?.name ?? b.linkId ?? "-"}`;
    if (b.linkType === "category") return `หมวดหมู่: ${categories.find((c) => c.id === b.linkId)?.name ?? b.linkId ?? "-"}`;
    return "-";
  };

  const filteredBanners = banners.filter((b) =>
    !search.trim() ||
    b.title.toLowerCase().includes(search.trim().toLowerCase()) ||
    b.eyebrow.toLowerCase().includes(search.trim().toLowerCase())
  );
  const totalItems = filteredBanners.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedBanners = filteredBanners.slice((page - 1) * pageSize, page * pageSize);
  const hasFilter = search.trim() !== "";
  const dragEnabled = !hasFilter && totalPages === 1;

  return (
    <>
      <ContentCard
        title="จัดการแบนเนอร์"
        description="แบนเนอร์แสดงบนหน้าแรก mobile app ลากเพื่อเรียงลำดับ"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-60">
            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] py-2.5 pl-9 pr-4 text-sm text-dark outline-none transition-colors placeholder:text-dark-5 focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ค้นหา..."
              value={search}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              className="rounded-2xl border border-[#d8e6dd] bg-[#f8fbf9] px-3 py-2.5 text-sm text-dark outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              value={pageSize}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n} รายการ</option>
              ))}
            </select>
            <button
              className="shrink-0 inline-flex items-center justify-center rounded-full bg-[#45745a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846]"
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              type="button"
            >
              + เพิ่มแบนเนอร์
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full min-w-[360px] text-left">
            <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="hidden px-4 py-3 font-semibold w-8 sm:table-cell"></th>
                <th className="px-4 py-3 font-semibold">รูป</th>
                <th className="px-4 py-3 font-semibold">Eyebrow / หัวข้อ</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ลิงก์</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3 font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-stroke dark:border-dark-3">
                    <td className="hidden px-4 py-4 sm:table-cell"><div className="h-4 w-4 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-3 py-2"><div className="h-12 w-20 animate-pulse rounded-lg bg-dark-5/20" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-36 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="hidden px-4 py-4 md:table-cell"><div className="h-4 w-28 animate-pulse rounded bg-dark-5/20" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-11 animate-pulse rounded-full bg-dark-5/20" /></td>
                    <td className="px-4 py-4"><div className="h-7 w-20 animate-pulse rounded-full bg-dark-5/20" /></td>
                  </tr>
                ))
              ) : pagedBanners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f6f2] dark:bg-dark-2">
                        <svg className="h-7 w-7 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><rect height="18" rx="3" width="18" x="3" y="3" /><path d="M3 9h18M9 21V9" /></svg>
                      </div>
                      <p className="font-semibold text-dark dark:text-white">{hasFilter ? "ไม่พบรายการ" : "ยังไม่มีแบนเนอร์"}</p>
                      <p className="mt-1 text-sm text-dark-5">{hasFilter ? "ลองเปลี่ยนคำค้นหา" : "เพิ่มแบนเนอร์แรกเพื่อแสดงบนหน้าแรก mobile app"}</p>
                    </div>
                  </td>
                </tr>
              ) : pagedBanners.map((banner, idx) => (
                <tr
                  key={banner.id}
                  className={`group border-t border-stroke text-sm dark:border-dark-3 transition-colors ${draggingIdx === idx ? "opacity-40" : ""} ${dragOverIdx === idx && draggingIdx !== idx ? "bg-[#eef8f1]" : ""}`}
                  draggable={dragEnabled}
                  onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
                  onDragOver={(e) => { e.preventDefault(); if (dragEnabled) setDragOverIdx(idx); }}
                  onDragStart={() => { if (dragEnabled) setDraggingIdx(idx); }}
                  onDrop={() => { if (dragEnabled) void handleDrop(idx); }}
                >
                  <td className="hidden cursor-grab select-none px-3 py-3 text-center text-dark-5 opacity-30 transition-opacity group-hover:opacity-70 sm:table-cell">⠿</td>
                  <td className="px-3 py-2">
                    {banner.imageUrl ? (
                      <img alt={banner.title} className="h-12 w-20 rounded-lg object-cover border border-[#d8e6dd]" src={banner.imageUrl} />
                    ) : (
                      <div className="h-12 w-20 rounded-lg border border-dashed border-[#c8ddd1] bg-[#f8fbf9] flex items-center justify-center text-lg text-[#b8d4c1]">🖼</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-dark-5 uppercase">{banner.eyebrow}</div>
                    <div className="font-semibold text-dark dark:text-white">{banner.title}</div>
                    <div className="text-xs text-dark-5">{banner.buttonLabel}</div>
                  </td>
                  <td className="hidden px-4 py-4 text-xs text-dark-5 md:table-cell">{linkLabel(banner)}</td>
                  <td className="px-4 py-4">
                    <button
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${banner.isActive ? "bg-[#45745a]" : "bg-[#d7e2db]"}`}
                      onClick={() => void handleToggleActive(banner)}
                      type="button"
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${banner.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                        onClick={() => setPreviewBanner(banner)}
                        type="button"
                      >
                        <svg fill="none" height="11" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="11"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        ดูตัวอย่าง
                      </button>
                      <button
                        className="rounded-full border border-[#d7e7dc] px-3 py-1 text-xs font-semibold text-[#355846] hover:bg-[#f4fbf6]"
                        onClick={() => startEdit(banner)}
                        type="button"
                      >
                        แก้ไข
                      </button>
                      <button
                        className="rounded-full border border-[#f1d0cf] px-3 py-1 text-xs font-semibold text-[#b42318] hover:bg-[#fff5f4]"
                        onClick={() => setBannerToDelete(banner.id)}
                        type="button"
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
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-dark-5">
            {isLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#d8e6dd] border-t-[#45745a]" />
                กำลังโหลด...
              </span>
            ) : (
              <>
                <span className="font-semibold text-dark dark:text-white">{totalItems}</span>
                {" รายการ"}
                {totalPages > 1 ? ` · หน้า ${page}/${totalPages}` : ""}
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              type="button"
            >← ก่อนหน้า</button>
            <span className="min-w-[3rem] text-center text-sm font-medium text-dark dark:text-white">
              {page} / {totalPages}
            </span>
            <button
              className="rounded-full border border-[#d7e7dc] px-4 py-2 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >ถัดไป →</button>
          </div>
        </div>
      </ContentCard>

      {previewBanner ? createPortal(
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/75 px-4"
          onClick={() => setPreviewBanner(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <BannerPreview
              form={{
                eyebrow: previewBanner.eyebrow,
                title: previewBanner.title,
                body: previewBanner.body ?? "",
                tag: previewBanner.tag ?? "",
                buttonLabel: previewBanner.buttonLabel,
                linkType: previewBanner.linkType,
                linkId: previewBanner.linkId ?? "",
                isActive: previewBanner.isActive,
              }}
              imagePreview={previewBanner.imageUrl ?? null}
            />
            <button
              className="mt-4 mx-auto flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              onClick={() => setPreviewBanner(null)}
              type="button"
            >
              ปิดตัวอย่าง
            </button>
          </div>
        </div>,
        document.body,
      ) : null}

      {bannerToDelete ? createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0f172a]/55 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#eadbda] bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark">
            <div className="flex items-center justify-between gap-3 border-b border-[#f3e8e7] px-6 py-5 dark:border-dark-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f1]">
                  <svg fill="none" height="18" stroke="#c84b44" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
                </div>
                <h3 className="text-lg font-bold text-dark dark:text-white">ยืนยันการลบแบนเนอร์</h3>
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-dark-4 hover:bg-[#f0f7f2] dark:text-dark-6 dark:hover:bg-dark-3" onClick={() => setBannerToDelete(null)} type="button">✕</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">ต้องการลบแบนเนอร์นี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</p>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-[#f3e8e7] px-6 py-4 dark:border-dark-3">
              <button className="inline-flex items-center justify-center rounded-full border border-[#d7e7dc] px-5 py-2.5 text-sm font-semibold text-[#355846] transition-colors hover:bg-[#f4fbf6]" onClick={() => setBannerToDelete(null)} type="button">ยกเลิก</button>
              <button className="inline-flex items-center justify-center rounded-full bg-[#c84b44] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ad3d37] disabled:opacity-70" disabled={isDeleting} onClick={() => void handleConfirmDelete()} type="button">
                {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      {isModalOpen ? createPortal(
        <BannerFormModal
          editingId={editingId}
          form={form}
          isSubmitting={isSubmitting}
          categories={categories}
          products={products}
          imageFile={imageFile}
          imagePreview={imagePreview}
          onChange={(next) => setForm((c) => ({ ...c, ...next }))}
          onImageChange={handleImageChange}
          onClose={() => { setIsModalOpen(false); resetForm(); }}
          onSubmit={handleSubmit}
        />,
        document.body,
      ) : null}
    </>
  );
}
