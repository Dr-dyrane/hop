"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  OrderReviewRequestRow,
  OrderReviewRow,
} from "@/lib/db/types";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Try again.";
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function OrderReviewCard({
  orderId,
  accessToken,
  orderStatus,
  reviewRequest,
  review,
}: {
  orderId: string;
  accessToken?: string;
  orderStatus: string;
  reviewRequest: OrderReviewRequestRow | null;
  review: OrderReviewRow | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState("5");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = orderStatus === "delivered" && !!reviewRequest && !review;

  if (!canSubmit && !review) {
    return (
      <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
        Available after delivery.
      </div>
    );
  }

  async function handleSubmit() {
    startTransition(async () => {
      try {
        setMessage(null);

        const response = await fetch("/api/order-reviews", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            accessToken,
            rating: Number(rating),
            title,
            body,
          }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Try again.");
        }

        setTitle("");
        setBody("");
        setMessage("Saved.");
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  if (review) {
    return (
      <div className="space-y-3">
        <div className="rounded-[22px] bg-system-fill/36 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-2xl font-semibold tracking-tight text-label">
              {review.rating}/5
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              {formatStatusLabel(review.status)}
            </div>
          </div>
          {review.title ? (
            <div className="mt-3 text-sm font-medium text-label">{review.title}</div>
          ) : null}
          {review.body ? (
            <div className="mt-2 text-sm text-secondary-label">{review.body}</div>
          ) : null}
        </div>

        <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {formatTimestamp(review.createdAt)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
        Delivered. Rate it.
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <select
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className="min-h-[44px] rounded-[22px] bg-system-fill/52 px-4 text-sm text-label focus:outline-none"
        >
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="min-h-[44px] w-full rounded-[22px] bg-system-fill/52 px-4 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
        />
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Optional note"
        rows={4}
        className="w-full resize-none rounded-[24px] bg-system-fill/52 px-4 py-3 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
      />

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isPending}
          className="button-secondary min-h-[44px] text-xs font-semibold uppercase tracking-headline"
        >
          {isPending ? "Saving" : "Send"}
        </button>
        {message ? <p className="text-xs text-secondary-label">{message}</p> : null}
      </div>
    </div>
  );
}
