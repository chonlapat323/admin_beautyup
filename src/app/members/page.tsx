import { ContentCard, PageIntro, StatusPill } from "@/components/admin-next/page-elements";
import { getMembers } from "@/lib/admin-api";

export default async function MembersPage() {
  const members = await getMembers();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Member Management"
        badge={members[0]?.source === "api" ? "Live API" : "Mock fallback"}
        description="Track member profiles, point balances, referral ownership, and spending history before support action."
        primaryAction={{ label: "Create member", href: "/members" }}
        secondaryAction={{ label: "View reports", href: "/reports" }}
        title="Keep member operations visible, simple, and support-ready"
      />

      <ContentCard
        title="Customer and referral overview"
        description="Prepared for profile CRUD, points history, support notes, and referral ownership review."
      >
        <div className="overflow-hidden rounded-2xl border border-stroke dark:border-dark-3">
          <table className="w-full text-left">
            <thead className="bg-[#f8fbf9] text-sm text-dark-5 dark:bg-dark-2 dark:text-dark-6">
              <tr>
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Tier</th>
                <th className="px-5 py-4 font-medium">Points</th>
                <th className="px-5 py-4 font-medium">Referrals</th>
                <th className="px-5 py-4 font-medium">Spend</th>
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
                      label={member.tier}
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
