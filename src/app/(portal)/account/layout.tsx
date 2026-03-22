import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { CartDrawer } from "@/components/commerce/CartDrawer";
import { CommerceProvider } from "@/components/providers/CommerceProvider";
import { MarketingContentProvider } from "@/components/providers/MarketingContentProvider";
import { PORTAL_HEADER_ROUTES, PORTAL_NAV_ITEMS } from "@/lib/app-shell";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listWorkspaceNotificationsForCustomer } from "@/lib/db/repositories/workspace-notification-repository";
import { getMarketingSnapshot } from "@/lib/marketing/service";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await requireAuthenticatedSession("/account");
  const [marketingSnapshot, notifications] = await Promise.all([
    getMarketingSnapshot(),
    listWorkspaceNotificationsForCustomer(session.email),
  ]);

  return (
    <MarketingContentProvider snapshot={marketingSnapshot}>
      <CommerceProvider>
        <WorkspaceShell
          eyebrow="Customer Portal"
          title="Store"
          navItems={PORTAL_NAV_ITEMS}
          headerRoutes={PORTAL_HEADER_ROUTES}
          mobileNav
          visualStyle="native"
          sessionEmail={session.email}
          sessionRoleLabel="Signed in"
          notifications={notifications}
        >
          {children}
        </WorkspaceShell>
        <CartDrawer />
      </CommerceProvider>
    </MarketingContentProvider>
  );
}
