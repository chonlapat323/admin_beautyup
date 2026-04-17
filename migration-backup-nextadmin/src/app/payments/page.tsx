import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { getPayments } from "@/lib/admin-api";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <AdminShellTheme
      activeHref="/payments"
      badge={payments[0]?.source === "api" ? "Live API" : "Mock fallback"}
      description="Review payment channel performance and prepare the UI for retry flow, reconciliation, and support investigation."
      eyebrow="Payment Management"
      primaryAction={{ label: "Review orders", href: "/orders" }}
      secondaryAction={{ label: "Open settings", href: "/settings" }}
      title="Support payment operations across every launch channel"
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Payment Channels</p>
            <h2 className={styles.panelTitle}>Method overview</h2>
            <p className={styles.panelCopy}>
              Built for PromptPay QR, card payment, and TrueMoney review with room for retry and
              reconciliation tools.
            </p>
          </div>
        </div>

        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Method</th>
                <th>Orders</th>
                <th>Success rate</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.method}>
                  <td>{payment.method}</td>
                  <td>{payment.orders}</td>
                  <td>{payment.successRate}</td>
                  <td>{payment.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShellTheme>
  );
}
