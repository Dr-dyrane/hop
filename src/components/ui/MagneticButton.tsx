"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { appleEase } from "@/lib/motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg" | "xl";
  disabled?: boolean;
  glow?: boolean;
}

export function MagneticButton({
  children,
  className,
  strength = 0.35,
  radius = 150,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  glow = true,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    
    if (distance < radius) {
      const factor = 1 - distance / radius;
      setPosition({
        x: distanceX * strength * factor,
        y: distanceY * strength * factor,
      });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const variants = {
    primary: cn(
      "bg-accent text-accent-foreground",
      glow && "shadow-[0_0_0_0_rgba(var(--accent-rgb),0)]",
      glow && isHovered && "shadow-[0_8px_30px_-4px_rgba(215,197,163,0.4)]"
    ),
    secondary: cn(
      "bg-surface-alt text-foreground border border-border-soft",
      isHovered && "bg-surface border-border-strong"
    ),
    ghost: cn(
      "bg-transparent text-foreground",
      isHovered && "bg-surface-alt"
    ),
  };

  const sizes = {
    md: "px-8 py-4 text-sm min-h-[52px]",
    lg: "px-10 py-5 text-base min-h-[60px]",
    xl: "px-14 py-6 text-lg min-h-[72px]",
  };

  return (
    <motion.button
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center gap-2",
        "font-semibold tracking-wide uppercase",
        "rounded-full overflow-hidden",
        "transition-colors duration-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      animate={{
        x: position.x,
        y: position.y,
      }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 20,
        mass: 0.5,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
    >
      {/* Inner glow effect */}
      {glow && variant === "primary" && (
        <motion.div
          className="absolute inset-0 rounded-full bg-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Content with slight magnetic effect */}
      <motion.span
        className="relative z-10 flex items-center gap-2"
        animate={{
          x: position.x * 0.15,
          y: position.y * 0.15,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}

// Simpler magnetic wrapper for any element
interface MagneticWrapperProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticWrapper({
  children,
  className,
  strength = 0.25,
}: MagneticWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    setPosition({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength,
    });
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      animate={{ x: position.x, y: position.y }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 20,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPosition({ x: 0, y: 0 })}
    >
      {children}
    </motion.div>
  );
}
