import type { ReactNode } from "react";
import Link from "next/link";
import { Clock3, CreditCard, Layers3, Sparkles } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  getAdminHomeLayoutSummary,
  getAdminOverviewMetrics,
} from "@/lib/db/repositories/admin-repository";
import { listAllAdminCatalogProducts } from "@/lib/db/repositories/catalog-admin-repository";
import {
  listOrdersForAdmin,
  listPaymentsForAdmin,
} from "@/lib/db/repositories/orders-repository";
import { getOrderStagePresentation } from "@/lib/orders/presentation";

export default async function AdminPage() {
  const session = await requireAdminSession("/admin");
  const [metrics, layoutSummary, products, orders, payments] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminHomeLayoutSummary(),
    listAllAdminCatalogProducts(),
    listOrdersForAdmin(12, session.email),
    listPaymentsForAdmin(12, session.email),
  ]);

  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled", "expired"].includes(order.status)
  ).length;
  const paymentAttention = payments.filter((payment) =>
    ["submitted", "under_review"].includes(payment.status)
  ).length;
  const featuredProducts = products.filter(
    (product) => product.merchandisingState === "featured"
  );
  const urgentOrders = orders.filter((order) =>
    [
      "checkout_draft",
      "awaiting_transfer",
      "payment_under_review",
      "ready_for_dispatch",
    ].includes(order.status)
  );

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <section className="space-y-5">
        <div className="workspace-surface rounded-[24px] bg-system-fill/32 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] md:inline-flex">
          <div className="grid grid-cols-3 gap-1.5">
            <QuickLink href="/admin/orders" label="Orders" />
            <QuickLink href="/admin/payments" label="Payments" />
            <QuickLink href="/admin/delivery" label="Delivery" />
          </div>
        </div>

        <MetricRail
          items={[
            {
              label: "Active",
              value: `${activeOrders}`,
              detail: "Moving",
              icon: Clock3,
            },
            {
              label: "Payments",
              value: `${paymentAttention}`,
              detail: "Review",
              icon: CreditCard,
            },
            {
              label: "Featured",
              value: `${metrics.featuredProducts}`,
              detail: "Picks",
              icon: Sparkles,
            },
            {
              label: "Live",
              value: `${metrics.enabledHomeSections}`,
              detail: layoutSummary.versionLabel ?? "No live version",
              icon: Layers3,
            },
          ]}
          columns={4}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr_0.85fr]">
        <OverviewPanel
          title="Attention"
          badge={urgentOrders.length.toString()}
          emptyLabel="Clear"
        >
          {urgentOrders.length > 0 ? (
            urgentOrders.slice(0, 5).map((order) => {
              const stage = getOrderStagePresentation(order);

              return (
                <Link
                  key={order.orderId}
                  href={`/admin/orders/${order.orderId}`}
                  className="motion-press-soft flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/34 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/48"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-label">#{order.orderNumber}</div>
                    <div className="mt-1 truncate text-xs text-secondary-label">
                      {order.customerName}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-system-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    {stage.label}
                  </span>
                </Link>
              );
            })
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title="Merchandising"
          badge={featuredProducts.length.toString()}
          emptyLabel="Nothing featured"
        >
          {featuredProducts.length > 0 ? (
            featuredProducts.slice(0, 5).map((product) => (
              <Link
                key={product.productId}
                href={`/admin/catalog/products/${product.productId}`}
                className="motion-press-soft flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/34 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/48"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-label">
                    {product.productMarketingName ?? product.productName}
                  </div>
                  <div className="mt-1 truncate text-xs text-secondary-label">
                    {product.isAvailable ? "Live" : "Hidden"}
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  Open
                </span>
              </Link>
            ))
          ) : null}
        </OverviewPanel>

        <OverviewPanel
          title="Layout"
          badge={layoutSummary.enabledSectionCount.toString()}
          emptyLabel="No live layout"
        >
          <div className="grid gap-3">
            <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                Version
              </div>
              <div className="mt-1 text-sm font-semibold text-label">
                {layoutSummary.versionLabel ?? "No live version"}
              </div>
            </div>
            <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                Bindings
              </div>
              <div className="mt-1 text-sm font-semibold text-label">
                {metrics.homeBindingCount} active
              </div>
            </div>
            <Link
              href="/admin/layout"
              className="motion-press-soft flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/34 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/48"
            >
              <span className="text-sm font-semibold text-label">Open layout</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                Edit
              </span>
            </Link>
          </div>
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
    <section className="workspace-surface rounded-[32px] bg-system-background/92 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-label">{title}</h2>
        <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          {badge}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {hasChildren ? children : (
          <div className="rounded-[24px] bg-system-fill/32 px-4 py-4 text-sm text-secondary-label">
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
      className="motion-press-soft flex min-h-[40px] items-center justify-center rounded-[18px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-system-background"
    >
      {label}
    </Link>
  );
}
