import Link from "next/link";
import {
  ContentCard,
  StatCard,
  StatusPill,
} from "@/components/admin-next/page-elements";
import { toThaiLabel } from "@/lib/thai-text";
import { getDashboardData } from "./fetch";

function thb(n: number) {
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function orderTone(status: string): "success" | "warning" | "default" {
  const s = status.toUpperCase();
  if (s === "DELIVERED" || s === "COMPLETED" || s === "PAID") return "success";
  if (s === "PENDING" || s === "PROCESSING" || s === "PREPARING") return "warning";
  return "default";
}

function IconBox({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
      {children}
    </div>
  );
}

const QUICK_LINKS = [
  { label: "สมาชิก", href: "/members", desc: "จัดการสมาชิกและข้อมูลส่วนตัว" },
  { label: "สินค้า", href: "/products", desc: "จัดการสินค้าและสต็อก" },
  { label: "คอมมิชชัน", href: "/commissions", desc: "ตรวจสอบและจ่ายค่าคอมมิชชัน" },
  { label: "รายงาน", href: "/reports", desc: "รายงานยอดขายและ commission" },
  { label: "รางวัล", href: "/reward-products", desc: "จัดการสินค้าแลกแต้ม" },
];

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="ยอดขายรวม"
          value={data.orderCount > 0 ? `฿${thb(data.revenue)}` : "-"}
          hint={`${thb(data.orderCount)} คำสั่งซื้อทั้งหมด`}
          icon={
            <IconBox bg="bg-[#e8f5ee]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d5e44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </IconBox>
          }
        />
        <StatCard
          label="คำสั่งซื้อ"
          value={thb(data.orderCount)}
          hint={
            data.pendingOrderCount > 0
              ? `${data.pendingOrderCount} รายการรอดำเนินการ`
              : "ไม่มีรายการค้างดำเนินการ"
          }
          icon={
            <IconBox bg="bg-[#e8f0fe]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </IconBox>
          }
        />
        <StatCard
          label="สมาชิก"
          value={data.memberCount > 0 ? thb(data.memberCount) : "-"}
          hint="สมาชิกทั้งหมดในระบบ"
          icon={
            <IconBox bg="bg-[#f3e8ff]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </IconBox>
          }
        />
        <StatCard
          label="สต็อกต่ำ"
          value={`${data.lowStockCount} SKU`}
          hint={
            data.lowStockCount > 0
              ? "สินค้าที่เหลือ ≤ 10 ชิ้น"
              : "สต็อกทุกรายการปกติ"
          }
          icon={
            <IconBox bg="bg-[#fff3e0]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </IconBox>
          }
        />
        <StatCard
          label="คอมมิชชันวันนี้"
          value={
            data.commission.source === "api"
              ? `฿${thb(data.commission.todayTotal)}`
              : "-"
          }
          hint={
            data.commission.source === "api"
              ? `${data.commission.todayCount} รายการที่จ่ายวันนี้`
              : "ไม่สามารถโหลดข้อมูลได้"
          }
          icon={
            <IconBox bg="bg-[#fce4ec]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c2185b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </IconBox>
          }
        />
      </section>

      {/* Main content */}
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Recent orders — ดึงจาก API จริงผ่าน getOrderStats() */}
        <ContentCard
          title="คำสั่งซื้อล่าสุด"
          description={`${data.recentOrders.length} คำสั่งซื้อล่าสุดจากระบบ`}
          aside={
            <Link
              href="/orders"
              className="text-sm font-semibold text-[#45745a] hover:underline dark:text-[#7fc49a]"
            >
              ดูทั้งหมด →
            </Link>
          }
        >
          {data.recentOrders.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
              <table className="w-full text-left">
                <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="px-5 py-4 font-medium">คำสั่งซื้อ</th>
                    <th className="px-5 py-4 font-medium">สมาชิก</th>
                    <th className="px-5 py-4 font-medium">ยอดรวม</th>
                    <th className="px-5 py-4 font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-stroke text-sm dark:border-dark-3"
                    >
                      <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                        {order.code}
                      </td>
                      <td className="px-5 py-4 text-dark-5 dark:text-dark-6">
                        {order.member}
                      </td>
                      <td className="px-5 py-4 font-medium text-dark dark:text-white">
                        ฿{thb(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill
                          label={toThaiLabel(order.status)}
                          tone={orderTone(order.status)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-dark-5 dark:text-dark-6">
              ยังไม่มีคำสั่งซื้อในระบบ
            </p>
          )}
        </ContentCard>

        {/* Right sidebar */}
        <div className="space-y-6">
          <ContentCard title="เมนูหลัก">
            <nav className="space-y-1">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-[#f4fbf6] dark:hover:bg-dark-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-dark dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-dark-5 dark:text-dark-6">{item.desc}</p>
                  </div>
                  <span className="text-sm text-[#5f8f74]">→</span>
                </Link>
              ))}
            </nav>
          </ContentCard>

          {data.lowStockCount > 0 && (
            <div className="rounded-[22px] border border-[#ffe4b5] bg-[#fffbf0] p-5 shadow-1 dark:border-[#6b4c00] dark:bg-[#2a2000]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a6a12]">
                แจ้งเตือนสต็อก
              </p>
              <p className="mt-2 text-2xl font-bold text-dark dark:text-white">
                {data.lowStockCount} SKU
              </p>
              <p className="mt-1 text-sm text-[#9a6a12]">สินค้าที่เหลือ ≤ 10 ชิ้น</p>
              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#7a5410] hover:underline dark:text-[#f0c060]"
              >
                ดูสินค้า →
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
