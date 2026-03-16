"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { wordReveal, textReveal, charReveal, appleEase } from "@/lib/motion";

interface TextRevealProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  mode?: "words" | "chars" | "lines";
  delay?: number;
  stagger?: number;
  once?: boolean;
  blur?: boolean;
}

export function TextReveal({
  children,
  className,
  as: Component = "p",
  mode = "words",
  delay = 0,
  stagger = 0.08,
  once = true,
  blur = true,
}: TextRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: "-50px" });

  const elements = React.useMemo(() => {
    if (mode === "chars") {
      return children.split("").map((char, i) => (
        char === " " ? " " : char
      ));
    }
    if (mode === "lines") {
      return children.split("\n");
    }
    return children.split(" ");
  }, [children, mode]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: mode === "chars" ? 15 : 30,
      filter: blur ? "blur(8px)" : "blur(0px)",
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: mode === "chars" ? 0.4 : 0.7,
        ease: appleEase.out,
      },
    },
  };

  const MotionComponent = motion[Component] || motion.p;

  return (
    <MotionComponent
      ref={ref}
      className={cn("overflow-hidden", className)}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      aria-label={children}
    >
      {elements.map((element, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          className="inline-block"
          style={{ 
            whiteSpace: mode === "chars" && element === " " ? "pre" : "normal",
            marginRight: mode === "words" ? "0.25em" : 0,
          }}
        >
          {element}
        </motion.span>
      ))}
    </MotionComponent>
  );
}

// Simpler headline reveal for large text
interface HeadlineRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function HeadlineReveal({ 
  children, 
  className,
  delay = 0,
}: HeadlineRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : { y: "100%", opacity: 0 }}
        transition={{
          duration: 1.0,
          ease: appleEase.out,
          delay,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Split text for dramatic reveals
interface SplitTextProps {
  children: string;
  className?: string;
  highlightWords?: string[];
  highlightClassName?: string;
}

export function SplitText({
  children,
  className,
  highlightWords = [],
  highlightClassName = "text-accent",
}: SplitTextProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const words = children.split(" ");

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
      }}
    >
      {words.map((word, i) => {
        const isHighlighted = highlightWords.some(
          (hw) => word.toLowerCase().includes(hw.toLowerCase())
        );
        return (
          <motion.span
            key={i}
            className={cn(
              "inline-block mr-[0.25em]",
              isHighlighted && highlightClassName
            )}
            variants={{
              hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.6, ease: appleEase.out },
              },
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.div>
  );
}
