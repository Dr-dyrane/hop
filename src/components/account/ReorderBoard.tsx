"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { PortalOrderListRow } from "@/lib/db/types";
import { prepareReorderAction } from "@/app/(portal)/account/reorder/actions";
import { useUI } from "@/components/providers/UIProvider";
import { replaceRemoteCartItems } from "@/lib/cart/api-client";
import { formatNgn } from "@/lib/commerce";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";
import { cn } from "@/lib/utils";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return formatFlowStatusLabel(value);
}

export function ReorderBoard({ orders }: { orders: PortalOrderListRow[] }) {
  const router = useRouter();
  const { hasActiveOverlay } = useUI();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  function handleReorder(orderId: string) {
    setBusyOrderId(orderId);
    setMessage(null);
    setMessageTone(null);

    startTransition(async () => {
      const prepared = await prepareReorderAction(orderId);

      if (!prepared.success || !prepared.data) {
        setMessage(prepared.error || "Unable to reorder.");
        setMessageTone("error");
        setBusyOrderId(null);
        return;
      }

      if (prepared.data.items.length === 0) {
        setMessage("Nothing available now.");
        setMessageTone("error");
        setBusyOrderId(null);
        return;
      }

      try {
        await replaceRemoteCartItems(prepared.data.items);
      } catch (error) {
        setMessage((error as Error).message);
        setMessageTone("error");
        setBusyOrderId(null);
        return;
      }

      const unavailableCount = prepared.data.unavailableItems.length;
      const changedCount = prepared.data.changedPriceCount;
      const parts = ["Cart ready."];

      if (unavailableCount > 0) {
        parts.push(`${unavailableCount} skipped.`);
      }

      if (changedCount > 0) {
        parts.push(`${changedCount} repriced.`);
      }

      setMessage(parts.join(" "));
      setMessageTone("success");
      setBusyOrderId(null);
      router.push("/");
    });
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-[28px] bg-[color:var(--surface)]/86 px-5 py-6 text-sm text-secondary-label shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      {orders.map((order) => (
        <article
          key={order.orderId}
          className="rounded-[28px] bg-[color:var(--surface)]/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
        >
          <div className="flex flex-col gap-4 min-[920px]:flex-row min-[920px]:items-center min-[920px]:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-label">
                  #{order.orderNumber}
                </h2>
                <span className="rounded-full bg-system-fill/42 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  {formatStatusLabel(order.status)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-secondary-label">
                <span>{formatTimestamp(order.placedAt)}</span>
                <span>{order.itemCount} items</span>
                <span>{formatNgn(order.totalNgn)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/account/orders/${order.orderId}`}
                className="flex min-h-[40px] items-center rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() => handleReorder(order.orderId)}
                disabled={isPending && busyOrderId === order.orderId}
                className={cn(
                  "button-primary min-h-[40px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em]",
                  isPending && busyOrderId === order.orderId && "pointer-events-none opacity-50"
                )}
              >
                {isPending && busyOrderId === order.orderId ? "Loading" : "Reorder"}
              </button>
            </div>
          </div>
        </article>
      ))}

      <div
        className={cn(
          "z-layer-sticky-action sticky bottom-6 hidden md:block",
          hasActiveOverlay && "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/56 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p
            className={cn(
              "text-xs font-medium",
              messageTone === "success" && "text-accent",
              messageTone === "error" && "text-red-500",
              !messageTone && "text-secondary-label"
            )}
          >
            {message ?? "Current availability only."}
          </p>
          <Link
            href="/"
            className="flex min-h-[40px] items-center rounded-[18px] bg-[color:var(--surface)] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
          >
            Store
          </Link>
        </div>
      </div>
    </div>
  );
}
