import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricRailItem = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "default" | "success";
};

const toneClasses: Record<NonNullable<MetricRailItem["tone"]>, string> = {
  default:
    "bg-[color:var(--surface)]/40 text-accent",
  success:
    "bg-[color:var(--surface)]/40 text-emerald-700 dark:text-emerald-300",
};

function getDesktopGridClass(columns: 2 | 3 | 4) {
  if (columns === 2) {
    return "md:grid-cols-2";
  }

  if (columns === 3) {
    return "md:grid-cols-2 xl:grid-cols-3";
  }

  return "md:grid-cols-2 xl:grid-cols-4";
}

export function MetricRail({
  items,
  columns = 3,
}: {
  items: MetricRailItem[];
  columns?: 2 | 3 | 4;
}) {
  const mobileMinWidth =
    items.length <= 4 ? `calc((100% - ${(items.length - 1) * 8}px) / ${items.length})` : "152px";

  return (
    <>
      <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 md:hidden">
        {items.map((item) => {
          return (
            <MetricCard
              key={item.label}
              item={item}
              size="mobile"
              style={{ minWidth: mobileMinWidth }}
            />
          );
        })}
      </div>

      <div
        className={cn(
          "hidden gap-4 md:grid",
          getDesktopGridClass(columns)
        )}
      >
        {items.map((item) => {
          return (
            <MetricCard
              key={item.label}
              item={item}
              size="desktop"
            />
          );
        })}
      </div>
    </>
  );
}

function MetricCard({
  item,
  size,
  style,
}: {
  item: MetricRailItem;
  size: "mobile" | "desktop";
  style?: CSSProperties;
}) {
  const Icon = item.icon;
  const tone = toneClasses[item.tone ?? "default"];

  if (size === "mobile") {
    return (
      <article
        style={style}
        className="overflow-hidden squircle bg-[color:var(--surface)]/80 px-3 py-3 shadow-[0_10px_22px_rgba(15,23,42,0.05)] backdrop-blur-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              {item.label}
            </p>
            <p className="mt-1 truncate text-[22px] font-semibold tracking-tight text-label">
              {item.value}
            </p>
          </div>
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center squircle",
              tone
            )}
          >
            <Icon size={14} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden squircle bg-[color:var(--surface)]/80 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl  xl:p-5 xl:shadow-[0_16px_34px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            {item.label}
          </p>
          <p className="mt-2 truncate text-[28px] font-semibold tracking-tight text-label xl:mt-3 xl:text-4xl">
            {item.value}
          </p>
          {item.detail ? (
            <p className="mt-2 truncate text-[11px] text-secondary-label xl:mt-3 xl:text-xs">
              {item.detail}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center squircle xl:h-10 xl:w-10",
            tone
          )}
        >
          <Icon size={17} />
        </div>
      </div>
    </article>
  );
}
