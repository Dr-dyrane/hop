"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CreditCard,
  Package2,
  RotateCcw,
  TriangleAlert,
  Truck,
  X,
} from "lucide-react";
import { useOverlayPresence } from "@/components/providers/UIProvider";
import type { WorkspaceNotification } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  order: Package2,
  payment: CreditCard,
  delivery: Truck,
  return: RotateCcw,
  alert: TriangleAlert,
} as const;

function formatRelativeTime(value: string) {
  const deltaMs = new Date(value).getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minutes = Math.round(deltaMs / (1000 * 60));

  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }

  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    return rtf.format(hours, "hour");
  }

  const days = Math.round(hours / 24);

  if (Math.abs(days) < 7) {
    return rtf.format(days, "day");
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function WorkspaceNotificationSheet({
  notifications,
}: {
  notifications: WorkspaceNotification[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const count = notifications.length;
  useOverlayPresence("workspace-notifications", isOpen);
  const countLabel = useMemo(() => {
    if (count < 10) {
      return `${count}`;
    }

    return "9+";
  }, [count]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-system-fill/72 text-label transition-colors duration-200 hover:bg-system-fill"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-semibold tracking-tight text-[var(--accent-label)]">
            {countLabel}
          </span>
        ) : null}
      </button>

      <div
        className={cn(
          "z-layer-sheet-backdrop fixed inset-0 transition-opacity duration-300",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close notifications"
          className="absolute inset-0 bg-black/48 backdrop-blur-md"
        />
      </div>

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        aria-hidden={!isOpen}
        className={cn(
          "z-layer-sheet fixed right-0 top-0 h-svh w-full max-w-full transition-transform duration-500 ease-[var(--ease-premium)] sm:max-w-[28rem] lg:max-w-[30rem]",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden bg-[color:var(--system-background)] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.22)] sm:rounded-l-[36px] sm:p-5">
          <div className="flex items-start justify-between gap-4 px-1 pb-5 pt-2">
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-display text-label">
                Notifications
              </h2>
              <div className="mt-2 text-sm text-secondary-label">
                {count > 0 ? `${count} important update${count === 1 ? "" : "s"}` : "No updates"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/80 text-label transition-colors duration-300 hover:bg-system-fill"
              aria-label="Close notifications"
            >
              <X className="h-5 w-5" strokeWidth={1.7} />
            </button>
          </div>

          {count === 0 ? (
            <div className="flex flex-1 items-center justify-center px-3 text-center">
              <div className="space-y-3">
                <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-system-fill/80 text-secondary-label shadow-soft">
                  <Bell className="h-8 w-8" strokeWidth={1.7} />
                </div>
                <div className="text-lg font-semibold tracking-tight text-label">Quiet for now</div>
              </div>
            </div>
          ) : (
            <div className="scrollbar-hide flex-1 overflow-y-auto pr-1">
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon = ICON_MAP[notification.icon];
                  const toneClass =
                    notification.tone === "success"
                      ? "bg-accent/12 text-accent"
                      : notification.tone === "warning"
                        ? "bg-system-fill text-label"
                        : "bg-system-fill/72 text-label";

                  return (
                    <Link
                      key={notification.notificationId}
                      href={notification.href}
                      onClick={() => setIsOpen(false)}
                      className="block rounded-[28px] bg-system-background/86 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-[1px]"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                            toneClass
                          )}
                        >
                          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold tracking-tight text-label">
                                {notification.title}
                              </div>
                              <div className="mt-1 text-sm text-secondary-label">
                                {notification.detail}
                              </div>
                            </div>
                            <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                              {formatRelativeTime(notification.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
