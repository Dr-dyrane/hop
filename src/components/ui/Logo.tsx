import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/images/hero/hop-mark.svg"
        alt=""
        width={28}
        height={28}
        className="h-6 -mr-1 w-auto dark:invert"
        priority
      />
      {showWordmark && (
        <Image
          src="/images/hero/hop-wordmark.svg"
          alt="House of Prax"
          width={100}
          height={28}
          className="h-8 -ml-6 w-auto dark:invert"
          priority
        />
      )}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Image
        src="/images/hero/hop-mark.svg"
        alt="HOP"
        width={36}
        height={36}
        className="dark:invert"
        priority
      />
    </div>
  );
}
