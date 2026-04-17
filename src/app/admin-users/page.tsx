import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";
import { adminUsers } from "@/lib/admin-data";
import { toThaiLabel } from "@/lib/thai-text";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <ContentCard
        title="ภาพรวมสิทธิ์ผู้ใช้งาน"
        description=""
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">ชื่อ</th>
                <th className="px-5 py-4 font-medium">บทบาท</th>
                <th className="px-5 py-4 font-medium">สถานะ</th>
                <th className="px-5 py-4 font-medium">สิทธิ์ที่ดูแล</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.map((user) => (
                <tr
                  key={user.name}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                    {user.name}
                  </td>
                  <td className="px-5 py-4">{toThaiLabel(user.role)}</td>
                  <td className="px-5 py-4">
                    <StatusPill
                      label={toThaiLabel(user.status)}
                      tone={user.status === "Active" ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-5 py-4">{user.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
