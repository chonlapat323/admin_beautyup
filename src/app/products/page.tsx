import { Suspense } from "react";
import { ProductManagerTable } from "@/components/admin-next/product-manager-table";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";
import { getProductsPageData } from "@/lib/admin-api";

async function ProductsContent() {
  const { items, meta } = await getProductsPageData();
  return <ProductManagerTable initialItems={items} initialMeta={meta} />;
}

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={8} cols={7} />}>
        <ProductsContent />
      </Suspense>
    </div>
  );
}
