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
