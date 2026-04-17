import { ContentCard, PageIntro, StatusPill } from "@/components/admin-next/page-elements";
import { getOrders } from "@/lib/admin-api";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Order Management"
        badge={orders[0]?.source === "api" ? "Live API" : "Mock fallback"}
        description="Review order status, branch ownership, and checkout totals before fulfilment and reporting workflows proceed."
        primaryAction={{ label: "Open payments", href: "/payments" }}
        secondaryAction={{ label: "View reports", href: "/reports" }}
        title="Monitor the order pipeline from payment to delivery"
      />

      <ContentCard
        title="Current order status"
        description="Prepared for status updates, cancellation flow, and branch-specific fulfilment review."
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">Order</th>
                <th className="px-5 py-4 font-medium">Member</th>
                <th className="px-5 py-4 font-medium">Store</th>
                <th className="px-5 py-4 font-medium">Total</th>
                <th className="px-5 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.code}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                    {order.code}
                  </td>
                  <td className="px-5 py-4">{order.member}</td>
                  <td className="px-5 py-4">{order.store}</td>
                  <td className="px-5 py-4">{order.total}</td>
                  <td className="px-5 py-4">
                    <StatusPill
                      label={order.status}
                      tone={
                        order.status === "Paid" || order.status === "Delivered"
                          ? "success"
                          : "default"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
