"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";
import { verifyEmailOtpAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_ACTION_STATE } from "@/lib/auth/action-state";

export function EmailOtpVerifyForm({
  developmentOtpCode,
}: {
  developmentOtpCode?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    verifyEmailOtpAction,
    INITIAL_AUTH_ACTION_STATE
  );

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  return (
    <form
      action={formAction}
      className="grid max-w-full min-w-0 gap-4 overflow-hidden rounded-[32px] bg-system-fill/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <label className="grid gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Verification Code
        </span>
        <input
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="min-w-0 max-w-full rounded-[24px] bg-system-background px-4 py-4 text-center text-[clamp(1.55rem,7vw,2rem)] font-semibold tabular-nums tracking-[0.28em] text-label placeholder:tracking-[0.12em] placeholder:text-secondary-label sm:tracking-[0.42em]"
        />
      </label>

      {state.message ? (
        <AuthStatusMessage tone={state.status === "error" ? "error" : "success"}>
          {state.message}
        </AuthStatusMessage>
      ) : null}

      {developmentOtpCode ? (
        <AuthStatusMessage tone="info">
          Development code: {developmentOtpCode}
        </AuthStatusMessage>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="button-primary min-h-[52px] min-w-0 flex-1 justify-center text-[11px] font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
        >
          {pending ? "Checking" : "Continue"}
        </button>
      </div>
    </form>
  );
}
