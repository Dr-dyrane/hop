export type OrderStageTone = "default" | "success" | "muted";

export type OrderStagePresentation = {
  key:
    | "requested"
    | "awaiting_transfer"
    | "money_sent"
    | "preparing"
    | "ready_for_dispatch"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "expired";
  label: string;
  detail: string;
  nextAction: string;
  tone: OrderStageTone;
};

const STATUS_LABELS: Record<string, string> = {
  checkout_draft: "Request received",
  awaiting_transfer: "Awaiting transfer",
  payment_submitted: "Money sent",
  payment_under_review: "Money sent",
  payment_confirmed: "Preparing order",
  preparing: "Preparing order",
  ready_for_dispatch: "Ready for dispatch",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Transfer window closed",
  submitted: "Money sent",
  under_review: "Money sent",
  confirmed: "Payment confirmed",
  rejected: "Awaiting transfer",
  pending: "Pending",
};

const PAYMENT_REVIEW_ACTION_LABELS: Record<string, string> = {
  submitted: "Money sent",
  marked_under_review: "Checked payment",
  under_review: "Checked payment",
  confirmed: "Payment confirmed",
  rejected: "Payment rejected",
  expired: "Transfer window closed",
};

const PAYMENT_REVIEW_BUTTON_LABELS: Record<string, string> = {
  submitted: "Mark money sent",
  under_review: "Check payment",
  confirmed: "Confirm payment",
  rejected: "Reject payment",
};

export function getOrderStagePresentation(input: {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): OrderStagePresentation {
  const status = input.status ?? null;
  const paymentStatus = input.paymentStatus ?? null;
  const fulfillmentStatus = input.fulfillmentStatus ?? null;

  if (status === "checkout_draft") {
    return {
      key: "requested",
      label: "Request received",
      detail: "Waiting for approval",
      nextAction: "Accept request",
      tone: "default",
    };
  }

  if (status === "cancelled" || fulfillmentStatus === "cancelled") {
    return {
      key: "cancelled",
      label: "Cancelled",
      detail: "Order closed",
      nextAction: "Closed",
      tone: "muted",
    };
  }

  if (status === "expired" || paymentStatus === "expired") {
    return {
      key: "expired",
      label: "Transfer window closed",
      detail: "Start a fresh order",
      nextAction: "Closed",
      tone: "muted",
    };
  }

  if (fulfillmentStatus === "delivered" || status === "delivered") {
    return {
      key: "delivered",
      label: "Delivered",
      detail: "Completed",
      nextAction: "Completed",
      tone: "success",
    };
  }

  if (
    fulfillmentStatus === "out_for_delivery" ||
    status === "out_for_delivery"
  ) {
    return {
      key: "out_for_delivery",
      label: "Out for delivery",
      detail: "On the way",
      nextAction: "Mark delivered",
      tone: "success",
    };
  }

  if (fulfillmentStatus === "ready_for_dispatch") {
    return {
      key: "ready_for_dispatch",
      label: "Ready for dispatch",
      detail: "Queued for rider assignment",
      nextAction: "Dispatch to rider",
      tone: "default",
    };
  }

  if (
    fulfillmentStatus === "preparing" ||
    status === "preparing" ||
    status === "payment_confirmed" ||
    paymentStatus === "confirmed"
  ) {
    return {
      key: "preparing",
      label: "Preparing order",
      detail: "Payment confirmed",
      nextAction: "Start preparing",
      tone: "default",
    };
  }

  if (paymentStatus === "under_review" || status === "payment_under_review") {
    return {
      key: "money_sent",
      label: "Money sent",
      detail: "Checking transfer",
      nextAction: "Confirm payment",
      tone: "default",
    };
  }

  if (paymentStatus === "submitted" || status === "payment_submitted") {
    return {
      key: "money_sent",
      label: "Money sent",
      detail: "Waiting for confirmation",
      nextAction: "Confirm payment",
      tone: "default",
    };
  }

  if (paymentStatus === "rejected") {
    return {
      key: "awaiting_transfer",
      label: "Awaiting transfer",
      detail: "Send payment again",
      nextAction: "Wait for transfer",
      tone: "default",
    };
  }

  return {
    key: "awaiting_transfer",
    label: "Awaiting transfer",
    detail: "Send payment",
    nextAction: "Wait for transfer",
    tone: "default",
  };
}

export function getPaymentStatusPresentation(status?: string | null) {
  switch (status) {
    case "submitted":
      return {
        label: "Money sent",
        detail: "Waiting for confirmation",
        tone: "default" as const,
      };
    case "under_review":
      return {
        label: "Money sent",
        detail: "Checking transfer",
        tone: "default" as const,
      };
    case "confirmed":
      return {
        label: "Payment confirmed",
        detail: "Preparing can start",
        tone: "default" as const,
      };
    case "rejected":
      return {
        label: "Awaiting transfer",
        detail: "Send payment again",
        tone: "default" as const,
      };
    case "expired":
      return {
        label: "Transfer window closed",
        detail: "Start a fresh order",
        tone: "muted" as const,
      };
    default:
      return {
        label: "Awaiting transfer",
        detail: "Waiting for customer",
        tone: "default" as const,
      };
  }
}

export function formatFlowStatusLabel(value: string) {
  return STATUS_LABELS[value] ?? value.replace(/_/g, " ");
}

export function formatPaymentReviewActionLabel(value: string) {
  return PAYMENT_REVIEW_ACTION_LABELS[value] ?? value.replace(/_/g, " ");
}

export function getPaymentReviewActionLabel(value: string) {
  return PAYMENT_REVIEW_BUTTON_LABELS[value] ?? value.replace(/_/g, " ");
}
