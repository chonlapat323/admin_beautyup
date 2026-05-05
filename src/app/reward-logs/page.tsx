import { Suspense } from "react";
import { RewardLogManager } from "@/components/admin-next/reward-log-manager";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";

export default function RewardLogsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={8} cols={5} />}>
        <RewardLogManager />
      </Suspense>
    </div>
  );
}
