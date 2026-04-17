"use client";

import { SearchIcon } from "@/assets/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";

const PAGE_COPY: Record<string, { title: string; description: string }> = {
  "/": {
    title: "แดชบอร์ด Beauty Up",
    description: "ติดตามสินค้า สมาชิก การชำระเงิน และภาพรวมการทำงานได้ในหน้าจอเดียว",
  },
  "/categories": {
    title: "จัดการหมวดหมู่",
    description: "จัดโครงสร้างหมวดหมู่ให้พร้อมสำหรับการใช้งานและการอัปเดตในอนาคต",
  },
  "/products": {
    title: "จัดการสินค้า",
    description: "ดูแล SKU สต็อก ราคา สื่อ และสถานะการแสดงผลได้จากที่เดียว",
  },
  "/members": {
    title: "จัดการสมาชิก",
    description: "ตรวจสอบข้อมูลสมาชิก แต้มสะสม และการแนะนำสมาชิกได้อย่างชัดเจน",
  },
  "/admin-users": {
    title: "ผู้ดูแลระบบ",
    description: "จัดการสิทธิ์การเข้าถึง การดูแลแต่ละสาขา และสถานะของผู้ดูแลระบบ",
  },
  "/roles": {
    title: "สิทธิ์การใช้งาน",
    description: "กำหนดขอบเขตการทำงานของซูเปอร์แอดมินและแอดมินในระบบหลังบ้าน",
  },
  "/orders": {
    title: "จัดการคำสั่งซื้อ",
    description: "ติดตามคำสั่งซื้อทุกขั้นตอนตั้งแต่ชำระเงินจนถึงจัดส่งและสรุปรายงาน",
  },
  "/payments": {
    title: "ตรวจสอบการชำระเงิน",
    description: "ตรวจสอบประสิทธิภาพการชำระผ่าน PromptPay บัตร และวอลเล็ท",
  },
  "/reports": {
    title: "รายงานธุรกิจ",
    description: "ติดตามผลงานแต่ละสาขา สินค้าขายดี และผลลัพธ์ของแคมเปญ",
  },
  "/settings": {
    title: "ตั้งค่าระบบ",
    description: "ปรับเงื่อนไขจัดส่ง แต้มสะสม การแนะนำ สต็อก และช่องทางต่าง ๆ",
  },
};

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const pathname = usePathname();
  const pageCopy = PAGE_COPY[pathname] ?? PAGE_COPY["/"];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stroke bg-white px-4 py-5 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <MenuIcon />
        <span className="sr-only">เปิดหรือปิดเมนูด้านข้าง</span>
      </button>

      {isMobile && (
        <Link
          href={"/"}
          className="ml-2 flex size-10 items-center justify-center rounded-2xl bg-[#e8f5ec] text-base font-bold text-[#3d6d55] max-[430px]:hidden min-[375px]:ml-4"
        >
          B
        </Link>
      )}

      <div className="max-xl:hidden">
        <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
          {pageCopy.title}
        </h1>
        <p className="font-medium">{pageCopy.description}</p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        {/* <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Search catalog, orders, members"
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div> */}

        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
