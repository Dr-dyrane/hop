import Link from "next/link";
import { CheckCircle2, MessageCircleMore, Sparkles } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { listReviewsForAdmin } from "@/lib/db/repositories/review-repository";
import { AdminReviewModerationCard } from "@/components/reviews/AdminReviewModerationCard";

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

export default async function AdminReviewsPage() {
  const session = await requireAdminSession("/admin/reviews");
  const reviews = await listReviewsForAdmin(session.email);
  const pendingCount = reviews.filter((review) => review.status === "pending").length;
  const approvedCount = reviews.filter((review) => review.status === "approved").length;
  const featuredCount = reviews.filter((review) => review.isFeatured).length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <MetricRail
        items={[
          {
            label: "Pending",
            value: `${pendingCount}`,
            detail: "Need moderation",
            icon: MessageCircleMore,
          },
          {
            label: "Approved",
            value: `${approvedCount}`,
            detail: "Visible",
            icon: CheckCircle2,
            tone: "success",
          },
          {
            label: "Featured",
            value: `${featuredCount}`,
            detail: "Promoted",
            icon: Sparkles,
          },
        ]}
        columns={3}
      />

      <section className="space-y-4">
        {reviews.length === 0 ? (
          <div className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-6 text-sm text-secondary-label shadow-soft">
            No reviews yet.
          </div>
        ) : (
          reviews.map((review) => (
            <article
              key={review.reviewId}
              className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-4 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold tracking-tight text-label">
                      #{review.orderNumber}
                    </div>
                    <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                      {formatStatusLabel(review.status)}
                    </span>
                    {review.isFeatured ? (
                      <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-2xl font-semibold text-label">{review.rating}/5</div>

                  <div className="mt-3 grid gap-3 text-sm text-secondary-label sm:grid-cols-2 xl:grid-cols-4">
                    <MetaItem label="Customer" value={review.customerName} />
                    <MetaItem label="Email" value={review.customerEmail ?? "No email"} />
                    <MetaItem label="Created" value={formatTimestamp(review.createdAt)} />
                    <MetaItem
                      label="Moderated"
                      value={review.moderatedAt ? formatTimestamp(review.moderatedAt) : "-"}
                    />
                  </div>

                  {review.title ? (
                    <div className="mt-4 text-base font-semibold text-label">{review.title}</div>
                  ) : null}
                  {review.body ? (
                    <div className="mt-2 text-sm leading-relaxed text-secondary-label">
                      {review.body}
                    </div>
                  ) : null}
                </div>

                <div className="min-w-[160px] shrink-0">
                  <div className="flex justify-end">
                    <Link
                      href={`/admin/orders/${review.orderId}`}
                      className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
                    >
                      Open
                    </Link>
                  </div>
                  <div className="mt-4">
                    <AdminReviewModerationCard
                      reviewId={review.reviewId}
                      status={review.status}
                      isFeatured={review.isFeatured}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium text-label">{value}</div>
    </div>
  );
}
