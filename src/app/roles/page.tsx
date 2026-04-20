import { RoleManagerTable } from "@/components/admin-next/role-manager-table";
import { getRolesPageData } from "@/lib/admin-api";

export default async function RolesPage() {
  const { items, meta } = await getRolesPageData();
  return (
    <div className="space-y-6">
      <RoleManagerTable initialItems={items} initialMeta={meta} />
    </div>
  );
}
