import Link from "next/link";
import { cn } from "@/lib/utils";

type SummaryCard = {
  label: string;
  value: string;
  detail: string;
};

type DetailSection = {
  title: string;
  description: string;
  items: string[];
};

export function ScaffoldPage({
  badge,
  title,
  description,
  summary,
  sections,
  primaryAction,
  secondaryAction,
}: {
  badge: string;
  title: string;
  description: string;
  summary: SummaryCard[];
  sections: DetailSection[];
  primaryAction?: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
}) {
  return (
    <div className="space-y-8">
      <section className="glass-morphism overflow-hidden rounded-[36px] bg-[color:var(--surface)]/88 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="inline-flex rounded-full bg-accent/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-accent dark:bg-accent/15">
          {badge}
        </div>

        <div className="mt-5 max-w-4xl">
          <h2 className="text-4xl font-bold tracking-display text-label md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-secondary-label md:text-lg">
            {description}
          </p>
        </div>

        {primaryAction || secondaryAction ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="button-primary min-h-[52px] justify-center px-6 text-[11px] font-semibold uppercase tracking-headline"
              >
                {primaryAction.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link
                href={secondaryAction.href}
                className="button-secondary min-h-[52px] justify-center px-6 text-[11px] font-semibold uppercase tracking-headline"
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {summary.map((item) => (
            <article
              key={item.label}
              className="rounded-[28px] bg-system-fill/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                {item.label}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-label">
                {item.value}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-secondary-label">
                {item.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {sections.map((section, index) => (
          <article
            key={section.title}
            className={cn(
              "glass-morphism rounded-[32px] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]",
              index === 0
                ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(244,242,234,0.9)_100%)] dark:bg-[linear-gradient(180deg,rgba(21,24,21,0.96)_0%,rgba(11,13,11,0.96)_100%)]"
                : "bg-[color:var(--surface)]/88"
            )}
          >
            <h3 className="text-xl font-semibold tracking-title text-label">
              {section.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-secondary-label">
              {section.description}
            </p>

            <ul className="mt-5 space-y-3">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-label">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
