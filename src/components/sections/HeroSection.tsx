"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <section className="hero-shell relative flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* 1. Atmosphere Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-grain-layer" />
        
        {/* Dynamic Glows */}
        <AnimatePresence mode="wait">
          {mounted && (
            <motion.div
              key={isDark ? "dark" : "light"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              {isDark ? (
                <>
                  <Image 
                    src="/images/hero/hero-glow-forest-dark.png" 
                    alt="" 
                    fill 
                    className="object-cover opacity-40 blur-[120px]" 
                  />
                  <Image 
                    src="/images/hero/hero-glow-beige-dark.png" 
                    alt="" 
                    fill 
                    className="object-cover opacity-20 blur-[100px]" 
                  />
                </>
              ) : (
                <>
                  <Image 
                    src="/images/hero/hero-glow-cream.png" 
                    alt="" 
                    fill 
                    className="object-cover opacity-20 blur-[100px]" 
                  />
                  <div className="hero-glow hero-glow-primary" />
                  <div className="hero-glow hero-glow-secondary" />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="container-shell relative z-10 grid items-center gap-12 lg:grid-cols-2 py-20 lg:py-0">
        {/* 2. Copy Layer */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-center lg:text-left"
        >
          <div className="flex justify-center lg:justify-start">
            <span className="hero-eyebrow">
              <div className="relative inline-block mr-2">
                <Image 
                  src="/images/hero/hon-mark.svg" 
                  alt="" 
                  width={16} 
                  height={16} 
                  className="block dark:hidden" 
                />
                <Image 
                  src="/images/hero/hon-mark-dark.svg" 
                  alt="" 
                  width={16} 
                  height={16} 
                  className="hidden dark:block" 
                />
              </div>
              Plant-Based Performance
            </span>
          </div>

          <h1 className="mt-8 font-headline text-5xl sm:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-foreground font-black">
            Clean Plant Protein
            <br />
            <span className="opacity-90">Built for Real Training</span>
          </h1>

          <p className="text-muted mt-8 text-lg sm:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0">
            Premium plant-based protein designed for strength, recovery, and everyday performance.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
            <Button size="lg" variant="primary">Shop Now</Button>
            <Button size="lg" variant="secondary">See Ingredients</Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4 md:gap-6 text-sm font-semibold text-muted/80">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Image src="/images/hero/icon-plant.svg" alt="" width={18} height={18} className="text-accent" />
              <span>Plant-Based</span>
            </div>
            <span className="hidden sm:inline opacity-20 text-lg">|</span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Image src="/images/hero/icon-clean.svg" alt="" width={18} height={18} className="text-accent" />
              <span>Clean Ingredients</span>
            </div>
            <span className="hidden sm:inline opacity-20 text-lg">|</span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Image src="/images/hero/icon-digest.svg" alt="" width={18} height={18} className="text-accent" />
              <span>Easy Digestion</span>
            </div>
          </div>
        </motion.div>

        {/* 3. Product Layer */}
        <div className="relative flex flex-col items-center justify-center lg:justify-end h-full min-h-[500px]">
          <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
            {/* Shadow under jar */}
            <div className="product-shadow-wrap">
              <AnimatePresence mode="wait">
                {mounted && (
                  <motion.div
                    key={isDark ? "dark-shadow" : "light-shadow"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  >
                    <Image 
                      src={isDark ? "/images/hero/hero-product-shadow-dark.png" : "/images/hero/hero-product-shadow.png"}
                      alt="" 
                      width={600} 
                      height={100} 
                      className={cn("w-full h-auto transition-opacity duration-1000", isDark ? "opacity-60" : "opacity-30")}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating Jar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full"
            >
              <AnimatePresence mode="wait">
                {mounted && (
                  <motion.div
                    key={isDark ? "dark-product" : "light-product"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Image 
                      src={isDark ? "/images/hero/hero-product-dark.png" : "/images/hero/hero-product.png"}
                      alt="House of Nutrition plant protein jar"
                      width={800}
                      height={1000}
                      priority
                      className="hero-product-image drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Flavor Chips */}
          <div className="flavor-pills">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flavor-pill"
            >
              Chocolate
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flavor-pill"
            >
              Vanilla
            </motion.span>
          </div>
        </div>
      </div>
    </section>
  );
}

