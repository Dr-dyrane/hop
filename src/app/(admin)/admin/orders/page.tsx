import Link from "next/link";
import { CircleEllipsis, Clock3, Landmark, PackageCheck, RotateCcw } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listOpenOrderReturnCasesForAdmin } from "@/lib/db/repositories/order-returns-repository";
import { listOrdersForAdmin } from "@/lib/db/repositories/orders-repository";
import { getOrderStagePresentation } from "@/lib/orders/presentation";

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

export default async function AdminOrdersPage() {
  const session = await requireAdminSession("/admin/orders");
  const [orders, openReturns] = await Promise.all([
    listOrdersForAdmin(40, session.email),
    listOpenOrderReturnCasesForAdmin(12, session.email),
  ]);
  const requests = orders.filter((order) => order.status === "checkout_draft").length;
  const awaitingTransfer = orders.filter(
    (order) =>
      order.status !== "checkout_draft" &&
      order.paymentStatus === "awaiting_transfer"
  ).length;
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled", "expired"].includes(order.status)
  ).length;
  const preparingOrders = orders.filter(
    (order) => getOrderStagePresentation(order).key === "preparing"
  ).length;

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
              label: "Active",
              value: `${activeOrders}`,
              detail: "Live",
              icon: Clock3,
            },
            {
              label: "Requests",
              value: `${requests}`,
              detail: "Pending",
              icon: CircleEllipsis,
            },
            {
              label: "Awaiting",
              value: `${awaitingTransfer}`,
              detail: "Transfer",
              icon: Landmark,
            },
            {
              label: "Preparing",
              value: `${preparingOrders}`,
              detail: "Orders",
              icon: PackageCheck,
              tone: "success",
            },
            {
              label: "Returns",
              value: `${openReturns.length}`,
              detail: "Open",
              icon: RotateCcw,
            },
          ]}
          columns={4}
        />
      </section>

      {openReturns.length > 0 ? (
        <section className="space-y-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            Returns
          </div>
          <div className="grid gap-3">
            {openReturns.map((returnCase) => (
              <article
                key={returnCase.returnCaseId}
                className="glass-morphism rounded-[28px] bg-[color:var(--surface)]/88 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-col gap-3 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold tracking-tight text-label">
                        #{returnCase.orderNumber}
                      </div>
                      <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                        {formatStatusLabel(returnCase.status)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-secondary-label">{returnCase.reason}</div>
                    <div className="mt-3 grid gap-3 text-sm text-secondary-label sm:grid-cols-2 xl:grid-cols-4">
                      <MetaItem label="Customer" value={returnCase.customerName} />
                      <MetaItem label="Phone" value={returnCase.customerPhone} />
                      <MetaItem
                        label="Refund"
                        value={formatNgn(
                          returnCase.approvedRefundAmountNgn ??
                            returnCase.requestedRefundAmountNgn
                        )}
                      />
                      <MetaItem
                        label="Account"
                        value={
                          [
                            returnCase.refundBankName,
                            returnCase.refundAccountNumber,
                          ]
                            .filter(Boolean)
                            .join(" / ") || "Pending"
                        }
                      />
                    </div>
                  </div>

                  <div className="min-w-[150px] shrink-0">
                    <div className="text-right text-sm text-secondary-label">
                      <div>{formatTimestamp(returnCase.requestedAt)}</div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/admin/orders/${returnCase.orderId}`}
                        className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4">
        {orders.map((order) => {
          const stage = getOrderStagePresentation(order);

          return (
            <article
              key={order.orderId}
              className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-4 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold tracking-tight text-label">
                      #{order.orderNumber}
                    </div>
                    <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                      {stage.label}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-secondary-label">{stage.detail}</div>

                  <div className="mt-3 grid gap-3 text-sm text-secondary-label sm:grid-cols-2 xl:grid-cols-4">
                    <MetaItem label="Customer" value={order.customerName} />
                    <MetaItem label="Phone" value={order.customerPhone} />
                    <MetaItem label="Placed" value={formatTimestamp(order.placedAt)} />
                    <MetaItem label="Next" value={stage.detail} />
                  </div>
                </div>

                <div className="min-w-[150px] shrink-0">
                  <div className="text-right text-sm text-secondary-label">
                    <div className="text-lg font-semibold text-label">{formatNgn(order.totalNgn)}</div>
                    <div className="mt-1">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
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
