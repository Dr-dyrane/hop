"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  acceptOrderRequestAction,
  cancelOrderAction,
  reviewPaymentAction,
} from "@/app/(admin)/admin/orders/[orderId]/actions";
import { INITIAL_ORDER_ADMIN_ACTION_STATE } from "@/lib/orders/action-state";
import { getPaymentReviewActionLabel } from "@/lib/orders/presentation";
import { cn } from "@/lib/utils";

export function AdminOrderActions({
  orderId,
  paymentId,
  isRequestPending,
  paymentActions,
  canCancel,
}: {
  orderId: string;
  paymentId: string | null;
  isRequestPending: boolean;
  paymentActions: readonly string[];
  canCancel: boolean;
}) {
  const router = useRouter();
  const [acceptState, acceptFormAction, acceptPending] = useActionState(
    acceptOrderRequestAction,
    INITIAL_ORDER_ADMIN_ACTION_STATE
  );

  useEffect(() => {
    if (acceptState.status === "success") {
      router.refresh();
    }
  }, [acceptState.status, router]);

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {isRequestPending ? (
        <>
          <form
            id="admin-order-primary-form"
            action={acceptFormAction}
            className="flex"
          >
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="note" value="Request accepted from order detail." />
            <button
              type="submit"
              disabled={acceptPending}
              className="button-secondary min-h-[44px] w-full text-xs font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none disabled:opacity-50"
            >
              {acceptPending ? "Checking stock" : "Accept"}
            </button>
          </form>
          <form action={cancelOrderAction} className="flex">
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="note" value="Request declined from order detail." />
            <button
              type="submit"
              className="min-h-[44px] w-full rounded-full bg-system-fill/56 px-4 text-xs font-semibold uppercase tracking-headline text-red-500 transition-colors duration-200 hover:bg-system-fill/76"
            >
              Decline
            </button>
          </form>
          {acceptState.message ? (
            <div
              className={cn(
                "rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm sm:col-span-4",
                acceptState.status === "error" ? "text-red-500" : "text-secondary-label"
              )}
            >
              {acceptState.message}
            </div>
          ) : null}
        </>
      ) : paymentId && paymentActions.length > 0 ? (
        paymentActions.map((action, index) => (
          <form
            key={action}
            id={index === 0 ? "admin-order-primary-form" : undefined}
            action={reviewPaymentAction}
            className="flex"
          >
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="paymentId" value={paymentId} />
            <button
              type="submit"
              name="action"
              value={action}
              className="button-secondary min-h-[44px] w-full text-xs font-semibold uppercase tracking-headline"
            >
              {getPaymentReviewActionLabel(action)}
            </button>
          </form>
        ))
      ) : (
        <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label sm:col-span-3">
          {paymentId ? "No payment action needed." : "Waiting for payment."}
        </div>
      )}

      {!isRequestPending && canCancel ? (
        <form action={cancelOrderAction} className="flex">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="note" value="Cancelled from order detail." />
          <button
            type="submit"
            className="min-h-[44px] w-full rounded-full bg-system-fill/56 px-4 text-xs font-semibold uppercase tracking-headline text-red-500 transition-colors duration-200 hover:bg-system-fill/76"
          >
            Cancel
          </button>
        </form>
      ) : null}
    </div>
  );
}
