"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "@/app/(portal)/account/reviews/actions";
import { INITIAL_REVIEW_ACTION_STATE } from "@/lib/reviews/action-state";

export function PortalReviewComposer({
  orderId,
  orderNumber,
  completedAt,
}: {
  orderId: string;
  orderNumber: string;
  completedAt: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    submitReviewAction,
    INITIAL_REVIEW_ACTION_STATE
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form
      action={formAction}
      className="glass-morphism rounded-[28px] bg-[color:var(--surface)]/88 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    >
      <input type="hidden" name="orderId" value={orderId} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            #{orderNumber}
          </div>
          <div className="mt-1 text-sm text-secondary-label">{completedAt}</div>
        </div>
        <select
          name="rating"
          defaultValue="5"
          className="rounded-full bg-system-fill/56 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-label"
        >
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3">
        <input
          type="text"
          name="title"
          placeholder="Title"
          className="w-full rounded-[22px] bg-system-fill/56 px-4 py-3 text-sm text-label placeholder:text-secondary-label"
        />
        <textarea
          name="body"
          rows={3}
          placeholder="Optional note"
          className="w-full rounded-[22px] bg-system-fill/56 px-4 py-3 text-sm text-label placeholder:text-secondary-label"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {state.message ? (
          <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            {state.message}
          </div>
        ) : (
          <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Review
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none"
        >
          {pending ? "Saving" : "Submit"}
        </button>
      </div>
    </form>
  );
}
