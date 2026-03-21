import { publicEnv } from "@/lib/config/public";

export type MapboxAddressSuggestion = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  latitude: number;
  longitude: number;
};

type MapboxFeature = {
  id: string;
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    full_address?: string;
    name?: string;
    place_formatted?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
    context?: {
      address?: {
        name?: string;
      };
      street?: {
        name?: string;
      };
      place?: {
        name?: string;
      };
      locality?: {
        name?: string;
      };
      neighborhood?: {
        name?: string;
      };
      region?: {
        name?: string;
      };
      postcode?: {
        name?: string;
      };
      country?: {
        country_code?: string;
      };
    };
  };
};

type GeocodeResponse = {
  features?: MapboxFeature[];
};

function getMapboxAccessToken() {
  return publicEnv.mapboxAccessToken;
}

function hasFeatureCoordinates(feature: MapboxFeature) {
  const latitude =
    feature.properties?.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  const longitude =
    feature.properties?.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];

  if (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude)
  ) {
    return {
      latitude,
      longitude,
    };
  }

  return null;
}

function normalizeSuggestion(feature: MapboxFeature): MapboxAddressSuggestion | null {
  const coordinates = hasFeatureCoordinates(feature);

  if (!coordinates) {
    return null;
  }

  const properties = feature.properties;
  const context = properties?.context;
  const line1 =
    context?.address?.name ??
    properties?.name ??
    properties?.full_address ??
    "";
  const city =
    context?.place?.name ??
    context?.locality?.name ??
    context?.neighborhood?.name ??
    "";
  const state = context?.region?.name ?? "";
  const postalCode = context?.postcode?.name ?? "";
  const countryCode = context?.country?.country_code?.toUpperCase() ?? "";
  const label = properties?.full_address ?? [line1, properties?.place_formatted].filter(Boolean).join(", ");

  if (!label || !line1) {
    return null;
  }

  return {
    id: feature.id,
    label,
    line1,
    city,
    state,
    postalCode,
    countryCode,
    latitude: Number(coordinates.latitude.toFixed(6)),
    longitude: Number(coordinates.longitude.toFixed(6)),
  };
}

async function readGeocodeResponse(url: URL) {
  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Map search unavailable.");
  }

  return (await response.json()) as GeocodeResponse;
}

export async function searchMapboxAddresses(input: {
  query: string;
  proximity?: {
    latitude: number;
    longitude: number;
  } | null;
}) {
  const token = getMapboxAccessToken();
  const query = input.query.trim();

  if (!token || query.length < 3) {
    return [] as MapboxAddressSuggestion[];
  }

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", token);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("permanent", "true");
  url.searchParams.set("country", "NG");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "5");
  url.searchParams.set("types", "address,street,place,locality,neighborhood");

  if (input.proximity) {
    url.searchParams.set(
      "proximity",
      `${input.proximity.longitude},${input.proximity.latitude}`
    );
  }

  const payload = await readGeocodeResponse(url);

  return (payload.features ?? [])
    .map((feature) => normalizeSuggestion(feature))
    .filter((feature): feature is MapboxAddressSuggestion => feature !== null);
}

export async function reverseMapboxAddress(input: {
  latitude: number;
  longitude: number;
}) {
  const token = getMapboxAccessToken();

  if (!token) {
    return null;
  }

  const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  url.searchParams.set("latitude", String(input.latitude));
  url.searchParams.set("longitude", String(input.longitude));
  url.searchParams.set("access_token", token);
  url.searchParams.set("permanent", "true");
  url.searchParams.set("language", "en");
  url.searchParams.set("country", "NG");

  const payload = await readGeocodeResponse(url);

  for (const feature of payload.features ?? []) {
    const normalized = normalizeSuggestion(feature);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}
