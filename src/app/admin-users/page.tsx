import { Suspense } from "react";
import { AdminUserManagerTable } from "@/components/admin-next/admin-user-manager-table";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";
import { getAdminUsersPageData } from "@/lib/admin-api";

async function AdminUsersContent() {
  const { items, meta } = await getAdminUsersPageData();
  return <AdminUserManagerTable initialItems={items} initialMeta={meta} />;
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={8} cols={5} />}>
        <AdminUsersContent />
      </Suspense>
    </div>
  );
}
