import { ContentCard, PageIntro, StatusPill } from "@/components/admin-next/page-elements";
import { getCategories } from "@/lib/admin-api";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Category Management"
        badge={categories[0]?.source === "api" ? "Live API" : "Mock fallback"}
        description="Create, edit, reorder, and stage product categories before they go live in the Beauty Up storefront."
        primaryAction={{ label: "Create category", href: "/categories" }}
        secondaryAction={{ label: "Back to overview", href: "/" }}
        title="Organize product discovery with clear category control"
      />

      <ContentCard
        title="Launch catalog structure"
        description="Category data is prepared for sorting, activation, storefront visibility, and future CRUD actions."
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Slug</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Products</th>
                <th className="px-5 py-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr
                  key={category.name}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                    {category.name}
                  </td>
                  <td className="px-5 py-4">{category.slug}</td>
                  <td className="px-5 py-4">
                    <StatusPill
                      label={category.status}
                      tone={category.status === "Active" ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-5 py-4">{category.products}</td>
                  <td className="px-5 py-4">{category.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
