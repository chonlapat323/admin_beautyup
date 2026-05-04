import { Suspense } from "react";
import { RewardProductManager } from "@/components/admin-next/reward-product-manager";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";

async function getRewardProducts() {
  try {
    const baseUrl =
      process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${baseUrl}/reward-products`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function RewardProductsContent() {
  const items = await getRewardProducts();
  return <RewardProductManager initialItems={items} />;
}

export default function RewardProductsPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={5} cols={5} />}>
        <RewardProductsContent />
      </Suspense>
    </div>
  );
}
