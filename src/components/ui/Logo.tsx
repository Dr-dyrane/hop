import React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <Image 
          src="/images/hero/hon-mark.svg" 
          alt="HON Mark" 
          width={32} 
          height={32} 
          className="block dark:hidden"
        />
        <Image 
          src="/images/hero/hon-mark-dark.svg" 
          alt="HON Mark" 
          width={32} 
          height={32} 
          className="hidden dark:block"
        />
      </div>
      <div className="relative">
        <Image 
          src="/images/hero/hon-wordmark.svg" 
          alt="HON" 
          width={140} 
          height={40} 
          className="block dark:hidden h-8 w-auto"
        />
        <Image 
          src="/images/hero/hon-wordmark-dark.svg" 
          alt="HON" 
          width={140} 
          height={40} 
          className="hidden dark:block h-8 w-auto"
        />
      </div>
    </div>
  );
}

export function LogoMark({ className }: LogoProps) {
  return (
    <div className={cn("relative", className)}>
      <Image 
        src="/images/hero/hon-mark.svg" 
        alt="HON Mark" 
        width={40} 
        height={40} 
        className="block dark:hidden"
      />
      <Image 
        src="/images/hero/hon-mark-dark.svg" 
        alt="HON Mark" 
        width={40} 
        height={40} 
        className="hidden dark:block"
      />
    </div>
  );
}
