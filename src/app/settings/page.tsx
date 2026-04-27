import { getRawSettings } from "@/lib/admin-api";
import { SettingsForm } from "@/components/admin-next/settings-form";

const FALLBACK = {
  shipping: { freeShippingThreshold: 1000, defaultShippingFee: 50 },
  points: { threshold: 3000, earnedPoint: 300 },
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
