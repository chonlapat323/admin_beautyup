import { Suspense } from "react";
import { MemberManagerTable } from "@/components/admin-next/member-manager-table";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";
import { getMembersPageData } from "@/lib/admin-api";

async function MembersContent() {
  const { items, meta } = await getMembersPageData();
  return <MemberManagerTable initialItems={items} initialMeta={meta} />;
}

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={8} cols={6} />}>
        <MembersContent />
      </Suspense>
    </div>
  );
}
