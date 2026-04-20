import { AdminUserManagerTable } from "@/components/admin-next/admin-user-manager-table";
import { getAdminUsersPageData } from "@/lib/admin-api";

export default async function AdminUsersPage() {
  const { items, meta } = await getAdminUsersPageData();

  return (
    <div className="space-y-6">
      <AdminUserManagerTable initialItems={items} initialMeta={meta} />
    </div>
  );
}
