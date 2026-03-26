"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { CleanIcon, PlantIcon, DigestionIcon } from "@/components/ui/Icons";
import { Lightbulb } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useMobile } from "@/hooks/useMobile";
import type { ProductId } from "@/lib/marketing/types";

type IndicatorIcon = React.ComponentType<{ size?: number; className?: string }>;
type TrustIndicator = { label: string; icon: IndicatorIcon; delay: number };

const TRUST_INDICATORS: TrustIndicator[] = [
  { label: "Clean Ingredients", icon: CleanIcon, delay: 0 },
  { label: "Plant-Based", icon: PlantIcon, delay: 0.1 },
  { label: "Easy Digestion", icon: DigestionIcon, delay: 0.2 },
  { label: "Zero Additives", icon: CleanIcon, delay: 0.3 },
];

export function SolutionSection({
  isScrollingIntoSection,
}: {
  isScrollingIntoSection: (sectionId: string) => boolean;
}) {
  const { brand, homeSectionsByKey, productIds, productsById } = useMarketingContent();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMobile();
  const enableAmbientMotion = !prefersReducedMotion && !isMobile;
  const containerRef = useRef<HTMLDivElement>(null);
  const [Product3DViewerComponent, setProduct3DViewerComponent] = useState<
    (typeof import("@/components/3d/Product3DViewer"))["Product3DViewer"] | null
  >(null);
  
  const solutionSettings = homeSectionsByKey.solution?.settings as { featuredProductId?: ProductId } | undefined;
  const currentProduct = solutionSettings?.featuredProductId && productsById[solutionSettings.featuredProductId]
      ? solutionSettings.featuredProductId
      : productIds[0] ?? null;
  
  const scrollActive = isScrollingIntoSection("solution");

  useEffect(() => {
    if (!scrollActive || !currentProduct || !productsById[currentProduct]?.model || Product3DViewerComponent) {
      return;
    }

    let active = true;
    void import("@/components/3d/Product3DViewer").then((mod) => {
      if (!active) {
        return;
      }
      setProduct3DViewerComponent(() => mod.Product3DViewer);
    });

    return () => {
      active = false;
    };
  }, [Product3DViewerComponent, currentProduct, productsById, scrollActive]);

  // Parallax & Scroll Effects
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.9]);
  const springScale = useSpring(scale, { stiffness: 100, damping: 30 });

  if (!currentProduct || !productsById[currentProduct]) return null;

  return (
    <SectionContainer variant="white" id="solution" spacing="flow" className="relative overflow-hidden min-h-screen">
      {/* Background Cinematic Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          style={enableAmbientMotion ? { rotate } : undefined}
          className="absolute -top-[20%] -right-[10%] w-[60%] aspect-square rounded-full bg-accent/5 blur-[120px]" 
        />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-system-background to-transparent" />
      </div>

      <div ref={containerRef} className="mx-auto flex w-full max-w-7xl flex-col items-center relative z-10">
        <div className="mb-12 flex flex-col items-center text-center sm:mb-16 lg:mb-20">
          <HeroEyebrow position="center" animated>
            <Lightbulb className="w-3.5 h-3.5 mr-3 text-label" />
            The Living Formula
          </HeroEyebrow>
          <h2 className="mt-12 text-6xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.75]">
            Meet <span className="italic opacity-70">{brand.name}.</span>
          </h2>
          <p className="mt-8 max-w-3xl text-lg font-light italic leading-relaxed text-secondary-label/60 sm:mt-10 sm:text-xl md:mt-12 md:text-2xl">
            Redesigned for the athlete. Refined for the everyday. 
            No fillers, just plant-powered performance.
          </p>
        </div>

        <div className="relative flex w-full flex-col gap-8 sm:gap-10 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12">
          
          {/* Left Side Indicators */}
          <div className="order-2 hidden lg:order-1 lg:col-span-3 lg:flex lg:flex-col lg:gap-6">
            {TRUST_INDICATORS.slice(0, 2).map((indicator) => (
              <IndicatorCard key={indicator.label} indicator={indicator} />
            ))}
          </div>

          {/* Central 3D Showcase */}
          <motion.div 
            style={{ scale: springScale }}
            className="order-1 relative flex items-center justify-center py-4 sm:py-6 md:py-8 lg:order-2 lg:col-span-6 lg:py-12"
          >
            {/* Orbital Glass Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                animate={enableAmbientMotion ? { rotate: 360 } : undefined}
                transition={
                  enableAmbientMotion
                    ? { duration: 25, repeat: Infinity, ease: "linear" }
                    : undefined
                }
                className="absolute w-[110%] aspect-square shadow rounded-full"
              />
              <motion.div 
                animate={enableAmbientMotion ? { rotate: -360 } : undefined}
                transition={
                  enableAmbientMotion
                    ? { duration: 20, repeat: Infinity, ease: "linear" }
                    : undefined
                }
                className="absolute w-[95%] aspect-square shadow rounded-full border-dashed"
              />
              <div className="absolute w-[70%] aspect-square bg-accent/[0.03] rounded-full blur-3xl" />
            </div>

            {scrollActive && Product3DViewerComponent ? (
              <Product3DViewerComponent
                modelPath={productsById[currentProduct]?.model ?? ""}
                theme="light"
                className="relative z-10 h-[360px] w-[270px] sm:h-[420px] sm:w-[320px] md:h-[500px] md:w-[360px] lg:h-[600px] lg:w-[400px]"
                sectionId="solution"
                scrollActive={scrollActive}
              />
            ) : (
              <Image
                src={productsById[currentProduct]?.image ?? ""}
                alt={productsById[currentProduct]?.name ?? "Product"}
                width={800}
                height={1000}
                className="relative z-10 w-[270px] object-contain drop-shadow-[0_50px_100px_rgba(0,0,0,0.15)] sm:w-[320px] md:w-[360px] lg:w-[400px]"
              />
            )}
          </motion.div>

          <div className="order-2 grid w-full grid-cols-2 gap-3 sm:gap-4 md:mx-auto md:max-w-3xl md:gap-5 lg:hidden">
            {TRUST_INDICATORS.map((indicator) => (
              <IndicatorCard key={indicator.label} indicator={indicator} />
            ))}
          </div>

          {/* Right Side Indicators */}
          <div className="order-3 hidden lg:col-span-3 lg:flex lg:flex-col lg:gap-6">
            {TRUST_INDICATORS.slice(2, 4).map((indicator) => (
              <IndicatorCard key={indicator.label} indicator={indicator} />
            ))}
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}

function IndicatorCard({ indicator }: { indicator: TrustIndicator }) {
  const Icon = indicator.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: indicator.delay, duration: 0.8 }}
      viewport={{ once: true }}
      className="h-full"
    >
      <LiquidGlassCard
        variant="default"
        intensity="subtle"
        interactive
        className="group flex h-full flex-col items-start gap-3 rounded-3xl p-4 text-left shadow sm:gap-4 sm:p-5 md:p-6 lg:p-8"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/5 transition-colors group-hover:bg-accent/10 sm:h-11 sm:w-11 lg:h-12 lg:w-12">
          <Icon size={20} className="text-accent transition-transform group-hover:scale-110 sm:h-[22px] sm:w-[22px] lg:h-6 lg:w-6" />
        </div>
        <div className="text-[9px] font-bold uppercase leading-snug tracking-[0.16em] text-label/55 transition-opacity group-hover:text-label sm:text-[10px] sm:tracking-[0.18em] lg:tracking-[0.2em]">
          {indicator.label}
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}
