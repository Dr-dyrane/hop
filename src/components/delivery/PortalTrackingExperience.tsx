"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { QuietValueStrip } from "@/components/ui/QuietValueStrip";
import { useSseResource } from "@/hooks/useSseResource";
import type { PortalTrackingSnapshot } from "@/lib/db/types";
import {
  buildTrackingMapUrl,
  formatRouteDistance,
  formatRouteDuration,
  getTrackingCoords,
  getTrackingFreshness,
} from "@/lib/delivery/tracking";

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

function buildStatusTag(value: string) {
  return { label: formatStatusLabel(value) };
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

export function PortalTrackingExperience({
  initialSnapshot,
  pollUrl,
  streamUrl,
  backHref,
}: {
  initialSnapshot: PortalTrackingSnapshot;
  pollUrl: string;
  streamUrl: string;
  backHref?: string;
}) {
  const { data: snapshot, error } = useSseResource<PortalTrackingSnapshot>({
    initialData: initialSnapshot,
    event: "tracking",
    streamUrl,
    fallbackUrl: pollUrl,
  });

  const mapCoords = snapshot.latestPoint
    ? {
        lat: snapshot.latestPoint.latitude,
        lng: snapshot.latestPoint.longitude,
      }
    : snapshot.trackingEnabled
      ? getTrackingCoords(snapshot.deliveryAddressSnapshot)
      : null;
  const mapSrc = mapCoords
    ? buildTrackingMapUrl({
        latitude: mapCoords.lat,
        longitude: mapCoords.lng,
        width: 960,
        height: 540,
        zoom: snapshot.latestPoint ? 14 : 12,
      })
    : null;
  const freshness = getTrackingFreshness(snapshot.latestPoint?.recordedAt ?? null);
  const freshnessTone =
    freshness.tone === "live" ? "success" : freshness.tone === "muted" ? "muted" : "default";
  const etaLabel = snapshot.routeEstimate
    ? formatRouteDuration(snapshot.routeEstimate.durationMinutes)
    : snapshot.latestPoint
      ? "Calculating"
      : "Waiting";
  const distanceLabel = snapshot.routeEstimate
    ? formatRouteDistance(snapshot.routeEstimate.distanceKilometers)
    : snapshot.latestPoint
      ? "Calculating"
      : "Waiting";

  return (
    <div className="space-y-6 pb-20">
      <WorkspaceContextPanel
        title={`#${snapshot.orderNumber}`}
        detail={getDeliveryLine(snapshot.deliveryAddressSnapshot)}
        tags={[
          buildStatusTag(snapshot.fulfillmentStatus),
          ...(snapshot.assignmentStatus ? [buildStatusTag(snapshot.assignmentStatus)] : []),
          {
            label: snapshot.trackingEnabled ? freshness.label : "tracking off",
            tone: snapshot.trackingEnabled ? freshnessTone : "muted",
          },
        ]}
        meta={[
          {
            label: "Update",
            value: formatTimestamp(snapshot.latestPoint?.recordedAt ?? null),
          },
          {
            label: "Contact",
            value: snapshot.customerPhone,
          },
        ]}
        actions={
          <Link
            href={backHref ?? `/account/orders/${snapshot.orderId}`}
            className="flex min-h-[40px] items-center rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
          >
            View order
          </Link>
        }
      />

      <QuietValueStrip
        items={[
          {
            label: "Signal",
            value: snapshot.trackingEnabled ? freshness.label : "Off",
            detail: snapshot.trackingEnabled
              ? freshness.ageMinutes == null
                ? "Waiting"
                : `${freshness.ageMinutes} min ago`
              : "Paused",
          },
          {
            label: "ETA",
            value: etaLabel,
            detail: snapshot.routeEstimate
              ? snapshot.routeEstimate.source === "mapbox"
                ? "Route"
                : "Estimate"
              : snapshot.latestPoint
                ? "Route"
                : "Pending",
          },
          {
            label: "Distance",
            value: distanceLabel,
            detail: snapshot.latestPoint ? "To stop" : "Waiting",
          },
          {
            label: "Rider",
            value: snapshot.riderName ?? "Pending",
            detail: snapshot.riderVehicleType ?? "Assignment pending",
          },
        ]}
        columns={4}
      />

      <section className="grid gap-4 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <TrackingSurface title="Map">
          {mapSrc ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-[26px]">
                <Image
                  src={mapSrc}
                  alt={`Tracking map for order ${snapshot.orderNumber}`}
                  width={960}
                  height={540}
                  className="h-auto w-full"
                  priority
                />
              </div>
              <div className="grid gap-3 rounded-[22px] bg-system-fill/36 px-4 py-4 text-sm text-secondary-label sm:grid-cols-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    ETA
                  </div>
                  <div className="mt-1 font-medium text-label">{etaLabel}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    Distance
                  </div>
                  <div className="mt-1 font-medium text-label">{distanceLabel}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    Update
                  </div>
                  <div className="mt-1 font-medium text-label">
                    {formatTimestamp(snapshot.latestPoint?.recordedAt ?? null)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-[26px] bg-system-fill/42 text-sm text-secondary-label">
              {snapshot.trackingEnabled ? "Waiting." : "Tracking is off."}
            </div>
          )}
        </TrackingSurface>

        <div className="space-y-4">
          <TrackingSurface title="Delivery">
            <div className="space-y-3 text-sm text-secondary-label">
              <div className="text-label">{getDeliveryLine(snapshot.deliveryAddressSnapshot)}</div>
              <div>{snapshot.customerName}</div>
              <div>{snapshot.customerPhone}</div>
              {snapshot.riderPhone ? (
                <div className="text-label">{snapshot.riderPhone}</div>
              ) : null}
            </div>
          </TrackingSurface>

          <TrackingSurface title="Updates">
            <div className="space-y-3">
              {snapshot.events.length === 0 ? (
                <p className="text-sm text-secondary-label">Waiting.</p>
              ) : (
                snapshot.events.map((event) => (
                  <div
                    key={event.eventId}
                    className="rounded-[22px] bg-system-fill/36 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-label">
                          {formatStatusLabel(event.eventType)}
                        </p>
                        {event.note ? (
                          <p className="mt-1 text-xs text-secondary-label">{event.note}</p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-[11px] text-secondary-label">
                        {formatTimestamp(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TrackingSurface>
        </div>
      </section>

      {error ? <p className="text-xs text-secondary-label">{error}</p> : null}
    </div>
  );
}

function TrackingSurface({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[32px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {title}
      </p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
