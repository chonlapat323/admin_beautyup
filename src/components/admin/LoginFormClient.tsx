"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export function LoginFormClient() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@beautyup.com");
  const [password, setPassword] = useState("P@ssw0rd123");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

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
        throw new Error(result.message || "Login failed");
      }

      setStatus(`Signed in as ${result.admin.email} (${result.admin.role})`);
      router.push("/");
      router.refresh();
    } catch {
      setStatus("Backend is unavailable right now. Please check the admin API and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white" htmlFor="email">
          Email
        </label>
        <input
          className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@beautyup.com"
          type="email"
          value={email}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white" htmlFor="password">
          Password
        </label>
        <input
          className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          type="password"
          value={password}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-dark dark:text-white" htmlFor="role">
          Access scope
        </label>
        <select
          className="w-full rounded-xl border border-stroke bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#5f8f74] dark:border-dark-3 dark:bg-gray-dark"
          defaultValue="admin"
          id="role"
        >
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-dark-5 dark:text-dark-6">
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          <span>Keep me signed in</span>
        </label>
        <span>Uses POST /auth/login</span>
      </div>

      <button
        className="inline-flex w-full items-center justify-center rounded-full bg-[#45745a] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#355846] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Sign in to backoffice"}
      </button>

      {status ? (
        <p className="text-sm leading-6 text-dark-5 dark:text-dark-6">{status}</p>
      ) : null}
    </form>
  );
}
