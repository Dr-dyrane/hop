import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/images/hero/hon-mark.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-auto dark:invert"
        priority
      />
      {showWordmark && (
        <Image
          src="/images/hero/hon-wordmark.svg"
          alt="House of Nutrition"
          width={100}
          height={28}
          className="h-5 w-auto dark:invert"
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
        src="/images/hero/hon-mark.svg"
        alt="HON"
        width={36}
        height={36}
        className="dark:invert"
        priority
      />
    </div>
  );
}
