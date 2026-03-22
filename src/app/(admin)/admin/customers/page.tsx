import Link from "next/link";
import { CircleUserRound, MapPinHouse, UserRoundCheck } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { listAdminCustomerSummaries } from "@/lib/db/repositories/admin-repository";
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

function formatStatusLabel(value?: string | null) {
  if (!value) {
    return null;
  }

  return formatFlowStatusLabel(value);
}

export default async function AdminCustomersPage() {
  const session = await requireAdminSession("/admin/customers");
  const customers = await listAdminCustomerSummaries(40, session.email);
  const accountLinked = customers.filter((customer) => customer.userId).length;
  const activeCustomers = customers.filter((customer) => customer.activeOrders > 0).length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <MetricRail
        items={[
            {
              label: "Visible",
              value: `${customers.length}`,
              detail: "Listed",
              icon: CircleUserRound,
            },
            {
              label: "Linked",
              value: `${accountLinked}`,
              detail: "Accounts",
              icon: UserRoundCheck,
              tone: "success",
            },
            {
              label: "Active",
              value: `${activeCustomers}`,
              detail: "Live",
              icon: MapPinHouse,
            },
        ]}
        columns={3}
      />

      <section className="grid gap-4">
        {customers.map((customer) => (
          <Link
            key={customer.customerKey}
            href={`/admin/customers/${encodeURIComponent(customer.customerKey)}`}
            className="glass-morphism block rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition-colors duration-200 hover:bg-[color:var(--surface)]/86"
          >
            <div className="flex flex-col gap-4 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate text-lg font-semibold tracking-tight text-label">
                    {customer.fullName ?? customer.email ?? customer.phone ?? "Unnamed"}
                  </div>
                  <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    {customer.userId ? "Account" : "Guest"}
                  </span>
                  {formatStatusLabel(customer.latestOrderStatus) ? (
                    <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                      {formatStatusLabel(customer.latestOrderStatus)}
                    </span>
                  ) : null}
                  {customer.supportState !== "standard" ? (
                    <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                      {formatSupportState(customer.supportState)}
                    </span>
                  ) : null}
                  {customer.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-3 grid gap-3 text-sm text-secondary-label sm:grid-cols-2 xl:grid-cols-4">
                  <MetaItem label="Email" value={customer.email ?? "No email"} />
                  <MetaItem label="Phone" value={customer.phone ?? "No phone"} />
                  <MetaItem label="Latest" value={customer.latestOrderNumber ?? "-"} />
                  <MetaItem label="Seen" value={formatTimestamp(customer.latestOrderAt)} />
                </div>
                {customer.notePreview ? (
                  <p className="mt-3 rounded-[22px] bg-system-fill/32 px-4 py-3 text-sm text-secondary-label">
                    {customer.notePreview}
                  </p>
                ) : null}
              </div>

              <div className="grid min-w-[180px] grid-cols-3 gap-3 text-center">
                <CountPill label="Orders" value={customer.totalOrders} />
                <CountPill label="Active" value={customer.activeOrders} />
                <CountPill label="Places" value={customer.addressCount} />
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

function formatSupportState(value: "standard" | "priority" | "follow_up" | "hold") {
  if (value === "follow_up") {
    return "Follow up";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
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

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] bg-system-fill/42 px-3 py-3">
      <div className="text-lg font-semibold text-label">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
    </div>
  );
}
