import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { getCategories } from "@/lib/admin-api";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <AdminShellTheme
      activeHref="/categories"
      badge={categories[0]?.source === "api" ? "Live API" : "Mock fallback"}
      description="Create, edit, reorder, and stage product categories before they go live in the Beauty Up storefront."
      eyebrow="Category Management"
      primaryAction={{ label: "Create category", href: "/categories" }}
      secondaryAction={{ label: "Back to overview", href: "/" }}
      title="Organize product discovery with clear category control"
    >
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Category List</p>
            <h2 className={styles.panelTitle}>Launch catalog structure</h2>
            <p className={styles.panelCopy}>
              Category data can later connect to backend APIs for sorting, activation, and
              storefront visibility.
            </p>
          </div>
        </div>

        <div className={styles.tablePanel}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Products</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.name}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td>
                    <span className={styles.statusPill}>{category.status}</span>
                  </td>
                  <td>{category.products}</td>
                  <td>{category.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShellTheme>
  );
}
