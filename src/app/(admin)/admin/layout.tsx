import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { ADMIN_HEADER_ROUTES, ADMIN_NAV_ITEMS } from "@/lib/app-shell";
import { requireAdminSession } from "@/lib/auth/guards";
import { listWorkspaceNotificationsForAdmin } from "@/lib/db/repositories/workspace-notification-repository";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession("/admin");
  const notifications = await listWorkspaceNotificationsForAdmin(session.email);

  return (
    <WorkspaceShell
      eyebrow="Operations Console"
      title="Admin"
      navItems={ADMIN_NAV_ITEMS}
      headerRoutes={ADMIN_HEADER_ROUTES}
      mobileNav
      visualStyle="native"
      sessionEmail={session.email}
      sessionRoleLabel="Administrator"
      notifications={notifications}
    >
      {children}
    </WorkspaceShell>
  );
}
