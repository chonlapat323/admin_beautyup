import { AdminShellTheme, adminStyles as styles } from "@/components/admin/AdminShellTheme";
import { getProducts } from "@/lib/admin-api";

const productNotes = [
  "Support SKU, category, status, stock, and price in one table.",
  "Prepare for image upload and YouTube / TikTok link fields in the next build.",
  "Reserve stock policy can later connect to stock summary and adjustment APIs.",
];

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <AdminShellTheme
      activeHref="/products"
      badge={products[0]?.source === "api" ? "Live API" : "Mock fallback"}
      description="Manage launch products, pricing, visibility, inventory, and media preparation from one backoffice page."
      eyebrow="Product Management"
      primaryAction={{ label: "Add product", href: "/products" }}
      secondaryAction={{ label: "Open categories", href: "/categories" }}
      title="Control product data, launch stock, and storefront readiness"
    >
      <section className={styles.sectionGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Catalog Table</p>
              <h2 className={styles.panelTitle}>Product list</h2>
              <p className={styles.panelCopy}>
                The table is designed for backend integration with CRUD, status updates, and stock
                adjustments.
              </p>
            </div>
          </div>

          <div className={styles.tablePanel}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.sku}>
                    <td>{product.sku}</td>
                    <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.price}</td>
                  <td>{product.stock}</td>
                    <td>
                      <span className={styles.statusPill}>{product.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={styles.subPanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Readiness</p>
              <h2 className={styles.panelTitle}>What this page supports</h2>
            </div>
          </div>

          <ul className={styles.list}>
            {productNotes.map((note) => (
              <li key={note} className={styles.listItem}>
                <span className={styles.dot} />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </AdminShellTheme>
  );
}
