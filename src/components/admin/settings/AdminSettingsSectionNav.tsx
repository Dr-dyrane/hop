"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SETTINGS_SECTIONS = [
  {
    href: "/admin/settings",
    label: "General",
  },
  {
    href: "/admin/settings/team",
    label: "Team",
  },
] as const;

export function AdminSettingsSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-morphism rounded-[30px] bg-[color:var(--surface)]/88 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap gap-2">
        {SETTINGS_SECTIONS.map((section) => {
          const active =
            section.href === "/admin/settings"
              ? pathname === section.href
              : pathname.startsWith(section.href);

          return (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                "min-h-[42px] rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 inline-flex items-center justify-center",
                active
                  ? "bg-accent/20 text-accent-label"
                  : "bg-system-fill/42 text-secondary-label hover:text-label"
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
