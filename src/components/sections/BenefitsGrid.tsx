"use client";

import React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { Zap, Wind, Activity, Leaf, Sparkles } from "lucide-react";

const ICON_MAP = { Zap, Wind, Activity, Leaf };

export function BenefitsGrid() {
  const { benefits } = useMarketingContent();

  return (
    <SectionContainer variant="alt" id="benefits" spacing="flow" className="relative overflow-hidden">
      {/* Cinematic Background: Large "Oil" Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.07, 0.03] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-[20%] -left-[10%] w-[60%] aspect-square rounded-full bg-accent blur-[140px]" 
        />
        <div className="absolute bottom-0 right-0 w-[50%] aspect-square bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl relative z-10">
        <div className="mb-28 flex flex-col items-center text-center">
          <HeroEyebrow position="center" animated className="bg-label text-system-background">
            <Sparkles className="w-3.5 h-3.5 mr-3" />
            Bio-Architecture
          </HeroEyebrow>
          
          <h2 className="mt-12 text-6xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.75] text-balance">
            Built for <br /> 
            <span className="italic opacity-20">Elite Output.</span>
          </h2>

          <p className="mt-12 text-xl md:text-2xl text-secondary-label/40 max-w-3xl font-light italic leading-relaxed">
            Meticulously engineered for those who refuse to compromise. 
            Pure science, encased in glass.
          </p>
        </div>

        {/* The "Floating Lens" Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:perspective-2000">
          {benefits.map((benefit, i) => (
            <BenefitPane 
              key={benefit.title} 
              benefit={benefit} 
              index={i}
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

function BenefitPane({ benefit, index }: { benefit: BenefitPaneData; index: number }) {
  const Icon = ICON_MAP[benefit.icon as keyof typeof ICON_MAP] || Activity;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  // Light beam that follows the mouse inside the glass
  const background = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, rgba(var(--accent-rgb), 0.12), transparent 40%)`
  );

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 40, rotateX: 10 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="group relative"
    >
      <LiquidGlassCard
        variant="default"
        intensity="subtle"
        interactive
        className="h-full min-h-[340px] p-10 flex flex-col justify-between overflow-hidden squircle shadow-2xl"
      >
        {/* The Refractive Layer */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ background }}
        />

        <div className="relative z-10">
          {/* Embossed Icon Container */}
          <div className="w-16 h-16 bg-white/[0.03] backdrop-blur-xl rounded-2xl flex items-center justify-center mb-12 text-accent shadow-inner group-hover:scale-110 transition-all duration-700 group-hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.2)]">
            <Icon size={28} strokeWidth={1} className="group-hover:rotate-12 transition-transform duration-700" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-3xl font-headline font-bold text-label tracking-tight leading-none group-hover:tracking-tighter transition-all duration-700">
              {benefit.title}
            </h3>
            <p className="text-label/30 text-lg leading-snug font-light italic group-hover:text-label/60 transition-colors duration-500">
              {benefit.description}
            </p>
          </div>
        </div>

        {/* The "Result" Trigger */}
        <div className="relative z-10 flex items-center gap-4">
          <motion.div 
            className="h-[1px] bg-accent/40 w-0 group-hover:w-16 transition-all duration-1000 ease-out"
          />
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-accent/0 group-hover:text-accent/100 transition-all duration-700 translate-x-4 group-hover:translate-x-0">
            Validated
          </span>
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}
