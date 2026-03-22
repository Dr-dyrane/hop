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
  const { isRequestPending, order, proofs, review, returnCase } = args;

  if (isRequestPending) {
    return "Your order is waiting for approval. Transfer details appear here after approval.";
  }

  if (
    order.status === "awaiting_transfer" ||
    order.paymentStatus === "awaiting_transfer"
  ) {
    return proofs.length > 0
      ? "Payment proof received. We will verify it and continue your order."
      : "Send payment with the transfer details below, then upload proof to continue.";
  }

  if (order.fulfillmentStatus === "out_for_delivery") {
    return "Your order is on the way. Track delivery and keep your address details handy.";
  }

  if (order.status === "delivered") {
    if (!returnCase && !review) {
      return "Delivered. You can request a return or leave a rating below.";
    }
    if (returnCase && !review) {
      return "Delivered. Your return case is active and you can still leave a rating.";
    }
    if (!returnCase && review) {
      return "Delivered and rated. You can still request a return if needed.";
    }
    return "Delivered. Return and rating activity is available below.";
  }

  return "Review your order status, payment progress, and delivery details below.";
}

export function getOrderPrimaryActionLabel(args: {
  isRequestPending: boolean;
  order: PortalOrderDetail;
  proofs: PaymentProofRow[];
}) {
  const { isRequestPending, order, proofs } = args;

  if (isRequestPending) return "Awaiting approval";
  if (
    order.status === "awaiting_transfer" ||
    order.paymentStatus === "awaiting_transfer"
  ) {
    return proofs.length > 0 ? "Proof uploaded" : "Upload payment proof";
  }
  if (order.fulfillmentStatus === "out_for_delivery") return "Track delivery";
  if (order.status === "delivered") return "After delivery";
  return "Order overview";
}
