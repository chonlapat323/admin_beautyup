import * as Icons from "../icons";
import type { ComponentType } from "react";

type NavSubItem = {
  title: string;
  url: string;
};

type NavItem = {
  title: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  url?: string;
  items: NavSubItem[];
};

type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_DATA: NavSection[] = [
  {
    label: "เมนูหลัก",
    items: [
      {
        title: "ภาพรวม",
        icon: Icons.HomeIcon,
        url: "/",
        items: [],
      },
      {
        title: "แบรนด์",
        url: "/brands",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "หมวดหมู่",
        url: "/categories",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "คอลเลกชัน",
        url: "/collections",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "สินค้า",
        url: "/products",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "สินค้าแลกแต้ม",
        url: "/reward-products",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "แบนเนอร์",
        url: "/banners",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "สูตรพิเศษ",
        url: "/bundles",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "สมาชิก",
        url: "/members",
        icon: Icons.User,
        items: [],
      },
      {
        title: "ผู้ดูแลระบบ",
        url: "/admin-users",
        icon: Icons.Authentication,
        items: [],
      },
      {
        title: "สิทธิ์การใช้งาน",
        url: "/roles",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "สต็อกสินค้า",
        url: "/stock",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "คำสั่งซื้อ",
        url: "/orders",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "การชำระเงิน",
        url: "/payments",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "โค้ดซาลอน",
        url: "/salon-codes",
        icon: Icons.User,
        items: [],
      },
      {
        title: "จ่ายคอมมิชชัน",
        url: "/commissions",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "คำขอถอนเครดิต",
        url: "/withdrawals",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "รายงาน",
        icon: Icons.PieChart,
        items: [
          { title: "ภาพรวม", url: "/reports" },
          { title: "คอมมิชชัน", url: "/commissions/report" },
          { title: "แลกของรางวัล", url: "/reward-logs" },
        ],
      },
      {
        title: "Transaction Log",
        url: "/credit-transactions",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "Audit Log",
        url: "/audit-logs",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "ตั้งค่า",
        url: "/settings",
        icon: Icons.Alphabet,
        items: [],
      },
    ],
  },
];
