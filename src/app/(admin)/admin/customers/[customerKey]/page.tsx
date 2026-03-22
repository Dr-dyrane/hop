import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { AdminCustomerCRM } from "@/components/admin/customers/AdminCustomerCRM";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { QuietValueStrip } from "@/components/ui/QuietValueStrip";
import { requireAdminSession } from "@/lib/auth/guards";
import { getAdminCustomerDetail } from "@/lib/db/repositories/admin-repository";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ customerKey: string }>;
}) {
  const session = await requireAdminSession("/admin/customers");
  const { customerKey } = await params;
  const customer = await getAdminCustomerDetail(
    decodeURIComponent(customerKey),
    session.email
  );

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title={customer.fullName ?? customer.email ?? customer.phone ?? "Customer"}
        detail={customer.email ?? customer.phone ?? "Order-linked customer"}
        tags={[
          {
            label: customer.userId ? "Account" : "Guest",
            tone: customer.userId ? "success" : "muted",
          },
          ...(customer.supportState !== "standard"
            ? [{ label: formatSupportState(customer.supportState), tone: "default" as const }]
            : []),
          ...(customer.latestOrderStatus
            ? [{ label: formatFlowStatusLabel(customer.latestOrderStatus), tone: "default" as const }]
            : []),
        ]}
        meta={[
          { label: "Orders", value: `${customer.totalOrders}` },
          { label: "Active", value: `${customer.activeOrders}` },
          { label: "Saved places", value: `${customer.addressCount}` },
        ]}
      />

      <QuietValueStrip
        items={[
          {
            label: "Email",
            value: customer.email ?? "No email",
            detail: customer.userId ? "Linked account" : "Guest checkout",
          },
          {
            label: "Phone",
            value: customer.phone ?? "No phone",
            detail: "Latest contact",
          },
          {
            label: "Latest",
            value: customer.latestOrderNumber ?? "-",
            detail: formatTimestamp(customer.latestOrderAt),
          },
        ]}
        columns={3}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.8fr)]">
        <section className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                Orders
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-label">
                Recent activity
              </h2>
            </div>
            <Package className="h-5 w-5 text-secondary-label" strokeWidth={1.8} />
          </div>

          <div className="mt-5 space-y-3">
            {customer.recentOrders.map((order) => (
              <Link
                key={order.orderId}
                href={`/admin/orders/${order.orderId}`}
                className="block rounded-[24px] bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/56"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                      Order
                    </div>
                    <div className="mt-1 text-lg font-semibold tracking-tight text-label">
                      {order.orderNumber}
                    </div>
                    <div className="mt-1 text-sm text-secondary-label">
                      {formatFlowStatusLabel(order.status)} - {order.itemCount} items
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold text-label">
                      {formatCurrency(order.totalNgn)}
                    </div>
                    <div className="mt-1 text-xs text-secondary-label">
                      {formatTimestamp(order.placedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {customer.recentOrders.length === 0 ? (
              <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label">
                No orders yet.
              </div>
            ) : null}
          </div>
        </section>

        <AdminCustomerCRM customer={customer} />
      </div>
    </div>
  );
}

function formatSupportState(value: "standard" | "priority" | "follow_up" | "hold") {
  if (value === "follow_up") {
    return "Follow up";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
