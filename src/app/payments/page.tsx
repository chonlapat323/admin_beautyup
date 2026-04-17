import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";
import { getPayments } from "@/lib/admin-api";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-6">
      <ContentCard
        title="ภาพรวมช่องทางชำระเงิน"
        description="ใช้สำหรับติดตาม PromptPay QR บัตร และ TrueMoney พร้อมรองรับการ retry และ reconciliation ในภายหลัง"
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">ช่องทาง</th>
                <th className="px-5 py-4 font-medium">จำนวนรายการ</th>
                <th className="px-5 py-4 font-medium">อัตราสำเร็จ</th>
                <th className="px-5 py-4 font-medium">หมายเหตุ</th>
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
