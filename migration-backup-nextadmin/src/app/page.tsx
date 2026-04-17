import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { launchModules, summaryMetrics } from "@/lib/admin-data";

const activityItems = [
  "PromptPay, card, and TrueMoney payment channels are prepared for admin review.",
  "Reserve stock policy keeps 10% protected from overselling during launch.",
  "Swagger and Docker local setup are ready for frontend to backend integration.",
];

export default function Home() {
  return (
    <AdminShellTheme
      activeHref="/"
      badge="Phase 1"
      description="A calm backoffice workspace for product management, member operations, order review, role control, and reporting across the Beauty Up Enterprise flow."
      eyebrow="Backoffice Dashboard"
      primaryAction={{ label: "Manage products", href: "/products" }}
      secondaryAction={{ label: "Open reports", href: "/reports" }}
      title="Light green admin theme for Beauty Up operations"
    >
      <section className={styles.metricsGrid}>
        {summaryMetrics.map((metric) => (
          <article key={metric.label} className={styles.metricCard}>
            <p className={styles.metricLabel}>{metric.label}</p>
            <strong className={styles.metricValue}>{metric.value}</strong>
            <p className={styles.metricHint}>{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className={styles.sectionGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Core Modules</p>
              <h2 className={styles.panelTitle}>Backoffice features ready to expand</h2>
              <p className={styles.panelCopy}>
                The dashboard is prepared for category, product, member, order, payment, report,
                and settings workflows.
              </p>
            </div>
            <span className={styles.badge}>10 screens</span>
          </div>

          <div className={styles.featureGrid}>
            {launchModules.map((module) => (
              <article key={module.title} className={styles.featureCard}>
                <h3 className={styles.featureTitle}>{module.title}</h3>
                <p className={styles.featureDescription}>{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className={styles.subPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>System Notes</p>
              <h2 className={styles.panelTitle}>Latest activity</h2>
            </div>
          </div>

          <ul className={styles.list}>
            {activityItems.map((item) => (
              <li key={item} className={styles.listItem}>
                <span className={styles.dot} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </AdminShellTheme>
  );
}
