import { CategoryManagerTable } from "@/components/admin-next/category-manager-table";
import { getCategoriesPageData } from "@/lib/admin-api";

export default async function CategoriesPage() {
  const categories = await getCategoriesPageData({
    page: 1,
    pageSize: 10,
    status: "all",
  });

  return (
    <div className="space-y-6">
      <CategoryManagerTable
        initialItems={categories.items}
        initialMeta={categories.meta}
      />
    </div>
  );
}
