import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, CreditCard, Truck } from "lucide-react";
import { PaymentProofUploadCard } from "@/components/orders/PaymentProofUploadCard";
import { OrderReviewCard } from "@/components/orders/OrderReviewCard";
import { OrderReturnRequestCard } from "@/components/orders/OrderReturnRequestCard";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { QuietValueStrip } from "@/components/ui/QuietValueStrip";
import { formatNgn } from "@/lib/commerce";
import type {
  OrderReturnCaseRow,
  OrderReturnCaseItemRow,
  OrderReturnEventRow,
  OrderReturnProofRow,
  OrderReviewRequestRow,
  OrderReviewRow,
  OrderStatusEventRow,
  PaymentProofRow,
  PortalOrderDetail,
} from "@/lib/db/types";
import {
  formatFlowStatusLabel,
  getOrderStagePresentation,
  getPaymentStatusPresentation,
} from "@/lib/orders/presentation";
import { buildStaticMapUrl } from "@/lib/mapbox";

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

function getTrackingCoords(snapshot: Record<string, unknown>) {
  const latCandidates = ["latitude", "lat"];
  const lngCandidates = ["longitude", "lng"];

  const lat =
    latCandidates
      .map((key) => snapshot[key])
      .find((value) => typeof value === "number") ?? null;
  const lng =
    lngCandidates
      .map((key) => snapshot[key])
      .find((value) => typeof value === "number") ?? null;

  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng };
  }

  return null;
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

const STAGE_ICONS = {
  requested: Clock3,
  awaiting_transfer: CreditCard,
  money_sent: CreditCard,
  preparing: CheckCircle2,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
  cancelled: Clock3,
  expired: Clock3,
} as const;

export function OrderDetailView({
  order,
  timeline,
  proofs,
  reviewRequest,
  review,
  returnCase,
  returnItems,
  returnEvents,
  returnProofs,
  backHref,
  accessToken,
  trackingHref,
}: {
  order: PortalOrderDetail | null;
  timeline: OrderStatusEventRow[];
  proofs: PaymentProofRow[];
  reviewRequest: OrderReviewRequestRow | null;
  review: OrderReviewRow | null;
  returnCase: OrderReturnCaseRow | null;
  returnItems: OrderReturnCaseItemRow[];
  returnEvents: OrderReturnEventRow[];
  returnProofs: OrderReturnProofRow[];
  backHref: string;
  accessToken?: string;
  trackingHref?: string | null;
}) {
  if (!order) {
    return (
      <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
        Order not found.
        <div className="mt-4">
          <Link
            href={backHref}
            className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  const coords = getTrackingCoords(order.deliveryAddressSnapshot);
  const mapSrc = coords
    ? buildStaticMapUrl({
        latitude: coords.lat,
        longitude: coords.lng,
        width: 600,
        height: 300,
        zoom: 14,
      })
    : null;
  const stage = getOrderStagePresentation(order);
  const paymentState = getPaymentStatusPresentation(order.payment?.status ?? order.paymentStatus);
  const StageIcon = STAGE_ICONS[stage.key];
  const isRequestPending = order.status === "checkout_draft";

  return (
    <div className="space-y-6">
      <WorkspaceContextPanel
        title={`#${order.orderNumber}`}
        detail={formatNgn(order.totalNgn)}
        tags={[{ label: stage.label, tone: stage.tone }]}
        meta={[
          {
            label: "Placed",
            value: formatTimestamp(order.placedAt),
          },
          {
            label: "Ref",
            value: isRequestPending ? "Pending" : order.transferReference,
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
              : order.payment?.status
                ? paymentState.label
                : "Pending",
          },
          {
            label: "Deadline",
            value: isRequestPending
              ? "Pending"
              : order.transferDeadlineAt
              ? formatTimestamp(order.transferDeadlineAt)
              : "Open",
          },
          {
            label: "Items",
            value: `${order.items.length}`,
            detail: `${order.items.reduce((total, item) => total + item.quantity, 0)} units`,
          },
          {
            label: "Proofs",
            value: `${proofs.length}`,
            detail: isRequestPending ? "Locked" : proofs.length > 0 ? "Received" : "Waiting",
          },
        ]}
        columns={4}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="space-y-4">
          <OrderSurface
            title="Transfer"
            action={
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                <StageIcon className="h-4 w-4" strokeWidth={1.8} />
                <span>{stage.label}</span>
              </div>
            }
          >
            {isRequestPending ? (
              <div className="space-y-3">
                <div className="text-[28px] font-semibold tracking-tight text-label">
                  {formatNgn(order.totalNgn)}
                </div>
                <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label">
                  Transfer details will appear here after approval.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-[28px] font-semibold tracking-tight text-label">
                  {formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn)}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SurfaceMeta
                    label="Bank"
                    value={order.payment?.bankName ?? "Pending"}
                  />
                  <SurfaceMeta
                    label="Name"
                    value={order.payment?.accountName ?? "Pending"}
                  />
                </div>
                <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    Number
                  </div>
                  <div className="mt-2 text-[26px] font-semibold tracking-tight text-label">
                    {order.payment?.accountNumber ?? "Pending"}
                  </div>
                  {order.payment?.instructions ? (
                    <div className="mt-2 text-sm text-secondary-label">
                      {order.payment.instructions}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </OrderSurface>

          <OrderSurface title="Items">
            <div className="grid gap-3">
              {order.items.map((item) => (
                <div
                  key={`${item.sku}-${item.title}`}
                  className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-label">{item.title}</div>
                      <div className="mt-1 text-xs">
                        {item.quantity} x {formatNgn(item.unitPriceNgn)}
                      </div>
                      {item.returnedQuantity > 0 ? (
                        <div className="mt-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                          {item.returnedQuantity} returned
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right font-medium text-label">
                      {formatNgn(item.lineTotalNgn)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </OrderSurface>
        </div>

        <div className="space-y-4">
          <OrderSurface
            title="Delivery Address"
            action={
              trackingHref &&
              ["ready_for_dispatch", "out_for_delivery", "delivered"].includes(
                order.fulfillmentStatus
              ) ? (
                <Link
                  href={trackingHref}
                  className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
                >
                  Track
                </Link>
              ) : null
            }
          >
            <div className="space-y-3 text-sm text-secondary-label">
              <div className="text-label">{getDeliveryLine(order.deliveryAddressSnapshot)}</div>
              <div>{order.customerPhone}</div>
              {order.notes ? <div>{order.notes}</div> : null}
            </div>
          </OrderSurface>

          <OrderSurface
            title={order.paymentId ? "Money Sent" : "Payment"}
            action={
              <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                {stage.detail}
              </span>
            }
          >
            {order.paymentId ? (
              <PaymentProofUploadCard
                orderId={order.orderId}
                paymentId={order.paymentId}
                accessToken={accessToken}
                paymentStatus={order.payment?.status ?? order.paymentStatus}
              />
            ) : (
              <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
                Available after approval.
              </div>
            )}

            {proofs.length > 0 ? (
              <div className="mt-4 grid gap-2 text-xs text-secondary-label">
                {proofs.map((proof) => (
                  <Link
                    key={proof.proofId}
                    href={proof.publicUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-4 hover:text-label"
                  >
                    {formatTimestamp(proof.createdAt)}
                  </Link>
                ))}
              </div>
            ) : null}
          </OrderSurface>

          {returnCase || order.status === "delivered" ? (
            <OrderSurface
              title="Return"
              action={
                returnCase ? (
                  <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    {formatStatusLabel(returnCase.status)}
                  </span>
                ) : null
              }
            >
              <OrderReturnRequestCard
                orderId={order.orderId}
                accessToken={accessToken}
                orderStatus={order.status}
                returnCase={returnCase}
                items={order.items}
                returnEvents={returnEvents}
                proofs={returnProofs}
              />
            </OrderSurface>
          ) : null}

          {order.status === "delivered" || reviewRequest || review ? (
            <OrderSurface
              title="Rating"
              action={
                review ? (
                  <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    {formatStatusLabel(review.status)}
                  </span>
                ) : null
              }
            >
              <OrderReviewCard
                orderId={order.orderId}
                accessToken={accessToken}
                orderStatus={order.status}
                reviewRequest={reviewRequest}
                review={review}
              />
            </OrderSurface>
          ) : null}

          <OrderSurface title="Updates">
            <div className="grid gap-2 text-sm text-secondary-label">
              {timeline.length === 0 ? (
                <div>Waiting.</div>
              ) : (
                timeline.map((event) => (
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
          </OrderSurface>

          {mapSrc ? (
            <OrderSurface title="Map">
              <div className="overflow-hidden rounded-[26px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mapSrc}
                  alt="Delivery location"
                  className="h-auto w-full"
                  loading="lazy"
                />
              </div>
            </OrderSurface>
          ) : null}

          {returnItems.length > 0 ? (
            <OrderSurface title="Return Items">
              <div className="grid gap-2 text-sm text-secondary-label">
                {returnItems.map((item) => (
                  <div
                    key={item.returnItemId}
                    className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-label">{item.title}</div>
                      <div className="mt-1 text-xs text-secondary-label">
                        {item.quantity} x {formatNgn(item.unitPriceNgn)}
                      </div>
                    </div>
                    <div className="shrink-0 font-medium text-label">
                      {formatNgn(item.lineTotalNgn)}
                    </div>
                  </div>
                ))}
              </div>
            </OrderSurface>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderSurface({
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
