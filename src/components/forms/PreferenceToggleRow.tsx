"use client";

import { cn } from "@/lib/utils";

export function PreferenceToggleRow({
  label,
  value,
  onChange,
  detail,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (nextValue: boolean) => void;
  detail?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={cn(
        "flex min-h-[56px] w-full items-center justify-between gap-4 rounded-[22px] bg-system-fill/42 px-4 text-left transition-colors duration-200 hover:bg-system-fill/56",
        disabled && "pointer-events-none opacity-50"
      )}
      aria-pressed={value}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-label">{label}</div>
        {detail ? (
          <div className="mt-1 text-xs text-secondary-label">{detail}</div>
        ) : null}
      </div>

      <span
        className={cn(
          "relative inline-flex h-8 w-[3.25rem] shrink-0 rounded-full transition-colors duration-200",
          value ? "bg-[var(--accent)]" : "bg-system-fill/80"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-6 w-6 rounded-full bg-system-background shadow-[0_6px_16px_rgba(15,23,42,0.16)] transition-transform duration-200",
            value ? "translate-x-[1.5rem]" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}
