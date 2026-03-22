import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PaymentProofUploadCard } from "@/components/orders/PaymentProofUploadCard";
import { OrderReviewCard } from "@/components/orders/OrderReviewCard";
import { OrderReturnRequestCard } from "@/components/orders/OrderReturnRequestCard";
import { formatNgn } from "@/lib/commerce";
import type {
  OrderReturnCaseRow,
  OrderReturnEventRow,
  OrderReturnProofRow,
  OrderReviewRequestRow,
  OrderReviewRow,
  PaymentProofRow,
  PortalOrderDetail,
} from "@/lib/db/types";
import {
  formatOrderStatusLabel,
  formatOrderTimestamp,
} from "@/lib/orders/detail-view";
import { cn } from "@/lib/utils";
import { AnimatedReveal, FocusPanel, MetaCard, TaskIntro } from "./primitives";
import styles from "./order-detail.module.css";

export function TransferPanel({
  isRequestPending,
  dueAmount,
  totalAmount,
  stageIcon,
  stageLabel,
  bankName,
  accountName,
  accountNumber,
  instructions,
  dimmed,
}: {
  isRequestPending: boolean;
  dueAmount: string;
  totalAmount: string;
  stageIcon: IconName;
  stageLabel: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions?: string | null;
  dimmed: boolean;
}) {
  return (
    <FocusPanel
      title="Transfer"
      variant="primary"
      dimmed={dimmed}
      action={
        <div className={styles.inlineStatus}>
          <Icon name={stageIcon} size={15} strokeWidth={1.8} />
          <span>{stageLabel}</span>
        </div>
      }
    >
      {isRequestPending ? (
        <div className={styles.transferPending}>
          <div className={styles.transferAmount}>{totalAmount}</div>
          <div className={styles.calloutCard}>
            Transfer details appear here after approval.
          </div>
        </div>
      ) : (
        <div className={styles.transferReady}>
          <div className={styles.transferAmount}>{dueAmount}</div>

          <div className={styles.metaGrid}>
            <MetaCard label="Bank" value={bankName} />
            <MetaCard label="Name" value={accountName} />
          </div>

          <div className={styles.accountCard}>
            <div className={styles.metaLabel}>Number</div>
            <div className={styles.accountNumber}>{accountNumber}</div>
            {instructions ? <div className={styles.helperText}>{instructions}</div> : null}
          </div>
        </div>
      )}
    </FocusPanel>
  );
}

export function PaymentPanel({
  order,
  stageDetail,
  stageIcon,
  stageLabel,
  proofs,
  isFocused,
  dimmed,
  accessToken,
  onToggle,
}: {
  order: PortalOrderDetail;
  stageDetail: string;
  stageIcon: IconName;
  stageLabel: string;
  proofs: PaymentProofRow[];
  isFocused: boolean;
  dimmed: boolean;
  accessToken?: string;
  onToggle: () => void;
}) {
  const canOpen = Boolean(order.paymentId);

  return (
    <FocusPanel
      title={order.paymentId ? "Money Sent" : "Payment"}
      variant={isFocused ? "overlay" : "primary"}
      dimmed={dimmed}
      action={
        <div className={styles.panelActionGroup}>
          <span className={styles.panelCaption}>{stageDetail}</span>
          {canOpen ? (
            <button
              type="button"
              className={styles.inlineButton}
              onClick={onToggle}
              aria-expanded={isFocused}
            >
              {isFocused ? "Close" : proofs.length > 0 ? "Manage" : "Open"}
            </button>
          ) : null}
        </div>
      }
    >
      <div className={cn(styles.taskShell, isFocused && styles.taskShellActive)}>
        <TaskIntro
          title={proofs.length > 0 ? "Payment proof activity" : "Upload payment proof"}
          description={
            order.paymentId
              ? "Keep this task focused. Upload proof, review timestamps, and continue your order flow."
              : "This task becomes available after approval."
          }
          status={stageLabel}
          icon={stageIcon}
        />

        {order.paymentId ? (
          <>
            {!isFocused ? (
              <button
                type="button"
                className={styles.primaryTaskButton}
                onClick={onToggle}
              >
                {proofs.length > 0 ? "Review proof status" : "Open upload form"}
              </button>
            ) : null}

            <AnimatedReveal show={isFocused} panelKey="payment-panel">
              <div className={styles.formPanel}>
                <PaymentProofUploadCard
                  orderId={order.orderId}
                  paymentId={order.paymentId}
                  accessToken={accessToken}
                  paymentStatus={order.payment?.status ?? order.paymentStatus}
                />
              </div>
            </AnimatedReveal>
          </>
        ) : (
          <div className={styles.calloutCard}>Available after approval.</div>
        )}

        {proofs.length > 0 ? (
          <div className={styles.proofList}>
            {proofs.map((proof) => {
              const timestamp = formatOrderTimestamp(proof.createdAt);

              if (!proof.publicUrl) {
                return (
                  <span key={proof.proofId} className={styles.proofText}>
                    {timestamp}
                  </span>
                );
              }

              return (
                <Link
                  key={proof.proofId}
                  href={proof.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.proofLink}
                >
                  {timestamp}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </FocusPanel>
  );
}

export function ItemsPanel({
  items,
  dimmed,
}: {
  items: PortalOrderDetail["items"];
  dimmed: boolean;
}) {
  return (
    <FocusPanel title="Items" variant="secondary" dimmed={dimmed}>
      <div className={styles.itemList}>
        {items.map((item) => (
          <div key={`${item.sku}-${item.title}`} className={styles.itemCard}>
            <div className={styles.itemLeft}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.itemMeta}>
                {item.quantity} x {formatNgn(item.unitPriceNgn)}
              </div>
              {item.returnedQuantity > 0 ? (
                <div className={styles.itemBadge}>{item.returnedQuantity} returned</div>
              ) : null}
            </div>

            <div className={styles.itemTotal}>{formatNgn(item.lineTotalNgn)}</div>
          </div>
        ))}
      </div>
    </FocusPanel>
  );
}

export function DeliveryPanel({
  line,
  phone,
  notes,
  dimmed,
  canTrack,
  trackingHref,
}: {
  line: string;
  phone: string;
  notes?: string | null;
  dimmed: boolean;
  canTrack: boolean;
  trackingHref?: string | null;
}) {
  return (
    <FocusPanel
      title="Delivery Address"
      variant="secondary"
      dimmed={dimmed}
      action={
        canTrack && trackingHref ? (
          <Link href={trackingHref} className={styles.inlineLink}>
            Track
          </Link>
        ) : null
      }
    >
      <div className={styles.addressBlock}>
        <div className={styles.addressLine}>{line}</div>
        <div className={styles.addressMeta}>{phone}</div>
        {notes ? <div className={styles.addressMeta}>{notes}</div> : null}
      </div>
    </FocusPanel>
  );
}

export function ReturnPanel({
  order,
  returnCase,
  returnEvents,
  returnProofs,
  accessToken,
  isFocused,
  dimmed,
  onToggle,
}: {
  order: PortalOrderDetail;
  returnCase: OrderReturnCaseRow | null;
  returnEvents: OrderReturnEventRow[];
  returnProofs: OrderReturnProofRow[];
  accessToken?: string;
  isFocused: boolean;
  dimmed: boolean;
  onToggle: () => void;
}) {
  return (
    <FocusPanel
      title="Return"
      variant={isFocused ? "overlay" : "secondary"}
      dimmed={dimmed}
      action={
        <div className={styles.panelActionGroup}>
          {returnCase ? (
            <span className={styles.panelCaption}>
              {formatOrderStatusLabel(returnCase.status)}
            </span>
          ) : (
            <span className={styles.panelCaption}>Post-delivery</span>
          )}

          <button
            type="button"
            className={styles.inlineButton}
            onClick={onToggle}
            aria-expanded={isFocused}
          >
            {isFocused ? "Close" : "Open"}
          </button>
        </div>
      }
    >
      <div className={cn(styles.taskShell, isFocused && styles.taskShellActive)}>
        <TaskIntro
          title="Return request"
          description="Start with essentials, then reveal the rest of the return flow only when needed."
        />

        {!isFocused ? (
          <button type="button" className={styles.primaryTaskButton} onClick={onToggle}>
            {returnCase ? "Manage return" : "Start return"}
          </button>
        ) : null}

        <AnimatedReveal show={isFocused} panelKey="return-panel">
          <div className={styles.formPanel}>
            <OrderReturnRequestCard
              orderId={order.orderId}
              accessToken={accessToken}
              orderStatus={order.status}
              returnCase={returnCase}
              items={order.items}
              returnEvents={returnEvents}
              proofs={returnProofs}
            />
          </div>
        </AnimatedReveal>
      </div>
    </FocusPanel>
  );
}

export function ReviewPanel({
  order,
  reviewRequest,
  review,
  accessToken,
  isFocused,
  dimmed,
  onToggle,
}: {
  order: PortalOrderDetail;
  reviewRequest: OrderReviewRequestRow | null;
  review: OrderReviewRow | null;
  accessToken?: string;
  isFocused: boolean;
  dimmed: boolean;
  onToggle: () => void;
}) {
  return (
    <FocusPanel
      title="Rating"
      variant={isFocused ? "overlay" : "secondary"}
      dimmed={dimmed}
      action={
        <div className={styles.panelActionGroup}>
          {review ? (
            <span className={styles.panelCaption}>{formatOrderStatusLabel(review.status)}</span>
          ) : (
            <span className={styles.panelCaption}>Optional</span>
          )}

          <button
            type="button"
            className={styles.inlineButton}
            onClick={onToggle}
            aria-expanded={isFocused}
          >
            {isFocused ? "Close" : "Open"}
          </button>
        </div>
      }
    >
      <div className={cn(styles.taskShell, isFocused && styles.taskShellActive)}>
        <TaskIntro
          title="Leave a rating"
          description="Keep this lightweight. Ask for rating first, then let text details follow naturally."
        />

        {!isFocused ? (
          <button type="button" className={styles.primaryTaskButton} onClick={onToggle}>
            {review ? "Review rating" : "Open rating"}
          </button>
        ) : null}

        <AnimatedReveal show={isFocused} panelKey="review-panel">
          <div className={styles.formPanel}>
            <OrderReviewCard
              orderId={order.orderId}
              accessToken={accessToken}
              orderStatus={order.status}
              reviewRequest={reviewRequest}
              review={review}
            />
          </div>
        </AnimatedReveal>
      </div>
    </FocusPanel>
  );
}
