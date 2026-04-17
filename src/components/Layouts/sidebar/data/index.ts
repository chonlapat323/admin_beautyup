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
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        url: "/",
        items: [],
      },
      {
        title: "Categories",
        url: "/categories",
        icon: Icons.Alphabet,
        items: [],
      },
      {
        title: "Products",
        url: "/products",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Members",
        url: "/members",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Admin Users",
        url: "/admin-users",
        icon: Icons.Authentication,
        items: [],
      },
      {
        title: "Roles",
        url: "/roles",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "Orders",
        url: "/orders",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "Payments",
        url: "/payments",
        icon: Icons.PieChart,
        items: [],
      },
      {
        title: "Reports",
        url: "/reports",
        icon: Icons.Table,
        items: [],
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Icons.Alphabet,
        items: [],
      },
    ],
  },
];
