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
    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
      {children}
    </div>
  );
}

const QUICK_LINKS = [
  {
    label: "สมาชิก",
    href: "/members",
    desc: "จัดการสมาชิกและข้อมูลส่วนตัว",
    icon: (
      <svg className="h-4 w-4 text-[#5f8f74]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    label: "สินค้า",
    href: "/products",
    desc: "จัดการสินค้าและสต็อก",
    icon: (
      <svg className="h-4 w-4 text-[#5f8f74]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    ),
  },
  {
    label: "คอมมิชชัน",
    href: "/commissions",
    desc: "ตรวจสอบและจ่ายค่าคอมมิชชัน",
    icon: (
      <svg className="h-4 w-4 text-[#5f8f74]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    label: "รายงาน",
    href: "/reports",
    desc: "รายงานยอดขายและคอมมิชชัน",
    icon: (
      <svg className="h-4 w-4 text-[#5f8f74]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    label: "รางวัล",
    href: "/reward-products",
    desc: "จัดการสินค้าแลกแต้ม",
    icon: (
      <svg className="h-4 w-4 text-[#5f8f74]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0H8.25m3.75 0h3.75M12 7.5v13.5" />
      </svg>
    ),
  },
];

export default async function Home() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard
          label="ยอดขายรวม"
          value={data.orderCount > 0 ? `฿${thb(data.revenue)}` : "-"}
          hint={`${thb(data.orderCount)} คำสั่งซื้อทั้งหมด`}
          icon={
            <IconBox bg="bg-[#e8f5ee]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d5e44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b5bdb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </IconBox>
          }
        />
        <StatCard
          label="สต็อกต่ำ"
          value={`${data.lowStockCount} รหัสสินค้า`}
          hint={data.lowStockCount > 0 ? "สินค้าที่เหลือ ≤ 10 ชิ้น" : "สต็อกทุกรายการปกติ"}
          icon={
            <IconBox bg="bg-[#fff3e0]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </IconBox>
          }
        />
        <div className="col-span-2 xl:col-span-1">
          <StatCard
            label="คอมมิชชันวันนี้"
            value={data.commission.source === "api" ? `฿${thb(data.commission.todayTotal)}` : "-"}
            hint={
              data.commission.source === "api"
                ? `${data.commission.todayCount} รายการที่จ่ายวันนี้`
                : "ไม่สามารถโหลดข้อมูลได้"
            }
            icon={
              <IconBox bg="bg-[#fce4ec]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2185b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </IconBox>
            }
          />
        </div>
      </section>

      {/* Main content */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] [&>*]:min-w-0">
        {/* Recent orders */}
        <ContentCard
          title="คำสั่งซื้อล่าสุด"
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
            <div className="overflow-x-auto rounded-2xl border border-stroke dark:border-dark-3">
              <table className="w-full text-left">
                <thead className="bg-[#f8fbf9] text-xs text-dark-5 dark:bg-dark-2 dark:text-dark-6">
                  <tr>
                    <th className="w-full px-4 py-3 font-semibold">คำสั่งซื้อ</th>
                    <th className="hidden px-4 py-3 font-semibold lg:table-cell">สมาชิก</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">ยอดรวม</th>
                    <th className="whitespace-nowrap px-4 py-3 font-semibold">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-stroke text-sm transition-colors hover:bg-[#fafcfb] dark:border-dark-3 dark:hover:bg-dark-2/50"
                    >
                      <td className="w-full min-w-0 px-4 py-3.5">
                        <span className="block truncate font-semibold text-dark dark:text-white">
                          {order.code}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3.5 text-dark-5 dark:text-dark-6 lg:table-cell">
                        {order.member}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums text-dark dark:text-white">
                        ฿{thb(order.total)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
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
            <div className="flex flex-col items-center py-14">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f6f2]">
                <svg className="h-6 w-6 text-[#7faa93]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <p className="font-semibold text-dark dark:text-white">ยังไม่มีคำสั่งซื้อ</p>
              <p className="mt-1 text-sm text-dark-5">คำสั่งซื้อใหม่จะปรากฏที่นี่</p>
            </div>
          )}
        </ContentCard>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Low stock alert — urgent, shown first */}
          {data.lowStockCount > 0 && (
            <div className="rounded-[22px] border border-[#ffe4b5] bg-[#fffbf0] p-5 shadow-1 dark:border-[#6b4c00] dark:bg-[#2a2000]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0c8]">
                  <svg className="h-4 w-4 text-[#9a6a12]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9a6a12]">
                    แจ้งเตือนสต็อก
                  </p>
                  <p className="mt-1 text-2xl font-bold text-dark dark:text-white">
                    {data.lowStockCount} รหัสสินค้า
                  </p>
                  <p className="text-sm text-[#9a6a12]">สินค้าที่เหลือ ≤ 10 ชิ้น</p>
                  <Link
                    href="/products"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#7a5410] hover:underline dark:text-[#f0c060]"
                  >
                    ดูสินค้า →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <ContentCard title="เมนูหลัก">
            <nav className="space-y-0.5">
              {QUICK_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#f4fbf6] dark:hover:bg-dark-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f6f2] dark:bg-dark-3">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-dark dark:text-white">
                      {item.label}
                    </p>
                    <p className="truncate text-xs text-dark-5 dark:text-dark-6">
                      {item.desc}
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-dark-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </nav>
          </ContentCard>
        </div>
      </section>
    </div>
  );
}
