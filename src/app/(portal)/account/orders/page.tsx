import Link from "next/link";
import { Clock3, PackageCheck } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listOrdersForPortal } from "@/lib/db/repositories/orders-repository";
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

export default async function OrdersPage() {
  const session = await requireAuthenticatedSession("/account/orders");
  const orders = await listOrdersForPortal(session.email);
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled", "expired"].includes(order.status)
  ).length;

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <MetricRail
          items={[
            {
              label: "Active",
              value: `${activeOrders}`,
              detail: "Live",
              icon: Clock3,
            },
            {
              label: "Total",
              value: `${orders.length}`,
              detail: "History",
              icon: PackageCheck,
              tone: "success",
            },
          ]}
          columns={2}
        />
      </section>

      <section className="space-y-4">
        {orders.length === 0 ? (
          <div className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-6 text-sm text-secondary-label shadow-soft">
            No orders yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {orders.map((order) => {
              const stage = getOrderStagePresentation(order);

              return (
                <article
                  key={order.orderId}
                  className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-headline text-secondary-label">
                          Order #{order.orderNumber}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-label">
                          {formatNgn(order.totalNgn)}
                        </p>
                      </div>
                      <OrderStatusBadge label={stage.label} tone={stage.tone} />
                    </div>

                    <div className="grid gap-2 md:hidden">
                      <CompactOrderStat label="Date" value={formatTimestamp(order.placedAt)} />
                      <CompactOrderStat
                        label="Items"
                        value={`${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`}
                      />
                    </div>

                    <div className="hidden md:flex md:flex-row md:items-start md:justify-between md:gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-headline text-secondary-label">
                          Status
                        </p>
                        <p className="mt-1 text-sm text-secondary-label">{stage.detail}</p>
                      </div>
                    </div>

                    <div className="hidden md:grid md:grid-cols-2 md:gap-4 md:text-sm md:text-secondary-label">
                      <div>{formatTimestamp(order.placedAt)}</div>
                      <div className="md:text-right">
                        {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="text-sm text-secondary-label md:hidden">{stage.detail}</div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
                        {order.active ? stage.label : "Completed"}
                      </span>
                      <Link
                        href={`/account/orders/${order.orderId}`}
                        className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CompactOrderStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}

function OrderStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "success" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? "bg-accent/15 text-accent"
      : tone === "muted"
        ? "bg-system-fill/56 text-tertiary-label"
        : "bg-system-fill/70 text-secondary-label";

  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-tight ${toneClass}`}>
      {label}
    </span>
  );
}
