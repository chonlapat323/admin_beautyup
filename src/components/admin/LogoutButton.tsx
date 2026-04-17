"use client";

import { useRouter } from "next/navigation";
import styles from "@/components/admin/adminlte-theme.module.css";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/session/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <button className={styles.ghostButton} onClick={handleLogout} type="button">
      Sign out
    </button>
  );
}
