"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/admin/adminlte-theme.module.css";
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
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          className={styles.input}
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@beautyup.com"
          type="email"
          value={email}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          className={styles.input}
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          type="password"
          value={password}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="role">
          Access scope
        </label>
        <select className={styles.select} defaultValue="admin" id="role">
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className={styles.helperRow}>
        <label className={styles.checkboxRow}>
          <input type="checkbox" />
          <span>Keep me signed in</span>
        </label>
        <span>Uses POST /auth/login</span>
      </div>

      <button className={styles.primaryButton} disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in to backoffice"}
      </button>

      {status ? <p className={styles.formDescription}>{status}</p> : null}
    </form>
  );
}
