import "server-only";

import type { DeliveryRouteEstimate } from "@/lib/db/types";
import { publicEnv } from "@/lib/config/public";

type Coordinates = {
  lat: number;
  lng: number;
};

type CachedEstimate = {
  expiresAt: number;
  value: DeliveryRouteEstimate | null;
};

const ROUTE_CACHE_TTL_MS = 2 * 60 * 1000;
const routeEstimateCache = new Map<string, CachedEstimate>();

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function normalizeCoordinate(value: number) {
  return Math.round(value * 10000) / 10000;
}

function buildCacheKey(origin: Coordinates, destination: Coordinates) {
  return [
    normalizeCoordinate(origin.lat),
    normalizeCoordinate(origin.lng),
    normalizeCoordinate(destination.lat),
    normalizeCoordinate(destination.lng),
  ].join(":");
}

function buildEstimate(input: {
  distanceMeters: number;
  durationSeconds: number;
  source: DeliveryRouteEstimate["source"];
}): DeliveryRouteEstimate {
  const distanceMeters = Math.max(1, Math.round(input.distanceMeters));
  const durationSeconds = Math.max(60, Math.round(input.durationSeconds));

  return {
    distanceMeters,
    distanceKilometers: Number((distanceMeters / 1000).toFixed(1)),
    durationSeconds,
    durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
    source: input.source,
    computedAt: new Date().toISOString(),
  };
}

function getCachedEstimate(key: string) {
  const cached = routeEstimateCache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    routeEstimateCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedEstimate(key: string, value: DeliveryRouteEstimate | null) {
  routeEstimateCache.set(key, {
    expiresAt: Date.now() + ROUTE_CACHE_TTL_MS,
    value,
  });
}

function getFallbackEstimate(origin: Coordinates, destination: Coordinates) {
  const earthRadiusMeters = 6371000;
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(deltaLng / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  const distanceMeters = earthRadiusMeters * centralAngle;

  // Conservative city delivery fallback at roughly 22 km/h.
  const durationSeconds = distanceMeters / 6.11;

  return buildEstimate({
    distanceMeters,
    durationSeconds,
    source: "fallback",
  });
}

async function getMapboxEstimate(origin: Coordinates, destination: Coordinates) {
  const token = publicEnv.mapboxAccessToken;

  if (!token) {
    return null;
  }

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`);
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("overview", "simplified");
  url.searchParams.set("steps", "false");
  url.searchParams.set("access_token", token);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    routes?: Array<{
      distance?: number;
      duration?: number;
    }>;
  };

  const route = payload.routes?.[0];

  if (
    !route ||
    typeof route.distance !== "number" ||
    !Number.isFinite(route.distance) ||
    typeof route.duration !== "number" ||
    !Number.isFinite(route.duration)
  ) {
    return null;
  }

  return buildEstimate({
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    source: "mapbox",
  });
}

export async function getDeliveryRouteEstimate(
  origin: Coordinates | null,
  destination: Coordinates | null
) {
  if (!origin || !destination) {
    return null;
  }

  const key = buildCacheKey(origin, destination);
  const cached = getCachedEstimate(key);

  if (cached) {
    return cached;
  }

  let estimate = null;

  try {
    estimate = await getMapboxEstimate(origin, destination);
  } catch {
    estimate = null;
  }

  if (!estimate) {
    estimate = getFallbackEstimate(origin, destination);
  }

  setCachedEstimate(key, estimate);
  return estimate;
}
