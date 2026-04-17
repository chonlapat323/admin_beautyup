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
    template: "%s | Beauty Up Enterprise Admin",
    default: "Beauty Up Enterprise Admin",
  },
  description:
    "Beauty Up Enterprise backoffice for managing catalog, members, orders, payments, reports, and operational settings.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#4d7e62" showSpinner={false} />
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
