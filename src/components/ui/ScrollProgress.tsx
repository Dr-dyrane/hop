"use client";

import React from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  className?: string;
  color?: string;
  height?: number;
  showAfterScroll?: number;
}

export function ScrollProgress({
  className,
  height = 2,
  showAfterScroll = 100,
}: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = React.useState(false);
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  React.useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfterScroll);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showAfterScroll]);

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] origin-left",
        "bg-accent",
        className
      )}
      style={{
        height,
        scaleX,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ opacity: { duration: 0.3 } }}
    />
  );
}

// Section progress indicator
interface SectionProgressProps {
  sections: string[];
  className?: string;
}

export function SectionProgress({ sections, className }: SectionProgressProps) {
  const [activeSection, setActiveSection] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      sections.forEach((sectionId, index) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  return (
    <div className={cn("fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3", className)}>
      {sections.map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors duration-300",
            index === activeSection ? "bg-accent" : "bg-border-soft"
          )}
          animate={{
            scale: index === activeSection ? 1.5 : 1,
          }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
}
