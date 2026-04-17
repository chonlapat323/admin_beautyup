export type NavItem = {
  label: string;
  href: string;
};

export const navigationItems: NavItem[] = [
  { label: "ภาพรวม", href: "/" },
  { label: "หมวดหมู่", href: "/categories" },
  { label: "สินค้า", href: "/products" },
  { label: "สมาชิก", href: "/members" },
  { label: "ผู้ดูแลระบบ", href: "/admin-users" },
  { label: "สิทธิ์การใช้งาน", href: "/roles" },
  { label: "คำสั่งซื้อ", href: "/orders" },
  { label: "การชำระเงิน", href: "/payments" },
  { label: "รายงาน", href: "/reports" },
  { label: "ตั้งค่า", href: "/settings" },
];

export const summaryMetrics = [
  { label: "ยอดขายรวม", value: "THB 128,400", hint: "+12.4% ในเดือนนี้" },
  { label: "คำสั่งซื้อ", value: "324", hint: "18 รายการรอตรวจสอบ" },
  { label: "สมาชิก", value: "1,286", hint: "สมาชิกใหม่ 42 คนในสัปดาห์นี้" },
  { label: "สต็อกต่ำ", value: "7 SKU", hint: "ควรวางแผนเติมสินค้า" },
];

export const launchModules = [
  {
    title: "จัดการแคตตาล็อก",
    description:
      "ดูแลสินค้าเปิดตัว หมวดหมู่ ลิงก์สื่อ ราคา และสถานะการแสดงผลได้จากหน้าจอเดียว",
  },
  {
    title: "ดูแลสมาชิก",
    description:
      "ตรวจสอบโปรไฟล์สมาชิก แต้มสะสม ผู้แนะนำ และประวัติแยกตามสาขาก่อนให้การช่วยเหลือ",
  },
  {
    title: "ตรวจสอบคำสั่งซื้อและการชำระเงิน",
    description:
      "ติดตามสถานะเช็กเอาต์ การยืนยัน PromptPay สถานะบัตร และการชำระผ่านวอลเล็ทได้โดยไม่ต้องออกจากแดชบอร์ด",
  },
  {
    title: "กติกาและการตั้งค่า",
    description:
      "ควบคุมเงื่อนไขจัดส่ง นโยบายกันสต็อก กติกาแต้ม สิทธิ์การใช้งาน และลิงก์ช่องทางต่าง ๆ",
  },
];

export const categories = [
  { name: "สีผมและฟอกสี", status: "Active", products: 18, updatedAt: "16 เม.ย. 2026" },
  { name: "แชมพูและมาสก์", status: "Active", products: 21, updatedAt: "15 เม.ย. 2026" },
  { name: "ลีฟอิน", status: "Active", products: 14, updatedAt: "14 เม.ย. 2026" },
  { name: "ของรางวัลแต้มสะสม", status: "Draft", products: 9, updatedAt: "12 เม.ย. 2026" },
];

export const products = [
  { sku: "BU-CLR-013NB", name: "ครีมสีผม 13-NB", category: "สีผมและฟอกสี", price: "THB 49", stock: 180, status: "Active" },
  { sku: "BU-CLR-AD13", name: "สีผม Addicthy 13-NB", category: "สีผมและฟอกสี", price: "THB 54", stock: 72, status: "Active" },
  { sku: "BU-SHM-001", name: "แชมพู Smooth Smoothing", category: "แชมพูและมาสก์", price: "THB 58", stock: 94, status: "Active" },
  { sku: "BU-LIV-001", name: "ออยล์บำรุงผม Elujuda", category: "ลีฟอิน", price: "THB 42", stock: 38, status: "Low stock" },
];

export const members = [
  { name: "Nisa P.", tier: "Silver", points: 600, referrals: 2, spend: "THB 6,420" },
  { name: "Pimlada K.", tier: "Gold", points: 900, referrals: 5, spend: "THB 12,840" },
  { name: "Thanaporn S.", tier: "Silver", points: 300, referrals: 1, spend: "THB 3,280" },
  { name: "Kanya R.", tier: "Basic", points: 0, referrals: 0, spend: "THB 980" },
];

export const adminUsers = [
  { name: "Pao Chonlapat", role: "Super Admin", status: "Active", access: "ทุกสาขา" },
  { name: "Store Admin A", role: "Admin", status: "Active", access: "สาขากรุงเทพฯ" },
  { name: "Store Admin B", role: "Admin", status: "Pending", access: "สาขาเชียงใหม่" },
];

export const rolePermissions = [
  { permission: "จัดการสินค้า", superAdmin: "Full access", admin: "สร้าง / แก้ไข / เผยแพร่" },
  { permission: "จัดการสมาชิก", superAdmin: "Full access", admin: "ดูข้อมูล / อัปเดตหมายเหตุช่วยเหลือ" },
  { permission: "จัดการผู้ดูแลระบบ", superAdmin: "Full access", admin: "No access" },
  { permission: "ตั้งค่าระบบ", superAdmin: "Full access", admin: "Store-level only" },
];

export const orders = [
  { code: "BU-24003", member: "Nisa P.", store: "กรุงเทพฯ", total: "THB 62", status: "Preparing" },
  { code: "BU-24018", member: "Pimlada K.", store: "กรุงเทพฯ", total: "THB 118", status: "Paid" },
  { code: "BU-24031", member: "Thanaporn S.", store: "เชียงใหม่", total: "THB 84", status: "Delivered" },
];

export const payments = [
  { method: "PromptPay QR", orders: 162, successRate: "98.1%", note: "ช่องทางหลักสำหรับการชำระเงินผ่านมือถือ" },
  { method: "บัตรเครดิต / เดบิต", orders: 94, successRate: "96.4%", note: "รองรับการชำระเงินแบบพรีเมียม" },
  { method: "TrueMoney Wallet", orders: 68, successRate: "95.8%", note: "ได้รับความนิยมในกลุ่มสมาชิกที่กลับมาซื้อซ้ำ" },
];

export const reportCards = [
  { title: "ยอดขายตามสาขา", value: "3 สาขา", note: "กรุงเทพฯ มียอดขายสูงสุดที่ 48% ของยอดรวม" },
  { title: "หมวดหมู่ยอดนิยม", value: "สีผมและฟอกสี", note: "มีอัตราแปลงยอดซื้อสูงสุดจาก flow เลือกเฉดสีก่อน" },
  { title: "การใช้แต้มสะสม", value: "126 รายการ", note: "เมนูของรางวัลเริ่มใช้งานทุกช่วงแคมเปญ" },
];

export const settingsSections = [
  { title: "กติกาการจัดส่ง", description: "ฟรีค่าจัดส่งเมื่อมียอดตั้งแต่ THB 1,000 ขึ้นไป และคิดค่าจัดส่งเมื่อยอดต่ำกว่าเงื่อนไข" },
  { title: "กติกาแต้มสะสม", description: "มอบ 300 แต้มทุกการใช้จ่ายสำเร็จครบ THB 3,000" },
  { title: "กติกาผู้แนะนำ", description: "กำหนดค่าคอมมิชชัน 3% สำหรับคำสั่งซื้อที่มาจากการแนะนำสำเร็จ" },
  { title: "ลิงก์สื่อ", description: "ตั้งค่าทางลัดไปยัง YouTube, TikTok และช่องทางของแบรนด์" },
];
