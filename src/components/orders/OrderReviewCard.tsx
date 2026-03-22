"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import type { OrderReviewRequestRow, OrderReviewRow } from "@/lib/db/types";
import { getClientErrorMessage } from "@/lib/orders/client-form";
import { formatOrderStatusLabel } from "@/lib/orders/detail-view";
import { cn } from "@/lib/utils";
import styles from "./order-detail/order-task-cards.module.css";

type ReviewStage = "idle" | "rate" | "comment" | "success";

const SCENE_MOTION = {
  initial: { opacity: 0, y: 8, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -6, filter: "blur(4px)" },
  transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] as const },
};

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
  const [stage, setStage] = useState<ReviewStage>(review ? "success" : "idle");
  const [rating, setRating] = useState<number>(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.body ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, startTransition] = useTransition();

  const canReview = orderStatus === "delivered" || Boolean(reviewRequest);

  if (!canReview && !review) {
    return (
      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>Ratings open after delivery</div>
        <div className={styles.infoText}>
          You can rate this order once it has been delivered.
        </div>
      </div>
    );
  }

  async function submitReview() {
    if (!rating) {
      setError("Choose a star rating first.");
      return;
    }

    startTransition(async () => {
      try {
        setError("");

        const response = await fetch("/api/order-reviews", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            accessToken,
            rating,
            body: comment.trim(),
          }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Unable to submit rating.");
        }

        setStage("success");
        router.refresh();
      } catch (submitError) {
        setError(getClientErrorMessage(submitError, "Unable to submit rating."));
      }
    });
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Order rating</h3>
          <p className={styles.description}>
            Start with stars first, then add an optional note.
          </p>
        </div>
        {review ? <div className={styles.statusPill}>Submitted</div> : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {stage === "idle" ? (
          <motion.section
            key="review-idle"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setStage("rate")}
            >
              {review ? "View rating" : "Leave a rating"}
            </button>
          </motion.section>
        ) : null}

        {stage === "rate" ? (
          <motion.section
            key="review-rate"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.sceneTitle}>How was this order?</div>
            <div className={styles.starRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={rating >= value ? styles.starActive : styles.starButton}
                  onClick={() => {
                    setRating(value);
                    setError("");
                  }}
                  aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                >
                  <Star
                    size={18}
                    strokeWidth={2}
                    className={cn(
                      styles.ratingStarIcon,
                      rating >= value && styles.ratingStarIconFilled
                    )}
                  />
                </button>
              ))}
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setStage("idle")}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!rating}
                onClick={() => setStage("comment")}
              >
                Continue
              </button>
            </div>
          </motion.section>
        ) : null}

        {stage === "comment" ? (
          <motion.section
            key="review-comment"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.sceneTitle}>Anything else to add?</div>
            <textarea
              className={styles.textarea}
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Optional. Keep it brief."
            />

            {error ? <div className={styles.errorBanner}>{error}</div> : null}

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setStage("rate")}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void submitReview()}
                disabled={isSubmitting || !rating}
              >
                {isSubmitting ? "Submitting..." : "Submit rating"}
              </button>
            </div>
          </motion.section>
        ) : null}

        {stage === "success" ? (
          <motion.section
            key="review-success"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.successCard}>
              <div className={styles.successTitle}>Rating submitted</div>
              <div className={styles.ratingStarsRow}>
                {Array.from({ length: 5 }).map((_, index) => {
                  const active = index < Math.max(0, Math.min(5, rating || review?.rating || 0));

                  return (
                    <Star
                      key={`review-star-${index}`}
                      size={18}
                      strokeWidth={2}
                      className={cn(
                        styles.ratingStarIcon,
                        active && styles.ratingStarIconFilled
                      )}
                    />
                  );
                })}
              </div>
              {(comment.trim() || review?.body) ? (
                <div className={styles.successText}>{comment.trim() || review?.body}</div>
              ) : null}
              {review?.status ? (
                <div className={styles.infoText}>{formatOrderStatusLabel(review.status)}</div>
              ) : null}
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setStage("comment")}
              >
                Edit
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
