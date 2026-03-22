import type { ReactNode } from "react";
import Link from "next/link";
import { Bookmark, Receipt, Sparkles } from "lucide-react";
import { PortalStoreShelf } from "@/components/account/PortalStoreShelf";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listPublishedCatalogProducts } from "@/lib/db/repositories/catalog-repository";
import { getPortalAccountSummary } from "@/lib/db/repositories/account-repository";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";

export default async function AccountPage() {
  const session = await requireAuthenticatedSession("/account");
  const [accountSummary, products] = await Promise.all([
    getPortalAccountSummary(session.email),
    listPublishedCatalogProducts(),
  ]);
  const availableProductCount = products.filter((product) => product.isAvailable).length;
  const featuredProductCount = products.filter(
    (product) => product.merchandisingState === "featured"
  ).length;
  const customerName =
    accountSummary.fullName ?? session.email.split("@")[0] ?? "Customer";

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <section className="space-y-5">
        <div className="rounded-[24px] bg-system-fill/42 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:inline-flex">
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-4">
            <QuickLink href="/account#store" label="Store" />
            <QuickLink href="/account/orders" label="Orders" />
            <QuickLink href="/account/addresses" label="Places" />
            <QuickLink href="/account/profile" label="Profile" />
          </div>
        </div>

        <MetricRail
          items={[
            {
              label: "Active",
              value: `${accountSummary.activeOrders}`,
              detail: "Live",
              icon: Receipt,
            },
            {
              label: "Places",
              value: `${accountSummary.addressCount}`,
              detail: "Saved",
              icon: Bookmark,
            },
            {
              label: "Reviews",
              value: `${accountSummary.reviewCount}`,
              detail: "Sent",
              icon: Sparkles,
              tone: "success",
            },
          ]}
          columns={3}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PortalPanel title="Order" badge={accountSummary.latestOrderNumber ? "Live" : "New"}>
          {accountSummary.latestOrderNumber ? (
            <Link
              href="/account/orders"
              className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/58"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-label">
                  #{accountSummary.latestOrderNumber}
                </div>
                <div className="mt-1 truncate text-xs text-secondary-label">
                  {formatFlowStatusLabel(accountSummary.latestOrderStatus ?? "pending")}
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                View
              </span>
            </Link>
          ) : (
            <EmptyRow label="No order yet." />
          )}
        </PortalPanel>

        <PortalPanel title="You" badge={customerName.slice(0, 1).toUpperCase()}>
          <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
            <div className="text-sm font-semibold text-label">{customerName}</div>
            <div className="mt-1 truncate text-xs text-secondary-label">{session.email}</div>
          </div>
          <Link
            href="/account/profile"
            className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/58"
          >
            <span className="text-sm font-semibold text-label">Profile</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Edit
            </span>
          </Link>
        </PortalPanel>

        <PortalPanel title="Shop" badge={`${availableProductCount}`}>
          <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
            <div className="text-sm font-semibold text-label">
              {availableProductCount} available
            </div>
            <div className="mt-1 text-xs text-secondary-label">
              {featuredProductCount} featured now
            </div>
          </div>
          <Link
            href={accountSummary.totalOrders > 0 ? "/account/reorder" : "/account#store"}
            className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/58"
          >
            <span className="text-sm font-semibold text-label">
              {accountSummary.totalOrders > 0 ? "Reorder" : "Browse"}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              View
            </span>
          </Link>
        </PortalPanel>
      </section>

      <section id="store" className="scroll-mt-28">
        <PortalStoreShelf products={products} />
      </section>
    </div>
  );
}

function PortalPanel({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-label">{title}</h2>
        <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          {badge}
        </span>
      </div>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
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

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label">
      {label}
    </div>
  );
}
