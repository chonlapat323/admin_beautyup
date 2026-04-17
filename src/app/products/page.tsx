import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";
import { getProducts } from "@/lib/admin-api";
import { toThaiLabel } from "@/lib/thai-text";

const productNotes = [
  "รองรับ SKU หมวดหมู่ สถานะ สต็อก และราคาในตารางเดียว",
  "เตรียมต่อยอดสำหรับอัปโหลดรูปสินค้าและลิงก์ YouTube / TikTok ในรอบถัดไป",
  "นโยบายกันสต็อกสามารถเชื่อมกับสรุปสต็อกและการปรับสต็อกได้ในอนาคต",
];

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ContentCard
          title="รายการสินค้า"
          description=""
        >
          <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
            <table className="w-full text-left">
              <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                <tr>
                  <th className="px-5 py-4 font-medium">SKU</th>
                  <th className="px-5 py-4 font-medium">สินค้า</th>
                  <th className="px-5 py-4 font-medium">หมวดหมู่</th>
                  <th className="px-5 py-4 font-medium">ราคา</th>
                  <th className="px-5 py-4 font-medium">สต็อก</th>
                  <th className="px-5 py-4 font-medium">สถานะ</th>
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
                        label={toThaiLabel(product.status)}
                        tone={product.status === "Active" ? "success" : "warning"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>

        <ContentCard title="ความพร้อมใช้งาน" description="หน้านี้ถูกวางโครงให้ตรงกับงานเปิดระบบในระยะแรกแล้ว">
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
