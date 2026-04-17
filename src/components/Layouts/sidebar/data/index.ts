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
        title: "หมวดหมู่",
        url: "/categories",
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
        title: "รายงาน",
        url: "/reports",
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
