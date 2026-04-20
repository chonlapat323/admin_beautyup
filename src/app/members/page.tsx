import { MemberManagerTable } from "@/components/admin-next/member-manager-table";
import { getMembersPageData } from "@/lib/admin-api";

export default async function MembersPage() {
  const { items, meta } = await getMembersPageData();

  return (
    <div className="space-y-6">
      <MemberManagerTable initialItems={items} initialMeta={meta} />
    </div>
  );
}
