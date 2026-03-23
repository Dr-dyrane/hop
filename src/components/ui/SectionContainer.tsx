import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: "white" | "alt";
  id?: string;
  spacing?: "default" | "flow";
}

export const SectionContainer = forwardRef<HTMLElement, SectionContainerProps>(({
  children,
  className,
  variant = "white",
  id,
  spacing = "default",
}: SectionContainerProps, ref) => {
  const spacingTokens =
    spacing === "flow"
      ? {
          mobileTop: "56px",
          mobileBottom: "72px",
          desktopTop: "88px",
          desktopBottom: "96px",
        }
      : {
          mobileTop: "var(--spacing-section-mobile)",
          mobileBottom: "var(--spacing-section-mobile)",
          desktopTop: "var(--spacing-section)",
          desktopBottom: "var(--spacing-section)",
        };

  return (
    <section 
      id={id}
      ref={ref}
      style={{ 
        // Controlled per-section pacing to maintain story flow.
        ["--section-pt-mobile" as string]: spacingTokens.mobileTop,
        ["--section-pb-mobile" as string]: spacingTokens.mobileBottom,
        ["--section-pt-desktop" as string]: spacingTokens.desktopTop,
        ["--section-pb-desktop" as string]: spacingTokens.desktopBottom,
      }}
      className={cn(
        "section-shell relative flex flex-col items-center min-h-screen justify-center overflow-hidden [padding-top:var(--section-pt-mobile)] [padding-bottom:var(--section-pb-mobile)] lg:[padding-top:var(--section-pt-desktop)] lg:[padding-bottom:var(--section-pb-desktop)]",
        variant === "alt" && "section-shell--alt",
        className
      )}
    >
      <div className="container-shell">
        {children}
      </div>
    </section>
  );
});

SectionContainer.displayName = "SectionContainer";
