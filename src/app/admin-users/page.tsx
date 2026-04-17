import { ContentCard, PageIntro, StatusPill } from "@/components/admin-next/page-elements";
import { adminUsers } from "@/lib/admin-data";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin User Management"
        badge="Super admin control"
        description="Manage backoffice access, invite new admins, and review branch-level responsibilities from one place."
        primaryAction={{ label: "Invite admin", href: "/admin-users" }}
        secondaryAction={{ label: "Review roles", href: "/roles" }}
        title="Control who can operate Beauty Up backoffice"
      />

      <ContentCard
        title="User access overview"
        description="Prepared for role assignment, status updates, password reset, and audit tracking."
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr
                  key={user.name}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                    {user.name}
                  </td>
                  <td className="px-5 py-4">{user.role}</td>
                  <td className="px-5 py-4">
                    <StatusPill
                      label={user.status}
                      tone={user.status === "Active" ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-5 py-4">{user.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
