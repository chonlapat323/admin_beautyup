import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { getSettings } from "@/lib/admin-api";

export default async function SettingsPage() {
  const settingsSections = await getSettings();

  return (
    <AdminShellTheme
      activeHref="/settings"
      badge={settingsSections[0]?.source === "api" ? "Live API" : "Mock fallback"}
      description="Manage shipping thresholds, point rules, referral logic, and media channels from a single configuration workspace."
      eyebrow="Settings"
      primaryAction={{ label: "Review roles", href: "/roles" }}
      secondaryAction={{ label: "Open payments", href: "/payments" }}
      title="Keep operational rules consistent across the whole Beauty Up system"
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Configuration</p>
            <h2 className={styles.panelTitle}>Business settings</h2>
            <p className={styles.panelCopy}>
              These cards are ready to become real form sections once backend settings endpoints are
              connected.
            </p>
          </div>
        </div>

        <div className={styles.settingGrid}>
          {settingsSections.map((section) => (
            <article key={section.title} className={styles.settingCard}>
              <h3 className={styles.settingTitle}>{section.title}</h3>
              <p className={styles.settingDescription}>{section.description}</p>
            </article>
          ))}
        </div>
      </section>
    </AdminShellTheme>
  );
}
