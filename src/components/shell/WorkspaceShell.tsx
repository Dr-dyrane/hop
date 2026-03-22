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
import { cn } from "@/lib/utils";

export function WorkspaceShell({
  eyebrow,
  title,
  description,
  navItems,
  headerRoutes,
  children,
  mobileNav = false,
  visualStyle = "glass",
  containMainSurface = false,
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
  visualStyle?: "glass" | "native";
  containMainSurface?: boolean;
  sessionEmail?: string;
  sessionRoleLabel?: string;
  notifications?: WorkspaceNotification[];
}) {
  const nativeMode = visualStyle === "native";

  return (
    <div
      className={cn(
        "min-h-svh",
        nativeMode
          ? "workspace-shell-native"
          : "bg-[radial-gradient(circle_at_top,rgba(15,61,46,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,242,234,0.9)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(215,197,163,0.09),transparent_38%),linear-gradient(180deg,rgba(18,22,18,0.98)_0%,rgba(10,12,10,1)_100%)]"
      )}
    >
      <div className="min-h-svh w-full md:grid md:grid-cols-[80px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] transition-all duration-300">
        <aside
          className={cn(
            "hidden px-3 py-6 md:sticky md:top-0 md:flex md:h-svh md:flex-col md:self-start md:overflow-hidden lg:px-6",
            nativeMode ? "bg-system-background/68" : "bg-system-background/48"
          )}
        >
          <Link href="/" className="inline-flex items-center justify-center lg:justify-start">
            <Logo showWordmark={false} className="lg:hidden" />
            <Logo showWordmark={true} className="hidden lg:flex" />
          </Link>

          <div className="mt-10 md:max-lg:hidden">
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

          <div
            className={cn(
              "squircle px-2 py-3 lg:px-4",
              nativeMode
                ? "workspace-surface bg-system-fill/42 shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
                : "glass-morphism bg-system-fill/56 shadow-soft"
            )}
          >
            <div className="hidden items-start justify-between gap-4 lg:flex">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                  {sessionRoleLabel ?? "Appearance"}
                </div>
                <div className="mt-1 text-sm font-medium text-label">
                  {sessionEmail ?? "Theme"}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                {sessionEmail ? <SignOutButton /> : null}
                {/* <ThemeToggle /> */}
              </div>
            </div>

            <div className="flex items-center justify-center lg:hidden">
              {sessionEmail ? <SignOutButton compact /> : null}
            </div>
          </div>
        </aside>

        <div
          className={cn(
            "min-w-0",
            containMainSurface && "relative overflow-x-clip"
          )}
        >
          {containMainSurface ? (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0",
                nativeMode
                  ? "bg-system-background/88"
                  : "bg-system-background/72"
              )}
            />
          ) : null}

          <header className="z-layer-header sticky top-0 px-2.5 pt-[calc(env(safe-area-inset-top)+0.5rem)] md:px-6 md:pt-6">
            <div
              className={cn(
                "squircle px-3 py-2.5 md:rounded-[30px] md:px-5 md:py-4",
                nativeMode
                  ? "backdrop-blur-md shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
                  : "shadow-soft"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <WorkspaceHeaderTitle
                    eyebrow={eyebrow}
                    title={title}
                    navItems={navItems}
                    routes={headerRoutes}
                  />
                </div>

                <div className="flex items-center gap-2 md:gap-3">
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

          <main className="relative z-[1] w-full px-2.5 pb-32 pt-2.5 md:px-6 md:pb-12 md:pt-8">
            {children}
          </main>
        </div>
      </div>

      {mobileNav ? <WorkspaceNav items={navItems} headerRoutes={headerRoutes} mode="mobile" /> : null}
    </div>
  );
}
