import { ContentCard, PageIntro, StatusPill } from "@/components/admin-next/page-elements";
import { rolePermissions } from "@/lib/admin-data";

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Role Permission"
      badge="Permission matrix"
      description="Define the difference between super admin and admin access without creating confusion for the operations team."
      primaryAction={{ label: "Review admins", href: "/admin-users" }}
      secondaryAction={{ label: "Open settings", href: "/settings" }}
      title="Map role permissions clearly before real data goes live"
      />

      <ContentCard
        title="Permission matrix"
        description="The UI is ready for future permission guards, backend policies, and route protection."
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">Permission</th>
                <th className="px-5 py-4 font-medium">Super Admin</th>
                <th className="px-5 py-4 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {rolePermissions.map((row) => (
                <tr
                  key={row.permission}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">{row.permission}</td>
                  <td className="px-5 py-4">
                    <StatusPill label={row.superAdmin} tone="success" />
                  </td>
                  <td className="px-5 py-4">{row.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
