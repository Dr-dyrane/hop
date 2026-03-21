"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ProgressiveFormSectionProps = {
  step: string;
  title: string;
  summary?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

export function ProgressiveFormSection({
  step,
  title,
  summary,
  children,
  actions,
  className,
  bodyClassName,
  open,
  onOpenChange,
  defaultOpen = false,
}: ProgressiveFormSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : uncontrolledOpen;

  function setOpen(nextOpen: boolean) {
    onOpenChange?.(nextOpen);

    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
  }

  return (
    <section
      className={cn(
        "rounded-[28px] bg-system-background/86 shadow-[0_18px_40px_rgba(15,23,42,0.06)]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6 md:py-6"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/42 text-[11px] font-semibold uppercase tracking-[0.16em] text-label">
            {step}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              Step
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-label">
              {title}
            </h2>
            {summary ? (
              <p className="mt-1 truncate text-sm text-secondary-label">{summary}</p>
            ) : null}
          </div>
        </div>

        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-secondary-label transition-transform duration-300 ease-[var(--ease-premium)]",
            isOpen && "rotate-90"
          )}
          strokeWidth={1.9}
        />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-premium)]",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={cn("px-5 pb-5 pt-1 md:px-6 md:pb-6", bodyClassName)}>
            {children}
            {actions ? <div className="mt-5 flex items-center gap-2">{actions}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
