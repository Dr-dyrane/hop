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
  backHref,
  trackingHref,
  canTrack,
  heroSummary,
  stageLabel,
  stageIcon,
  primaryActionLabel,
  dueAmount,
  paymentLabel,
  placedAt,
  proofCount,
  lineItemCount,
  totalUnits,
}: {
  orderNumber: string;
  backHref: string;
  trackingHref?: string | null;
  canTrack: boolean;
  heroSummary: string;
  stageLabel: string;
  stageIcon: IconName;
  primaryActionLabel: string;
  dueAmount: string;
  paymentLabel: string;
  placedAt: string;
  proofCount: number;
  lineItemCount: number;
  totalUnits: number;
}) {
  return (
    <section className={styles.heroShell}>
      <div className={styles.heroTopRow}>
        <Link href={backHref} className={styles.backLink}>
          Back
        </Link>

        <div className={styles.heroActions}>
          {canTrack && trackingHref ? (
            <Link href={trackingHref} className={styles.secondaryAction}>
              Track
            </Link>
          ) : null}
        </div>
      </div>

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
            <div className={styles.subtlePill}>{primaryActionLabel}</div>
          </div>
        </div>

        <div className={styles.heroStats}>
          <TopMetric label="Due" value={dueAmount} detail={paymentLabel} />
          <TopMetric
            label="Placed"
            value={formatOrderTimestamp(placedAt)}
            detail="Order date"
          />
          <TopMetric
            label="Items"
            value={`${totalUnits}`}
            detail={`${lineItemCount} line item${lineItemCount === 1 ? "" : "s"}`}
          />
          <TopMetric
            label="Proofs"
            value={`${proofCount}`}
            detail={proofCount > 0 ? "Received" : "Waiting"}
          />
        </div>
      </div>
    </section>
  );
}

export function OrderPriorityStrip({
  stageLabel,
  stageDetail,
  transferReference,
  transferDeadline,
  deliveryLine,
  hasFocus,
  isPaymentFocused,
  isReturnFocused,
  isReviewFocused,
}: {
  stageLabel: string;
  stageDetail: string;
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
        detail={stageDetail}
        subdued={hasFocus && !isPaymentFocused && !isReturnFocused && !isReviewFocused}
      />
      <QuietStat
        label="Reference"
        value={transferReference}
        detail="Transfer ref"
        subdued={hasFocus && !isPaymentFocused}
      />
      <QuietStat
        label="Deadline"
        value={transferDeadline}
        detail="Transfer window"
        subdued={hasFocus && !isPaymentFocused}
      />
      <QuietStat
        label="Delivery"
        value={deliveryLine}
        detail="Address"
        subdued={hasFocus && isPaymentFocused}
      />
    </section>
  );
}
