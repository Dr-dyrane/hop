"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export function AppErrorState({
  title,
  detail,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  debugMessage,
}: {
  title: string;
  detail: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel: string;
  onSecondaryAction: () => void;
  debugMessage?: string | null;
}) {
  return (
    <main className="workspace-shell-native flex min-h-svh items-center justify-center px-4 py-8 sm:px-6">
      <section className="glass-morphism w-full max-w-[34rem] rounded-[36px] bg-[color:var(--surface)]/92 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)] sm:p-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-system-fill/72 text-accent shadow-soft">
          <AlertTriangle className="h-6 w-6" strokeWidth={1.8} />
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            Recovery
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-display text-label sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-secondary-label">{detail}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="button-primary min-h-[48px] flex-1 justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            <RefreshCcw className="h-4 w-4" strokeWidth={1.8} />
            {primaryActionLabel}
          </button>
          <button
            type="button"
            onClick={onSecondaryAction}
            className="button-secondary min-h-[48px] flex-1 justify-center text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            {secondaryActionLabel}
          </button>
        </div>

        {debugMessage ? (
          <pre className="mt-5 overflow-x-auto rounded-[24px] bg-system-fill/42 px-4 py-3 text-xs leading-relaxed text-secondary-label">
            {debugMessage}
          </pre>
        ) : null}
      </section>
    </main>
  );
}
