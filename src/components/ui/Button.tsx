"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "button-primary",
    secondary: "button-secondary",
  };

  const sizes = {
    md: "px-6 py-3 text-sm min-h-[44px]",
    lg: "px-10 py-4 text-base tracking-tight min-h-[52px]",
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
