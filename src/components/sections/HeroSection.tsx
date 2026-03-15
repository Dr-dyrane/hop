"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="hero-shell relative flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Atmosphere Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-grain-layer" />
        
        {/* Light mode glows */}
        <div className="absolute inset-0 dark:hidden">
          <Image 
            src="/images/hero/hero-glow-cream.png" 
            alt="" 
            fill 
            className="object-cover opacity-20 blur-[100px]" 
          />
          <div className="hero-glow hero-glow-primary" />
          <div className="hero-glow hero-glow-secondary" />
        </div>
        
        {/* Dark mode glows */}
        <div className="absolute inset-0 hidden dark:block">
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
        </div>
      </div>

      <div className="container-shell relative z-10 grid items-center gap-12 lg:grid-cols-2 py-20 lg:py-0">
        {/* Copy Layer */}
        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-center lg:text-left"
        >
          <div className="flex justify-center lg:justify-start">
            <span className="hero-eyebrow">
              <Image 
                src="/images/hero/hon-mark.svg" 
                alt="" 
                width={14} 
                height={14} 
                className="mr-2 dark:invert" 
              />
              Plant-Based Performance
            </span>
          </div>

          <h1 className="mt-8 font-headline text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] tracking-[-0.03em] text-foreground">
            Clean Plant Protein
            <br />
            <span className="text-muted">Built for Real Training</span>
          </h1>

          <p className="text-muted mt-8 text-base sm:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
            Premium plant-based protein designed for strength, recovery, and everyday performance.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
            <Button size="lg" variant="primary">Shop Now</Button>
            <Button size="lg" variant="secondary">See Ingredients</Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-medium tracking-wide text-muted uppercase">
            <div className="flex items-center gap-2">
              <Image src="/images/hero/icon-plant.svg" alt="" width={16} height={16} className="opacity-60 dark:invert" />
              <span>Plant-Based</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src="/images/hero/icon-clean.svg" alt="" width={16} height={16} className="opacity-60 dark:invert" />
              <span>Clean Ingredients</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src="/images/hero/icon-digest.svg" alt="" width={16} height={16} className="opacity-60 dark:invert" />
              <span>Easy Digestion</span>
            </div>
          </div>
        </motion.div>

        {/* Product Layer */}
        <div className="relative flex flex-col items-center justify-center lg:justify-end h-full min-h-[420px] lg:min-h-[500px]">
          <div className="relative w-full max-w-[420px] lg:max-w-[480px] aspect-square flex items-center justify-center">
            {/* Shadow under jar */}
            <div className="product-shadow-wrap">
              <Image 
                src="/images/hero/hero-product-shadow.png"
                alt="" 
                width={600} 
                height={100} 
                className="w-full h-auto opacity-30 dark:hidden"
              />
              <Image 
                src="/images/hero/hero-product-shadow-dark.png"
                alt="" 
                width={600} 
                height={100} 
                className="w-full h-auto opacity-50 hidden dark:block"
              />
            </div>

            {/* Floating Jar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full"
            >
              <Image 
                src="/images/hero/hero-product.png"
                alt="House of Nutrition plant protein jar"
                width={800}
                height={1000}
                priority
                className="hero-product-image drop-shadow-2xl dark:hidden"
              />
              <Image 
                src="/images/hero/hero-product-dark.png"
                alt="House of Nutrition plant protein jar"
                width={800}
                height={1000}
                priority
                className="hero-product-image drop-shadow-2xl hidden dark:block"
              />
            </motion.div>
          </div>

          {/* Flavor Chips */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flavor-pills"
          >
            <span className="flavor-pill">Chocolate</span>
            <span className="flavor-pill">Vanilla</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

