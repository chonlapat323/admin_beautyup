import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { getOrders } from "@/lib/admin-api";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <AdminShellTheme
      activeHref="/orders"
      badge={orders[0]?.source === "api" ? "Live API" : "Mock fallback"}
      description="Review order status, branch ownership, and checkout totals before fulfilment and reporting workflows proceed."
      eyebrow="Order Management"
      primaryAction={{ label: "Open payments", href: "/payments" }}
      secondaryAction={{ label: "View reports", href: "/reports" }}
      title="Monitor the order pipeline from payment to delivery"
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Order Queue</p>
            <h2 className={styles.panelTitle}>Current order status</h2>
            <p className={styles.panelCopy}>
              This screen is prepared for status updates, cancellation flow, and branch-specific
              fulfilment review.
            </p>
          </div>
        </div>

        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Member</th>
                <th>Store</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.code}>
                  <td>{order.code}</td>
                  <td>{order.member}</td>
                  <td>{order.store}</td>
                  <td>{order.total}</td>
                  <td>
                    <span className={styles.statusPill}>{order.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShellTheme>
  );
}
