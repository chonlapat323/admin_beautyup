"use client";

import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useRef } from "react";

const AUTH_PATHS = ["/login", "/auth/sign-in"];

export function AppFrame({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  const isAuthPage = AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  if (isAuthPage) {
    return <main className="min-h-screen bg-gray-2 dark:bg-[#020d1a]">{children}</main>;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main
          ref={mainRef}
          className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-2 dark:bg-[#020d1a]"
        >
          <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
