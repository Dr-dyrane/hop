import { buildStaticMapUrl } from "@/lib/mapbox";

export function getTrackingCoords(snapshot: Record<string, unknown>) {
  const latitudeCandidates = [snapshot.latitude, snapshot.lat];
  const longitudeCandidates = [snapshot.longitude, snapshot.lng];
  const lat =
    latitudeCandidates.find((value) => typeof value === "number") ?? null;
  const lng =
    longitudeCandidates.find((value) => typeof value === "number") ?? null;

  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng };
  }

  return null;
}

export function buildTrackingMapUrl(input: {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
}) {
  return buildStaticMapUrl(input);
}

export function getTrackingFreshness(recordedAt: string | null) {
  if (!recordedAt) {
    return {
      label: "No signal",
      tone: "muted" as const,
      ageMinutes: null,
    };
  }

  const ageMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(recordedAt).getTime()) / 60000)
  );

  if (ageMinutes <= 3) {
    return {
      label: "Live",
      tone: "live" as const,
      ageMinutes,
    };
  }

  if (ageMinutes <= 15) {
    return {
      label: "Recent",
      tone: "recent" as const,
      ageMinutes,
    };
  }

  return {
    label: "Stale",
    tone: "stale" as const,
    ageMinutes,
  };
}

export function formatRouteDuration(minutes: number | null | undefined) {
  if (minutes == null || !Number.isFinite(minutes)) {
    return "Waiting";
  }

  const roundedMinutes = Math.max(1, Math.round(minutes));

  if (roundedMinutes < 60) {
    return `${roundedMinutes} min`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

export function formatRouteDistance(kilometers: number | null | undefined) {
  if (kilometers == null || !Number.isFinite(kilometers)) {
    return "Waiting";
  }

  if (kilometers < 1) {
    return `${Math.max(50, Math.round(kilometers * 1000))} m`;
  }

  const precision = kilometers < 10 ? 1 : 0;
  return `${kilometers.toFixed(precision)} km`;
}
