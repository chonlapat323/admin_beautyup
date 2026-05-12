"use client";

import { useToast } from "@/components/shared/toast-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginFormClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "เข้าสู่ระบบไม่สำเร็จ";
      showToast(message, "error");
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
          required
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
          required
        />
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
