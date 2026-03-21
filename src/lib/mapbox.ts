import { publicEnv } from "@/lib/config/public";

export const MAPBOX_STYLE_LIGHT = "mapbox://styles/mapbox/light-v11";
export const MAPBOX_STYLE_DARK = "mapbox://styles/mapbox/dark-v11";
export const MAPBOX_STATIC_STYLE = "mapbox/light-v11";
export const MAPBOX_DEFAULT_CENTER = {
  latitude: 6.5244,
  longitude: 3.3792,
  zoom: 11,
} as const;

export function hasMapboxAccessToken() {
  return Boolean(publicEnv.mapboxAccessToken);
}

export function buildStaticMapUrl(input: {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
}) {
  if (!hasMapboxAccessToken()) {
    return null;
  }

  const width = input.width ?? 960;
  const height = input.height ?? 540;
  const zoom = input.zoom ?? 13;
  const pin = `pin-s+111111(${input.longitude},${input.latitude})`;

  return `https://api.mapbox.com/styles/v1/${MAPBOX_STATIC_STYLE}/static/${pin}/${input.longitude},${input.latitude},${zoom}/${width}x${height}@2x?access_token=${publicEnv.mapboxAccessToken}`;
}
