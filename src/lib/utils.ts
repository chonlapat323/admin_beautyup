import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * แปลง URL รูปจาก backend (http://localhost:PORT/uploads/...)
 * ให้โหลดผ่าน Next.js proxy (/api/uploads/...) แทน
 * เพื่อให้ admin โหลดรูปได้แม้จะอยู่คนละ machine กับ server
 */
export function toProxiedImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/uploads/")) {
      return `/api${parsed.pathname}`;
    }
  } catch {
    // ถ้า url เป็น relative path อยู่แล้ว ใช้ตรงๆ
    if (url.startsWith("/uploads/")) return `/api${url}`;
  }
  return url;
}
