"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import {
  useUI,
  type NavigationDirection,
} from "@/components/providers/UIProvider";
import { getRouteTransitionDirection } from "@/lib/app-shell";

type RouteFeedbackLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  feedbackKind?: "selection" | "tap" | "none";
  navigationDirection?: NavigationDirection;
};

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

export function RouteFeedbackLink({
  href,
  feedbackKind = "selection",
  navigationDirection,
  onClick,
  target,
  ...props
}: RouteFeedbackLinkProps) {
  const pathname = usePathname();
  const feedback = useFeedback();
  const { startRouteNavigation } = useUI();

  return (
    <Link
      {...props}
      href={href}
      target={target}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented || !isPlainLeftClick(event) || target === "_blank") {
          return;
        }

        if (href === pathname) {
          return;
        }

        if (feedbackKind === "selection") {
          feedback.selection();
        } else if (feedbackKind === "tap") {
          feedback.tap();
        }

        startRouteNavigation(
          href,
          navigationDirection ?? getRouteTransitionDirection(pathname, href)
        );
      }}
    />
  );
}
