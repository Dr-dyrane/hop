"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  hasMapboxAccessToken,
  MAPBOX_DEFAULT_CENTER,
  MAPBOX_STYLE_DARK,
  MAPBOX_STYLE_LIGHT,
} from "@/lib/mapbox";
import {
  reverseMapboxAddress,
  type MapboxAddressSuggestion,
} from "@/lib/mapbox-search";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";
import { useTheme } from "next-themes";

type LocationValue = {
  latitude: number | null;
  longitude: number | null;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

function toCoordinates(
  latitude: number | null,
  longitude: number | null
): Coordinates | null {
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

export function MapboxLocationPicker({
  latitude,
  longitude,
  onChange,
  onResolveAddress,
  className,
  isVisible = true,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (value: LocationValue) => void;
  onResolveAddress?: (address: MapboxAddressSuggestion) => void;
  className?: string;
  isVisible?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const userMarkerRef = useRef<MapboxMarker | null>(null);
  const lastPointRef = useRef<LocationValue>({ latitude, longitude });
  const hasCheckedUserLocationRef = useRef(false);
  const userLocationRef = useRef<Coordinates | null>(null);
  const onChangeRef = useRef(onChange);
  const onResolveAddressRef = useRef(onResolveAddress);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onResolveAddressRef.current = onResolveAddress;
  }, [onResolveAddress]);

  const resolveAddress = useCallback(async (latitudeValue: number, longitudeValue: number) => {
    try {
      const suggestion = await reverseMapboxAddress({
        latitude: latitudeValue,
        longitude: longitudeValue,
      });

      if (suggestion) {
        onResolveAddressRef.current?.(suggestion);
      }
    } catch {
      return;
    }
  }, []);

  const syncMarker = useCallback((
    latitudeValue: number | null,
    longitudeValue: number | null,
    shouldCenter = false
  ) => {
    const coordinates = toCoordinates(latitudeValue, longitudeValue);

    if (!mapRef.current) {
      return;
    }

    if (!coordinates) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      const markerElement = document.createElement("div");
      markerElement.className =
        "h-5 w-5 rounded-full bg-label shadow-[0_12px_30px_rgba(0,0,0,0.22)]";

      void import("mapbox-gl").then(({ default: mapboxgl }) => {
        if (!mapRef.current || markerRef.current) {
          return;
        }

        const marker = new mapboxgl.Marker({
          element: markerElement,
          draggable: true,
        })
          .setLngLat([coordinates.longitude, coordinates.latitude])
          .addTo(mapRef.current);

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          const nextValue = {
            latitude: Number(lngLat.lat.toFixed(6)),
            longitude: Number(lngLat.lng.toFixed(6)),
          };

          lastPointRef.current = nextValue;
          onChangeRef.current(nextValue);
          void resolveAddress(nextValue.latitude, nextValue.longitude);
        });

        markerRef.current = marker;
      });
    } else {
      markerRef.current.setLngLat([coordinates.longitude, coordinates.latitude]);
    }

    if (shouldCenter) {
      mapRef.current.easeTo({
        center: [coordinates.longitude, coordinates.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 14),
        duration: 600,
      });
    }
  }, [resolveAddress]);

  const syncUserMarker = useCallback((
    latitudeValue: number | null,
    longitudeValue: number | null,
    shouldCenter = false
  ) => {
    const coordinates = toCoordinates(latitudeValue, longitudeValue);

    if (!mapRef.current) {
      return;
    }

    if (!coordinates) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    if (!userMarkerRef.current) {
      const markerElement = document.createElement("div");
      markerElement.className = "relative h-5 w-5";
      markerElement.innerHTML =
        '<span class="absolute inset-0 rounded-full bg-[#0A84FF]/28"></span><span class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0A84FF] shadow-[0_0_0_2px_rgba(255,255,255,0.92),0_10px_24px_rgba(10,132,255,0.34)]"></span>';

      void import("mapbox-gl").then(({ default: mapboxgl }) => {
        if (!mapRef.current || userMarkerRef.current) {
          return;
        }

        const marker = new mapboxgl.Marker({
          element: markerElement,
        })
          .setLngLat([coordinates.longitude, coordinates.latitude])
          .addTo(mapRef.current);

        userMarkerRef.current = marker;
      });
    } else {
      userMarkerRef.current.setLngLat([coordinates.longitude, coordinates.latitude]);
    }

    if (shouldCenter) {
      mapRef.current.easeTo({
        center: [coordinates.longitude, coordinates.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 13),
        duration: 600,
      });
    }
  }, []);

  useEffect(() => {
    if (!hasMapboxAccessToken() || !containerRef.current || mapRef.current) {
      return;
    }

    let disposed = false;

    async function bootstrapMap() {
      const { default: mapboxgl } = await import("mapbox-gl");

      if (disposed || !containerRef.current) {
        return;
      }

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

      const initialCoordinates = toCoordinates(latitude, longitude);
      const initialCenter: [number, number] = initialCoordinates
        ? [initialCoordinates.longitude, initialCoordinates.latitude]
        : [MAPBOX_DEFAULT_CENTER.longitude, MAPBOX_DEFAULT_CENTER.latitude];

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: resolvedTheme === "dark" ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT,
        center: initialCenter,
        zoom: initialCoordinates ? 14 : MAPBOX_DEFAULT_CENTER.zoom,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
      mapRef.current = map;

      map.on("click", (event) => {
        const nextValue = {
          latitude: Number(event.lngLat.lat.toFixed(6)),
          longitude: Number(event.lngLat.lng.toFixed(6)),
        };

        lastPointRef.current = nextValue;
        syncMarker(nextValue.latitude, nextValue.longitude);
        onChangeRef.current(nextValue);
        void resolveAddress(nextValue.latitude, nextValue.longitude);
      });

      map.on("load", () => {
        syncMarker(latitude, longitude);
        const liveUserLocation = userLocationRef.current;

        if (liveUserLocation) {
          syncUserMarker(
            liveUserLocation.latitude,
            liveUserLocation.longitude,
            !toCoordinates(latitude, longitude)
          );
        }
      });
    }

    void bootstrapMap();

    return () => {
      disposed = true;
      markerRef.current?.remove();
      markerRef.current = null;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, resolvedTheme, resolveAddress, syncMarker, syncUserMarker]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    mapRef.current.setStyle(
      resolvedTheme === "dark" ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT
    );
  }, [resolvedTheme]);

  useEffect(() => {
    if (!mapRef.current || !isVisible) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      mapRef.current?.resize();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isVisible]);

  useEffect(() => {
    if (!containerRef.current || !mapRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const currentPoint = lastPointRef.current;

    if (
      currentPoint.latitude === latitude &&
      currentPoint.longitude === longitude
    ) {
      return;
    }

    lastPointRef.current = { latitude, longitude };
    syncMarker(latitude, longitude, true);
  }, [latitude, longitude, syncMarker]);

  useEffect(() => {
    syncUserMarker(
      userLocation?.latitude ?? null,
      userLocation?.longitude ?? null,
      !toCoordinates(latitude, longitude)
    );
  }, [latitude, longitude, syncUserMarker, userLocation]);

  const updateUserLocation = useCallback(
    (input: Coordinates, options?: { centerOnly?: boolean; applySelection?: boolean }) => {
      userLocationRef.current = input;
      setUserLocation(input);
      syncUserMarker(input.latitude, input.longitude, options?.centerOnly ?? false);

      if (!options?.applySelection) {
        return;
      }

      lastPointRef.current = input;
      syncMarker(input.latitude, input.longitude, true);
      onChangeRef.current(input);
      void resolveAddress(input.latitude, input.longitude);
    },
    [resolveAddress, syncMarker, syncUserMarker]
  );

  useEffect(() => {
    if (
      hasCheckedUserLocationRef.current ||
      !isVisible ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      return;
    }

    hasCheckedUserLocationRef.current = true;

    if (!("permissions" in navigator) || typeof navigator.permissions?.query !== "function") {
      return;
    }

    let isActive = true;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((permissionStatus) => {
        if (!isActive || permissionStatus.state !== "granted") {
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isActive) {
              return;
            }

            updateUserLocation(
              {
                latitude: Number(position.coords.latitude.toFixed(6)),
                longitude: Number(position.coords.longitude.toFixed(6)),
              },
              { centerOnly: !toCoordinates(latitude, longitude) }
            );
          },
          () => {
            return;
          },
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 300000,
          }
        );
      })
      .catch(() => {
        return;
      });

    return () => {
      isActive = false;
    };
  }, [isVisible, latitude, longitude, updateUserLocation]);

  function handleLocate() {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateUserLocation(
          {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          },
          { applySelection: true }
        );
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
      }
    );
  }

  if (!hasMapboxAccessToken()) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative h-[176px] w-full overflow-hidden rounded-[28px] bg-system-fill/38 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:h-[198px] lg:h-[184px]",
        className
      )}
    >
      <div ref={containerRef} className="mapbox-shell h-full w-full" />

      <button
        type="button"
        onClick={handleLocate}
        disabled={isLocating}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-system-background/90 text-label shadow-[0_16px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl disabled:opacity-50"
        aria-label="Use current location"
      >
        <LocateFixed className="h-4 w-4" strokeWidth={1.9} />
      </button>
    </div>
  );
}
