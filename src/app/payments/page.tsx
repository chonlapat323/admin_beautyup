import { ContentCard, PageIntro, StatusPill } from "@/components/admin-next/page-elements";
import { getPayments } from "@/lib/admin-api";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Payment Management"
        badge={payments[0]?.source === "api" ? "Live API" : "Mock fallback"}
        description="Review payment channel performance and prepare the UI for retry flow, reconciliation, and support investigation."
        primaryAction={{ label: "Review orders", href: "/orders" }}
        secondaryAction={{ label: "Open settings", href: "/settings" }}
        title="Support payment operations across every launch channel"
      />

      <ContentCard
        title="Method overview"
        description="Built for PromptPay QR, card payment, and TrueMoney review with room for retry and reconciliation tools."
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">Method</th>
                <th className="px-5 py-4 font-medium">Orders</th>
                <th className="px-5 py-4 font-medium">Success rate</th>
                <th className="px-5 py-4 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.method}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                    {payment.method}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill label={String(payment.orders)} />
                  </td>
                  <td className="px-5 py-4">{payment.successRate}</td>
                  <td className="px-5 py-4">{payment.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
