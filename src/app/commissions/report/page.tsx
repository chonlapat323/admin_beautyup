import { CommissionReport } from "@/components/admin-next/commission-report";

export const metadata = { title: "รายงานคอมมิชชัน" };

export default function CommissionReportPage() {
  return (
    <div className="space-y-6">
      <CommissionReport />
    </div>
  );
}
