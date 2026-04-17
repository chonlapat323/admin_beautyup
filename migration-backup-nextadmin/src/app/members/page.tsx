import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { getMembers } from "@/lib/admin-api";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <AdminShellTheme
      activeHref="/members"
      badge={members[0]?.source === "api" ? "Live API" : "Mock fallback"}
      description="Track member profiles, point balances, referral ownership, and spending history before support action."
      eyebrow="Member Management"
      primaryAction={{ label: "Create member", href: "/members" }}
      secondaryAction={{ label: "View reports", href: "/reports" }}
      title="Keep member operations visible, simple, and support-ready"
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Member List</p>
            <h2 className={styles.panelTitle}>Customer and referral overview</h2>
            <p className={styles.panelCopy}>
              This page is ready to connect to profile CRUD, points history, referral tracking, and
              support notes.
            </p>
          </div>
        </div>

        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Tier</th>
                <th>Points</th>
                <th>Referrals</th>
                <th>Spend</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.name}>
                  <td>{member.name}</td>
                  <td>{member.tier}</td>
                  <td>{member.points}</td>
                  <td>{member.referrals}</td>
                  <td>{member.spend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShellTheme>
  );
}
