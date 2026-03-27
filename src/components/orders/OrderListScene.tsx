import { formatNgn } from "@/lib/commerce";
import { cn } from "@/lib/utils";
import { RouteFeedbackLink } from "@/components/ui/RouteFeedbackLink";
import styles from "./OrderListScene.module.css";

export type OrderListBannerTone = "idle" | "active" | "action";

export type OrderListBannerState = {
  title: string;
  detail: string;
  tone: OrderListBannerTone;
};

export type OrderListEntry = {
  entryId: string;
  orderNumber: string;
  totalNgn: number;
  placedAt?: string | null;
  stageLabel: string;
  stageDetail: string;
  stageTone: "default" | "success" | "muted";
  footnote: string;
  priority: boolean;
  href: string;
  actionLabel: string;
  actionEmphasis: "primary" | "secondary";
  meta: Array<{
    label: string;
    value: string;
  }>;
};

export type OrderListSection = {
  sectionKey: string;
  title: string;
  entries: OrderListEntry[];
};

type OrderListSceneProps = {
  banner: OrderListBannerState;
  sections: OrderListSection[];
  emptyStateText: string;
  withBottomPadding?: boolean;
  wideMetaGrid?: boolean;
  className?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

export function OrderListScene({
  banner,
  sections,
  emptyStateText,
  withBottomPadding = false,
  wideMetaGrid = false,
  className,
}: OrderListSceneProps) {
  const visibleSections = sections.filter((section) => section.entries.length > 0);
  const hasEntries = visibleSections.length > 0;

  return (
    <div
      className={cn(
        styles.page,
        withBottomPadding && styles.withBottomPadding,
        className
      )}
    >
      <section
        className={cn(
          styles.stateBanner,
          banner.tone === "action"
            ? styles.bannerAction
            : banner.tone === "active"
              ? styles.bannerActive
              : styles.bannerIdle
        )}
      >
        <h1 className={styles.bannerTitle}>{banner.title}</h1>
        <p className={styles.bannerText}>{banner.detail}</p>
      </section>

      {!hasEntries ? (
        <section className={styles.emptyState}>{emptyStateText}</section>
      ) : (
        <div className={styles.sectionStack}>
          {visibleSections.map((section) => (
            <section key={section.sectionKey} className={styles.section}>
              <header className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <span className={styles.sectionCount}>{section.entries.length}</span>
              </header>

              <div className={styles.mobileBladeList}>
                {section.entries.map((entry) => (
                  <details
                    key={entry.entryId}
                    className={cn(styles.blade, entry.priority && styles.bladePriority)}
                    open={entry.priority}
                  >
                    <summary className={styles.bladeSummary}>
                      <div className={styles.bladeMain}>
                        <p className={styles.orderLabel}>Order #{entry.orderNumber}</p>
                        <p className={styles.bladeStatus}>{entry.stageLabel}</p>
                      </div>
                      <div className={styles.bladeSide}>
                        <p className={styles.bladeTotal}>{formatNgn(entry.totalNgn)}</p>
                        <p className={styles.bladeDate}>{formatDate(entry.placedAt)}</p>
                      </div>
                    </summary>

                    <div className={styles.bladeContent}>
                      <OrderEntryBody entry={entry} wideMetaGrid={wideMetaGrid} />
                    </div>
                  </details>
                ))}
              </div>

              <div className={styles.desktopGrid}>
                {section.entries.map((entry) => (
                  <article
                    key={entry.entryId}
                    className={cn(styles.card, entry.priority && styles.cardPriority)}
                  >
                    <div className={styles.cardHeader}>
                      <div>
                        <p className={styles.orderLabel}>Order #{entry.orderNumber}</p>
                        <p className={styles.orderTotal}>{formatNgn(entry.totalNgn)}</p>
                      </div>
                      <OrderStatusBadge label={entry.stageLabel} tone={entry.stageTone} />
                    </div>

                    <OrderEntryBody entry={entry} wideMetaGrid={wideMetaGrid} />
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderEntryBody({
  entry,
  wideMetaGrid,
}: {
  entry: OrderListEntry;
  wideMetaGrid: boolean;
}) {
  return (
    <div className={styles.entryBody}>
      <p className={styles.stageDetail}>{entry.stageDetail}</p>

      <div className={cn(styles.metaRow, wideMetaGrid && styles.metaRowWide)}>
        {entry.meta.map((item) => (
          <CompactOrderStat key={`${entry.entryId}:${item.label}`} label={item.label} value={item.value} />
        ))}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.footerState}>
          {entry.footnote} - {formatDate(entry.placedAt)}
        </span>
        <RouteFeedbackLink
          href={entry.href}
          className={cn(
            styles.actionButton,
            entry.actionEmphasis === "primary"
              ? styles.actionButtonPrimary
              : styles.actionButtonSecondary
          )}
        >
          {entry.actionLabel}
        </RouteFeedbackLink>
      </div>
    </div>
  );
}

function CompactOrderStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.metaItem}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={styles.metaValue}>{value}</div>
    </div>
  );
}

function OrderStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "success" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? styles.statusSuccess
      : tone === "muted"
        ? styles.statusMuted
        : styles.statusDefault;

  return <span className={cn(styles.statusBadge, toneClass)}>{label}</span>;
}
