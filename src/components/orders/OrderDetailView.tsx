"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatNgn } from "@/lib/commerce";
import {
  formatOrderTimestamp,
  getDeliveryLine,
  getOrderHeroSummary,
  getOrderPrimaryActionLabel,
  getTrackingCoords,
} from "@/lib/orders/detail-view";
import {
  getOrderStagePresentation,
  getPaymentStatusPresentation,
} from "@/lib/orders/presentation";
import { buildStaticMapUrl } from "@/lib/mapbox";
import { STAGE_ICONS, TRACKABLE_FULFILLMENT_STATUSES } from "./order-detail/constants";
import {
  DeliveryPanel,
  ItemsPanel,
  OrderHero,
  OrderNotFound,
  OrderPriorityStrip,
  OrderSecondaryDetails,
  PaymentPanel,
  ReturnPanel,
  ReviewPanel,
  TransferPanel,
} from "./order-detail/sections";
import type { ActivePanel, OrderDetailViewProps } from "./order-detail/types";
import styles from "./order-detail/order-detail.module.css";

const PANEL_QUERY_KEY = "panel";

function parseActivePanel(value: string | null): ActivePanel {
  if (value === "payment") return "payment";
  if (value === "return") return "return";
  if (value === "review") return "review";
  if (value === "details") return "details";
  return null;
}

export function OrderDetailView({
  order,
  timeline,
  proofs,
  reviewRequest,
  review,
  returnCase,
  returnItems,
  returnEvents,
  returnProofs,
  backHref,
  accessToken,
  trackingHref,
}: OrderDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const coords = order ? getTrackingCoords(order.deliveryAddressSnapshot) : null;
  const mapSrc = coords
    ? buildStaticMapUrl({
        latitude: coords.lat,
        longitude: coords.lng,
        width: 900,
        height: 420,
        zoom: 14,
      })
    : null;
  const showReturn = Boolean(order && (returnCase || order.status === "delivered"));
  const showReview = Boolean(
    order && (order.status === "delivered" || reviewRequest || review)
  );
  const hasDetailsSection = Boolean(
    order && (mapSrc || timeline.length > 0 || returnItems.length > 0)
  );

  const activePanel = useMemo(() => {
    const requestedPanel = parseActivePanel(searchParams.get(PANEL_QUERY_KEY));
    if (!requestedPanel) return null;
    if (requestedPanel === "return" && !showReturn) return null;
    if (requestedPanel === "review" && !showReview) return null;
    if (requestedPanel === "details" && !hasDetailsSection) return null;
    return requestedPanel;
  }, [hasDetailsSection, searchParams, showReturn, showReview]);

  const togglePanel = useCallback(
    (panel: Exclude<ActivePanel, null>) => {
      const currentPanel = parseActivePanel(searchParams.get(PANEL_QUERY_KEY));
      const nextPanel = currentPanel === panel ? null : panel;
      const params = new URLSearchParams(searchParams.toString());

      if (nextPanel) {
        params.set(PANEL_QUERY_KEY, nextPanel);
      } else {
        params.delete(PANEL_QUERY_KEY);
      }

      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  if (!order) {
    return <OrderNotFound backHref={backHref} />;
  }

  const stage = getOrderStagePresentation(order);
  const paymentState = getPaymentStatusPresentation(
    order.payment?.status ?? order.paymentStatus
  );

  const stageIcon = STAGE_ICONS[stage.key] ?? "history";
  const isRequestPending = order.status === "checkout_draft";
  const totalUnits = order.items.reduce((total, item) => total + item.quantity, 0);
  const dueAmount = formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn);
  const deliveryLine = getDeliveryLine(order.deliveryAddressSnapshot);
  const canTrack = Boolean(
    trackingHref && TRACKABLE_FULFILLMENT_STATUSES.has(order.fulfillmentStatus)
  );

  const heroSummary = getOrderHeroSummary({
    isRequestPending,
    order,
    proofs,
    review,
    returnCase,
  });

  const primaryActionLabel = getOrderPrimaryActionLabel({
    isRequestPending,
    order,
    proofs,
  });

  const isPaymentFocused = activePanel === "payment";
  const isReturnFocused = activePanel === "return";
  const isReviewFocused = activePanel === "review";
  const isDetailsFocused = activePanel === "details";
  const hasFocus = activePanel !== null;

  return (
    <div className={styles.page}>
      <OrderHero
        orderNumber={order.orderNumber}
        backHref={backHref}
        trackingHref={trackingHref}
        canTrack={canTrack}
        heroSummary={heroSummary}
        stageLabel={stage.label}
        stageIcon={stageIcon}
        primaryActionLabel={primaryActionLabel}
        dueAmount={dueAmount}
        paymentLabel={paymentState.label}
        placedAt={order.placedAt}
        proofCount={proofs.length}
        lineItemCount={order.items.length}
        totalUnits={totalUnits}
      />

      <OrderPriorityStrip
        stageLabel={stage.label}
        stageDetail={stage.detail}
        transferReference={isRequestPending ? "Pending" : order.transferReference || "Pending"}
        transferDeadline={
          isRequestPending
            ? "Pending"
            : order.transferDeadlineAt
            ? formatOrderTimestamp(order.transferDeadlineAt)
            : "Open"
        }
        deliveryLine={deliveryLine}
        hasFocus={hasFocus}
        isPaymentFocused={isPaymentFocused}
        isReturnFocused={isReturnFocused}
        isReviewFocused={isReviewFocused}
      />

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <TransferPanel
            isRequestPending={isRequestPending}
            dueAmount={dueAmount}
            totalAmount={formatNgn(order.totalNgn)}
            stageIcon={stageIcon}
            stageLabel={stage.label}
            bankName={order.payment?.bankName ?? "Pending"}
            accountName={order.payment?.accountName ?? "Pending"}
            accountNumber={order.payment?.accountNumber ?? "Pending"}
            instructions={order.payment?.instructions}
            dimmed={hasFocus && !isPaymentFocused}
          />

          <PaymentPanel
            order={order}
            stageDetail={stage.detail}
            stageIcon={stageIcon}
            stageLabel={stage.label}
            proofs={proofs}
            isFocused={isPaymentFocused}
            dimmed={hasFocus && !isPaymentFocused}
            accessToken={accessToken}
            onToggle={() => togglePanel("payment")}
          />

          <ItemsPanel
            items={order.items}
            dimmed={hasFocus && (isPaymentFocused || isReturnFocused || isReviewFocused)}
          />
        </div>

        <div className={styles.sideColumn}>
          <DeliveryPanel
            line={deliveryLine}
            phone={order.customerPhone}
            notes={order.notes}
            dimmed={hasFocus && isPaymentFocused}
            canTrack={canTrack}
            trackingHref={trackingHref}
          />

          {showReturn ? (
            <ReturnPanel
              order={order}
              returnCase={returnCase}
              returnEvents={returnEvents}
              returnProofs={returnProofs}
              accessToken={accessToken}
              isFocused={isReturnFocused}
              dimmed={hasFocus && !isReturnFocused}
              onToggle={() => togglePanel("return")}
            />
          ) : null}

          {showReview ? (
            <ReviewPanel
              order={order}
              reviewRequest={reviewRequest}
              review={review}
              accessToken={accessToken}
              isFocused={isReviewFocused}
              dimmed={hasFocus && !isReviewFocused}
              onToggle={() => togglePanel("review")}
            />
          ) : null}
        </div>
      </div>

      {hasDetailsSection && (
        <OrderSecondaryDetails
          timeline={timeline}
          mapSrc={mapSrc}
          returnItems={returnItems}
          isFocused={isDetailsFocused}
          dimmed={hasFocus && !isDetailsFocused}
          onToggle={() => togglePanel("details")}
        />
      )}
    </div>
  );
}
