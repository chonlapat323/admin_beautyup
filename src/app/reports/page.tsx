import { ContentCard, StatCard } from "@/components/admin-next/page-elements";
import { reportCards } from "@/lib/admin-data";

const reportNotes = [
  "เตรียมการ์ดสรุปสำหรับยอดขายรายสาขาและสัดส่วนการขายแต่ละหมวดหมู่",
  "เผื่อพื้นที่สำหรับสรุปการใช้แต้ม ค่าคอมมิชชัน และสถานะสต็อกในอนาคต",
  "คงรูปแบบให้เรียบง่ายเพื่อให้ผู้บริหารและทีมงานสแกนข้อมูลได้รวดเร็ว",
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {reportCards.map((card) => (
          <StatCard key={card.title} label={card.title} value={card.value} hint={card.note} />
        ))}
      </section>

      <ContentCard
        title="แนวทางการใช้งานรายงาน"
        description="การจัดวางข้อมูลที่เรียบง่ายช่วยให้มองเห็นผลงานของแต่ละสาขาได้ชัดเจนขึ้น"
      >
        <ul className="space-y-3">
          {reportNotes.map((note) => (
            <li
              key={note}
              className="rounded-2xl bg-[#f7fbf8] p-4 text-sm leading-6 text-dark-5 dark:bg-dark-2 dark:text-dark-6"
            >
              {note}
            </li>
          ))}
        </ul>
      </ContentCard>
    </div>
  );
}
