"use client";

import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

const AUTH_PATHS = ["/login", "/auth/sign-in"];

export function AppFrame({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isAuthPage) {
    return <main className="min-h-screen bg-gray-2 dark:bg-[#020d1a]">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
