import { ContentCard, PageIntro, StatusPill } from "@/components/admin-next/page-elements";
import { getProducts } from "@/lib/admin-api";

const productNotes = [
  "Support SKU, category, status, stock, and price in one table.",
  "Prepare for image upload and YouTube / TikTok link fields in the next build.",
  "Reserve stock policy can later connect to stock summary and adjustment APIs.",
];

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Product Management"
        badge={products[0]?.source === "api" ? "Live API" : "Mock fallback"}
        description="Manage launch products, pricing, visibility, inventory, and media preparation from one backoffice page."
        primaryAction={{ label: "Add product", href: "/products" }}
        secondaryAction={{ label: "Open categories", href: "/categories" }}
        title="Control product data, launch stock, and storefront readiness"
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ContentCard
          title="Product list"
          description="The table is ready for CRUD, stock adjustment, publish status, and media link support."
        >
          <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left">
              <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="px-5 py-4 font-medium">SKU</th>
                  <th className="px-5 py-4 font-medium">Product</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Price</th>
                  <th className="px-5 py-4 font-medium">Stock</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.sku}
                    className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                  >
                    <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                      {product.sku}
                    </td>
                    <td className="px-5 py-4">{product.name}</td>
                    <td className="px-5 py-4">{product.category}</td>
                    <td className="px-5 py-4">{product.price}</td>
                    <td className="px-5 py-4">{product.stock}</td>
                    <td className="px-5 py-4">
                      <StatusPill
                        label={product.status}
                        tone={product.status === "Active" ? "success" : "warning"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>

        <ContentCard title="Readiness" description="This page is already mapped to the launch requirements.">
          <ul className="space-y-3">
            {productNotes.map((note) => (
              <li
                key={note}
                className="rounded-2xl bg-[#f7fbf8] p-4 text-sm leading-6 text-dark-5 dark:bg-dark-2 dark:text-dark-6"
              >
                {note}
              </li>
            ))}
          </ul>
        </ContentCard>
      </div>
    </div>
  );
}
