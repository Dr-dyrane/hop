import { MapPinned, RotateCcw } from "lucide-react";
import { formatNgn } from "@/lib/commerce";
import type {
  OrderReturnCaseItemRow,
  OrderStatusEventRow,
} from "@/lib/db/types";
import { formatOrderTimestamp } from "@/lib/orders/detail-view";
import { cn } from "@/lib/utils";
import { AnimatedReveal, FocusPanel } from "./primitives";
import { buildTrackingJourney, TrackingStepRow } from "./tracking";
import styles from "./order-detail.module.css";

export function OrderSecondaryDetails({
  timeline,
  mapSrc,
  returnItems,
  isFocused,
  dimmed,
  onToggle,
}: {
  timeline: OrderStatusEventRow[];
  mapSrc: string | null;
  returnItems: OrderReturnCaseItemRow[];
  isFocused: boolean;
  dimmed: boolean;
  onToggle: () => void;
}) {
  const tracking = buildTrackingJourney(timeline);
  const hasMapPanel = Boolean(mapSrc);
  const hasReturnPanel = returnItems.length > 0;
  const hasSidePanel = hasMapPanel || hasReturnPanel;

  return (
    <section
      className={cn(
        styles.detailsShell,
        isFocused && styles.detailsShellOpen,
        dimmed && styles.dimmed
      )}
    >
      <div className={styles.detailsHeader}>
        <div>
          <div className={styles.sectionEyebrow}>Tracking</div>
          <h2 className={styles.detailsTitle}>{tracking.currentTitle}</h2>
          <p className={styles.detailsDescription}>
            {tracking.currentTime
              ? formatOrderTimestamp(tracking.currentTime)
              : "Timeline updates appear here as your order progresses."}
          </p>
        </div>

        <button
          type="button"
          className={styles.inlineButton}
          onClick={onToggle}
          aria-expanded={isFocused}
        >
          {isFocused ? "Close" : "Open"}
        </button>
      </div>

      <AnimatedReveal show={isFocused} panelKey="details-panel">
        <div
          className={cn(
            styles.trackingLayout,
            hasSidePanel && styles.trackingLayoutWithSide
          )}
        >
          <FocusPanel title="Order journey" variant="muted" className={styles.timelinePanel}>
            <div
              className={cn(
                styles.trackingStepList,
                !hasSidePanel && styles.trackingStepListZigZag
              )}
            >
              {tracking.steps.map((step, index) => (
                <TrackingStepRow
                  key={step.key}
                  step={step}
                  isLast={index === tracking.steps.length - 1}
                />
              ))}
            </div>
          </FocusPanel>

          {mapSrc ? (
            <FocusPanel title="Map" variant="muted" className={styles.trackingMapPanel}>
              <div className={styles.trackingPanelEyebrow}>
                <MapPinned size={14} strokeWidth={1.8} />
                <span>Live location snapshot</span>
              </div>
              <div className={styles.mapFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mapSrc}
                  alt="Delivery location"
                  className={styles.mapImage}
                  loading="lazy"
                />
              </div>
            </FocusPanel>
          ) : null}

          {hasReturnPanel ? (
            <FocusPanel
              title="Return activity"
              variant="muted"
              className={styles.trackingSecondaryPanel}
            >
              <div className={styles.timelineList}>
                {returnItems.map((item) => (
                  <div key={item.returnItemId} className={styles.returnActivityItem}>
                    <div className={styles.returnActivityIcon}>
                      <RotateCcw size={14} strokeWidth={1.8} />
                    </div>
                    <div className={styles.timelineStatusGroup}>
                      <div className={styles.timelineStatus}>{item.title}</div>
                      <div className={styles.timelineSubtext}>
                        {item.quantity} x {formatNgn(item.unitPriceNgn)}
                      </div>
                    </div>
                    <span className={styles.timelineAmount}>{formatNgn(item.lineTotalNgn)}</span>
                  </div>
                ))}
              </div>
            </FocusPanel>
          ) : null}
        </div>
      </AnimatedReveal>
    </section>
  );
}
