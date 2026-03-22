"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  getShellHeaderContext,
  type ShellHeaderRoute,
  type ShellNavItem,
} from "@/lib/app-shell";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import { cn } from "@/lib/utils";

export function WorkspaceHeaderTitle({
  eyebrow,
  title,
  navItems,
  routes,
}: {
  eyebrow: string;
  title: string;
  navItems: ShellNavItem[];
  routes: ShellHeaderRoute[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const feedback = useFeedback();
  const context = getShellHeaderContext({
    pathname,
    navItems,
    routes,
    fallbackTitle: title,
  });
  const hasHistoryEntry = typeof window !== "undefined" && window.history.length > 1;
  const hasMobileBack = context.breadcrumbs.length > 0 && hasHistoryEntry;

  return (
    <div className="min-w-0">
      {context.breadcrumbs.length > 0 ? (
        <nav
          aria-label="Breadcrumb"
          className="scrollbar-hide hidden items-center gap-1 overflow-x-auto text-[10px] font-semibold uppercase tracking-headline text-secondary-label md:flex"
        >
          {context.breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href} className="flex items-center gap-1 shrink-0">
              {index > 0 ? <ChevronRight size={12} className="text-tertiary-label" /> : null}
              <Link
                href={breadcrumb.href}
                className={cn(
                  "rounded-full px-1.5 py-0.5 transition-colors duration-200",
                  "hover:bg-system-fill/60 hover:text-label"
                )}
              >
                {breadcrumb.label}
              </Link>
            </div>
          ))}
        </nav>
      ) : (
        <div className="hidden text-[10px] font-semibold uppercase tracking-headline text-secondary-label md:block">
          {eyebrow}
        </div>
      )}

      <div className="flex items-center gap-2 md:hidden">
        {hasMobileBack ? (
          <button
            type="button"
            onClick={() => {
              feedback.selection();
              router.back();
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-system-fill/34 text-tertiary-label transition-colors duration-200 hover:bg-system-fill/52 hover:text-secondary-label"
            aria-label="Go back"
          >
            <ChevronLeft size={16} />
          </button>
        ) : null}
        <div className="truncate text-lg font-semibold tracking-title text-label">
          {context.title}
        </div>
      </div>

      <div className="hidden truncate text-lg font-semibold tracking-title text-label md:mt-1 md:block md:text-2xl">
        {context.title}
      </div>
    </div>
  );
}
