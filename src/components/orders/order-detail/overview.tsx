import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { formatOrderTimestamp } from "@/lib/orders/detail-view";
import { QuietStat, TopMetric } from "./primitives";
import styles from "./order-detail.module.css";

export function OrderNotFound({ backHref }: { backHref: string }) {
  return (
    <div className={styles.emptyState}>
      <div>Order not found.</div>
      <div className={styles.emptyStateActions}>
        <Link href={backHref} className={styles.backLink}>
          Back
        </Link>
      </div>
    </div>
  );
}

export function OrderHero({
  orderNumber,
  heroSummary,
  stageLabel,
  stageIcon,
  dueAmount,
  placedAt,
  proofCount,
  totalUnits,
}: {
  orderNumber: string;
  heroSummary: string;
  stageLabel: string;
  stageIcon: IconName;
  dueAmount: string;
  placedAt: string;
  proofCount: number;
  totalUnits: number;
}) {
  return (
    <section className={styles.heroShell}>
      <div className={styles.heroCard}>
        <div className={styles.heroMain}>
          <div className={styles.heroLabel}>Order</div>
          <h1 className={styles.heroTitle}>#{orderNumber}</h1>
          <p className={styles.heroSummary}>{heroSummary}</p>

          <div className={styles.heroStatusRow}>
            <div className={styles.statusPill}>
              <Icon name={stageIcon} size={16} strokeWidth={1.8} />
              <span>{stageLabel}</span>
            </div>
          </div>
        </div>

        <div className={styles.heroStats}>
          <TopMetric label="Due" value={dueAmount} />
          <TopMetric label="Placed" value={formatOrderTimestamp(placedAt)} />
          <TopMetric label="Items" value={`${totalUnits}`} />
          <TopMetric label="Proofs" value={`${proofCount}`} />
        </div>
      </div>
    </section>
  );
}

export function OrderPriorityStrip({
  stageLabel,
  transferReference,
  transferDeadline,
  deliveryLine,
  hasFocus,
  isPaymentFocused,
  isReturnFocused,
  isReviewFocused,
}: {
  stageLabel: string;
  transferReference: string;
  transferDeadline: string;
  deliveryLine: string;
  hasFocus: boolean;
  isPaymentFocused: boolean;
  isReturnFocused: boolean;
  isReviewFocused: boolean;
}) {
  return (
    <section className={styles.priorityStrip}>
      <QuietStat
        label="Stage"
        value={stageLabel}
        subdued={hasFocus && !isPaymentFocused && !isReturnFocused && !isReviewFocused}
      />
      <QuietStat
        label="Reference"
        value={transferReference}
        className={styles.priorityDesktopOnly}
        subdued={hasFocus && !isPaymentFocused}
      />
      <QuietStat
        label="Deadline"
        value={transferDeadline}
        className={styles.priorityDesktopOnly}
        subdued={hasFocus && !isPaymentFocused}
      />
      <QuietStat
        label="Delivery"
        value={deliveryLine}
        subdued={hasFocus && isPaymentFocused}
      />
    </section>
  );
}
