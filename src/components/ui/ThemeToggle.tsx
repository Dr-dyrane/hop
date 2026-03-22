"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle({
  mode = "switch",
}: {
  mode?: "switch" | "icon";
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-12 h-6" />;

  const isDark = resolvedTheme === "dark";

  if (mode === "icon") {
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-system-fill/48 text-secondary-label transition-colors duration-300 ease-in-out outline-none border-none hover:bg-system-fill/64 hover:text-label focus:outline-none focus-visible:ring-0"
        aria-label="Toggle theme"
      >
        <motion.div
          className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--surface)]/84 transform-gpu text-label"
          animate={{ rotate: isDark ? -18 : 0, scale: isDark ? 0.98 : 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
        >
          {isDark ? (
            <Moon size={12} strokeWidth={2.2} />
          ) : (
            <Sun size={12} strokeWidth={2.2} />
          )}
        </motion.div>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center w-12 h-6 p-1 rounded-full bg-border-strong transition-colors duration-300 ease-in-out outline-none border-none focus:outline-none focus-visible:ring-0"
      aria-label="Toggle theme"
    >
      <motion.div
        className="flex items-center justify-center w-4 h-4 rounded-full bg-background shadow-sm transform-gpu text-foreground"
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <Moon size={10} strokeWidth={2.5} />
        ) : (
          <Sun size={10} strokeWidth={2.5} />
        )}
      </motion.div>
    </button>
  );
}
