import { CommissionManager } from "@/components/admin-next/commission-manager";

export const metadata = { title: "คอมมิชชัน" };

export default function CommissionsPage() {
  return (
    <div className="space-y-6">
      <CommissionManager />
    </div>
  );
}
