import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";
import { rolePermissions } from "@/lib/admin-data";
import { toThaiLabel } from "@/lib/thai-text";

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <ContentCard
        title="ตารางสิทธิ์การใช้งาน"
        description="หน้าแสดงสิทธิ์พื้นฐานเพื่อใช้ต่อยอดกับ policy และ route protection ในขั้นถัดไป"
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">สิทธิ์</th>
                <th className="px-5 py-4 font-medium">ซูเปอร์แอดมิน</th>
                <th className="px-5 py-4 font-medium">แอดมิน</th>
              </tr>
            </thead>
            <tbody>
              {rolePermissions.map((row) => (
                <tr
                  key={row.permission}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">{row.permission}</td>
                  <td className="px-5 py-4">
                    <StatusPill label={toThaiLabel(row.superAdmin)} tone="success" />
                  </td>
                  <td className="px-5 py-4">{toThaiLabel(row.admin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
