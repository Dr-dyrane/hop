import Image from "next/image";
import Link from "next/link";
import { PaymentProofUploadCard } from "@/components/orders/PaymentProofUploadCard";
import { formatNgn } from "@/lib/commerce";
import type {
  OrderStatusEventRow,
  PaymentProofRow,
  PortalOrderDetail,
} from "@/lib/db/types";

const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

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

function buildMapUrl(lat: number, lng: number) {
  if (!mapToken) {
    return null;
  }

  const style = "mapbox/light-v10";
  const pin = `pin-s+0f0(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/${style}/static/${pin}/${lng},${lat},14/600x300@2x?access_token=${mapToken}`;
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

function StatusChip({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
      {formatStatusLabel(value)}
    </span>
  );
}

export function OrderDetailView({
  order,
  timeline,
  proofs,
  backHref,
  accessToken,
}: {
  order: PortalOrderDetail | null;
  timeline: OrderStatusEventRow[];
  proofs: PaymentProofRow[];
  backHref: string;
  accessToken?: string;
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
  const mapSrc = coords ? buildMapUrl(coords.lat, coords.lng) : null;

  return (
    <div className="space-y-6">
      <section className="glass-morphism rounded-[36px] bg-system-background/86 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Order
            </p>
            <h2 className="text-3xl font-semibold tracking-title text-label">
              #{order.orderNumber}
            </h2>
            <div className="flex flex-wrap gap-2">
              <StatusChip value={order.status} />
              <StatusChip value={order.paymentStatus} />
              <StatusChip value={order.fulfillmentStatus} />
            </div>
          </div>

          <div className="grid gap-3 text-right text-sm text-secondary-label">
            <div>
              <div className="font-semibold text-label">{formatNgn(order.totalNgn)}</div>
              <div>{formatTimestamp(order.placedAt)}</div>
            </div>
            <div>
              <div className="font-semibold text-label">{order.transferReference}</div>
              <div>
                {order.transferDeadlineAt
                  ? formatTimestamp(order.transferDeadlineAt)
                  : "No deadline"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Transfer
            </p>
            <div className="text-lg font-semibold tracking-tight text-label">
              {formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn)}
            </div>
            <div className="grid gap-1 text-sm">
              <div className="text-secondary-label">
                {order.payment?.bankName ?? "Bank pending"}
              </div>
              <div className="text-label">
                {order.payment?.accountName ?? "Account pending"}
              </div>
              <div className="text-xl font-semibold tracking-tight text-label">
                {order.payment?.accountNumber ?? "Pending"}
              </div>
            </div>
            {order.payment?.instructions ? (
              <div className="text-sm text-secondary-label">
                {order.payment.instructions}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Delivery
            </p>
            <div className="text-sm text-label">
              {getDeliveryLine(order.deliveryAddressSnapshot)}
            </div>
            <div className="text-sm text-secondary-label">{order.customerPhone}</div>
            {order.notes ? (
              <div className="text-sm text-secondary-label">{order.notes}</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Items
        </p>
        <div className="mt-4 grid gap-3">
          {order.items.map((item) => (
            <div
              key={`${item.sku}-${item.title}`}
              className="rounded-[24px] bg-system-fill/70 p-4 text-sm text-secondary-label"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-label">{item.title}</div>
                <div className="text-right">
                  <div className="text-label">
                    {item.quantity} x {formatNgn(item.unitPriceNgn)}
                  </div>
                  <div>{formatNgn(item.lineTotalNgn)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Proof
          </p>
          <span className="text-xs text-secondary-label">
            {order.payment?.status ? formatStatusLabel(order.payment.status) : "Pending"}
          </span>
        </div>

        <PaymentProofUploadCard
          orderId={order.orderId}
          paymentId={order.paymentId}
          accessToken={accessToken}
        />

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
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Timeline
        </p>
        <div className="mt-4 grid gap-2 text-sm text-secondary-label">
          {timeline.length === 0 ? (
            <div>No updates.</div>
          ) : (
            timeline.map((event) => (
              <div
                key={event.eventId}
                className="flex items-center justify-between gap-4"
              >
                <span>{formatStatusLabel(event.toStatus)}</span>
                <span>{formatTimestamp(event.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {mapSrc ? (
        <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Tracking
          </p>
          <div className="mt-4 overflow-hidden rounded-[28px]">
            <Image
              src={mapSrc}
              alt="Delivery location"
              width={600}
              height={300}
              className="h-auto w-full"
              priority
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
