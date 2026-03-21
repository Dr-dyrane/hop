import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { WorkspaceHeaderTitle } from "@/components/shell/WorkspaceHeaderTitle";
import { WorkspaceNav } from "@/components/shell/WorkspaceNav";
import { WorkspaceNotificationSheet } from "@/components/shell/WorkspaceNotificationSheet";
import type { ShellHeaderRoute, ShellNavItem } from "@/lib/app-shell";
import type { WorkspaceNotification } from "@/lib/db/types";

export function WorkspaceShell({
  eyebrow,
  title,
  description,
  navItems,
  headerRoutes,
  children,
  mobileNav = false,
  sessionEmail,
  sessionRoleLabel,
  notifications = [],
}: {
  eyebrow: string;
  title: string;
  description?: string;
  navItems: ShellNavItem[];
  headerRoutes: ShellHeaderRoute[];
  children: ReactNode;
  mobileNav?: boolean;
  sessionEmail?: string;
  sessionRoleLabel?: string;
  notifications?: WorkspaceNotification[];
}) {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(15,61,46,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,242,234,0.9)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(215,197,163,0.09),transparent_38%),linear-gradient(180deg,rgba(18,22,18,0.98)_0%,rgba(10,12,10,1)_100%)]">
      <div className="mx-auto min-h-svh max-w-[1600px] md:grid md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden bg-system-background/48 px-6 py-6 md:sticky md:top-0 md:flex md:h-svh md:flex-col md:self-start md:overflow-hidden">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>

          <div className="mt-10">
            <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              {eyebrow}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-display text-label">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-sm leading-relaxed text-secondary-label">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-10 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-hide">
            <WorkspaceNav items={navItems} />
          </div>

          <div className="glass-morphism rounded-[24px] bg-system-fill/56 px-4 py-3 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                  {sessionRoleLabel ?? "Appearance"}
                </div>
                <div className="mt-1 text-sm font-medium text-label">
                  {sessionEmail ?? "Theme"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {sessionEmail ? <SignOutButton /> : null}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 px-4 pt-4 md:px-6 md:pt-6">
            <div className="glass-morphism rounded-[30px] bg-system-background/78 px-5 py-4 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <WorkspaceHeaderTitle
                    eyebrow={eyebrow}
                    title={title}
                    navItems={navItems}
                    routes={headerRoutes}
                  />
                </div>

                <div className="flex items-center gap-3">
                  {sessionEmail ? (
                    <div className="md:hidden">
                      <SignOutButton />
                    </div>
                  ) : null}
                  <WorkspaceNotificationSheet notifications={notifications} />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          <main className="w-full px-4 pb-28 pt-6 md:px-6 md:pb-12 md:pt-8">
            {children}
          </main>
        </div>
      </div>

      {mobileNav ? <WorkspaceNav items={navItems} headerRoutes={headerRoutes} mode="mobile" /> : null}
    </div>
  );
}
