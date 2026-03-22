import {
  Banknote,
  CheckCircle2,
  Circle,
  CreditCard,
  Package,
  PackageCheck,
  Receipt,
  Truck,
} from "lucide-react";
import type { OrderStatusEventRow } from "@/lib/db/types";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";
import { formatOrderTimestamp } from "@/lib/orders/detail-view";
import { cn } from "@/lib/utils";
import styles from "./order-detail.module.css";

type TrackingIconComponent = typeof Circle;
type TrackingStepState = "completed" | "current" | "upcoming";
type TrackingStepKey =
  | "requested"
  | "awaiting_transfer"
  | "money_sent"
  | "preparing"
  | "ready_for_dispatch"
  | "out_for_delivery"
  | "delivered";

export type TrackingStep = {
  key: TrackingStepKey;
  label: string;
  icon: TrackingIconComponent;
  state: TrackingStepState;
  occurredAt: string | null;
};

const TRACKING_STEP_DEFINITIONS: Array<{
  key: TrackingStepKey;
  label: string;
  icon: TrackingIconComponent;
}> = [
  { key: "requested", label: "Request received", icon: Receipt },
  { key: "awaiting_transfer", label: "Awaiting transfer", icon: CreditCard },
  { key: "money_sent", label: "Money sent", icon: Banknote },
  { key: "preparing", label: "Preparing order", icon: Package },
  { key: "ready_for_dispatch", label: "Ready for dispatch", icon: PackageCheck },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export function TrackingStepRow({
  step,
  isLast,
}: {
  step: TrackingStep;
  isLast: boolean;
}) {
  const StepIcon = step.icon;
  const stateClass =
    step.state === "current"
      ? styles.trackingStepCurrent
      : step.state === "completed"
      ? styles.trackingStepCompleted
      : styles.trackingStepUpcoming;

  return (
    <div className={cn(styles.trackingStep, stateClass)}>
      <div className={styles.trackingStepRail}>
        <div className={styles.trackingStepIcon}>
          <StepIcon size={16} strokeWidth={1.9} />
        </div>
        {!isLast ? <div className={styles.trackingStepLine} /> : null}
      </div>
      <div className={styles.trackingStepBody}>
        <div className={styles.trackingStepTopRow}>
          <div className={styles.trackingStepTitle}>{step.label}</div>
          {step.state === "current" ? (
            <span className={styles.trackingCurrentPill}>Current</span>
          ) : null}
        </div>
        <div className={styles.trackingStepTime}>
          {step.occurredAt
            ? formatOrderTimestamp(step.occurredAt)
            : step.state === "upcoming"
            ? "Pending"
            : "Not recorded"}
        </div>
      </div>
    </div>
  );
}

export function buildTrackingJourney(timeline: OrderStatusEventRow[]): {
  currentTitle: string;
  currentTime: string | null;
  steps: TrackingStep[];
} {
  if (timeline.length === 0) {
    return {
      currentTitle: "No updates yet",
      currentTime: null,
      steps: TRACKING_STEP_DEFINITIONS.map((definition, index) => ({
        ...definition,
        occurredAt: null,
        state: index === 0 ? "current" : "upcoming",
      })),
    };
  }

  const byTimeAsc = [...timeline].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
  const byTimeDesc = [...timeline].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  const latestByStatus = new Map<TrackingStepKey, string>();
  for (const event of byTimeAsc) {
    const key = normalizeTrackingStatus(event.toStatus);
    if (!key) continue;
    latestByStatus.set(key, event.createdAt);
  }

  const latestEvent = byTimeDesc[0];
  const currentKey =
    byTimeDesc
      .map((event) => normalizeTrackingStatus(event.toStatus))
      .find((key): key is TrackingStepKey => Boolean(key)) ?? "requested";

  const currentIndex = TRACKING_STEP_DEFINITIONS.findIndex(
    (definition) => definition.key === currentKey
  );
  const safeCurrentIndex = currentIndex < 0 ? 0 : currentIndex;

  const steps: TrackingStep[] = TRACKING_STEP_DEFINITIONS.map(
    (definition, index) => {
      const state: TrackingStepState =
        index < safeCurrentIndex
          ? "completed"
          : index === safeCurrentIndex
          ? "current"
          : "upcoming";

      return {
        ...definition,
        occurredAt: latestByStatus.get(definition.key) ?? null,
        state,
      };
    }
  );

  const currentTitle =
    steps[safeCurrentIndex]?.label ??
    formatFlowStatusLabel(latestEvent.toStatus);

  return {
    currentTitle,
    currentTime: steps[safeCurrentIndex]?.occurredAt ?? latestEvent.createdAt,
    steps,
  };
}

function normalizeTrackingStatus(value: string): TrackingStepKey | null {
  const normalized = value.trim().toLowerCase();

  if (["requested", "request_received", "checkout_draft"].includes(normalized)) {
    return "requested";
  }

  if (normalized === "awaiting_transfer") {
    return "awaiting_transfer";
  }

  if (
    [
      "money_sent",
      "submitted",
      "payment_submitted",
      "under_review",
      "payment_under_review",
    ].includes(normalized)
  ) {
    return "money_sent";
  }

  if (["preparing", "preparing_order", "processing"].includes(normalized)) {
    return "preparing";
  }

  if (
    ["ready_for_dispatch", "dispatch_ready", "ready_to_ship"].includes(normalized)
  ) {
    return "ready_for_dispatch";
  }

  if (["out_for_delivery", "in_transit"].includes(normalized)) {
    return "out_for_delivery";
  }

  if (normalized === "delivered") {
    return "delivered";
  }

  if (["cancelled", "expired", "failed"].includes(normalized)) {
    return "requested";
  }

  return null;
}
