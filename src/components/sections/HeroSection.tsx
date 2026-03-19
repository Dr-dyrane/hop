"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BadgeList } from "@/components/ui/Badge";
import Image from "next/image";
import { useTheme } from "next-themes";
import { PRODUCTS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ProductFallback } from "@/components/3d/ProductFallback";

const Product3DCarousel = dynamic(
  () =>
    import("@/components/3d/Product3DCarousel").then((mod) => mod.Product3DCarousel),
  { ssr: false }
);

export function HeroSection({
  activeSection,
  isScrollingIntoSection,
  isScrollingOutOfSection,
}: {
  activeSection: string | null;
  isScrollingIntoSection: (sectionId: string) => boolean;
  isScrollingOutOfSection: (sectionId: string) => boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [enableHero3D, setEnableHero3D] = useState(false);
  const [currentProduct, setCurrentProduct] =
    useState<keyof typeof PRODUCTS>("protein_chocolate");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const enable = () => setEnableHero3D(true);
    const idleCallback =
      typeof globalThis.requestIdleCallback === "function"
        ? globalThis.requestIdleCallback.bind(globalThis)
        : null;
    const cancelIdleCallback =
      typeof globalThis.cancelIdleCallback === "function"
        ? globalThis.cancelIdleCallback.bind(globalThis)
        : null;

    if (idleCallback && cancelIdleCallback) {
      const idleId = idleCallback(enable, { timeout: 1500 });
      return () => cancelIdleCallback(idleId);
    }

    const timer = globalThis.setTimeout(enable, 900);
    return () => globalThis.clearTimeout(timer);
  }, [mounted]);

  const isDark = mounted && resolvedTheme === "dark";

  const revealVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.1,
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  return (
    <section
      id="hero"
      className="hero-shell relative flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none">
        <div className="hero-grain-layer" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentProduct + (isDark ? "-dark" : "-light")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="stage-light"
          />
        </AnimatePresence>
      </div>

      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={revealVariants}
        className="flex justify-center lg:justify-start mb-8"
      >
        <span className="hero-eyebrow">
          <Image
            src="/images/hero/hop-mark.svg"
            alt=""
            width={14}
            height={14}
            className="mr-2 dark:invert"
          />
          <span className="vibrancy-label uppercase">Plant-Based Performance</span>
        </span>
      </motion.div>

      <div className="container-shell relative z-10 grid items-center gap-12 lg:grid-cols-2 min-h-[calc(100svh-120px)] py-0">
        <div className="max-w-xl text-center lg:text-left pt-6 lg:pt-0 mx-auto lg:mx-0">
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="font-headline text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-tight tracking-display text-foreground"
          >
            Natural Energy
            <AnimatePresence mode="wait">
              <motion.span
                key={currentProduct}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.8, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="block mt-4 sm:mt-6 text-secondary-label italic font-headline tracking-headline"
              >
                {PRODUCTS[currentProduct].name}
              </motion.span>
            </AnimatePresence>
          </motion.h1>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="mt-16 flex flex-row gap-4 justify-center lg:justify-start items-center"
          >
            <Button
              size="lg"
              variant="primary"
              className="px-10 sm:min-w-[240px] shadow-float"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const el = document.getElementById("shop");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Start Your Order
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="px-10 liquid-glass !border-none text-label font-bold shadow-soft overflow-hidden"
              onClick={() => {
                const el = document.getElementById("ingredients");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              View Ingredients
            </Button>
          </motion.div>

          <BadgeList
            items={["Plant-Based", "Clean Ingredients", "Easy Digestion"]}
            className="mt-16"
            animated
          />
        </div>

        <div className="relative flex w-full items-center justify-center min-h-[420px] sm:min-h-[480px] lg:min-h-[560px] xl:min-h-[620px]">
          <div className="relative w-full min-w-0 max-w-[440px] sm:max-w-[520px] lg:max-w-[580px] xl:max-w-[640px] aspect-[5/4] lg:aspect-[4/3] flex items-center justify-center">
            <div className="product-shadow-wrap absolute bottom-0 md:bottom-[-5%] w-full">
              <div
                className={cn(
                  "w-full h-8 bg-black/10 blur-[40px] rounded-full scale-x-75 transition-opacity duration-1000",
                  isDark ? "opacity-30" : "opacity-20"
                )}
              />
            </div>

            {!enableHero3D && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ProductFallback
                  imagePath={PRODUCTS[currentProduct].image}
                  className="w-[78%] h-auto max-w-[360px] sm:max-w-[420px] lg:max-w-[460px]"
                  priority
                />
              </div>
            )}

            {enableHero3D && (
              <Product3DCarousel
                activeId={currentProduct}
                onChange={(id) => setCurrentProduct(id as keyof typeof PRODUCTS)}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
