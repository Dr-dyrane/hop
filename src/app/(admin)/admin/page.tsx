import type { ReactNode } from "react";
import Link from "next/link";
import {
  CircleAlert,
  Clock3,
  Landmark,
  PackageCheck,
  Truck,
} from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import {
  getAdminOverviewSnapshot,
  getAdminOverviewMetrics,
} from "@/lib/db/repositories/admin-repository";
import { listAllAdminCatalogProducts } from "@/lib/db/repositories/catalog-admin-repository";
import { listOrdersForAdmin } from "@/lib/db/repositories/orders-repository";
import { getOrderStagePresentation } from "@/lib/orders/presentation";

export default async function AdminPage() {
  const session = await requireAdminSession("/admin");
  const [metrics, snapshot, products, orders] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminOverviewSnapshot(),
    listAllAdminCatalogProducts(),
    listOrdersForAdmin(20, session.email),
  ]);

  const activeOrders = snapshot.openOrders;
  const paymentReviewQueue = snapshot.paymentReviewQueue;
  const requestQueue = snapshot.requestQueue;
  const preparingQueue = snapshot.preparingQueue;
  const outForDeliveryQueue = snapshot.outForDeliveryQueue;
  const needsActionCount =
    requestQueue + paymentReviewQueue + preparingQueue + outForDeliveryQueue;
  const awaitingTransferAmountNgn = snapshot.awaitingTransferAmountNgn;
  const reviewAmountNgn = snapshot.reviewAmountNgn;
  const queueValueNgn = awaitingTransferAmountNgn + reviewAmountNgn;
  const liveCatalogCount = products.filter((product) => product.isAvailable).length;
  const featuredCount = products.filter(
    (product) => product.merchandisingState === "featured"
  ).length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <section className="space-y-5">
        <div className="squircle bg-system-fill/42 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:inline-flex">
          <div className="grid grid-cols-3 gap-1.5">
            <QuickLink href="/admin/orders" label="Orders" />
            <QuickLink href="/admin/payments" label="Payments" />
            <QuickLink href="/admin/delivery" label="Delivery" />
          </div>
        </div>

        <MetricRail
          items={[
            {
              label: "Needs action",
              value: `${needsActionCount}`,
              detail: "Priority queue",
              icon: CircleAlert,
            },
            {
              label: "Open orders",
              value: `${activeOrders}`,
              detail: "In motion",
              icon: Clock3,
            },
            {
              label: "Preparing",
              value: `${preparingQueue}`,
              detail: "Ready to send",
              icon: PackageCheck,
            },
            {
              label: "Out",
              value: `${outForDeliveryQueue}`,
              detail: "On delivery",
              icon: Truck,
            },
          ]}
          columns={4}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.15fr_0.85fr_0.85fr]">
        <OverviewPanel
          title="Needs Action"
          badge={needsActionCount.toString()}
          emptyLabel="No active queue."
        >
          <QueueRow
            href="/admin/orders"
            label="Requests"
            detail="Waiting approval"
            value={`${requestQueue}`}
          />
          <QueueRow
            href="/admin/payments"
            label="Payments"
            detail="Waiting review"
            value={`${paymentReviewQueue}`}
          />
          <QueueRow
            href="/admin/delivery"
            label="Dispatch"
            detail="Preparing and out"
            value={`${preparingQueue + outForDeliveryQueue}`}
          />
          {needsActionCount > 0 ? (
            orders
              .filter((order) =>
                ["checkout_draft", "payment_submitted", "payment_under_review"].includes(
                  order.status
                )
              )
              .slice(0, 2)
              .map((order) => {
                const stage = getOrderStagePresentation(order);

                return (
                  <Link
                    key={order.orderId}
                    href={`/admin/orders/${order.orderId}`}
                    className="motion-press-soft flex items-center justify-between gap-3 squircle bg-system-fill/34 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/48"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-label">#{order.orderNumber}</div>
                      <div className="mt-1 truncate text-xs text-secondary-label">
                        {stage.label}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                      Open
                    </span>
                  </Link>
                );
              })
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title="Cash"
          badge="Live"
          emptyLabel="No open queue value."
        >
          <StatRow label="Last 7d gross" value={formatNgn(snapshot.grossLast7dNgn)} />
          <StatRow label="Last 24h gross" value={formatNgn(snapshot.grossLast24hNgn)} />
          <StatRow label="Queue value" value={formatNgn(queueValueNgn)} />
          <StatRow
            label="Awaiting transfer"
            value={formatNgn(awaitingTransferAmountNgn)}
          />
          <StatRow label="In review" value={formatNgn(reviewAmountNgn)} />
          <Link
            href="/admin/payments"
            className="motion-press-soft flex items-center justify-between gap-3 squircle bg-system-fill/34 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/48"
          >
            <span className="text-sm font-semibold text-label">Open payments</span>
            <Landmark className="h-4 w-4 text-secondary-label" />
          </Link>
        </OverviewPanel>

        <OverviewPanel
          title="Control"
          badge={`${activeOrders}`}
          emptyLabel="No controls available."
        >
          <StatRow label="Catalog live" value={`${liveCatalogCount} available`} />
          <StatRow label="Featured" value={`${featuredCount} picks`} />
          <StatRow label="Home sections" value={`${metrics.enabledHomeSections} live`} />
          <Link
            href="/admin/catalog"
            className="motion-press-soft flex items-center justify-between gap-3 squircle bg-system-fill/34 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/48"
          >
            <span className="text-sm font-semibold text-label">Open catalog</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Manage
            </span>
          </Link>
          <Link
            href="/admin/layout"
            className="motion-press-soft flex items-center justify-between gap-3 squircle bg-system-fill/34 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/48"
          >
            <span className="text-sm font-semibold text-label">Open layout</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Edit
            </span>
          </Link>
        </OverviewPanel>
      </section>
    </div>
  );
}

function OverviewPanel({
  title,
  badge,
  children,
  emptyLabel,
}: {
  title: string;
  badge: string;
  children: ReactNode;
  emptyLabel: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-label">{title}</h2>
        <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          {badge}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {hasChildren ? children : (
          <div className="squircle bg-system-fill/32 px-4 py-4 text-sm text-secondary-label">
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[40px] items-center justify-center rounded-[18px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-system-background hover:shadow-soft"
    >
      {label}
    </Link>
  );
}

function QueueRow({
  href,
  label,
  detail,
  value,
}: {
  href: string;
  label: string;
  detail: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 squircle bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/58"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-label">{label}</div>
        <div className="mt-1 truncate text-xs text-secondary-label">{detail}</div>
      </div>
      <span className="text-sm font-semibold text-label">{value}</span>
    </Link>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="squircle bg-system-fill/42 px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-label">{value}</div>
    </div>
  );
}
