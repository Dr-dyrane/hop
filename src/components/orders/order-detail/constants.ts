import type { IconName } from "@/components/ui/Icon";

export const STAGE_ICONS: Record<string, IconName> = {
  requested: "history",
  awaiting_transfer: "credit-card",
  money_sent: "credit-card",
  preparing: "check-circle",
  ready_for_dispatch: "package",
  out_for_delivery: "truck",
  delivered: "check-circle",
  cancelled: "history",
  expired: "history",
};

export const TRACKABLE_FULFILLMENT_STATUSES = new Set([
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
]);

export const PANEL_MOTION = {
  initial: { opacity: 0, y: 10, height: 0, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, height: "auto", filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, height: 0, filter: "blur(6px)" },
  transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const },
};
