type LedgerStateKey =
  | "request_received"
  | "awaiting_transfer"
  | "payment_submitted"
  | "payment_under_review"
  | "preparing"
  | "ready_for_dispatch"
  | "out_for_delivery"
  | "delivered"
  | "closed";

type LedgerStateUiPolicy = {
  showPaymentWorkflow: boolean;
  collapseTransferIntoLedger: boolean;
  showPostDeliveryActions: boolean;
};

type LedgerPolicyEntry = {
  /* JSON-style inline documentation for defensive rendering:
     - sources: canonical status families this policy covers
     - whyHidden: explicit rationale for suppressed panels
     - ui: actual render rules consumed by OrderDetailView
  */
  sources: {
    orderStatus: string[];
    paymentStatus: string[];
    fulfillmentStatus: string[];
  };
  whyHidden: string[];
  ui: LedgerStateUiPolicy;
};

export const ORDER_LEDGER_POLICY: Record<LedgerStateKey, LedgerPolicyEntry> = {
  request_received: {
    sources: {
      orderStatus: ["checkout_draft"],
      paymentStatus: [],
      fulfillmentStatus: [],
    },
    whyHidden: [
      "No transfer data exists before admin acceptance.",
      "Payment workflow is hidden to avoid dead-end interaction.",
    ],
    ui: {
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  awaiting_transfer: {
    sources: {
      orderStatus: ["awaiting_transfer", "rejected"],
      paymentStatus: ["awaiting_transfer", "rejected"],
      fulfillmentStatus: [],
    },
    whyHidden: [],
    ui: {
      showPaymentWorkflow: true,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  payment_submitted: {
    sources: {
      orderStatus: ["payment_submitted"],
      paymentStatus: ["submitted"],
      fulfillmentStatus: [],
    },
    whyHidden: [],
    ui: {
      showPaymentWorkflow: true,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  payment_under_review: {
    sources: {
      orderStatus: ["payment_under_review"],
      paymentStatus: ["under_review"],
      fulfillmentStatus: [],
    },
    whyHidden: [],
    ui: {
      showPaymentWorkflow: true,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  preparing: {
    sources: {
      orderStatus: ["payment_confirmed", "preparing"],
      paymentStatus: ["confirmed", "verified"],
      fulfillmentStatus: ["preparing"],
    },
    whyHidden: [
      "Payment workflow is hidden after confirmation to reduce redundancy.",
    ],
    ui: {
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  ready_for_dispatch: {
    sources: {
      orderStatus: ["ready_for_dispatch"],
      paymentStatus: ["confirmed", "verified"],
      fulfillmentStatus: ["ready_for_dispatch"],
    },
    whyHidden: [
      "Payment workflow remains hidden once order is queued for dispatch.",
    ],
    ui: {
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  out_for_delivery: {
    sources: {
      orderStatus: ["out_for_delivery"],
      paymentStatus: ["confirmed", "verified"],
      fulfillmentStatus: ["out_for_delivery"],
    },
    whyHidden: [
      "Payment workflow is hidden while delivery is in flight.",
    ],
    ui: {
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  delivered: {
    sources: {
      orderStatus: ["delivered"],
      paymentStatus: ["confirmed", "verified"],
      fulfillmentStatus: ["delivered"],
    },
    whyHidden: [
      "Payment workflow is hidden after completion.",
      "Return and rating are promoted as post-delivery actions.",
    ],
    ui: {
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: true,
      showPostDeliveryActions: true,
    },
  },
  closed: {
    sources: {
      orderStatus: ["cancelled", "expired"],
      paymentStatus: ["expired"],
      fulfillmentStatus: ["cancelled", "failed"],
    },
    whyHidden: [
      "Order is closed; task flows are suppressed to prevent invalid actions.",
    ],
    ui: {
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
};

export type ResolvedOrderLedgerState = {
  key: LedgerStateKey;
  ui: LedgerStateUiPolicy;
  whyHidden: string[];
};

const seenUnknownLedgerStates = new Set<string>();

export function resolveOrderLedgerState(input: {
  orderStatus?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): ResolvedOrderLedgerState {
  const orderStatus = normalize(input.orderStatus);
  const paymentStatus = normalize(input.paymentStatus);
  const fulfillmentStatus = normalize(input.fulfillmentStatus);

  const key = resolveKey({ orderStatus, paymentStatus, fulfillmentStatus });
  const policy = ORDER_LEDGER_POLICY[key];

  return {
    key,
    ui: policy.ui,
    whyHidden: policy.whyHidden,
  };
}

function resolveKey(input: {
  orderStatus: string | null;
  paymentStatus: string | null;
  fulfillmentStatus: string | null;
}): LedgerStateKey {
  const { orderStatus, paymentStatus, fulfillmentStatus } = input;

  if (
    orderStatus === "cancelled" ||
    orderStatus === "expired" ||
    fulfillmentStatus === "cancelled" ||
    paymentStatus === "expired"
  ) {
    return "closed";
  }

  if (orderStatus === "checkout_draft") {
    return "request_received";
  }

  if (orderStatus === "delivered" || fulfillmentStatus === "delivered") {
    return "delivered";
  }

  if (orderStatus === "out_for_delivery" || fulfillmentStatus === "out_for_delivery") {
    return "out_for_delivery";
  }

  if (orderStatus === "ready_for_dispatch" || fulfillmentStatus === "ready_for_dispatch") {
    return "ready_for_dispatch";
  }

  if (
    orderStatus === "payment_confirmed" ||
    orderStatus === "preparing" ||
    fulfillmentStatus === "preparing" ||
    paymentStatus === "confirmed" ||
    paymentStatus === "verified"
  ) {
    return "preparing";
  }

  if (orderStatus === "payment_under_review" || paymentStatus === "under_review") {
    return "payment_under_review";
  }

  if (orderStatus === "payment_submitted" || paymentStatus === "submitted") {
    return "payment_submitted";
  }

  if (
    orderStatus === "awaiting_transfer" ||
    paymentStatus === "awaiting_transfer" ||
    paymentStatus === "rejected"
  ) {
    return "awaiting_transfer";
  }

  // Defensive fallback: unresolved states default to the safest actionable path.
  // Emit lightweight telemetry so unknown status combinations are visible in logs.
  emitUnknownLedgerStateTelemetry({
    orderStatus,
    paymentStatus,
    fulfillmentStatus,
  });
  return "awaiting_transfer";
}

function normalize(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function emitUnknownLedgerStateTelemetry(input: {
  orderStatus: string | null;
  paymentStatus: string | null;
  fulfillmentStatus: string | null;
}) {
  const signature = JSON.stringify(input);
  if (seenUnknownLedgerStates.has(signature)) {
    return;
  }

  seenUnknownLedgerStates.add(signature);
  console.warn("[order-ledger] Unmapped status combination", input);
}
