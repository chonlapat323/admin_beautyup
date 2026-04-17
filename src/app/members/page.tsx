import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";
import { getMembers } from "@/lib/admin-api";
import { toThaiLabel } from "@/lib/thai-text";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="space-y-6">
      <ContentCard
        title="ภาพรวมสมาชิกและผู้แนะนำ"
        description="เตรียมไว้สำหรับจัดการโปรไฟล์ ประวัติแต้มสะสม หมายเหตุช่วยเหลือ และความสัมพันธ์ของผู้แนะนำ"
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">ชื่อ</th>
                <th className="px-5 py-4 font-medium">ระดับสมาชิก</th>
                <th className="px-5 py-4 font-medium">แต้ม</th>
                <th className="px-5 py-4 font-medium">ผู้แนะนำ</th>
                <th className="px-5 py-4 font-medium">ยอดใช้จ่าย</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.name}
                  className="border-t border-stroke text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6"
                >
                  <td className="px-5 py-4 font-semibold text-dark dark:text-white">
                    {member.name}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill
                      label={toThaiLabel(member.tier)}
                      tone={member.tier === "Gold" ? "warning" : member.tier === "Silver" ? "success" : "default"}
                    />
                  </td>
                  <td className="px-5 py-4">{member.points}</td>
                  <td className="px-5 py-4">{member.referrals}</td>
                  <td className="px-5 py-4">{member.spend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </div>
  );
}
