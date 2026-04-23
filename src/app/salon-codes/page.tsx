import { Suspense } from "react";
import { SalonCodeManager } from "@/components/admin-next/salon-code-manager";
import { TablePageSkeleton } from "@/components/admin-next/table-page-skeleton";

async function getSalonCodes() {
  try {
    const baseUrl =
      process.env.ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${baseUrl}/salon-codes`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function SalonCodesContent() {
  const items = await getSalonCodes();
  return <SalonCodeManager initialItems={items} />;
}

export default function SalonCodesPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<TablePageSkeleton rows={6} cols={6} />}>
        <SalonCodesContent />
      </Suspense>
    </div>
  );
}
