import {
  ContentCard,
  PageIntro,
  StatCard,
  StatusPill,
} from "@/components/admin-next/page-elements";
import { getOrders, getPayments } from "@/lib/admin-api";
import { launchModules, summaryMetrics } from "@/lib/admin-data";

export default async function Home() {
  const [orders, payments] = await Promise.all([getOrders(), getPayments()]);
  const topOrders = orders.slice(0, 4);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Beauty Up Enterprise"
        title="Backoffice dashboard for launch operations"
        description="Follow product readiness, order flow, payment performance, and member operations from one clean workspace built on the NextAdmin foundation."
        badge="Phase 1"
        primaryAction={{ label: "Manage products", href: "/products" }}
        secondaryAction={{ label: "Open reports", href: "/reports" }}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.hint}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <ContentCard
          title="Order queue"
          description="A launch-ready view for current orders that need payment review, packing, or delivery follow-up."
          aside={
            <StatusPill
              label={topOrders[0]?.source === "api" ? "Live API" : "Mock fallback"}
            />
          }
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
                {topOrders.map((order) => (
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

        <ContentCard
          title="Operational highlights"
          description="The most important launch modules and payment channels visible at a glance."
        >
          <div className="space-y-4">
            {launchModules.slice(0, 3).map((module) => (
              <article key={module.title} className="rounded-2xl bg-[#f7fbf8] p-4 dark:bg-dark-2">
                <h4 className="text-base font-semibold text-dark dark:text-white">
                  {module.title}
                </h4>
                <p className="mt-2 text-sm leading-6 text-dark-5 dark:text-dark-6">
                  {module.description}
                </p>
              </article>
            ))}

            <div className="rounded-2xl border border-dashed border-[#cfe2d5] p-4 dark:border-dark-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#5f8f74]">
                Payment channels
              </p>
              <div className="mt-3 space-y-3">
                {payments.map((payment) => (
                  <div key={payment.method} className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-dark dark:text-white">
                        {payment.method}
                      </p>
                      <p className="text-dark-5 dark:text-dark-6">{payment.note}</p>
                    </div>
                    <StatusPill label={String(payment.orders)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ContentCard>
      </section>
    </div>
  );
}
