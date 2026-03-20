import { requireAdminSession } from "@/lib/auth/guards";
import { listAdminCustomerSummaries } from "@/lib/db/repositories/admin-repository";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function CustomerStatusChip({ value }: { value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[11px] font-semibold tracking-tight text-secondary-label">
      {value.replace(/_/g, " ")}
    </span>
  );
}

export default async function AdminCustomersPage() {
  await requireAdminSession("/admin/customers");
  const customers = await listAdminCustomerSummaries(40);
  const accountLinked = customers.filter((customer) => customer.userId).length;
  const activeCustomers = customers.filter((customer) => customer.activeOrders > 0).length;

  return (
    <div className="space-y-8">
      <section className="glass-morphism rounded-[36px] bg-system-background/86 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Customers
        </p>
        <h2 className="text-3xl font-bold tracking-display text-label">
          Customer directory
        </h2>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
              Visible
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{customers.length}</p>
          </article>
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
              Linked
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{accountLinked}</p>
          </article>
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
              Active
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{activeCustomers}</p>
          </article>
        </div>
      </section>

      <section className="grid gap-4">
        {customers.map((customer) => (
          <article
            key={customer.customerKey}
            className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-headline text-secondary-label">
                  Customer
                </p>
                <p className="text-2xl font-semibold tracking-tight text-label">
                  {customer.fullName ?? customer.email ?? customer.phone ?? "Unnamed"}
                </p>
                <p className="text-sm text-secondary-label">
                  {customer.email ?? "No email"}
                </p>
                <p className="text-sm text-secondary-label">
                  {customer.phone ?? "No phone"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {customer.userId ? (
                  <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[11px] font-semibold tracking-tight text-secondary-label">
                    account
                  </span>
                ) : (
                  <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[11px] font-semibold tracking-tight text-secondary-label">
                    guest
                  </span>
                )}
                <CustomerStatusChip value={customer.latestOrderStatus} />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="text-sm text-secondary-label">
                <div className="font-semibold text-label">{customer.totalOrders}</div>
                <div>orders</div>
              </div>
              <div className="text-sm text-secondary-label">
                <div className="font-semibold text-label">{customer.activeOrders}</div>
                <div>active</div>
              </div>
              <div className="text-sm text-secondary-label">
                <div className="font-semibold text-label">{customer.addressCount}</div>
                <div>addresses</div>
              </div>
              <div className="text-sm text-secondary-label">
                <div className="font-semibold text-label">
                  {customer.latestOrderNumber ?? "-"}
                </div>
                <div>{formatTimestamp(customer.latestOrderAt)}</div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
