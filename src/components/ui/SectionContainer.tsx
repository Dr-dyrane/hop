import { cn } from "@/lib/utils";
import React from "react";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: "white" | "alt";
  id?: string;
}

export function SectionContainer({
  children,
  className,
  variant = "white",
  id,
}: SectionContainerProps) {
  return (
    <section 
      id={id}
      className={cn(
        "section-shell relative flex flex-col items-center justify-center",
        variant === "alt" && "section-shell--alt",
        className
      )}
    >
      <div className="container-shell w-full">
        {children}
      </div>
    </section>
  );
}
