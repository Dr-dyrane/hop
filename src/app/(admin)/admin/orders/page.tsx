import Link from "next/link";
import { CircleEllipsis, Clock3, Landmark, PackageCheck, RotateCcw } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listOpenOrderReturnCasesForAdmin } from "@/lib/db/repositories/order-returns-repository";
import { listOrdersForAdmin } from "@/lib/db/repositories/orders-repository";
import { resolveOrderLedgerState } from "@/lib/orders/ledger-policy";
import { getOrderStagePresentation } from "@/lib/orders/presentation";
import { cn } from "@/lib/utils";
import styles from "./orders-page.module.css";

type AdminLifecycleBucket = "needs_attention" | "in_progress" | "history";

type AdminOrderEntryAction = {
  label: string;
  emphasis: "primary" | "secondary";
};

type OrderEntry = {
  order: Awaited<ReturnType<typeof listOrdersForAdmin>>[number];
  stage: ReturnType<typeof getOrderStagePresentation>;
  bucket: AdminLifecycleBucket;
  action: AdminOrderEntryAction;
  href: string;
};

type BannerTone = "idle" | "active" | "action";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getAdminOrderBucket(input: {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): AdminLifecycleBucket {
  const ledger = resolveOrderLedgerState(input);

  if (
    [
      "request_received",
      "awaiting_transfer",
      "payment_submitted",
      "payment_under_review",
    ].includes(ledger.key)
  ) {
    return "needs_attention";
  }

  if (ledger.key === "delivered" || ledger.key === "closed") {
    return "history";
  }

  return "in_progress";
}

function getAdminOrderAction(input: {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): AdminOrderEntryAction {
  const ledger = resolveOrderLedgerState(input);

  if (ledger.key === "request_received") {
    return { label: "Review request", emphasis: "primary" };
  }

  if (["payment_submitted", "payment_under_review"].includes(ledger.key)) {
    return { label: "Review payment", emphasis: "primary" };
  }

  if (ledger.key === "awaiting_transfer") {
    return { label: "Await transfer", emphasis: "secondary" };
  }

  return { label: "Open", emphasis: "secondary" };
}

function getBannerState(input: {
  activeCount: number;
  needsAttentionCount: number;
}) {
  const { activeCount, needsAttentionCount } = input;
  if (activeCount === 0) {
    return {
      title: "No active orders",
      detail: "Queue is clear right now.",
      tone: "idle" as BannerTone,
    };
  }

  if (needsAttentionCount > 0) {
    return {
      title: `${needsAttentionCount} order${needsAttentionCount === 1 ? "" : "s"} need attention`,
      detail: "Process requests and payment checks first.",
      tone: "action" as BannerTone,
    };
  }

  return {
    title: `${activeCount} order${activeCount === 1 ? "" : "s"} in progress`,
    detail: "Fulfillment is moving.",
    tone: "active" as BannerTone,
  };
}

function getBucketFootnote(bucket: AdminLifecycleBucket) {
  if (bucket === "needs_attention") return "Needs attention";
  if (bucket === "in_progress") return "In progress";
  return "History";
}

export default async function AdminOrdersPage() {
  const session = await requireAdminSession("/admin/orders");
  const [orders, openReturns] = await Promise.all([
    listOrdersForAdmin(50, session.email),
    listOpenOrderReturnCasesForAdmin(12, session.email),
  ]);

  const requests = orders.filter((order) => order.status === "checkout_draft").length;
  const awaitingTransfer = orders.filter(
    (order) =>
      order.status !== "checkout_draft" &&
      order.paymentStatus === "awaiting_transfer"
  ).length;
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled", "expired"].includes(order.status)
  ).length;
  const preparingOrders = orders.filter(
    (order) => getOrderStagePresentation(order).key === "preparing"
  ).length;

  const entries: OrderEntry[] = orders.map((order) => {
    const stage = getOrderStagePresentation(order);
    const bucket = getAdminOrderBucket(order);
    const action = getAdminOrderAction(order);

    return {
      order,
      stage,
      bucket,
      action,
      href: `/admin/orders/${order.orderId}`,
    };
  });

  const lifecycleRank: Record<AdminLifecycleBucket, number> = {
    needs_attention: 0,
    in_progress: 1,
    history: 2,
  };

  const sortedEntries = [...entries].sort((left, right) => {
    const rank = lifecycleRank[left.bucket] - lifecycleRank[right.bucket];
    if (rank !== 0) return rank;

    return (
      new Date(right.order.placedAt).getTime() - new Date(left.order.placedAt).getTime()
    );
  });

  const activeEntries = sortedEntries.filter((entry) => entry.bucket !== "history");
  const needsAttentionEntries = sortedEntries.filter(
    (entry) => entry.bucket === "needs_attention"
  );
  const inProgressEntries = sortedEntries.filter(
    (entry) => entry.bucket === "in_progress"
  );
  const historyEntries = sortedEntries.filter((entry) => entry.bucket === "history");
  const bannerState = getBannerState({
    activeCount: activeEntries.length,
    needsAttentionCount: needsAttentionEntries.length,
  });

  return (
    <div className="space-y-6 pb-20 md:space-y-8">
      <section className="space-y-5">
        <div className="rounded-[24px] bg-system-fill/42 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:inline-flex">
          <div className="grid grid-cols-2 gap-1.5">
            <QuickLink href="/admin/orders" label="Orders" />
            <QuickLink href="/admin/payments" label="Payments" />
          </div>
        </div>

        <MetricRail
          items={[
            {
              label: "Active",
              value: `${activeOrders}`,
              detail: "Live",
              icon: Clock3,
            },
            {
              label: "Requests",
              value: `${requests}`,
              detail: "Pending",
              icon: CircleEllipsis,
            },
            {
              label: "Awaiting",
              value: `${awaitingTransfer}`,
              detail: "Transfer",
              icon: Landmark,
            },
            {
              label: "Preparing",
              value: `${preparingOrders}`,
              detail: "Orders",
              icon: PackageCheck,
              tone: "success",
            },
            {
              label: "Returns",
              value: `${openReturns.length}`,
              detail: "Open",
              icon: RotateCcw,
            },
          ]}
          columns={4}
        />
      </section>

      <div className={styles.page}>
        <section
          className={cn(
            styles.stateBanner,
            bannerState.tone === "action"
              ? styles.bannerAction
              : bannerState.tone === "active"
                ? styles.bannerActive
                : styles.bannerIdle
          )}
        >
          <h1 className={styles.bannerTitle}>{bannerState.title}</h1>
          <p className={styles.bannerText}>{bannerState.detail}</p>
        </section>

        {orders.length === 0 ? (
          <section className={styles.emptyState}>No orders available yet.</section>
        ) : (
          <div className={styles.sectionStack}>
            {needsAttentionEntries.length > 0 ? (
              <OrderSection title="Needs attention" entries={needsAttentionEntries} />
            ) : null}

            {inProgressEntries.length > 0 ? (
              <OrderSection title="In progress" entries={inProgressEntries} />
            ) : null}

            {historyEntries.length > 0 ? (
              <OrderSection
                title={activeEntries.length === 0 ? "Orders" : "History"}
                entries={historyEntries}
              />
            ) : null}
          </div>
        )}
      </div>

      {openReturns.length > 0 ? (
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Open returns</h2>
            <span className={styles.sectionCount}>{openReturns.length}</span>
          </header>

          <div className="grid gap-2 md:grid-cols-2 md:gap-3">
            {openReturns.map((returnCase) => (
              <article key={returnCase.returnCaseId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.orderLabel}>Order #{returnCase.orderNumber}</p>
                    <p className={styles.orderTotal}>
                      {formatNgn(
                        returnCase.approvedRefundAmountNgn ??
                          returnCase.requestedRefundAmountNgn
                      )}
                    </p>
                  </div>
                  <span className={cn(styles.statusBadge, styles.statusDefault)}>
                    {formatStatusLabel(returnCase.status)}
                  </span>
                </div>

                <div className={styles.entryBody}>
                  <p className={styles.stageDetail}>{returnCase.reason}</p>
                  <div className={styles.metaRow}>
                    <CompactOrderStat label="Customer" value={returnCase.customerName} />
                    <CompactOrderStat label="Phone" value={returnCase.customerPhone} />
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.footerState}>
                      {formatDate(returnCase.requestedAt)}
                    </span>
                    <Link href={`/admin/orders/${returnCase.orderId}`} className={styles.actionButton}>
                      Open case
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function OrderSection({
  title,
  entries,
}: {
  title: string;
  entries: OrderEntry[];
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <span className={styles.sectionCount}>{entries.length}</span>
      </header>

      <div className={styles.mobileBladeList}>
        {entries.map((entry) => (
          <details
            key={entry.order.orderId}
            className={cn(
              styles.blade,
              entry.bucket === "needs_attention" && styles.bladePriority
            )}
            open={entry.bucket === "needs_attention"}
          >
            <summary className={styles.bladeSummary}>
              <div className={styles.bladeMain}>
                <p className={styles.orderLabel}>Order #{entry.order.orderNumber}</p>
                <p className={styles.bladeStatus}>{entry.stage.label}</p>
              </div>
              <div className={styles.bladeSide}>
                <p className={styles.bladeTotal}>{formatNgn(entry.order.totalNgn)}</p>
                <p className={styles.bladeDate}>{formatDate(entry.order.placedAt)}</p>
              </div>
            </summary>

            <div className={styles.bladeContent}>
              <OrderEntryBody entry={entry} />
            </div>
          </details>
        ))}
      </div>

      <div className={styles.desktopGrid}>
        {entries.map((entry) => (
          <article
            key={entry.order.orderId}
            className={cn(
              styles.card,
              entry.bucket === "needs_attention" && styles.cardPriority
            )}
          >
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.orderLabel}>Order #{entry.order.orderNumber}</p>
                <p className={styles.orderTotal}>{formatNgn(entry.order.totalNgn)}</p>
              </div>
              <OrderStatusBadge label={entry.stage.label} tone={entry.stage.tone} />
            </div>

            <OrderEntryBody entry={entry} />
          </article>
        ))}
      </div>
    </section>
  );
}

function OrderEntryBody({ entry }: { entry: OrderEntry }) {
  return (
    <div className={styles.entryBody}>
      <p className={styles.stageDetail}>{entry.stage.detail}</p>

      <div className={styles.metaRow}>
        <CompactOrderStat label="Customer" value={entry.order.customerName} />
        <CompactOrderStat label="Phone" value={entry.order.customerPhone} />
        <CompactOrderStat
          label="Items"
          value={`${entry.order.itemCount} item${entry.order.itemCount === 1 ? "" : "s"}`}
        />
        <CompactOrderStat label="Placed" value={formatTimestamp(entry.order.placedAt)} />
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.footerState}>
          {getBucketFootnote(entry.bucket)} - {formatDate(entry.order.placedAt)}
        </span>
        <Link
          href={entry.href}
          className={cn(
            styles.actionButton,
            entry.action.emphasis === "primary"
              ? styles.actionButtonPrimary
              : styles.actionButtonSecondary
          )}
        >
          {entry.action.label}
        </Link>
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

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[40px] items-center justify-center rounded-[18px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-[color:var(--surface)] hover:shadow-soft"
    >
      {label}
    </Link>
  );
}
