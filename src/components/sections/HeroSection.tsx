"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BadgeList } from "@/components/ui/Badge";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { cn } from "@/lib/utils";
import { ProductFallback } from "@/components/3d/ProductFallback";
import { useHydrated } from "@/hooks/useHydrated";
import type { ProductId } from "@/lib/marketing/types";

export function HeroSection() {
  const { homeSectionsByKey, productIds, productsById } = useMarketingContent();
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const [enableHero3D, setEnableHero3D] = useState(false);
  const [Product3DCarouselComponent, setProduct3DCarouselComponent] = useState<
    (typeof import("@/components/3d/Product3DCarousel"))["Product3DCarousel"] | null
  >(null);
  const heroSettings = homeSectionsByKey.hero?.settings as
    | { badgeItems?: string[]; featuredProductId?: ProductId }
    | undefined;
  const defaultProductId =
    heroSettings?.featuredProductId && productsById[heroSettings.featuredProductId]
      ? heroSettings.featuredProductId
      : productIds[0] ?? null;
  const [currentProduct, setCurrentProduct] = useState<ProductId | null>(defaultProductId);

  useEffect(() => {
    if (!enableHero3D || Product3DCarouselComponent) {
      return;
    }

    let active = true;
    void import("@/components/3d/Product3DCarousel").then((mod) => {
      if (!active) {
        return;
      }
      setProduct3DCarouselComponent(() => mod.Product3DCarousel);
    });

    return () => {
      active = false;
    };
  }, [Product3DCarouselComponent, enableHero3D]);

  const isDark = hydrated && resolvedTheme === "dark";
  const requestHero3D = () => {
    if (!hydrated) {
      return;
    }
    setEnableHero3D(true);
  };

  if (!currentProduct || !productsById[currentProduct]) {
    return null;
  }

  const revealVariants: Variants = {
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

      <div 
        style={{ 
          paddingTop: 'var(--spacing-hero-mobile)', 
          paddingBottom: 'var(--spacing-hero-mobile)' 
        }}
        className="container-shell relative z-10 flex flex-col items-center justify-center min-h-[calc(100svh-120px)] lg:[padding-block:var(--spacing-hero)]"
      >
        {/* Top: Primary Headline */}
        <div className="max-w-4xl text-center mx-auto mb-8 lg:mb-12">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="flex justify-center mb-8"
          >
            <span className="hero-eyebrow">
              <Image
                src="/images/hero/hop-mark.svg"
                alt=""
                width={14}
                height={14}
                className="mr-2 dark:invert"
              />
              <span className="vibrancy-label uppercase tracking-widest text-[10px] font-semibold">
                Plant-Based Performance
              </span>
            </span>
          </motion.div>

          <h1
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[0.85] tracking-tight text-foreground"
            style={{
              fontFamily:
                "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            }}
          >
            Natural Energy
          </h1>
        </div>

        {/* Middle: 3D Product Stage (Full-Width Seedance Style) */}
        <div className="relative w-screen flex items-center justify-center overflow-visible mb-12 lg:mb-16">
          <div
            className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[21/9] flex items-center justify-center overflow-visible"
            onPointerEnter={requestHero3D}
            onTouchStart={requestHero3D}
          >
            <div className="product-shadow-wrap absolute bottom-[2%] w-full">
              <div
                className={cn(
                  "w-full h-16 bg-black/10 blur-[100px] rounded-full scale-x-90 transition-opacity duration-1000",
                  isDark ? "opacity-30" : "opacity-20"
                )}
              />
            </div>

            {!enableHero3D && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ProductFallback
                  imagePath={productsById[currentProduct]?.image ?? ""}
                  className="w-[85%] h-auto max-w-[480px] drop-shadow-[0_45px_120px_rgba(0,0,0,0.22)]"
                  priority
                />
              </div>
            )}

            {enableHero3D && Product3DCarouselComponent && (
              <Product3DCarouselComponent
                activeId={currentProduct}
                onChange={setCurrentProduct}
                isDark={isDark}
              />
            )}
          </div>
        </div>

        {/* Bottom: Variant Name and CTAs */}
        <div className="max-w-4xl text-center mx-auto flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentProduct}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.9, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="block text-3xl sm:text-4xl text-secondary-label italic font-headline tracking-tighter"
            >
              {productsById[currentProduct]?.name}
            </motion.span>
          </AnimatePresence>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="mt-12 flex w-full max-w-[26rem] flex-nowrap items-center justify-center gap-2 sm:max-w-none sm:gap-5"
          >
            <Button
              size="lg"
              variant="primary"
              className="h-14 min-w-0 flex-1 whitespace-nowrap rounded-full px-4 text-[11px] font-bold uppercase tracking-[0.18em] shadow-float transition-all duration-500 hover:scale-[1.02] sm:h-[64px] sm:flex-none sm:px-12 sm:text-sm sm:tracking-widest sm:min-w-[260px]"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const el = document.getElementById("shop");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start Your Order
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="liquid-glass h-14 min-w-0 flex-1 whitespace-nowrap rounded-full px-4 text-[11px] font-bold text-label shadow-soft overflow-hidden transition-all duration-500 hover:bg-white/10 active:scale-95 dark:hover:bg-white/5 sm:h-[64px] sm:flex-none sm:px-12 sm:text-sm sm:min-w-[260px]"
              onClick={() => {
                const el = document.getElementById("ingredients");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Ingredients
            </Button>
          </motion.div>

          <div className="mt-16 w-full flex justify-center">
            <BadgeList
              items={heroSettings?.badgeItems ?? ["Plant-Based", "Clean Ingredients", "Easy Digestion"]}
              className="w-full justify-center"
              animated
            />
          </div>
        </div>
      </div>
    </section>
  );
}
