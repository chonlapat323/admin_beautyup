import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { rolePermissions } from "@/lib/admin-data";

export default function RolesPage() {
  return (
    <AdminShellTheme
      activeHref="/roles"
      badge="Permission matrix"
      description="Define the difference between super admin and admin access without creating confusion for the operations team."
      eyebrow="Role Permission"
      primaryAction={{ label: "Review admins", href: "/admin-users" }}
      secondaryAction={{ label: "Open settings", href: "/settings" }}
      title="Map role permissions clearly before real data goes live"
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Access Control</p>
            <h2 className={styles.panelTitle}>Permission matrix</h2>
            <p className={styles.panelCopy}>
              The UI is ready for future permission guards, backend policies, and route protection.
            </p>
          </div>
        </div>

        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Super Admin</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {rolePermissions.map((row) => (
                <tr key={row.permission}>
                  <td>{row.permission}</td>
                  <td>{row.superAdmin}</td>
                  <td>{row.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShellTheme>
  );
}
