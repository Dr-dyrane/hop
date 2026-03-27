"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  getActiveShellNavItem,
  getRouteTransitionDirection,
  getShellMatchedRoute,
  isActiveShellPath,
  type ShellFabAction,
  type ShellFabIcon,
  type ShellHeaderRoute,
  type ShellNavIcon,
  type ShellNavItem,
} from "@/lib/app-shell";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import { useUI } from "@/components/providers/UIProvider";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";
import { RouteFeedbackLink } from "@/components/ui/RouteFeedbackLink";

const NAV_ICON_MAP: Record<ShellNavIcon, IconName> = {
  store: "store",
  cart: "bag",
  orders: "orders",
  addresses: "map-pin",
  reviews: "sparkles",
  profile: "account",
  overview: "home",
  payments: "credit-card",
  delivery: "truck",
  catalog: "store",
  layout: "layout",
  customers: "users",
  settings: "settings",
};

const FAB_ICON_MAP: Record<ShellFabIcon, IconName> = {
  ...NAV_ICON_MAP,
  cart: "bag",
  add: "plus",
  save: "save",
};

export function WorkspaceNav({
  items,
  headerRoutes = [],
  mode = "sidebar",
  isCompact = false,
}: {
  items: ShellNavItem[];
  headerRoutes?: ShellHeaderRoute[];
  mode?: "sidebar" | "mobile";
  isCompact?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasActiveOverlay, pendingPathname, startRouteNavigation } = useUI();
  const feedback = useFeedback();

  if (mode === "mobile") {
    const activeItem = getActiveShellNavItem(pathname, items);
    const orderedItems = activeItem
      ? [activeItem, ...items.filter((item) => item.href !== activeItem.href)]
      : items;
    const matchedRoute = getShellMatchedRoute(pathname, headerRoutes);
    const defaultAdminFab: ShellFabAction | null = pathname.startsWith("/admin")
      ? {
          label: "New product",
          icon: "add",
          kind: "link",
          href: "/admin/catalog/products/new",
        }
      : null;
    const mobileFab = matchedRoute?.mobileFab ?? defaultAdminFab;

    const handleMobileFab = () => {
      if (!mobileFab) {
        return;
      }

      feedback.selection();

      if (mobileFab.kind === "cart") {
        window.dispatchEvent(new Event("commerce:open-cart"));
        return;
      }

      if (mobileFab.kind === "submit") {
        const form = mobileFab.formId ? document.getElementById(mobileFab.formId) : null;
        if (form instanceof HTMLFormElement) {
          form.requestSubmit();
        }
        return;
      }

      if (mobileFab.kind === "event") {
        if (mobileFab.eventName) {
          window.dispatchEvent(new CustomEvent(mobileFab.eventName));
        }
        return;
      }

      if (mobileFab.href) {
        startRouteNavigation(
          mobileFab.href,
          getRouteTransitionDirection(pathname, mobileFab.href)
        );
        router.push(mobileFab.href);
      }
    };

    return (
      <>
        <nav
          aria-label="Section navigation"
          data-tour-id="workspace-mobile-nav"
          className={cn(
            "z-layer-mobile-nav fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 w-[calc(100vw-5.75rem)] max-w-[24rem] rounded-[28px] bg-[color:var(--surface)]/20 p-1.5 shadow-[0_20px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl md:hidden",
            hasActiveOverlay && "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <ul className="scrollbar-hide flex min-w-0 items-center gap-1 overflow-x-auto">
            {orderedItems.map((item) => {
              const active = isActiveShellPath(pathname, item);
              const pending = pendingPathname
                ? isActiveShellPath(pendingPathname, item)
                : false;
              const highlighted = active || pending;

              return (
                <li key={item.href} className="shrink-0">
                  <RouteFeedbackLink
                    href={item.href}
                    aria-label={item.label}
                    navigationDirection={getRouteTransitionDirection(pathname, item.href)}
                    className={cn(
                      "motion-press-soft flex h-12 items-center justify-center rounded-full text-[11px] font-semibold tracking-tight transition-all duration-200",
                      highlighted
                        ? "min-w-[6.75rem] gap-2 px-4 text-label shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
                        : "w-11 text-secondary-label hover:bg-system-fill/80 hover:text-label",
                      pending && !active && "animate-pulse"
                    )}
                    aria-current={active ? "page" : undefined}
                    style={
                      highlighted
                        ? {
                            backgroundColor:
                              active
                                ? "color-mix(in srgb, var(--accent) 16%, var(--surface) 84%)"
                                : "color-mix(in srgb, var(--accent) 11%, var(--surface) 89%)",
                          }
                        : undefined
                    }
                  >
                    <Icon name={NAV_ICON_MAP[item.icon]} className="h-[17px] w-[17px]" strokeWidth={1.9} />
                    <span
                      className={cn(
                        "overflow-hidden whitespace-nowrap leading-none transition-all duration-200",
                        highlighted ? "max-w-[5rem] opacity-100" : "max-w-0 opacity-0"
                      )}
                    >
                      {item.shortLabel}
                    </span>
                  </RouteFeedbackLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {mobileFab ? (
          <button
            type="button"
            onClick={handleMobileFab}
            aria-label={mobileFab.label}
            data-tour-id="workspace-mobile-fab"
            className={cn(
              "motion-press z-layer-mobile-fab fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-label)] shadow-[0_18px_40px_rgba(15,23,42,0.16)] transition-transform duration-200 md:hidden",
              mobileFab.href && pendingPathname === mobileFab.href && "scale-[0.96] opacity-80",
              hasActiveOverlay && "pointer-events-none translate-y-4 opacity-0"
            )}
          >
            <Icon name={FAB_ICON_MAP[mobileFab.icon]} className="h-[20px] w-[20px]" strokeWidth={1.9} />
          </button>
        ) : null}
      </>
    );
  }

  return (
    <nav aria-label="Section navigation" className="space-y-2">
      {items.map((item) => {
        const active = isActiveShellPath(pathname, item);
        const pending = pendingPathname ? isActiveShellPath(pendingPathname, item) : false;
        const highlighted = active || pending;

        return (
          <RouteFeedbackLink
            key={item.href}
            href={item.href}
            navigationDirection={getRouteTransitionDirection(pathname, item.href)}
            className={cn(
              "motion-press-soft block squircle transition-all duration-200",
              isCompact ? "px-0 py-2" : "px-1 py-1 md:max-lg:px-0 md:max-lg:py-2",
              highlighted
                ? "bg-muted text-[var(--accent-label)] shadow-button"
                : "bg-system-fill/10 text-label hover:bg-system-fill/76",
              pending && !active && "animate-pulse"
            )}
          >
            <div className={cn("flex items-center gap-3", (isCompact || mode === "sidebar") && "md:max-lg:justify-center md:max-lg:gap-0", isCompact && "justify-center gap-0")}>
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center squircle",
                  highlighted
                    ? "bg-white/12 text-[var(--accent-label)]"
                    : "bg-[color:var(--surface)]/88 text-label"
                )}
              >
                <Icon name={NAV_ICON_MAP[item.icon]} className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
              <div
                className={cn(
                  "text-sm font-semibold tracking-tight transition-all duration-200",
                  highlighted ? "text-[var(--accent-label)]" : "text-label",
                  (isCompact || mode === "sidebar") && "md:max-lg:hidden"
                )}
              >
                {item.label}
              </div>
            </div>
          </RouteFeedbackLink>
        );
      })}
    </nav>
  );
}
