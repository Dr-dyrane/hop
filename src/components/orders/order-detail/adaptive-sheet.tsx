"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useOverlayPresence } from "@/components/providers/UIProvider";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import { cn } from "@/lib/utils";

export function AdaptiveOrderSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const feedback = useFeedback();
  useOverlayPresence("order-detail-sheet", open);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <>
      <div
        className={cn(
          "z-layer-sheet-backdrop fixed inset-0 transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <button
          type="button"
          onClick={() => {
            feedback.tap();
            onClose();
          }}
          aria-label="Close details panel"
          className="absolute inset-0 bg-black/48 backdrop-blur-md"
        />
      </div>

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        className={cn(
          "z-layer-sheet fixed inset-x-0 bottom-0 top-auto max-h-[calc(100svh-0.75rem)] w-full transition-all duration-500 ease-[var(--ease-premium)] md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[88svh] md:w-[min(42rem,calc(100vw-3rem))] xl:inset-y-0 xl:right-0 xl:left-auto xl:top-0 xl:max-h-none xl:h-svh xl:w-full xl:max-w-[40rem]",
          open
            ? "pointer-events-auto opacity-100 translate-y-0 md:-translate-x-1/2 md:-translate-y-1/2 xl:translate-x-0 xl:translate-y-0"
            : "pointer-events-none opacity-0 translate-y-full md:-translate-x-1/2 md:translate-y-[calc(-50%+24px)] xl:translate-x-full xl:translate-y-0"
        )}
      >
        <div className="flex h-full max-h-[inherit] flex-col overflow-hidden rounded-t-[34px] bg-[color:var(--surface)]/92 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-22px_60px_rgba(0,0,0,0.18)] md:rounded-[30px] md:p-5 md:pb-5 md:shadow-[0_24px_90px_rgba(0,0,0,0.2)] xl:rounded-l-[36px] xl:rounded-tr-none xl:shadow-[0_32px_120px_rgba(0,0,0,0.22)]">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-system-fill/90 md:hidden" />

          <div className="flex items-center justify-between gap-4 px-1 pb-4 pt-1 md:pb-5 md:pt-2">
            <h2 className="text-lg font-semibold tracking-title text-label md:text-xl">
              {title}
            </h2>
            <button
              type="button"
              onClick={() => {
                feedback.tap();
                onClose();
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/64 text-secondary-label transition-colors duration-300 hover:bg-system-fill/82 hover:text-label"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" strokeWidth={1.7} />
            </button>
          </div>

          <div className="scrollbar-hide flex-1 overflow-y-auto pr-1 pb-1">{children}</div>
        </div>
      </aside>
    </>,
    document.body
  );
}
