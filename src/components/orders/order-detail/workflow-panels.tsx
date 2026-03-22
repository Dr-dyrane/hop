import Link from "next/link";
import { useState } from "react";
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
  collapseToLedger,
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
  collapseToLedger: boolean;
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
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const isLedgerMode = collapseToLedger && !isRequestPending;

  const transferDetails = (
    <>
      <div className={styles.metaGrid}>
        <MetaCard label="Bank" value={bankName} />
        <MetaCard label="Name" value={accountName} />
      </div>

      <div className={styles.accountCard}>
        <div className={styles.metaLabel}>Number</div>
        <div className={styles.accountNumber}>{accountNumber}</div>
        {instructions ? <div className={styles.helperText}>{instructions}</div> : null}
      </div>
    </>
  );

  return (
    <FocusPanel
      title={isLedgerMode ? "Payment completed" : "Transfer"}
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
          <div className={styles.calloutCard}>Awaiting approval.</div>
        </div>
      ) : isLedgerMode ? (
        <div className={styles.transferReady}>
          <div className={styles.ledgerSummaryRow}>
            <div className={styles.ledgerSummaryText}>Payment completed - {dueAmount}</div>
            <button
              type="button"
              className={styles.inlineButton}
              onClick={() => setShowTransferDetails((current) => !current)}
              aria-expanded={showTransferDetails}
            >
              {showTransferDetails ? "Hide details" : "View details"}
            </button>
          </div>

          {showTransferDetails ? transferDetails : null}
        </div>
      ) : (
        <div className={styles.transferReady}>
          <div className={styles.transferAmount}>{dueAmount}</div>

          {transferDetails}
        </div>
      )}
    </FocusPanel>
  );
}

export function PaymentPanel({
  order,
  stageIcon,
  stageLabel,
  proofs,
  isFocused,
  dimmed,
  accessToken,
  onToggle,
}: {
  order: PortalOrderDetail;
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
          description={order.paymentId ? undefined : "Awaiting approval."}
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
          <div className={styles.calloutCard}>Awaiting approval.</div>
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
  onOpenItem,
}: {
  items: PortalOrderDetail["items"];
  dimmed: boolean;
  onOpenItem: (orderItemId: string) => void;
}) {
  return (
    <FocusPanel title="Items" variant="secondary" dimmed={dimmed}>
      <div className={styles.itemList}>
        {items.map((item) => (
          <button
            key={`${item.orderItemId}-${item.sku}-${item.title}`}
            type="button"
            className={cn(styles.itemCard, styles.itemCardButton)}
            onClick={() => onOpenItem(item.orderItemId)}
            aria-label={`Preview ${item.title}`}
          >
            <div className={styles.itemThumb}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={`${item.title} thumbnail`}
                  className={styles.itemThumbImage}
                  loading="lazy"
                />
              ) : (
                <span className={styles.itemThumbPlaceholder}>
                  <Icon name="image" size={16} strokeWidth={1.8} />
                </span>
              )}
            </div>

            <div className={styles.itemLeft}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.itemMeta}>
                {item.quantity} x {formatNgn(item.unitPriceNgn)}
              </div>
              {item.returnedQuantity > 0 ? (
                <div className={styles.itemBadge}>{item.returnedQuantity} returned</div>
              ) : null}
            </div>

            <div className={styles.itemRight}>
              <div className={styles.itemTotal}>{formatNgn(item.lineTotalNgn)}</div>
              <span className={styles.itemPreviewLabel}>Preview</span>
            </div>
          </button>
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

export function PostDeliveryActionsPanel({
  hasReview,
  hasReturn,
  reviewSubmitted,
  returnCaseStatus,
  dimmed,
  onOpenReview,
  onOpenReturn,
}: {
  hasReview: boolean;
  hasReturn: boolean;
  reviewSubmitted: boolean;
  returnCaseStatus?: string | null;
  dimmed: boolean;
  onOpenReview: () => void;
  onOpenReturn: () => void;
}) {
  return (
    <FocusPanel title="After delivery" variant="primary" dimmed={dimmed}>
      <div className={styles.postDeliveryActions}>
        {hasReview ? (
          <button
            type="button"
            className={styles.primaryTaskButton}
            onClick={onOpenReview}
          >
            {reviewSubmitted ? "Review rating" : "Leave a rating"}
          </button>
        ) : null}

        {hasReturn ? (
          <button
            type="button"
            className={styles.secondaryTaskButton}
            onClick={onOpenReturn}
          >
            {returnCaseStatus ? "Manage return" : "Request return"}
          </button>
        ) : null}
      </div>
    </FocusPanel>
  );
}

export function ItemPreviewPanel({
  item,
  canReorder,
  isReordering,
  onReorder,
}: {
  item: PortalOrderDetail["items"][number];
  canReorder: boolean;
  isReordering: boolean;
  onReorder: () => void;
}) {
  return (
    <div className={styles.itemPreviewSheet}>
      <div className={styles.itemPreviewMedia}>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className={styles.itemPreviewImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.itemPreviewPlaceholder}>
            <Icon name="package" size={26} strokeWidth={1.7} />
          </div>
        )}
      </div>

      <div className={styles.itemPreviewBody}>
        <h3 className={styles.itemPreviewTitle}>{item.title}</h3>
        <p className={styles.itemPreviewMeta}>
          {item.quantity} x {formatNgn(item.unitPriceNgn)}
        </p>
        <p className={styles.itemPreviewTotal}>{formatNgn(item.lineTotalNgn)}</p>
        {item.sku ? <p className={styles.itemPreviewSku}>SKU: {item.sku}</p> : null}
        {item.returnedQuantity > 0 ? (
          <p className={styles.itemPreviewReturned}>
            Returned: {item.returnedQuantity}
          </p>
        ) : null}
      </div>

      {canReorder ? (
        <div className={styles.itemPreviewActions}>
          <button
            type="button"
            className={styles.primaryTaskButton}
            onClick={onReorder}
            disabled={isReordering}
          >
            {isReordering ? "Preparing" : "Reorder"}
          </button>
        </div>
      ) : null}
    </div>
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
          ) : null}

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
        <TaskIntro title="Return request" />

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
          ) : null}

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
        <TaskIntro title="Leave a rating" />

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
