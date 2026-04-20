"use client";

import { useRef, useState } from "react";

export type PreviewImage = {
  key: string;
  url: string;
  kind: "temp" | "existing";
  tempFilename?: string;
  existingId?: string;
  uploading: boolean;
  error: boolean;
};

export function ProductImageManager({
  images,
  onFilesDropped,
  onRemove,
  onReorder,
}: {
  images: PreviewImage[];
  onFilesDropped: (files: File[]) => void;
  onRemove: (key: string) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragSrcIndex, setDragSrcIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleZoneDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (dragSrcIndex === null) setIsDragOver(true);
  }

  function handleZoneDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (dragSrcIndex !== null) {
      setDragSrcIndex(null);
      return;
    }
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) onFilesDropped(files);
  }

  function handleItemDragStart(e: React.DragEvent, index: number) {
    setDragSrcIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleItemDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }

  function handleItemDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    if (dragSrcIndex !== null && dragSrcIndex !== targetIndex) {
      onReorder(dragSrcIndex, targetIndex);
    }
    setDragSrcIndex(null);
    setDragOverIndex(null);
  }

  function handleItemDragEnd() {
    setDragSrcIndex(null);
    setDragOverIndex(null);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) onFilesDropped(files);
    e.target.value = "";
  }

  return (
    <div
      className={`relative min-h-[120px] rounded-2xl border-2 border-dashed p-3 transition-colors ${
        isDragOver ? "border-[#5f8f74] bg-[#eef8f1]" : "border-[#c8ddd1]"
      }`}
      onDragLeave={handleZoneDragLeave}
      onDragOver={handleZoneDragOver}
      onDrop={handleZoneDrop}
    >
      {images.length === 0 && !isDragOver ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <span className="text-3xl text-[#b8d4c1]">🖼</span>
          <p className="mt-2 text-sm text-dark-5">ลากรูปภาพมาวางที่นี่ หรือ</p>
          <button
            className="mt-2 rounded-full border border-[#c8ddd1] px-4 py-1.5 text-sm font-semibold text-[#45745a] hover:bg-[#f4fbf6]"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            เลือกไฟล์
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {images.map((img, index) => (
            <div
              key={img.key}
              className={`group relative cursor-grab active:cursor-grabbing ${
                dragOverIndex === index && dragSrcIndex !== index
                  ? "ring-2 ring-[#45745a] ring-offset-2"
                  : ""
              } ${dragSrcIndex === index ? "opacity-40" : ""}`}
              draggable={!img.uploading && !img.error}
              onDragEnd={handleItemDragEnd}
              onDragOver={(e) => handleItemDragOver(e, index)}
              onDragStart={(e) => handleItemDragStart(e, index)}
              onDrop={(e) => handleItemDrop(e, index)}
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-[#d8e6dd]">
                {img.uploading ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#f8fbf9]">
                    <span className="text-xs text-dark-5">กำลังอัปโหลด...</span>
                  </div>
                ) : img.error ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-[#fff5f4]">
                    <span className="text-lg">⚠️</span>
                    <span className="mt-1 text-xs text-[#b42318]">ล้มเหลว</span>
                  </div>
                ) : (
                  <img alt="" className="h-full w-full object-cover" src={img.url} />
                )}

                {/* Sort order badge */}
                {!img.uploading && !img.error && (
                  <div className="absolute bottom-1 left-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-black/50 px-1 text-[10px] font-bold text-white">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Delete button */}
              <button
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c84b44] text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#ad3d37]"
                onClick={() => onRemove(img.key)}
                type="button"
              >
                ×
              </button>

              {/* Drag handle indicator */}
              {!img.uploading && !img.error && (
                <div className="absolute bottom-1 right-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-70">
                  ⠿
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          <button
            className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c8ddd1] text-[#45745a] transition-colors hover:border-[#5f8f74] hover:bg-[#f4fbf6]"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="mt-1 text-xs">เพิ่มรูป</span>
          </button>
        </div>
      )}

      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl">
          <p className="text-sm font-semibold text-[#45745a]">วางรูปที่นี่เลย</p>
        </div>
      )}

      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        multiple
        onChange={handleFileInputChange}
        ref={fileInputRef}
        type="file"
      />
    </div>
  );
}
