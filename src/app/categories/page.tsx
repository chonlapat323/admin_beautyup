import { CategoryManager } from "@/components/admin-next/category-manager";
import { getCategories } from "@/lib/admin-api";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
