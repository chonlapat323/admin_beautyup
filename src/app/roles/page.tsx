import { Suspense } from "react";
import { RoleManagerTable } from "@/components/admin-next/role-manager-table";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";
import { getRolesPageData } from "@/lib/admin-api";

async function RolesContent() {
  const { items, meta } = await getRolesPageData();
  return <RoleManagerTable initialItems={items} initialMeta={meta} />;
}

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={6} cols={4} />}>
        <RolesContent />
      </Suspense>
    </div>
  );
}
