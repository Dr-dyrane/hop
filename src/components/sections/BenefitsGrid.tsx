"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { useMobile } from "@/hooks/useMobile";
import { Zap, Wind, Activity, Leaf, Sparkles } from "lucide-react";

const ICON_MAP = { Zap, Wind, Activity, Leaf };

export function BenefitsGrid() {
  const { benefits } = useMarketingContent();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMobile();
  const enableAmbientMotion = !prefersReducedMotion && !isMobile;

  return (
    <SectionContainer variant="alt" id="benefits" spacing="flow" className="relative overflow-hidden">
      {/* Cinematic Background: Large "Oil" Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={
            enableAmbientMotion
              ? { scale: [1, 1.12, 1], opacity: [0.03, 0.07, 0.03] }
              : undefined
          }
          transition={
            enableAmbientMotion
              ? { duration: 11, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          className="absolute -top-[20%] -left-[10%] w-[60%] aspect-square rounded-full bg-accent blur-[140px]" 
        />
        <div className="absolute bottom-0 right-0 w-[50%] aspect-square bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl relative z-10">
        <div className="mb-16 flex flex-col items-center text-center sm:mb-20 lg:mb-28">
          <HeroEyebrow position="center" animated className="bg-label text-system-background">
            <Sparkles className="w-3.5 h-3.5 mr-3" />
            Bio-Architecture
          </HeroEyebrow>
          
          <h2 className="mt-12 text-6xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.75] text-balance">
            Built for <br /> 
            <span className="italic opacity-70">Elite Output.</span>
          </h2>

          <p className="mt-8 max-w-3xl text-lg font-light italic leading-relaxed text-secondary-label/65 sm:mt-10 sm:text-xl md:mt-12 md:text-2xl">
            Meticulously engineered for those who refuse to compromise. 
            Pure science, encased in glass.
          </p>
        </div>

        {/* The "Floating Lens" Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:perspective-2000">
          {benefits.map((benefit, i) => (
            <BenefitPane 
              key={benefit.title} 
              benefit={benefit} 
              index={i}
              animateEntry={!prefersReducedMotion}
            />
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

type BenefitPaneData = {
  title: string;
  description: string;
  icon: string;
};

function BenefitPane({
  benefit,
  index,
  animateEntry,
}: {
  benefit: BenefitPaneData;
  index: number;
  animateEntry: boolean;
}) {
  const Icon = ICON_MAP[benefit.icon as keyof typeof ICON_MAP] || Activity;

  return (
    <motion.div
      initial={animateEntry ? { opacity: 0, y: 40, rotateX: 10 } : undefined}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={
        animateEntry
          ? { delay: index * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }
          : undefined
      }
      viewport={{ once: true }}
      className="group relative"
    >
      <LiquidGlassCard
        variant="default"
        intensity="subtle"
        interactive
        className="flex h-full min-h-[220px] flex-col justify-between overflow-hidden p-5 squircle shadow-2xl sm:min-h-[280px] sm:p-8 lg:min-h-[340px] lg:p-10"
      >
        {/* The Refractive Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 40%, rgba(var(--accent-rgb),0.12), transparent 70%)",
          }}
        />

        <div className="relative z-10">
          {/* Embossed Icon Container */}
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-accent shadow-inner backdrop-blur-xl transition-all duration-700 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)] sm:mb-8 sm:h-14 sm:w-14 lg:mb-12 lg:h-16 lg:w-16">
            <Icon
              size={20}
              strokeWidth={1}
              className="transition-transform duration-700 group-hover:rotate-12 sm:h-6 sm:w-6 lg:h-7 lg:w-7"
            />
          </div>
          
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            <h3 className="text-lg font-headline font-bold leading-tight text-label tracking-tight transition-all duration-700 group-hover:tracking-tighter sm:text-2xl lg:text-3xl lg:leading-none">
              {benefit.title}
            </h3>
            <p className="text-sm leading-snug font-light italic text-label/40 transition-colors duration-500 group-hover:text-label/60 sm:text-base lg:text-lg">
              {benefit.description}
            </p>
          </div>
        </div>

        {/* The "Result" Trigger */}
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="h-[1px] w-0 bg-accent/40 transition-all duration-1000 ease-out group-hover:w-10 sm:group-hover:w-12 lg:group-hover:w-16" />
          <span className="translate-x-2 text-[8px] font-bold uppercase tracking-[0.28em] text-accent/0 transition-all duration-700 group-hover:translate-x-0 group-hover:text-accent/100 sm:text-[9px] sm:tracking-[0.34em] lg:translate-x-4 lg:tracking-[0.4em]">
            Validated
          </span>
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}
