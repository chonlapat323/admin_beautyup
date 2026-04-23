import { Suspense } from "react";
import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";
import { getOrders } from "@/lib/admin-api";
import { toThaiLabel } from "@/lib/thai-text";

async function OrdersContent() {
  const orders = await getOrders();
  return (
    <ContentCard title="สถานะคำสั่งซื้อปัจจุบัน" description="">
      <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
        <table className="w-full text-left">
          <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
            <tr>
              <th className="px-5 py-4 font-medium">คำสั่งซื้อ</th>
              <th className="px-5 py-4 font-medium">สมาชิก</th>
              <th className="px-5 py-4 font-medium">สาขา</th>
              <th className="px-5 py-4 font-medium">ยอดรวม</th>
              <th className="px-5 py-4 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.code}
                className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
              >
                <td className="px-5 py-4 font-semibold text-dark dark:text-white">{order.code}</td>
                <td className="px-5 py-4">{order.member}</td>
                <td className="px-5 py-4">{order.store}</td>
                <td className="px-5 py-4">{order.total}</td>
                <td className="px-5 py-4">
                  <StatusPill
                    label={toThaiLabel(order.status)}
                    tone={order.status === "Paid" || order.status === "Delivered" ? "success" : "default"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ContentCard>
  );
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={8} cols={5} />}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}
