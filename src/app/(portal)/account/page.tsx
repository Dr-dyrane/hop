import type { ReactNode } from "react";
import Link from "next/link";
import { PortalStoreShelf } from "@/components/account/PortalStoreShelf";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listPublishedCatalogProducts } from "@/lib/db/repositories/catalog-repository";
import { getPortalAccountSummary } from "@/lib/db/repositories/account-repository";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";
import styles from "./account-page.module.css";

export default async function AccountPage() {
  const session = await requireAuthenticatedSession("/account");
  const [accountSummary, products] = await Promise.all([
    getPortalAccountSummary(session.email),
    listPublishedCatalogProducts(),
  ]);

  const availableProductCount = products.filter((product) => product.isAvailable).length;
  const customerName =
    accountSummary.fullName ?? session.email.split("@")[0] ?? "Customer";
  const hasLatestOrder = Boolean(accountSummary.latestOrderNumber);
  const hasOrders = accountSummary.totalOrders > 0;
  const latestOrderStatusLabel = formatFlowStatusLabel(
    accountSummary.latestOrderStatus ?? "pending"
  );
  const activitySummary = `${accountSummary.activeOrders} active • ${accountSummary.addressCount} places • ${accountSummary.reviewCount} reviews`;
  const completedOrderCount = Math.max(
    0,
    accountSummary.totalOrders - accountSummary.activeOrders
  );

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Account Home</p>
        <h1 className={styles.heroTitle}>Welcome back, {customerName}.</h1>
        <p className={styles.heroDetail}>
          {hasLatestOrder
            ? "Resume your active flow or continue shopping."
            : "Start your first order and manage everything here."}
        </p>

        <div className={styles.heroActions}>
          <Link
            href={hasLatestOrder ? "/account/orders" : "/account#store"}
            className={styles.primaryAction}
          >
            {hasLatestOrder ? "Resume orders" : "Start shopping"}
          </Link>
          <Link href="/account/profile" className={styles.secondaryAction}>
            Open profile
          </Link>
        </div>

        <div className={styles.activityPill}>{activitySummary}</div>
      </section>

      <section className={styles.primaryWorkflow}>
        {hasLatestOrder ? (
          <>
            <div className={styles.primaryWorkflowHead}>
              <div>
                <p className={styles.panelEyebrow}>
                  {accountSummary.activeOrders > 0 ? "Active workflow" : "Latest order"}
                </p>
                <h2 className={styles.orderTitle}>#{accountSummary.latestOrderNumber}</h2>
                <p className={styles.orderStatus}>{latestOrderStatusLabel}</p>
              </div>
              <span className={styles.orderBadge}>
                {accountSummary.activeOrders > 0 ? "Active" : "Completed"}
              </span>
            </div>

            <div className={styles.primaryActionGrid}>
              <Link href="/account/orders" className={styles.surfaceAction}>
                <span className={styles.surfaceActionLabel}>View order flow</span>
                <span className={styles.surfaceActionMeta}>Open</span>
              </Link>
              {hasOrders ? (
                <Link href="/account/reorder" className={styles.surfaceAction}>
                  <span className={styles.surfaceActionLabel}>Reorder from history</span>
                  <span className={styles.surfaceActionMeta}>Open</span>
                </Link>
              ) : null}
            </div>
          </>
        ) : (
          <div className={styles.emptyWorkflow}>
            <p className={styles.panelEyebrow}>Primary workflow</p>
            <h2 className={styles.emptyTitle}>No orders yet.</h2>
            <p className={styles.orderStatus}>Start with a product from the store shelf.</p>
            <div className={styles.primaryActionGrid}>
              <Link href="/account#store" className={styles.surfaceAction}>
                <span className={styles.surfaceActionLabel}>Open store</span>
                <span className={styles.surfaceActionMeta}>Shop</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className={styles.secondarySection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Shortcuts</h2>
        </header>
        <div className={styles.quickGrid}>
          <QuickLink href="/account#store" label="Store" />
          <QuickLink href="/account/orders" label="Orders" />
          <QuickLink href="/account/addresses" label="Places" />
          <QuickLink href="/account/profile" label="Profile" />
        </div>
      </section>

      <section id="store" className={styles.storeSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.storeTitle}>Shop</h2>
            <p className={styles.storeMeta}>{availableProductCount} available</p>
          </div>
        </div>
        <PortalStoreShelf products={products} />
      </section>

      <section className={styles.archiveGrid}>
        <PortalPanel title="Orders" badge={`${accountSummary.totalOrders}`}>
          <div className={styles.archiveMetaCard}>
            <div className={styles.archiveMetaValue}>
              {accountSummary.activeOrders} active
            </div>
            <div className={styles.archiveMetaSub}>{completedOrderCount} completed</div>
          </div>
          <Link href="/account/orders" className={styles.archiveAction}>
            <span className={styles.surfaceActionLabel}>History</span>
            <span className={styles.surfaceActionMeta}>Open</span>
          </Link>
        </PortalPanel>

        <PortalPanel title="Account" badge={customerName.slice(0, 1).toUpperCase()}>
          <div className={styles.archiveMetaCard}>
            <div className={styles.archiveMetaValue}>{customerName}</div>
            <div className={styles.archiveMetaSub}>{session.email}</div>
          </div>
          <div className={styles.archiveSubGrid}>
            <Link href="/account/profile" className={styles.archiveSubAction}>
              <span className={styles.surfaceActionLabel}>Profile</span>
              <span className={styles.surfaceActionMeta}>Edit</span>
            </Link>
            <Link href="/account/addresses" className={styles.archiveSubAction}>
              <span className={styles.surfaceActionLabel}>Places</span>
              <span className={styles.surfaceActionMeta}>Open</span>
            </Link>
          </div>
          <Link href="/account/reviews" className={styles.archiveAction}>
            <span className={styles.surfaceActionLabel}>Reviews</span>
            <span className={styles.surfaceActionMeta}>Open</span>
          </Link>
        </PortalPanel>
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
    <section className={styles.archivePanel}>
      <div className={styles.archivePanelHead}>
        <h2 className={styles.archivePanelTitle}>{title}</h2>
        <span className={styles.archivePanelBadge}>{badge}</span>
      </div>
      <div className={styles.archivePanelBody}>{children}</div>
    </section>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={styles.quickLink}>
      {label}
    </Link>
  );
}
