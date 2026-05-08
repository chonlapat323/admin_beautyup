import { cn } from "@/lib/utils";
import Link from "next/link";
import { PropsWithChildren } from "react";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  badge?: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
};

export function PageIntro({
  eyebrow,
  title,
  description,
  badge,
  primaryAction,
  secondaryAction,
}: PageIntroProps) {
  return (
    <section className="rounded-[22px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark xl:p-7.5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#5f8f74]">
              {eyebrow}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-dark dark:text-white xl:text-heading-4">
              {title}
            </h2>

            {badge ? (
              <span className="rounded-full border border-[#d6eadc] bg-[#eef8f1] px-3 py-1 text-xs font-semibold text-[#4d7e62]">
                {badge}
              </span>
            ) : null}
          </div>

          <p className="mt-4 max-w-2xl text-base leading-7 text-dark-5 dark:text-dark-6">
            {description}
          </p>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {secondaryAction ? (
              <ActionLink href={secondaryAction.href} variant="secondary">
                {secondaryAction.label}
              </ActionLink>
            ) : null}

            {primaryAction ? (
              <ActionLink href={primaryAction.href} variant="primary">
                {primaryAction.label}
              </ActionLink>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

type ActionLinkProps = PropsWithChildren<{
  href: string;
  variant?: "primary" | "secondary";
}>;

export function ActionLink({
  href,
  children,
  variant = "primary",
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-colors",
        variant === "primary"
          ? "bg-[#45745a] text-white hover:bg-[#355846]"
          : "border border-[#d7e7dc] bg-white text-[#355846] hover:bg-[#f4fbf6] dark:border-dark-3 dark:bg-transparent dark:text-white",
      )}
    >
      {children}
    </Link>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <article className="rounded-[22px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug text-dark-5 dark:text-dark-6">{label}</p>
        {icon ? <div className="shrink-0">{icon}</div> : null}
      </div>
      <strong className="mt-3 block text-[22px] font-bold leading-none tracking-tight text-dark tabular-nums dark:text-white sm:text-[26px]">
        {value}
      </strong>
      <p className="mt-1.5 text-xs leading-snug text-dark-5 dark:text-dark-6">{hint}</p>
    </article>
  );
}

export function ContentCard({
  title,
  description,
  children,
  aside,
}: PropsWithChildren<{
  title: string;
  description?: string;
  aside?: React.ReactNode;
}>) {
  return (
    <section className="rounded-[22px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-6 xl:p-7.5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-dark dark:text-white sm:text-xl">{title}</h3>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-dark-5 dark:text-dark-6">
              {description}
            </p>
          ) : null}
        </div>

        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>

      {children}
    </section>
  );
}

export function StatusPill({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        tone === "success" && "bg-[#ecf9f0] text-[#2f7a4f]",
        tone === "warning" && "bg-[#fff4df] text-[#9a6a12]",
        tone === "danger" && "bg-[#fef2f1] text-[#b42318]",
        tone === "default" && "bg-[#f1f5f3] text-[#456955]",
      )}
    >
      {label}
    </span>
  );
}
