import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { adminUsers } from "@/lib/admin-data";

export default function AdminUsersPage() {
  return (
    <AdminShellTheme
      activeHref="/admin-users"
      badge="Super admin control"
      description="Manage backoffice access, invite new admins, and review branch-level responsibilities from one place."
      eyebrow="Admin User Management"
      primaryAction={{ label: "Invite admin", href: "/admin-users" }}
      secondaryAction={{ label: "Review roles", href: "/roles" }}
      title="Control who can operate Beauty Up backoffice"
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Admin Directory</p>
            <h2 className={styles.panelTitle}>User access overview</h2>
            <p className={styles.panelCopy}>
              Prepared for role assignment, status updates, password reset, and audit tracking.
            </p>
          </div>
        </div>

        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr key={user.name}>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={styles.statusPill}>{user.status}</span>
                  </td>
                  <td>{user.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShellTheme>
  );
}
