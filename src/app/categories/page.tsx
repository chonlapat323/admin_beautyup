import { Suspense } from "react";
import { CategoryManagerTable } from "@/components/admin-next/category-manager-table";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";
import { getCategoriesPageData } from "@/lib/admin-api";

async function CategoriesContent() {
  const { items, meta } = await getCategoriesPageData({ page: 1, pageSize: 10, status: "all" });
  return <CategoryManagerTable initialItems={items} initialMeta={meta} />;
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={8} cols={6} />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}
