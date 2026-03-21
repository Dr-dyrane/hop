"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  Handbag,
  Home,
  LayoutTemplate,
  MapPinned,
  Package2,
  Plus,
  Save,
  Settings2,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  getShellMatchedRoute,
  isActiveShellPath,
  type ShellFabIcon,
  type ShellHeaderRoute,
  type ShellNavIcon,
  type ShellNavItem,
} from "@/lib/app-shell";
import { useUI } from "@/components/providers/UIProvider";
import { cn } from "@/lib/utils";

const NAV_ICON_MAP: Record<ShellNavIcon, typeof Home> = {
  store: ShoppingBag,
  cart: ShoppingBag,
  orders: Package2,
  addresses: MapPinned,
  reviews: Sparkles,
  profile: UserRound,
  overview: Home,
  payments: CreditCard,
  delivery: Truck,
  catalog: ShoppingBag,
  layout: LayoutTemplate,
  customers: UsersRound,
  settings: Settings2,
};
const FAB_ICON_MAP: Record<ShellFabIcon, typeof Home> = {
  ...NAV_ICON_MAP,
  cart: Handbag,
  add: Plus,
  save: Save,
};

export function WorkspaceNav({
  items,
  headerRoutes = [],
  mode = "sidebar",
}: {
  items: ShellNavItem[];
  headerRoutes?: ShellHeaderRoute[];
  mode?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasActiveOverlay } = useUI();

  if (mode === "mobile") {
    const matchedRoute = getShellMatchedRoute(pathname, headerRoutes);
    const mobileFab = matchedRoute?.mobileFab ?? null;

    const handleMobileFab = () => {
      if (!mobileFab) {
        return;
      }

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
        router.push(mobileFab.href);
      }
    };

    return (
      <>
        <nav
          aria-label="Section navigation"
          className={cn(
            "z-layer-mobile-nav fixed bottom-3 left-3 w-[calc(100vw-5.75rem)] max-w-[24rem] rounded-[28px] bg-[color:var(--system-background)]/24 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm md:hidden",
            hasActiveOverlay && "pointer-events-none translate-y-4 opacity-0"
          )}
        >
          <ul className="scrollbar-hide flex min-w-0 items-center gap-1 overflow-x-auto">
            {items.map((item) => {
              const active = isActiveShellPath(pathname, item);
              const Icon = NAV_ICON_MAP[item.icon];

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-label={item.label}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-full text-[11px] font-semibold tracking-tight transition-all duration-200",
                      active
                        ? "min-w-[7rem] gap-2 bg-[var(--accent)]/20 px-4 shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
                        : "w-11 text-secondary-label hover:bg-system-fill/80 hover:text-label"
                    )}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} />
                    <span
                      className={cn(
                        "overflow-hidden whitespace-nowrap leading-none transition-all duration-200",
                        active ? "max-w-[5rem] opacity-100" : "max-w-0 opacity-0"
                      )}
                    >
                      {item.shortLabel}
                    </span>
                  </Link>
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
            className={cn(
              "z-layer-mobile-fab fixed right-3 bottom-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-label)] shadow-[0_16px_36px_rgba(15,23,42,0.12)] transition-transform duration-200 active:scale-[0.98] md:hidden",
              hasActiveOverlay && "pointer-events-none translate-y-4 opacity-0"
            )}
          >
            {(() => {
              const ActionIcon = FAB_ICON_MAP[mobileFab.icon];
              return <ActionIcon className="h-[20px] w-[20px]" strokeWidth={1.9} />;
            })()}
          </button>
        ) : null}
      </>
    );
  }

  return (
    <nav aria-label="Section navigation" className="space-y-2">
      {items.map((item) => {
        const active = isActiveShellPath(pathname, item);
        const Icon = NAV_ICON_MAP[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-[28px] px-4 py-4 transition-all duration-200",
              active
                ? "bg-[var(--accent)] text-[var(--accent-label)] shadow-button"
                : "glass-morphism bg-system-fill/56 text-label hover:bg-system-fill/76"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  active ? "bg-white/12 text-[var(--accent-label)]" : "bg-system-background/78 text-label"
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
              <div
                className={cn(
                  "text-sm font-semibold tracking-tight",
                  active ? "text-[var(--accent-label)]" : "text-label"
                )}
              >
                {item.label}
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
