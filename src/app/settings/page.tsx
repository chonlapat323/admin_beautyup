import { ContentCard, PageIntro, StatusPill } from "@/components/admin-next/page-elements";
import { getSettings } from "@/lib/admin-api";

export default async function SettingsPage() {
  const settingsSections = await getSettings();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Settings"
        badge={settingsSections[0]?.source === "api" ? "Live API" : "Mock fallback"}
        description="Manage shipping thresholds, point rules, referral logic, and media channels from a single configuration workspace."
        primaryAction={{ label: "Review roles", href: "/roles" }}
        secondaryAction={{ label: "Open payments", href: "/payments" }}
        title="Keep operational rules consistent across the whole Beauty Up system"
      />

      <ContentCard
        title="Business settings"
        description="These cards can become form sections as soon as backend settings CRUD is connected."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => (
            <article
              key={section.title}
              className="rounded-[20px] border border-stroke bg-[#fbfdfb] p-5 dark:border-dark-3 dark:bg-dark-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  {section.title}
                </h3>
                <StatusPill label={section.source === "api" ? "Live" : "Mock"} />
              </div>
              <p className="mt-3 text-sm leading-6 text-dark-5 dark:text-dark-6">
                {section.description}
              </p>
            </article>
          ))}
        </div>
      </ContentCard>
    </div>
  );
}
