import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { QuietValueStrip } from "@/components/ui/QuietValueStrip";
import { AdminOrderActions } from "@/components/admin/orders/AdminOrderActions";
import { formatNgn } from "@/lib/commerce";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  getAdminOrderDetail,
  listOrderStatusEvents,
  listPaymentProofs,
  listPaymentReviewEvents,
} from "@/lib/db/repositories/orders-repository";
import {
  getLatestOrderReturnCase,
  listOrderReturnEvents,
} from "@/lib/db/repositories/order-returns-repository";
import {
  getOrderReview,
  getOrderReviewRequest,
} from "@/lib/db/repositories/review-repository";
import {
  formatFlowStatusLabel,
  formatPaymentReviewActionLabel,
  getOrderStagePresentation,
  getPaymentStatusPresentation,
} from "@/lib/orders/presentation";
import {
  advanceReturnCaseAction,
} from "./actions";

const returnStatusLabelMap: Record<string, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  received: "Received",
  refunded: "Refunded",
};

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDeliveryLine(snapshot: Record<string, unknown>) {
  const preferredKeys = ["formatted", "line1", "label"];

  for (const key of preferredKeys) {
    const value = snapshot[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "Pending";
}

function canCancelOrder(input: {
  status: string;
  fulfillmentStatus: string;
}) {
  return [
    "awaiting_transfer",
    "payment_submitted",
    "payment_under_review",
    "payment_confirmed",
    "preparing",
    "ready_for_dispatch",
  ].includes(input.status) && input.fulfillmentStatus !== "out_for_delivery";
}

function availablePaymentActions(status: string | null | undefined) {
  if (status === "submitted") {
    return ["under_review", "confirmed", "rejected"] as const;
  }

  if (status === "under_review") {
    return ["confirmed", "rejected"] as const;
  }

  return [] as const;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await requireAdminSession(`/admin/orders/${orderId}`);
  const order = await getAdminOrderDetail(orderId, session.email);

  if (!order) {
    return (
      <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
        Order not found.
        <div className="mt-4">
          <Link
            href="/admin/orders"
            className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
          >
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const adminActor = {
    email: session.email,
    role: "admin" as const,
  };
  const [orderEvents, paymentReviews, paymentProofs, reviewRequest, customerReview, returnCase, returnEvents] = await Promise.all([
    listOrderStatusEvents(orderId, adminActor),
    order.paymentId ? listPaymentReviewEvents(order.paymentId, session.email) : [],
    order.paymentId ? listPaymentProofs(order.paymentId, adminActor) : [],
    getOrderReviewRequest(orderId, adminActor),
    getOrderReview(orderId, adminActor),
    getLatestOrderReturnCase(orderId, adminActor),
    listOrderReturnEvents(orderId, adminActor),
  ]);
  const stage = getOrderStagePresentation(order);
  const paymentState = getPaymentStatusPresentation(order.payment?.status ?? order.paymentStatus);
  const paymentActions = availablePaymentActions(order.payment?.status ?? order.paymentStatus);
  const isRequestPending = order.status === "checkout_draft";

  return (
    <div className="space-y-6">
      <WorkspaceContextPanel
        title={`#${order.orderNumber}`}
        detail={order.customerName}
        tags={[{ label: stage.label, tone: stage.tone }]}
        meta={[
          {
            label: "Customer",
            value: order.customerEmail
              ? `${order.customerName} / ${order.customerEmail}`
              : order.customerName,
          },
          {
            label: "Contact",
            value: order.customerPhone,
          },
          {
            label: "Total",
            value: `${formatNgn(order.totalNgn)} / ${formatTimestamp(order.placedAt)}`,
          },
          {
            label: "Transfer Ref",
            value: isRequestPending ? "Pending" : order.transferReference,
          },
          {
            label: "Deadline",
            value: isRequestPending
              ? "Pending"
              : formatTimestamp(order.transferDeadlineAt),
          },
          {
            label: "Address",
            value: getDeliveryLine(order.deliveryAddressSnapshot),
          },
        ]}
      />

      <QuietValueStrip
        items={[
          {
            label: "Stage",
            value: stage.label,
            detail: stage.detail,
          },
          {
            label: "Due",
            value: formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn),
            detail: isRequestPending
              ? "Request pending"
              : order.payment
                ? paymentState.label
                : "Pending",
          },
          {
            label: "Proofs",
            value: `${paymentProofs.length}`,
            detail: isRequestPending
              ? "Locked"
              : paymentProofs.length > 0
                ? "Received"
                : "Waiting",
          },
          {
            label: "Checks",
            value: `${paymentReviews.length}`,
            detail: paymentReviews.length > 0 ? "Logged" : "Quiet",
          },
          {
            label: "Rating",
            value: customerReview ? `${customerReview.rating}/5` : reviewRequest ? "Pending" : "Quiet",
            detail: customerReview ? "Customer" : reviewRequest ? "Waiting" : "None",
          },
          {
            label: "Timeline",
            value: `${orderEvents.length}`,
            detail: orderEvents.length > 0 ? "Events" : "Waiting",
          },
          {
            label: "Return",
            value: returnCase ? returnStatusLabelMap[returnCase.status] ?? returnCase.status : "Quiet",
            detail: returnCase ? "Case" : "None",
          },
        ]}
        columns={4}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
        <div className="space-y-4">
          <DetailSurface
            title="Transfer"
            action={
              <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                #{order.paymentId ?? "pending"}
              </span>
            }
          >
            {isRequestPending ? (
              <div className="space-y-3">
                <div className="text-[28px] font-semibold tracking-tight text-label">
                  {formatNgn(order.totalNgn)}
                </div>
                <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label">
                  Accept the request to generate transfer details.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-[28px] font-semibold tracking-tight text-label">
                  {formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn)}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SurfaceMeta label="Bank" value={order.payment?.bankName ?? "Pending"} />
                  <SurfaceMeta label="Name" value={order.payment?.accountName ?? "Pending"} />
                </div>
                <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    Number
                  </div>
                  <div className="mt-1 text-lg font-semibold tracking-tight text-label">
                    {order.payment?.accountNumber ?? "Pending"}
                  </div>
                </div>
              </div>
            )}
          </DetailSurface>

          <DetailSurface title="Actions">
            <AdminOrderActions
              orderId={order.orderId}
              paymentId={order.paymentId}
              isRequestPending={isRequestPending}
              paymentActions={paymentActions}
              canCancel={canCancelOrder(order)}
            />
          </DetailSurface>

          <DetailSurface title="Timeline">
            <div className="grid gap-2 text-sm text-secondary-label">
              {orderEvents.length === 0 ? (
                <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">Waiting.</div>
              ) : (
                orderEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3"
                  >
                    <span className="text-label">{formatFlowStatusLabel(event.toStatus)}</span>
                    <span>{formatTimestamp(event.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </DetailSurface>
        </div>

        <div className="space-y-4">
          <DetailSurface title="Payment checks">
            <div className="grid gap-2 text-sm text-secondary-label">
              {paymentReviews.length === 0 ? (
                <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">Quiet.</div>
              ) : (
                paymentReviews.map((review) => (
                  <div
                    key={review.eventId}
                    className="rounded-[22px] bg-system-fill/36 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-label">{formatPaymentReviewActionLabel(review.action)}</span>
                      <span>{formatTimestamp(review.createdAt)}</span>
                    </div>
                    {review.note ? (
                      <div className="mt-1 text-xs text-secondary-label">{review.note}</div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </DetailSurface>

          <DetailSurface title="Customer rating">
            {customerReview ? (
              <div className="space-y-3">
                <div className="rounded-[22px] bg-system-fill/36 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-2xl font-semibold tracking-tight text-label">
                      {customerReview.rating}/5
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                      {customerReview.status}
                    </div>
                  </div>
                  {customerReview.title ? (
                    <div className="mt-3 text-sm font-medium text-label">
                      {customerReview.title}
                    </div>
                  ) : null}
                  {customerReview.body ? (
                    <div className="mt-2 text-sm text-secondary-label">
                      {customerReview.body}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
                {reviewRequest ? "Waiting for customer rating." : "No rating yet."}
              </div>
            )}
          </DetailSurface>

          <DetailSurface title="Proofs">
            <div className="grid gap-2 text-sm text-secondary-label">
              {paymentProofs.length === 0 ? (
                <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">
                  Waiting for receipt.
                </div>
              ) : (
                paymentProofs.map((proof) => (
                  <Link
                    key={proof.proofId}
                    href={proof.publicUrl ?? "#"}
                    className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3 text-xs font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{proof.mimeType}</span>
                    <span>{formatTimestamp(proof.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </DetailSurface>

          <DetailSurface title="Return">
            {!returnCase ? (
              <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
                No return.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-[22px] bg-system-fill/36 px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-label">
                      {returnStatusLabelMap[returnCase.status] ?? returnCase.status}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                      {formatTimestamp(returnCase.createdAt)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-secondary-label">{returnCase.reason}</div>
                  {returnCase.details ? (
                    <div className="mt-2 text-sm text-secondary-label">{returnCase.details}</div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SurfaceMeta
                    label="Requested"
                    value={formatNgn(returnCase.requestedRefundAmountNgn)}
                  />
                  <SurfaceMeta
                    label="Refund"
                    value={
                      returnCase.approvedRefundAmountNgn !== null
                        ? formatNgn(returnCase.approvedRefundAmountNgn)
                        : "Pending"
                    }
                  />
                </div>

                {returnCase.refundBankName ||
                returnCase.refundAccountName ||
                returnCase.refundAccountNumber ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SurfaceMeta label="Bank" value={returnCase.refundBankName ?? "Pending"} />
                    <SurfaceMeta label="Name" value={returnCase.refundAccountName ?? "Pending"} />
                    <SurfaceMeta
                      label="Number"
                      value={returnCase.refundAccountNumber ?? "Pending"}
                    />
                  </div>
                ) : null}

                {returnCase.status === "requested" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        action: "approved",
                        label: "Approve",
                        note: "Return approved from order detail.",
                      },
                      {
                        action: "rejected",
                        label: "Reject",
                        note: "Return rejected from order detail.",
                      },
                    ].map((item) => (
                      <form key={item.action} action={advanceReturnCaseAction} className="flex">
                        <input type="hidden" name="orderId" value={order.orderId} />
                        <input type="hidden" name="returnCaseId" value={returnCase.returnCaseId} />
                        <input type="hidden" name="action" value={item.action} />
                        <input type="hidden" name="note" value={item.note} />
                        <button
                          type="submit"
                          className="button-secondary min-h-[44px] w-full text-xs font-semibold uppercase tracking-headline"
                        >
                          {item.label}
                        </button>
                      </form>
                    ))}
                  </div>
                ) : null}

                {returnCase.status === "approved" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <form action={advanceReturnCaseAction} className="flex">
                      <input type="hidden" name="orderId" value={order.orderId} />
                      <input type="hidden" name="returnCaseId" value={returnCase.returnCaseId} />
                      <input type="hidden" name="action" value="received" />
                      <input type="hidden" name="note" value="Return received from order detail." />
                      <button
                        type="submit"
                        className="button-secondary min-h-[44px] w-full text-xs font-semibold uppercase tracking-headline"
                      >
                        Received
                      </button>
                    </form>
                    <form action={advanceReturnCaseAction} className="grid gap-2">
                      <input type="hidden" name="orderId" value={order.orderId} />
                      <input type="hidden" name="returnCaseId" value={returnCase.returnCaseId} />
                      <input type="hidden" name="action" value="refunded" />
                      <input type="hidden" name="note" value="Refund sent from order detail." />
                      <input
                        name="refundReference"
                        placeholder="Refund reference"
                        className="min-h-[44px] rounded-[22px] bg-system-fill/42 px-4 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="button-secondary min-h-[44px] w-full text-xs font-semibold uppercase tracking-headline"
                      >
                        Refund
                      </button>
                    </form>
                  </div>
                ) : null}

                {returnCase.status === "received" ? (
                  <form action={advanceReturnCaseAction} className="grid gap-2">
                    <input type="hidden" name="orderId" value={order.orderId} />
                    <input type="hidden" name="returnCaseId" value={returnCase.returnCaseId} />
                    <input type="hidden" name="action" value="refunded" />
                    <input type="hidden" name="note" value="Refund sent from order detail." />
                    <input
                      name="refundReference"
                      placeholder="Refund reference"
                      className="min-h-[44px] rounded-[22px] bg-system-fill/42 px-4 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="button-secondary min-h-[44px] text-xs font-semibold uppercase tracking-headline"
                    >
                      Refund
                    </button>
                  </form>
                ) : null}

                {returnCase.refundReference ? (
                  <SurfaceMeta label="Reference" value={returnCase.refundReference} />
                ) : null}

                {returnCase.resolutionNote ? (
                  <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
                    {returnCase.resolutionNote}
                  </div>
                ) : null}

                <div className="grid gap-2 text-sm text-secondary-label">
                  {returnEvents.length === 0 ? (
                    <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">Quiet.</div>
                  ) : (
                    returnEvents.map((event) => (
                      <div
                        key={event.eventId}
                        className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3"
                      >
                        <span className="text-label">
                          {returnStatusLabelMap[event.action] ?? event.action}
                        </span>
                        <span>{formatTimestamp(event.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </DetailSurface>
        </div>
      </div>
    </div>
  );
}

function DetailSurface({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {title}
        </p>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SurfaceMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}
