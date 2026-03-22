import Link from "next/link";
import { AlertCircle, CircleEllipsis, CreditCard } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listPaymentsForAdmin } from "@/lib/db/repositories/orders-repository";
import {
  getPaymentReviewActionLabel,
  getPaymentStatusPresentation,
} from "@/lib/orders/presentation";
import { reviewPaymentQueueAction } from "./actions";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function availablePaymentActions(status: string) {
  if (status === "submitted") {
    return ["under_review", "confirmed", "rejected"] as const;
  }

  if (status === "under_review") {
    return ["confirmed", "rejected"] as const;
  }

  return [] as const;
}

export default async function AdminPaymentsPage() {
  const session = await requireAdminSession("/admin/payments");
  const payments = await listPaymentsForAdmin(50, session.email);
  const underReview = payments.filter((payment) => payment.status === "under_review").length;
  const submitted = payments.filter((payment) => payment.status === "submitted").length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <section className="space-y-5">
        <div className="rounded-[24px] bg-system-fill/42 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:inline-flex">
          <div className="grid grid-cols-2 gap-1.5">
            <QuickLink href="/admin/orders" label="Orders" />
            <QuickLink href="/admin/payments" label="Payments" />
          </div>
        </div>

        <MetricRail
          items={[
            {
              label: "Checking",
              value: `${underReview}`,
              detail: "Queue",
              icon: AlertCircle,
            },
            {
              label: "Money Sent",
              value: `${submitted}`,
              detail: "Waiting",
              icon: CircleEllipsis,
            },
            {
              label: "Queue",
              value: `${payments.length}`,
              detail: "Recent",
              icon: CreditCard,
              tone: "success",
            },
          ]}
          columns={3}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {payments.length === 0 ? (
          <div className="glass-morphism min-h-[280px] rounded-[32px] bg-[color:var(--surface)]/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] xl:col-span-2 2xl:col-span-3">
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  Queue
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-label">
                  Clear
                </div>
              </div>

              <div className="grid gap-3 text-sm text-secondary-label sm:grid-cols-3">
                <MetaItem label="Checking" value={`${underReview}`} />
                <MetaItem label="Money Sent" value={`${submitted}`} />
                <MetaItem label="Recent" value={`${payments.length}`} />
              </div>
            </div>
          </div>
        ) : (
          payments.map((payment) => {
            const paymentState = getPaymentStatusPresentation(payment.status);

            return (
              <article
                key={payment.paymentId}
                className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-col gap-4 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold tracking-tight text-label">
                        #{payment.orderNumber}
                      </div>
                      <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                        {paymentState.label}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-secondary-label">{paymentState.detail}</div>

                    <div className="mt-3 grid gap-2 sm:hidden">
                      <CompactQueueStat
                        label="Due"
                        value={formatNgn(payment.expectedAmountNgn)}
                      />
                      <CompactQueueStat
                        label="Sent"
                        value={
                          payment.submittedAmountNgn !== null
                            ? formatNgn(payment.submittedAmountNgn)
                            : "Waiting"
                        }
                      />
                    </div>

                    <div className="mt-3 grid gap-3 text-sm text-secondary-label sm:grid-cols-2 xl:grid-cols-4">
                      <MetaItem
                        label="Account"
                        value={
                          [payment.bankName, payment.accountNumber].filter(Boolean).join(" / ") ||
                          "Pending"
                        }
                      />
                      <MetaItem label="Payer" value={payment.payerName ?? "Waiting for receipt"} />
                      <MetaItem label="Sent" value={formatTimestamp(payment.submittedAt)} />
                      <MetaItem label="Deadline" value={formatTimestamp(payment.expiresAt)} />
                    </div>
                  </div>

                  <div className="min-w-[220px] shrink-0">
                    <div className="hidden text-right text-sm text-secondary-label sm:block">
                      <div className="text-lg font-semibold text-label">
                        {formatNgn(payment.expectedAmountNgn)}
                      </div>
                      <div className="mt-1">
                        {payment.submittedAmountNgn !== null
                          ? formatNgn(payment.submittedAmountNgn)
                          : "Waiting for receipt"}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                      {availablePaymentActions(payment.status).map((action) => (
                        <form key={action} action={reviewPaymentQueueAction} className="flex">
                          <input type="hidden" name="orderId" value={payment.orderId} />
                          <input type="hidden" name="paymentId" value={payment.paymentId} />
                          <button
                            type="submit"
                            name="action"
                            value={action}
                            className="button-secondary min-h-[40px] w-full px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
                          >
                            {getPaymentReviewActionLabel(action)}
                          </button>
                        </form>
                      ))}
                      <Link
                        href={`/admin/orders/${payment.orderId}`}
                        className="button-secondary min-h-[40px] w-full px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

function CompactQueueStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-label">{value}</div>
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

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[40px] items-center justify-center rounded-[18px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-[color:var(--surface)] hover:shadow-soft"
    >
      {label}
    </Link>
  );
}
