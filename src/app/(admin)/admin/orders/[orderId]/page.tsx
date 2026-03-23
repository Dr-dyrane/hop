import Link from "next/link";
import { AdminOrderActions } from "@/components/admin/orders/AdminOrderActions";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import {
  getLatestOrderReturnCase,
  listOrderReturnCaseItems,
  listOrderReturnEvents,
  listOrderReturnProofs,
} from "@/lib/db/repositories/order-returns-repository";
import {
  getAdminOrderDetail,
  getAdminOrderInventoryReadiness,
  listOrderStatusEvents,
  listPaymentProofs,
  listPaymentReviewEvents,
} from "@/lib/db/repositories/orders-repository";
import {
  getOrderReview,
  getOrderReviewRequest,
} from "@/lib/db/repositories/review-repository";
import {
  formatPaymentReviewActionLabel,
  getOrderStagePresentation,
  getPaymentStatusPresentation,
} from "@/lib/orders/presentation";
import { advanceReturnCaseAction } from "./actions";

const RETURN_STATUS_LABELS: Record<string, string> = {
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

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ");
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
      <OrderDetailView
        order={null}
        timeline={[]}
        proofs={[]}
        reviewRequest={null}
        review={null}
        returnCase={null}
        returnItems={[]}
        returnEvents={[]}
        returnProofs={[]}
        backHref="/admin/orders"
        viewerRole="admin"
      />
    );
  }

  const adminActor = {
    email: session.email,
    role: "admin" as const,
  };

  const [
    timeline,
    paymentReviews,
    proofs,
    reviewRequest,
    review,
    returnCase,
    returnEvents,
    returnProofs,
    requestReadiness,
  ] = await Promise.all([
    listOrderStatusEvents(orderId, adminActor),
    order.paymentId ? listPaymentReviewEvents(order.paymentId, session.email) : [],
    order.paymentId ? listPaymentProofs(order.paymentId, adminActor) : [],
    getOrderReviewRequest(orderId, adminActor),
    getOrderReview(orderId, adminActor),
    getLatestOrderReturnCase(orderId, adminActor),
    listOrderReturnEvents(orderId, adminActor),
    listOrderReturnProofs(orderId, adminActor),
    order.status === "checkout_draft"
      ? getAdminOrderInventoryReadiness(orderId, session.email)
      : Promise.resolve(null),
  ]);

  const returnItems = returnCase
    ? await listOrderReturnCaseItems(returnCase.returnCaseId, adminActor)
    : [];
  const stage = getOrderStagePresentation(order);
  const paymentState = getPaymentStatusPresentation(
    order.payment?.status ?? order.paymentStatus
  );
  const paymentActions = availablePaymentActions(
    order.payment?.status ?? order.paymentStatus
  );
  const isRequestPending = order.status === "checkout_draft";

  return (
    <div className="space-y-5">
      <section className="rounded-[30px] bg-system-fill/34 p-4 shadow-soft md:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Admin controls
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-label">
              #{order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-secondary-label">
              {order.customerName} - {order.customerPhone}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetaPill label="Stage" value={stage.label} />
            <MetaPill label="Payment" value={paymentState.label} />
            <MetaPill
              label="Due"
              value={formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn)}
            />
            <MetaPill label="Proofs" value={`${proofs.length}`} />
          </div>
        </div>

        <div className="mt-4">
          <AdminOrderActions
            orderId={order.orderId}
            paymentId={order.paymentId}
            isRequestPending={isRequestPending}
            requestReadiness={requestReadiness}
            paymentActions={paymentActions}
            canCancel={canCancelOrder(order)}
          />
        </div>

        {requestReadiness ? (
          <div className="mt-4 rounded-[22px] bg-system-fill/42 px-4 py-3 text-sm text-secondary-label">
            {requestReadiness.summary}
          </div>
        ) : null}
      </section>

      {paymentReviews.length > 0 ? (
        <section className="rounded-[30px] bg-system-fill/28 p-4 shadow-soft md:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            Payment checks
          </p>
          <div className="mt-3 grid gap-2">
            {paymentReviews.map((entry) => (
              <article
                key={entry.eventId}
                className="rounded-[20px] bg-system-fill/44 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-label">
                    {formatPaymentReviewActionLabel(entry.action)}
                  </span>
                  <span className="text-secondary-label">
                    {formatTimestamp(entry.createdAt)}
                  </span>
                </div>
                {entry.note ? (
                  <p className="mt-1 text-xs text-secondary-label">{entry.note}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <AdminReturnCasePanel
        orderId={order.orderId}
        returnCase={returnCase}
        returnItems={returnItems}
        returnEvents={returnEvents}
        returnProofs={returnProofs}
      />

      <OrderDetailView
        order={order}
        timeline={timeline}
        proofs={proofs}
        reviewRequest={reviewRequest}
        review={review}
        returnCase={returnCase}
        returnItems={returnItems}
        returnEvents={returnEvents}
        returnProofs={returnProofs}
        backHref="/admin/orders"
        viewerRole="admin"
      />
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[color:var(--surface)]/82 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}

function AdminReturnCasePanel({
  orderId,
  returnCase,
  returnItems,
  returnEvents,
  returnProofs,
}: {
  orderId: string;
  returnCase: Awaited<ReturnType<typeof getLatestOrderReturnCase>>;
  returnItems: Awaited<ReturnType<typeof listOrderReturnCaseItems>>;
  returnEvents: Awaited<ReturnType<typeof listOrderReturnEvents>>;
  returnProofs: Awaited<ReturnType<typeof listOrderReturnProofs>>;
}) {
  if (!returnCase) {
    return null;
  }

  return (
    <section className="rounded-[30px] bg-system-fill/28 p-4 shadow-soft md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            Return case
          </p>
          <h2 className="mt-1 text-base font-semibold text-label">
            {RETURN_STATUS_LABELS[returnCase.status] ?? formatStatusLabel(returnCase.status)}
          </h2>
          <p className="mt-1 text-sm text-secondary-label">{returnCase.reason}</p>
          {returnCase.details ? (
            <p className="mt-1 text-sm text-secondary-label">{returnCase.details}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-system-fill/52 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          {formatTimestamp(returnCase.createdAt)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetaPill
          label="Requested"
          value={formatNgn(returnCase.requestedRefundAmountNgn)}
        />
        <MetaPill
          label="Refund"
          value={
            returnCase.approvedRefundAmountNgn !== null
              ? formatNgn(returnCase.approvedRefundAmountNgn)
              : "Pending"
          }
        />
        <MetaPill label="Bank" value={returnCase.refundBankName ?? "Pending"} />
        <MetaPill label="Account" value={returnCase.refundAccountNumber ?? "Pending"} />
      </div>

      {returnItems.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {returnItems.map((item) => (
            <article
              key={item.returnItemId}
              className="flex items-center justify-between gap-4 rounded-[20px] bg-system-fill/44 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-label">{item.title}</p>
                <p className="text-xs text-secondary-label">
                  {item.quantity} x {formatNgn(item.unitPriceNgn)}
                </p>
              </div>
              <p className="text-sm font-medium text-label">{formatNgn(item.lineTotalNgn)}</p>
            </article>
          ))}
        </div>
      ) : null}

      {returnProofs.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {returnProofs.map((proof) => (
            <Link
              key={proof.proofId}
              href={proof.publicUrl ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-4 rounded-[20px] bg-system-fill/44 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-secondary-label transition-colors duration-200 hover:text-label"
            >
              <span>{proof.mimeType}</span>
              <span>{formatTimestamp(proof.createdAt)}</span>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {returnCase.status === "requested" ? (
          <>
            <form action={advanceReturnCaseAction} className="flex">
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="returnCaseId" value={returnCase.returnCaseId} />
              <input type="hidden" name="action" value="approved" />
              <input type="hidden" name="note" value="Return approved from order detail." />
              <button
                type="submit"
                className="button-secondary min-h-[44px] w-full text-xs font-semibold uppercase tracking-headline"
              >
                Approve return
              </button>
            </form>
            <form action={advanceReturnCaseAction} className="flex">
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="returnCaseId" value={returnCase.returnCaseId} />
              <input type="hidden" name="action" value="rejected" />
              <input type="hidden" name="note" value="Return rejected from order detail." />
              <button
                type="submit"
                className="min-h-[44px] w-full rounded-full bg-system-fill/56 px-4 text-xs font-semibold uppercase tracking-headline text-red-500 transition-colors duration-200 hover:bg-system-fill/76"
              >
                Reject return
              </button>
            </form>
          </>
        ) : null}

        {returnCase.status === "approved" ? (
          <>
            <form action={advanceReturnCaseAction} className="flex">
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="returnCaseId" value={returnCase.returnCaseId} />
              <input type="hidden" name="action" value="received" />
              <input type="hidden" name="note" value="Return received from order detail." />
              <button
                type="submit"
                className="button-secondary min-h-[44px] w-full text-xs font-semibold uppercase tracking-headline"
              >
                Mark received
              </button>
            </form>
            <form action={advanceReturnCaseAction} className="grid gap-2">
              <input type="hidden" name="orderId" value={orderId} />
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
                Mark refunded
              </button>
            </form>
          </>
        ) : null}

        {returnCase.status === "received" ? (
          <form action={advanceReturnCaseAction} className="grid gap-2 sm:col-span-2">
            <input type="hidden" name="orderId" value={orderId} />
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
              Mark refunded
            </button>
          </form>
        ) : null}
      </div>

      {returnCase.refundReference ? (
        <div className="mt-2 rounded-[20px] bg-system-fill/44 px-4 py-3 text-sm text-secondary-label">
          Refund reference: {returnCase.refundReference}
        </div>
      ) : null}

      <div className="mt-3 grid gap-2">
        {returnEvents.map((event) => (
          <article
            key={event.eventId}
            className="flex items-center justify-between gap-4 rounded-[20px] bg-system-fill/44 px-4 py-3"
          >
            <span className="text-sm font-medium text-label">
              {RETURN_STATUS_LABELS[event.action] ?? formatStatusLabel(event.action)}
            </span>
            <span className="text-xs text-secondary-label">
              {formatTimestamp(event.createdAt)}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
