import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ContextTag = {
  label: string;
  tone?: "default" | "success" | "muted";
};

type ContextMeta = {
  label: string;
  value: string;
};

const tagToneClasses: Record<NonNullable<ContextTag["tone"]>, string> = {
  default: "bg-system-fill/56 text-secondary-label",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  muted: "bg-system-fill/42 text-tertiary-label",
};

export function WorkspaceContextPanel({
  title,
  detail,
  tags = [],
  meta = [],
  actions,
}: {
  title: string;
  detail?: string;
  tags?: ContextTag[];
  meta?: ContextMeta[];
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-[28px] bg-[color:var(--surface)]/82 px-4 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:rounded-[30px] md:px-6 md:py-6">
      <div className="flex flex-col gap-4 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
        <div className="min-w-0">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {tags.map((tag) => (
                <span
                  key={tag.label}
                  className={cn(
                    "rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] md:text-[10px]",
                    tagToneClasses[tag.tone ?? "default"]
                  )}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          ) : null}

          <h1 className="mt-3 text-[24px] font-semibold tracking-tight text-label md:text-[38px]">
            {title}
          </h1>

          {detail ? (
            <p className="mt-1.5 text-sm leading-relaxed text-secondary-label md:mt-2 md:text-base">
              {detail}
            </p>
          ) : null}
        </div>

        {actions ? <div className="shrink-0 self-start">{actions}</div> : null}
      </div>

      {meta.length > 0 ? (
        <>
          <div className="scrollbar-hide -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 md:hidden">
            {meta.map((item) => (
              <div
                key={item.label}
                className="min-w-[148px] shrink-0 rounded-[20px] bg-system-fill/42 px-4 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium text-label">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 hidden gap-3 sm:grid-cols-2 xl:grid-cols-3 md:grid">
            {meta.map((item) => (
              <div
                key={item.label}
                className="rounded-[22px] bg-system-fill/42 px-4 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-medium text-label">{item.value}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
