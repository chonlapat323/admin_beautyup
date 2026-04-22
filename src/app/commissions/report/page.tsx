import { CommissionReport } from "@/components/admin-next/commission-report";

export const metadata = { title: "รายงาน Commission" };

export default function CommissionReportPage() {
  return (
    <div className="space-y-6">
      <CommissionReport />
    </div>
  );
}
