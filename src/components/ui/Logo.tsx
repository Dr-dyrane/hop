"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src={isDark ? "/images/hero/hon-mark-dark.svg" : "/images/hero/hon-mark.svg"}
        alt=""
        width={28}
        height={28}
        className="h-7 w-auto"
        priority
      />
      {showWordmark && (
        <Image
          src={isDark ? "/images/hero/hon-wordmark-dark.svg" : "/images/hero/hon-wordmark.svg"}
          alt="House of Nutrition"
          width={100}
          height={28}
          className="h-5 w-auto"
          priority
        />
      )}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className={cn("relative", className)}>
      <Image
        src={isDark ? "/images/hero/hon-mark-dark.svg" : "/images/hero/hon-mark.svg"}
        alt="HON"
        width={36}
        height={36}
        priority
      />
    </div>
  );
}
