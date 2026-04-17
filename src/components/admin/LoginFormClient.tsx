"use client";

import { useToast } from "@/components/shared/toast-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LoginFormClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("admin@beautyup.com");
  const [password, setPassword] = useState("P@ssw0rd123");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json()) as { admin?: { email: string; role: string }; message?: string };

      if (!response.ok || !result.admin) {
        throw new Error(result.message || "เข้าสู่ระบบไม่สำเร็จ");
      }

      showToast("เข้าสู่ระบบสำเร็จ", "success");
      router.push("/");
      router.refresh();
    } catch {
      showToast("ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบระบบหลังบ้านแล้วลองอีกครั้ง", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white" htmlFor="email">
          อีเมล
        </label>
        <input
          className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="กรอกอีเมล"
          type="email"
          value={email}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white" htmlFor="password">
          รหัสผ่าน
        </label>
        <input
          className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="กรอกรหัสผ่าน"
          type="password"
          value={password}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white" htmlFor="role">
          สิทธิ์การเข้าใช้งาน
        </label>
        <select
          className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
          defaultValue="admin"
          id="role"
        >
          <option value="admin">แอดมิน</option>
          <option value="super_admin">ซูเปอร์แอดมิน</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-dark-5 dark:text-dark-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>จดจำการเข้าสู่ระบบ</span>
        </label>
        <span>เชื่อมต่อผ่าน POST /auth/login</span>
      </div>

      <button
        className="inline-flex w-full items-center justify-center rounded-full bg-[#45745a] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบหลังบ้าน"}
      </button>
    </form>
  );
}
