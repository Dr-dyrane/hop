"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { useTheme } from "next-themes";

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

      <div className="container-shell relative z-10 grid items-center gap-12 lg:grid-cols-2 min-h-[calc(100svh-120px)] py-24 lg:py-0">
        {/* Copy Layer */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl text-center lg:text-left pt-12 lg:pt-0 mx-auto lg:mx-0"
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
            <span className="block mt-4 sm:mt-6 text-muted italic">Built for Real Training</span>
          </h1>

          <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
            <Button
              size="lg"
              variant="primary"
              onClick={() => {
                const el = document.getElementById("shop");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Choose Your Flavor
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-[11px] font-bold tracking-[0.2em] text-muted uppercase">
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
        <div className="relative flex flex-col items-center justify-center lg:justify-end h-full min-h-[400px] lg:min-h-[500px]">
          <div className="relative w-full max-w-[420px] lg:max-w-[480px] aspect-square flex items-center justify-center">
            <div className="product-shadow-wrap absolute bottom-0 md:bottom-[-5%] w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "shadow-dark" : "shadow-light"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Image
                    src={isDark ? "/images/hero/hero-product-shadow-dark.png" : "/images/hero/hero-product-shadow.png"}
                    alt=""
                    width={600}
                    height={100}
                    className={`w-full h-auto ${isDark ? 'opacity-50' : 'opacity-60'}`}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Floating Jar */}
            <AnimatePresence mode="wait">
              {mounted && (
                <motion.div
                  key={isDark ? "jar-dark" : "jar-light"}
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: 0.1, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 w-[80%] max-w-[400px]"
                >
                  <Image
                    src={isDark ? "/images/hero/hero-product-dark.png" : "/images/hero/hero-product.png"}
                    alt="House of Nutrition plant protein jar"
                    width={800}
                    height={1000}
                    priority
                    className="hero-product-image drop-shadow-2xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Flavor Chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flavor-pills pb-8 lg:pb-0"
          >
            <span className="flavor-pill">Chocolate</span>
            <span className="flavor-pill">Vanilla</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

