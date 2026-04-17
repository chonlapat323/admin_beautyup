import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { reportCards } from "@/lib/admin-data";

const reportNotes = [
  "Prepare dashboard cards for sales by store and category contribution.",
  "Leave space for point usage, commission payout, and stock health summaries.",
  "Keep layout simple so stakeholders can scan branch performance quickly.",
];

export default function ReportsPage() {
  return (
    <AdminShellTheme
      activeHref="/reports"
      badge="Store reporting"
      description="Present branch performance, inventory health, and member-related insights in a clean dashboard for business review."
      eyebrow="Reports"
      primaryAction={{ label: "Open dashboard", href: "/" }}
      secondaryAction={{ label: "Review orders", href: "/orders" }}
      title="Bring store performance into one calm reporting view"
    >
      <section className={styles.sectionGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Business Snapshot</p>
              <h2 className={styles.panelTitle}>Report cards</h2>
              <p className={styles.panelCopy}>
                These cards are designed for API-driven summaries once backend reporting is ready.
              </p>
            </div>
          </div>

          <div className={styles.featureGrid}>
            {reportCards.map((card) => (
              <article key={card.title} className={styles.featureCard}>
                <p className={styles.metricLabel}>{card.title}</p>
                <strong className={styles.metricValue}>{card.value}</strong>
                <p className={styles.featureDescription}>{card.note}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className={styles.subPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Design Notes</p>
              <h2 className={styles.panelTitle}>Reporting guidance</h2>
            </div>
          </div>

          <ul className={styles.list}>
            {reportNotes.map((note) => (
              <li key={note} className={styles.listItem}>
                <span className={styles.dot} />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </AdminShellTheme>
  );
}
