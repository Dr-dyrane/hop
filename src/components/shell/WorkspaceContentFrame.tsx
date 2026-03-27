"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useUI } from "@/components/providers/UIProvider";

function getInitialOffset(direction: ReturnType<typeof useUI>["navigationDirection"]) {
  if (direction === "forward") {
    return { opacity: 0, x: 26, scale: 0.99 };
  }

  if (direction === "back") {
    return { opacity: 0, x: -20, scale: 0.995 };
  }

  if (direction === "lateral") {
    return { opacity: 0, y: 12, scale: 0.995 };
  }

  return { opacity: 1, x: 0, y: 0, scale: 1 };
}

function getExitOffset(direction: ReturnType<typeof useUI>["navigationDirection"]) {
  if (direction === "forward") {
    return { opacity: 0, x: -14, scale: 0.995 };
  }

  if (direction === "back") {
    return { opacity: 0, x: 18, scale: 0.995 };
  }

  if (direction === "lateral") {
    return { opacity: 0, y: -8, scale: 0.995 };
  }

  return { opacity: 1, x: 0, y: 0, scale: 1 };
}

export function WorkspaceContentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { navigationDirection } = useUI();

  if (prefersReducedMotion) {
    return <div className="min-w-0">{children}</div>;
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={pathname}
        initial={getInitialOffset(navigationDirection)}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={getExitOffset(navigationDirection)}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="min-w-0 transform-gpu"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
