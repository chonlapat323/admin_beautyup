import { ProductManagerTable } from "@/components/admin-next/product-manager-table";
import { getProductsPageData } from "@/lib/admin-api";

export default async function ProductsPage() {
  const { items, meta } = await getProductsPageData();

  return (
    <div className="space-y-6">
      <ProductManagerTable initialItems={items} initialMeta={meta} />
    </div>
  );
}
