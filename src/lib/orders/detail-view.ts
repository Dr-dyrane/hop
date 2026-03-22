import type {
  OrderReturnCaseRow,
  OrderReviewRow,
  PaymentProofRow,
  PortalOrderDetail,
} from "@/lib/db/types";

export function formatOrderTimestamp(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatOrderStatusLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function getTrackingCoords(snapshot: Record<string, unknown>) {
  const latCandidates = ["latitude", "lat"];
  const lngCandidates = ["longitude", "lng"];

  const lat =
    latCandidates
      .map((key) => snapshot[key])
      .find((candidate) => typeof candidate === "number") ?? null;

  const lng =
    lngCandidates
      .map((key) => snapshot[key])
      .find((candidate) => typeof candidate === "number") ?? null;

  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng };
  }

  return null;
}

export function getDeliveryLine(snapshot: Record<string, unknown>) {
  const preferredKeys = ["formatted", "line1", "label"];

  for (const key of preferredKeys) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  return "Pending";
}

export function getOrderHeroSummary(args: {
  isRequestPending: boolean;
  order: PortalOrderDetail;
  proofs: PaymentProofRow[];
  review: OrderReviewRow | null;
  returnCase: OrderReturnCaseRow | null;
}) {
  // Keep hero copy short and state-led. Rationale lives in code/docs, not UI prose.
  const { isRequestPending, order, proofs, review, returnCase } = args;

  if (isRequestPending) {
    return "Awaiting approval.";
  }

  if (
    order.status === "awaiting_transfer" ||
    order.paymentStatus === "awaiting_transfer"
  ) {
    return proofs.length > 0 ? "Proof submitted." : "Awaiting transfer.";
  }

  if (order.fulfillmentStatus === "out_for_delivery") {
    return "Out for delivery.";
  }

  if (order.status === "delivered") {
    const deliveredDate = order.deliveredAt
      ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
          new Date(order.deliveredAt)
        )
      : null;

    const deliveredLead = deliveredDate
      ? `Delivered - ${deliveredDate}.`
      : "Delivered.";

    if (!returnCase && !review) {
      return deliveredLead;
    }
    if (returnCase && !review) {
      return `${deliveredLead} Return in progress.`;
    }
    if (!returnCase && review) {
      return `${deliveredLead} Rated.`;
    }
    return `${deliveredLead} Return and rating recorded.`;
  }

  return "Order in progress.";
}
