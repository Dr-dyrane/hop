"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { prepareReorderAction } from "@/app/(portal)/account/reorder/actions";
import { formatNgn } from "@/lib/commerce";
import { replaceRemoteCartItems } from "@/lib/cart/api-client";
import {
  formatOrderTimestamp,
  getDeliveryLine,
  getOrderHeroSummary,
  getTrackingCoords,
} from "@/lib/orders/detail-view";
import { resolveOrderLedgerState } from "@/lib/orders/ledger-policy";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import {
  getOrderStagePresentation,
} from "@/lib/orders/presentation";
import { buildStaticMapUrl } from "@/lib/mapbox";
import { AdaptiveOrderSheet } from "./order-detail/adaptive-sheet";
import { STAGE_ICONS, TRACKABLE_FULFILLMENT_STATUSES } from "./order-detail/constants";
import {
  DeliveryPanel,
  ItemsPanel,
  ItemPreviewPanel,
  OrderHero,
  OrderNotFound,
  OrderPriorityStrip,
  PostDeliveryActionsPanel,
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

function clampActivePanel(input: {
  requestedPanel: ActivePanel;
  showPaymentWorkflow: boolean;
  showReturn: boolean;
  showReview: boolean;
  hasDetailsSection: boolean;
}): ActivePanel {
  const {
    requestedPanel,
    showPaymentWorkflow,
    showReturn,
    showReview,
    hasDetailsSection,
  } = input;

  if (!requestedPanel) return null;
  if (requestedPanel === "payment" && !showPaymentWorkflow) return null;
  if (requestedPanel === "return" && !showReturn) return null;
  if (requestedPanel === "review" && !showReview) return null;
  if (requestedPanel === "details" && !hasDetailsSection) return null;
  return requestedPanel;
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
  const searchParams = useSearchParams();
  const feedback = useFeedback();

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
  const ledgerState = order
    ? resolveOrderLedgerState({
        orderStatus: order.status,
        paymentStatus: order.payment?.status ?? order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
      })
    : null;
  const isDeliveredStage = ledgerState?.key === "delivered";
  const showReturn = Boolean(order && (returnCase || isDeliveredStage));
  const showReview = Boolean(order && (isDeliveredStage || reviewRequest || review));
  const showPaymentWorkflow = Boolean(
    order && order.paymentId && ledgerState?.ui.showPaymentWorkflow
  );
  const hasDetailsSection = Boolean(
    order && (mapSrc || timeline.length > 0 || returnItems.length > 0)
  );
  const stage = order ? getOrderStagePresentation(order) : null;

  const [panelChoice, setPanelChoice] = useState<ActivePanel>(() =>
    clampActivePanel({
      requestedPanel: parseActivePanel(searchParams.get(PANEL_QUERY_KEY)),
      showPaymentWorkflow,
      showReturn,
      showReview,
      hasDetailsSection,
    })
  );

  const activePanel = useMemo(
    () =>
      clampActivePanel({
        requestedPanel: panelChoice,
        showPaymentWorkflow,
        showReturn,
        showReview,
        hasDetailsSection,
      }),
    [hasDetailsSection, panelChoice, showPaymentWorkflow, showReturn, showReview]
  );
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isReordering, startReorderTransition] = useTransition();
  const canReorder = backHref.startsWith("/account");

  const updatePanelQuery = useCallback((nextPanel: ActivePanel) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = new URL(window.location.href);
    if (nextPanel) {
      nextUrl.searchParams.set(PANEL_QUERY_KEY, nextPanel);
    } else {
      nextUrl.searchParams.delete(PANEL_QUERY_KEY);
    }

    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history.replaceState(window.history.state, "", nextPath);
  }, []);

  const togglePanel = useCallback(
    (panel: Exclude<ActivePanel, null>) => {
      feedback.selection();

      setPanelChoice((currentPanel) => {
        const nextPanel = currentPanel === panel ? null : panel;
        updatePanelQuery(nextPanel);
        return nextPanel;
      });
    },
    [feedback, updatePanelQuery]
  );

  const closeActivePanel = useCallback(() => {
    setPanelChoice((currentPanel) => {
      if (!currentPanel) {
        return currentPanel;
      }

      updatePanelQuery(null);
      return null;
    });
  }, [updatePanelQuery]);

  const openItemPreview = useCallback(
    (orderItemId: string) => {
      feedback.selection();
      closeActivePanel();
      setActiveItemId(orderItemId);
    },
    [closeActivePanel, feedback]
  );

  useEffect(() => {
    if (!trackingHref) {
      return;
    }

    const onTrackCurrent = () => {
      if (!TRACKABLE_FULFILLMENT_STATUSES.has(order?.fulfillmentStatus ?? "")) {
        feedback.blocked();
        return;
      }

      feedback.selection();
      router.push(trackingHref);
    };

    window.addEventListener("orders:track-current", onTrackCurrent);
    return () => {
      window.removeEventListener("orders:track-current", onTrackCurrent);
    };
  }, [feedback, order?.fulfillmentStatus, router, trackingHref]);

  const sheetTitle =
    activePanel === "payment"
      ? "Payment"
      : activePanel === "return"
      ? "Return"
      : activePanel === "review"
      ? "Rating"
      : activePanel === "details"
      ? "Tracking"
      : null;

  const selectedItem = useMemo(() => {
    if (!order || !activeItemId) {
      return null;
    }

    return order.items.find((item) => item.orderItemId === activeItemId) ?? null;
  }, [activeItemId, order]);

  const handleReorder = useCallback(() => {
    if (!order || !canReorder) {
      return;
    }

    feedback.selection();

    startReorderTransition(async () => {
      const prepared = await prepareReorderAction(order.orderId);

      if (!prepared.success || !prepared.data) {
        feedback.blocked();
        return;
      }

      if (prepared.data.items.length === 0) {
        feedback.blocked();
        return;
      }

      try {
        await replaceRemoteCartItems(prepared.data.items);
      } catch {
        feedback.blocked();
        return;
      }

      feedback.success();
      window.dispatchEvent(new Event("commerce:open-cart"));
    });
  }, [canReorder, feedback, order, startReorderTransition]);

  const sheetContent =
    selectedItem ? (
      <ItemPreviewPanel
        item={selectedItem}
        canReorder={canReorder}
        isReordering={isReordering}
        onReorder={handleReorder}
      />
    ) : activePanel === "payment" && showPaymentWorkflow && order && stage ? (
      <PaymentPanel
        order={order}
        stageIcon={STAGE_ICONS[stage.key] ?? "history"}
        stageLabel={stage.label}
        proofs={proofs}
        isFocused
        dimmed={false}
        accessToken={accessToken}
        onToggle={closeActivePanel}
      />
    ) : activePanel === "return" && showReturn && order ? (
      <ReturnPanel
        order={order}
        returnCase={returnCase}
        returnEvents={returnEvents}
        returnProofs={returnProofs}
        accessToken={accessToken}
        isFocused
        dimmed={false}
        onToggle={closeActivePanel}
      />
    ) : activePanel === "review" && showReview && order ? (
      <ReviewPanel
        order={order}
        reviewRequest={reviewRequest}
        review={review}
        accessToken={accessToken}
        isFocused
        dimmed={false}
        onToggle={closeActivePanel}
      />
    ) : activePanel === "details" && hasDetailsSection ? (
      <OrderSecondaryDetails
        timeline={timeline}
        mapSrc={mapSrc}
        returnItems={returnItems}
        isFocused
        dimmed={false}
        onToggle={closeActivePanel}
      />
    ) : null;

  const sheetHeading = selectedItem ? "Product" : sheetTitle;
  const isSheetOpen = Boolean(sheetHeading && sheetContent);

  // If lifecycle gates invalidate the currently selected panel, keep URL query in sync with
  // the clamped visible panel state without triggering extra state churn.
  useEffect(() => {
    if (panelChoice === activePanel) {
      return;
    }

    updatePanelQuery(activePanel);
  }, [activePanel, panelChoice, updatePanelQuery]);

  // Track quick action should stay available from global FAB/header actions.
  const canTrack = Boolean(
    trackingHref && TRACKABLE_FULFILLMENT_STATUSES.has(order?.fulfillmentStatus ?? "")
  );

  if (!order) {
    return <OrderNotFound backHref={backHref} />;
  }

  const resolvedStage = stage ?? getOrderStagePresentation(order);
  const stageIcon = STAGE_ICONS[resolvedStage.key] ?? "history";
  const isRequestPending = order.status === "checkout_draft";
  const totalUnits = order.items.reduce((total, item) => total + item.quantity, 0);
  const dueAmount = formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn);
  const deliveryLine = getDeliveryLine(order.deliveryAddressSnapshot);
  const heroSummary = getOrderHeroSummary({
    isRequestPending,
    order,
    proofs,
    review,
    returnCase,
  });

  const isPaymentFocused = activePanel === "payment";
  const isReturnFocused = activePanel === "return";
  const isReviewFocused = activePanel === "review";
  const isItemFocused = Boolean(selectedItem);
  const hasFocus = activePanel !== null || isItemFocused;

  return (
    <div className={styles.page}>
      <OrderHero
        orderNumber={order.orderNumber}
        heroSummary={heroSummary}
        stageLabel={resolvedStage.label}
        stageIcon={stageIcon}
        dueAmount={dueAmount}
        placedAt={order.placedAt}
        proofCount={proofs.length}
        totalUnits={totalUnits}
      />

      <OrderPriorityStrip
        stageLabel={resolvedStage.label}
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
            collapseToLedger={Boolean(ledgerState?.ui.collapseTransferIntoLedger)}
            dueAmount={dueAmount}
            totalAmount={formatNgn(order.totalNgn)}
            stageIcon={stageIcon}
            stageLabel={resolvedStage.label}
            bankName={order.payment?.bankName ?? "Pending"}
            accountName={order.payment?.accountName ?? "Pending"}
            accountNumber={order.payment?.accountNumber ?? "Pending"}
            instructions={order.payment?.instructions}
            dimmed={hasFocus && !isPaymentFocused}
          />

          {showPaymentWorkflow ? (
            <PaymentPanel
              order={order}
              stageIcon={stageIcon}
              stageLabel={resolvedStage.label}
              proofs={proofs}
              isFocused={false}
              dimmed={hasFocus}
              accessToken={accessToken}
              onToggle={() => togglePanel("payment")}
            />
          ) : null}

          <ItemsPanel
            items={order.items}
            dimmed={hasFocus && !isItemFocused}
            onOpenItem={openItemPreview}
          />
        </div>

        <div className={styles.sideColumn}>
          {ledgerState?.ui.showPostDeliveryActions && (showReview || showReturn) ? (
            <PostDeliveryActionsPanel
              hasReview={showReview}
              hasReturn={showReturn}
              reviewSubmitted={Boolean(review)}
              returnCaseStatus={returnCase?.status ?? null}
              dimmed={hasFocus}
              onOpenReview={() => togglePanel("review")}
              onOpenReturn={() => togglePanel("return")}
            />
          ) : null}

          <DeliveryPanel
            line={deliveryLine}
            phone={order.customerPhone}
            notes={order.notes}
            dimmed={hasFocus}
            canTrack={canTrack}
            trackingHref={trackingHref}
          />

          {showReturn && !isDeliveredStage ? (
            <ReturnPanel
              order={order}
              returnCase={returnCase}
              returnEvents={returnEvents}
              returnProofs={returnProofs}
              accessToken={accessToken}
              isFocused={false}
              dimmed={hasFocus}
              onToggle={() => togglePanel("return")}
            />
          ) : null}

          {showReview && !isDeliveredStage ? (
            <ReviewPanel
              order={order}
              reviewRequest={reviewRequest}
              review={review}
              accessToken={accessToken}
              isFocused={false}
              dimmed={hasFocus}
              onToggle={() => togglePanel("review")}
            />
          ) : null}
        </div>
      </div>

      {hasDetailsSection ? (
        <OrderSecondaryDetails
          timeline={timeline}
          mapSrc={mapSrc}
          returnItems={returnItems}
          isFocused={false}
          dimmed={hasFocus}
          onToggle={() => togglePanel("details")}
        />
      ) : null}

      <AdaptiveOrderSheet
        open={isSheetOpen}
        title={sheetHeading ?? "Details"}
        onClose={() => {
          if (selectedItem) {
            setActiveItemId(null);
            return;
          }
          closeActivePanel();
        }}
      >
        {sheetContent}
      </AdaptiveOrderSheet>
    </div>
  );
}
