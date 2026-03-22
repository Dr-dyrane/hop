import { CheckCircle2, PenSquare, Star } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import {
  listPendingReviewsForPortal,
  listReviewsForPortal,
} from "@/lib/db/repositories/review-repository";
import { PortalReviewComposer } from "@/components/reviews/PortalReviewComposer";

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

export default async function ReviewsPage() {
  const session = await requireAuthenticatedSession("/account/reviews");
  const [pendingReviews, reviews] = await Promise.all([
    listPendingReviewsForPortal(session.email),
    listReviewsForPortal(session.email),
  ]);
  const approvedCount = reviews.filter((review) => review.status === "approved").length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <MetricRail
        items={[
          {
            label: "Pending",
            value: `${pendingReviews.length}`,
            detail: "Rate",
            icon: PenSquare,
          },
          {
            label: "Sent",
            value: `${reviews.length}`,
            detail: "Saved",
            icon: Star,
          },
          {
            label: "Approved",
            value: `${approvedCount}`,
            detail: "Live",
            icon: CheckCircle2,
            tone: "success",
          },
        ]}
        columns={3}
      />

      <section className="space-y-4">
        <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Pending
        </div>
        {pendingReviews.length === 0 ? (
          <div className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-6 text-sm text-secondary-label shadow-soft">
            Nothing to rate.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {pendingReviews.map((request) => (
              <PortalReviewComposer
                key={request.requestId}
                orderId={request.orderId}
                orderNumber={request.orderNumber}
                completedAt={formatTimestamp(request.completedAt)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Sent
        </div>
        {reviews.length === 0 ? (
          <div className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-6 text-sm text-secondary-label shadow-soft">
            No reviews yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.reviewId}
                className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-headline text-secondary-label">
                      #{review.orderNumber}
                    </div>
                    <div className="mt-1 text-2xl font-semibold text-label">
                      {review.rating}/5
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                      {formatStatusLabel(review.status)}
                    </span>
                    {review.isFeatured ? (
                      <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        Featured
                      </span>
                    ) : null}
                  </div>
                </div>

                {review.title ? (
                  <div className="mt-4 text-lg font-semibold tracking-tight text-label">
                    {review.title}
                  </div>
                ) : null}
                {review.body ? (
                  <div className="mt-2 text-sm leading-relaxed text-secondary-label">
                    {review.body}
                  </div>
                ) : null}

                <div className="mt-4 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                  {formatTimestamp(review.createdAt)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
