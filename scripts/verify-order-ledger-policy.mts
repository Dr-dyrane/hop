import assert from "node:assert/strict";

const ledgerPolicyModule = await import("../src/lib/orders/ledger-policy");
const orderPresentationModule = await import("../src/lib/orders/presentation");

const ledgerExports = ledgerPolicyModule as Record<string, unknown>;
const presentationExports = orderPresentationModule as Record<string, unknown>;

const resolveOrderLedgerState = (
  ledgerExports.resolveOrderLedgerState ??
  (ledgerExports.default as Record<string, unknown> | undefined)
    ?.resolveOrderLedgerState
) as typeof import("../src/lib/orders/ledger-policy").resolveOrderLedgerState;

const getOrderStagePresentation = (
  presentationExports.getOrderStagePresentation ??
  (presentationExports.default as Record<string, unknown> | undefined)
    ?.getOrderStagePresentation
) as typeof import("../src/lib/orders/presentation").getOrderStagePresentation;

if (!resolveOrderLedgerState || !getOrderStagePresentation) {
  throw new Error("Unable to load order ledger modules for verification.");
}

type LedgerMatrixCase = {
  name: string;
  input: {
    orderStatus?: string | null;
    paymentStatus?: string | null;
    fulfillmentStatus?: string | null;
  };
  expected: {
    key: string;
    showPaymentWorkflow: boolean;
    collapseTransferIntoLedger: boolean;
    showPostDeliveryActions: boolean;
  };
};

const matrix: LedgerMatrixCase[] = [
  {
    name: "request_received",
    input: { orderStatus: "checkout_draft" },
    expected: {
      key: "request_received",
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  {
    name: "awaiting_transfer",
    input: { orderStatus: "awaiting_transfer", paymentStatus: "awaiting_transfer" },
    expected: {
      key: "awaiting_transfer",
      showPaymentWorkflow: true,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  {
    name: "payment_submitted",
    input: { orderStatus: "payment_submitted", paymentStatus: "submitted" },
    expected: {
      key: "payment_submitted",
      showPaymentWorkflow: true,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  {
    name: "payment_under_review",
    input: { orderStatus: "payment_under_review", paymentStatus: "under_review" },
    expected: {
      key: "payment_under_review",
      showPaymentWorkflow: true,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  {
    name: "preparing",
    input: { orderStatus: "preparing", paymentStatus: "confirmed", fulfillmentStatus: "preparing" },
    expected: {
      key: "preparing",
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  {
    name: "ready_for_dispatch",
    input: {
      orderStatus: "ready_for_dispatch",
      paymentStatus: "confirmed",
      fulfillmentStatus: "ready_for_dispatch",
    },
    expected: {
      key: "ready_for_dispatch",
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  {
    name: "out_for_delivery",
    input: {
      orderStatus: "out_for_delivery",
      paymentStatus: "confirmed",
      fulfillmentStatus: "out_for_delivery",
    },
    expected: {
      key: "out_for_delivery",
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  {
    name: "delivered",
    input: {
      orderStatus: "delivered",
      paymentStatus: "confirmed",
      fulfillmentStatus: "delivered",
    },
    expected: {
      key: "delivered",
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: true,
      showPostDeliveryActions: true,
    },
  },
  {
    name: "closed_cancelled",
    input: { orderStatus: "cancelled", fulfillmentStatus: "cancelled" },
    expected: {
      key: "closed",
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
  {
    name: "closed_expired",
    input: { orderStatus: "expired", paymentStatus: "expired" },
    expected: {
      key: "closed",
      showPaymentWorkflow: false,
      collapseTransferIntoLedger: false,
      showPostDeliveryActions: false,
    },
  },
];

for (const entry of matrix) {
  const resolved = resolveOrderLedgerState(entry.input);
  assert.equal(resolved.key, entry.expected.key, `${entry.name}: key mismatch`);
  assert.equal(
    resolved.ui.showPaymentWorkflow,
    entry.expected.showPaymentWorkflow,
    `${entry.name}: showPaymentWorkflow mismatch`
  );
  assert.equal(
    resolved.ui.collapseTransferIntoLedger,
    entry.expected.collapseTransferIntoLedger,
    `${entry.name}: collapseTransferIntoLedger mismatch`
  );
  assert.equal(
    resolved.ui.showPostDeliveryActions,
    entry.expected.showPostDeliveryActions,
    `${entry.name}: showPostDeliveryActions mismatch`
  );
}

// Unknown state combinations should emit one deduped warning and fallback safely.
const warnCalls: unknown[][] = [];
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  warnCalls.push(args);
};

try {
  const first = resolveOrderLedgerState({
    orderStatus: "brand_new_status",
    paymentStatus: "unknown_payment",
    fulfillmentStatus: "unknown_fulfillment",
  });
  const second = resolveOrderLedgerState({
    orderStatus: "brand_new_status",
    paymentStatus: "unknown_payment",
    fulfillmentStatus: "unknown_fulfillment",
  });

  assert.equal(first.key, "awaiting_transfer", "unknown fallback key mismatch");
  assert.equal(second.key, "awaiting_transfer", "unknown fallback key mismatch on repeat");
  assert.equal(warnCalls.length, 1, "unknown telemetry warning should be deduped");
} finally {
  console.warn = originalWarn;
}

// Stage presentation must distinguish ready_for_dispatch from generic preparing.
const readyStage = getOrderStagePresentation({
  status: "ready_for_dispatch",
  paymentStatus: "confirmed",
  fulfillmentStatus: "ready_for_dispatch",
});

assert.equal(readyStage.key, "ready_for_dispatch", "ready_for_dispatch key mismatch");
assert.equal(readyStage.label, "Ready for dispatch", "ready_for_dispatch label mismatch");

console.log("order-ledger policy verification passed");
