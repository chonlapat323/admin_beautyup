import { WithdrawalManager } from "@/components/admin-next/withdrawal-manager";

export const metadata = { title: "ถอนเครดิต" };

export default function WithdrawalsPage() {
  return (
    <div className="space-y-6">
      <WithdrawalManager />
    </div>
  );
}
