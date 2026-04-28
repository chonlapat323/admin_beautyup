import { getRawSettings } from "@/lib/admin-api";
import { SettingsForm } from "@/components/admin-next/settings-form";

const FALLBACK = {
  shipping: { freeShippingThreshold: 1000, defaultShippingFee: 50 },
  points: { tiers: [{ minSpend: 3000, points: 300 }, { minSpend: 5000, points: 500 }, { minSpend: 10000, points: 1000 }] },
  referral: { commissionRate: 0.03 },
  stock: { reservePercentage: 10 },
  payment: { gatewayFee: 20 },
};

export default async function SettingsPage() {
  let settings = FALLBACK;
  try {
    settings = await getRawSettings();
  } catch {
    // use fallback
  }

  return <SettingsForm initial={settings} />;
}
