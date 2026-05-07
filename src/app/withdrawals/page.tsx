import { WithdrawalManager } from "@/components/admin-next/withdrawal-manager";

export const metadata = { title: "ถอน Credit" };

export default function WithdrawalsPage() {
  return (
    <div className="space-y-6">
      <WithdrawalManager />
    </div>
  );
}
