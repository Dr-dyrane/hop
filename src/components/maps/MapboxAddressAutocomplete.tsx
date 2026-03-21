"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  searchMapboxAddresses,
  type MapboxAddressSuggestion,
} from "@/lib/mapbox-search";

type Proximity = {
  latitude: number;
  longitude: number;
};

const defaultInputClassName =
  "w-full rounded-[28px] bg-system-fill/80 px-4 py-3 text-sm text-label placeholder:text-secondary-label transition-colors duration-300 focus:bg-system-fill dark:bg-white/[0.05] dark:focus:bg-white/[0.08]";

export function MapboxAddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  name,
  required = false,
  inputClassName = defaultInputClassName,
  className,
  proximity = null,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: MapboxAddressSuggestion) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  inputClassName?: string;
  className?: string;
  proximity?: Proximity | null;
}) {
  const deferredValue = useDeferredValue(value);
  const proximityLatitude = proximity?.latitude ?? null;
  const proximityLongitude = proximity?.longitude ?? null;
  const blurTimeoutRef = useRef<number | null>(null);
  const [suggestions, setSuggestions] = useState<MapboxAddressSuggestion[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      if (!isFocused || deferredValue.trim().length < 3) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const nextSuggestions = await searchMapboxAddresses({
          query: deferredValue,
          proximity:
            proximityLatitude != null && proximityLongitude != null
              ? {
                  latitude: proximityLatitude,
                  longitude: proximityLongitude,
                }
              : null,
        });

        if (!active) {
          return;
        }

        setSuggestions(nextSuggestions);
      } catch {
        if (!active) {
          return;
        }

        setSuggestions([]);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadSuggestions();

    return () => {
      active = false;
    };
  }, [deferredValue, isFocused, proximityLatitude, proximityLongitude]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const showSuggestions = isFocused && suggestions.length > 0;

  return (
    <div className={cn("z-layer-popover relative", className)}>
      <input
        type="text"
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (blurTimeoutRef.current) {
            window.clearTimeout(blurTimeoutRef.current);
          }
          setIsFocused(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => {
            setIsFocused(false);
          }, 120);
        }}
        className={inputClassName}
        placeholder={placeholder}
        autoComplete="street-address"
      />

      {showSuggestions ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-[28px] bg-system-background/96 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
          <div className="space-y-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(suggestion.label);
                  onSelect(suggestion);
                  setIsFocused(false);
                }}
                className="flex w-full items-start gap-3 rounded-[22px] px-4 py-3 text-left transition-colors duration-200 hover:bg-system-fill/46"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-system-fill/60 text-label">
                  <MapPinned className="h-4 w-4" strokeWidth={1.7} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-label">
                    {suggestion.line1}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-secondary-label">
                    {suggestion.label}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isFocused && isLoading && suggestions.length === 0 ? (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          ...
        </div>
      ) : null}
    </div>
  );
}
