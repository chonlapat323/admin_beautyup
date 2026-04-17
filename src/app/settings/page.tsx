import { ContentCard, StatusPill } from "@/components/admin-next/page-elements";
import { getSettings } from "@/lib/admin-api";

export default async function SettingsPage() {
  const settingsSections = await getSettings();

  return (
    <div className="space-y-6">
      <ContentCard
        title="การตั้งค่าธุรกิจ"
        description="การ์ดเหล่านี้สามารถต่อยอดเป็นฟอร์มแก้ไขได้ทันทีเมื่อเชื่อม CRUD ฝั่งหลังบ้าน"
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
                <StatusPill label={section.source === "api" ? "เชื่อมต่อแล้ว" : "ข้อมูลตัวอย่าง"} />
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
