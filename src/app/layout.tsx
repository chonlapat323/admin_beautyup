import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import { AppFrame } from "@/components/admin-next/app-frame";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | ระบบหลังบ้าน Beauty Up Enterprise",
    default: "ระบบหลังบ้าน Beauty Up Enterprise",
  },
  description:
    "ระบบหลังบ้าน Beauty Up Enterprise สำหรับจัดการสินค้า สมาชิก คำสั่งซื้อ การชำระเงิน รายงาน และการตั้งค่าการทำงาน",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#4d7e62" showSpinner={false} />
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
