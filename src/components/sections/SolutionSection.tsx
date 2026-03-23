"use client";

import React, { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { CleanIcon, PlantIcon, DigestionIcon } from "@/components/ui/Icons";
import { Lightbulb } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import type { ProductId } from "@/lib/marketing/types";

const Product3DViewer = dynamic(
  () => import("@/components/3d/Product3DViewer").then((mod) => mod.Product3DViewer),
  { ssr: false }
);

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
  const containerRef = useRef<HTMLDivElement>(null);
  
  const solutionSettings = homeSectionsByKey.solution?.settings as { featuredProductId?: ProductId } | undefined;
  const currentProduct = solutionSettings?.featuredProductId && productsById[solutionSettings.featuredProductId]
      ? solutionSettings.featuredProductId
      : productIds[0] ?? null;
  
  const scrollActive = isScrollingIntoSection("solution");

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
          style={{ rotate }}
          className="absolute -top-[20%] -right-[10%] w-[60%] aspect-square rounded-full bg-accent/5 blur-[120px]" 
        />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-system-background to-transparent" />
      </div>

      <div ref={containerRef} className="mx-auto flex w-full max-w-7xl flex-col items-center relative z-10">
        <div className="mb-20 flex flex-col items-center text-center">
          <HeroEyebrow position="center" animated>
            <Lightbulb className="w-3.5 h-3.5 mr-3 text-label" />
            The Living Formula
          </HeroEyebrow>
          <h2 className="mt-12 text-6xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.75]">
            Meet <span className="italic opacity-20">{brand.name}.</span>
          </h2>
          <p className="mt-12 text-xl md:text-2xl text-secondary-label/60 max-w-3xl font-light italic leading-relaxed">
            Redesigned for the athlete. Refined for the everyday. 
            No fillers, just plant-powered performance.
          </p>
        </div>

        <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side Indicators */}
          <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
            {TRUST_INDICATORS.slice(0, 2).map((indicator) => (
              <IndicatorCard key={indicator.label} indicator={indicator} />
            ))}
          </div>

          {/* Central 3D Showcase */}
          <motion.div 
            style={{ scale: springScale }}
            className="lg:col-span-6 relative flex items-center justify-center order-1 lg:order-2 py-12"
          >
            {/* Orbital Glass Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute w-[110%] aspect-square shadow rounded-full"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-[95%] aspect-square shadow rounded-full border-dashed"
              />
              <div className="absolute w-[70%] aspect-square bg-accent/[0.03] rounded-full blur-3xl" />
            </div>

            {scrollActive ? (
              <Product3DViewer
                modelPath={productsById[currentProduct]?.model ?? ""}
                theme="light"
                className="relative z-10 w-72 md:w-[400px] h-[500px] md:h-[600px]"
                sectionId="solution"
                scrollActive={scrollActive}
              />
            ) : (
              <Image
                src={productsById[currentProduct]?.image ?? ""}
                alt={productsById[currentProduct]?.name ?? "Product"}
                width={800}
                height={1000}
                className="relative z-10 w-72 md:w-[400px] object-contain drop-shadow-[0_50px_100px_rgba(0,0,0,0.15)]"
              />
            )}
          </motion.div>

          {/* Right Side Indicators */}
          <div className="lg:col-span-3 flex flex-col gap-6 order-3">
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
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: indicator.delay, duration: 0.8 }}
      viewport={{ once: true }}
    >
      <LiquidGlassCard
        variant="default"
        intensity="subtle"
        interactive
        className="group p-8 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 squircle shadow"
      >
        <div className="w-12 h-12 rounded-2xl bg-accent/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
          <Icon size={24} className="text-accent group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-[10px] font-bold text-label tracking-[0.2em] uppercase opacity-40 group-hover:opacity-100 transition-opacity">
          {indicator.label}
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}
