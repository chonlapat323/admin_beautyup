import { ContentCard, PageIntro, StatCard } from "@/components/admin-next/page-elements";
import { reportCards } from "@/lib/admin-data";

const reportNotes = [
  "Prepare dashboard cards for sales by store and category contribution.",
  "Leave space for point usage, commission payout, and stock health summaries.",
  "Keep layout simple so stakeholders can scan branch performance quickly.",
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Reports"
      badge="Store reporting"
      description="Present branch performance, inventory health, and member-related insights in a clean dashboard for business review."
      primaryAction={{ label: "Open dashboard", href: "/" }}
      secondaryAction={{ label: "Review orders", href: "/orders" }}
      title="Bring store performance into one calm reporting view"
      />

      <section className="grid gap-4 md:grid-cols-3">
        {reportCards.map((card) => (
          <StatCard key={card.title} label={card.title} value={card.value} hint={card.note} />
        ))}
      </section>

      <ContentCard
        title="Reporting guidance"
        description="A clean analytics layer keeps branch performance easy to scan during reviews."
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
