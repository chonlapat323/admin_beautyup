export type NavItem = {
  label: string;
  href: string;
};

export const navigationItems: NavItem[] = [
  { label: "Overview", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Products", href: "/products" },
  { label: "Members", href: "/members" },
  { label: "Admin Users", href: "/admin-users" },
  { label: "Roles", href: "/roles" },
  { label: "Orders", href: "/orders" },
  { label: "Payments", href: "/payments" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export const summaryMetrics = [
  { label: "Total Sales", value: "THB 128,400", hint: "+12.4% this month" },
  { label: "Orders", value: "324", hint: "18 awaiting review" },
  { label: "Members", value: "1,286", hint: "42 new this week" },
  { label: "Low Stock", value: "7 SKU", hint: "Needs restock planning" },
];

export const launchModules = [
  {
    title: "Catalog Control",
    description:
      "Maintain launch products, categories, media links, pricing, and active status from one workspace.",
  },
  {
    title: "Member Operations",
    description:
      "Review profiles, point balances, referral ownership, and store-specific history before support action.",
  },
  {
    title: "Order & Payment Review",
    description:
      "Track checkout progress, PromptPay verification, card status, and wallet payments without leaving the dashboard.",
  },
  {
    title: "Rules & Settings",
    description:
      "Control shipping thresholds, reserve stock policy, point rules, role permissions, and channel links.",
  },
];

export const categories = [
  { name: "Color & Bleach", status: "Active", products: 18, updatedAt: "16 Apr 2026" },
  { name: "Shampoo & Mask", status: "Active", products: 21, updatedAt: "15 Apr 2026" },
  { name: "Leave In", status: "Active", products: 14, updatedAt: "14 Apr 2026" },
  { name: "Point Rewards", status: "Draft", products: 9, updatedAt: "12 Apr 2026" },
];

export const products = [
  { sku: "BU-CLR-013NB", name: "13-NB Color Cream", category: "Color & Bleach", price: "THB 49", stock: 180, status: "Active" },
  { sku: "BU-CLR-AD13", name: "Addicthy 13-NB", category: "Color & Bleach", price: "THB 54", stock: 72, status: "Active" },
  { sku: "BU-SHM-001", name: "Smooth Smoothing Shampoo", category: "Shampoo & Mask", price: "THB 58", stock: 94, status: "Active" },
  { sku: "BU-LIV-001", name: "Elujuda Hair Oil", category: "Leave In", price: "THB 42", stock: 38, status: "Low stock" },
];

export const members = [
  { name: "Nisa P.", tier: "Silver", points: 600, referrals: 2, spend: "THB 6,420" },
  { name: "Pimlada K.", tier: "Gold", points: 900, referrals: 5, spend: "THB 12,840" },
  { name: "Thanaporn S.", tier: "Silver", points: 300, referrals: 1, spend: "THB 3,280" },
  { name: "Kanya R.", tier: "Basic", points: 0, referrals: 0, spend: "THB 980" },
];

export const adminUsers = [
  { name: "Pao Chonlapat", role: "Super Admin", status: "Active", access: "All stores" },
  { name: "Store Admin A", role: "Admin", status: "Active", access: "Bangkok Branch" },
  { name: "Store Admin B", role: "Admin", status: "Pending", access: "Chiang Mai Branch" },
];

export const rolePermissions = [
  { permission: "Manage products", superAdmin: "Full access", admin: "Create / edit / publish" },
  { permission: "Manage members", superAdmin: "Full access", admin: "View / update support notes" },
  { permission: "Manage admins", superAdmin: "Full access", admin: "No access" },
  { permission: "System settings", superAdmin: "Full access", admin: "Store-level only" },
];

export const orders = [
  { code: "BU-24003", member: "Nisa P.", store: "Bangkok", total: "THB 62", status: "Preparing" },
  { code: "BU-24018", member: "Pimlada K.", store: "Bangkok", total: "THB 118", status: "Paid" },
  { code: "BU-24031", member: "Thanaporn S.", store: "Chiang Mai", total: "THB 84", status: "Delivered" },
];

export const payments = [
  { method: "PromptPay QR", orders: 162, successRate: "98.1%", note: "Primary method for mobile checkout" },
  { method: "Credit / Debit Card", orders: 94, successRate: "96.4%", note: "Supports premium checkout flow" },
  { method: "TrueMoney Wallet", orders: 68, successRate: "95.8%", note: "Popular among returning members" },
];

export const reportCards = [
  { title: "Sales by store", value: "3 branches", note: "Bangkok leads at 48% of total sales" },
  { title: "Top category", value: "Color & Bleach", note: "Highest conversion from shade-first flow" },
  { title: "Point redemptions", value: "126 claims", note: "Reward menu launches every campaign cycle" },
];

export const settingsSections = [
  { title: "Shipping Rules", description: "Free shipping at THB 1,000 and above, fallback fee below threshold." },
  { title: "Point Rules", description: "Award 300 points for each THB 3,000 paid successfully." },
  { title: "Referral Rules", description: "Commission set to 3% for successful referred purchases." },
  { title: "Media Links", description: "Configure storefront shortcuts to YouTube, TikTok, and brand channels." },
];
