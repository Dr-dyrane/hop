"use client";

/* 
  CHANGES DOCUMENTATION:
  
  ORIGINAL IMPLEMENTATION (for rollback reference):
  <div
    key={problem}
    data-aos="zoom-in-up"
    data-aos-duration="600"
    data-aos-delay={400 + i * 100}
    className="card-premium p-10 flex flex-col items-start justify-between min-h-[220px] group hover:bg-system-background transition-all duration-700 hover:shadow-float squircle"
  >
    <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent text-[10px] font-semibold tracking-headline group-hover:scale-110 transition-transform">
      0{i + 1}
    </div>
    <div>
      <h3 className="text-2xl font-headline font-bold text-label tracking-headline leading-tight group-hover:text-accent transition-colors">{problem}</h3>
      <div className="h-[2px] w-0 bg-accent/20 mt-4 group-hover:w-full transition-all duration-700" />
    </div>
  </div>

  ORIGINAL CTA IMPLEMENTATION:
  <div
    data-aos="fade-up"
    data-aos-duration="1000"
    data-aos-delay="800"
    className="p-24 md:p-48 flex flex-col items-center justify-center squircle cta-inverse text-center relative overflow-hidden shadow-[0_50px_100px_-30px_rgba(0,0,0,0.3)] dark:shadow-none"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#d7c5a3_0%,_transparent_70%)] opacity-10 pointer-events-none blur-3xl" />
    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-accent mb-10 block">Perspective</span>
    <h3 className="relative z-10 text-4xl md:text-7xl font-headline font-bold tracking-display mb-12 leading-tight">
      Your body deserves <br /> better fuel.
    </h3>
    <div className="w-12 h-[4px] bg-accent/30 mx-auto mb-12 rounded-full" />
    <p className="relative z-10 text-xl leading-normal tracking-body w-full italic opacity-70">
      "Don't build your foundation on sand. Choose a system <br className="hidden md:block" /> designed for longevity and power."
    </p>
  </div>
  
  CHANGES MADE:
  REMOVED: card-premium class and basic hover effects on problem cards
  ADDED: LiquidGlassCard wrapper component for problem cards
  ADDED: variant="default" intensity="subtle" interactive={true} for problem cards
  ADDED: squircle class for Apple-style corners
  ADDED: proper z-index layering for content
  
  REMOVED: cta-inverse class and basic styling on CTA section
  ADDED: LiquidGlassCard wrapper component for CTA section
  ADDED: variant="default" intensity="subtle" interactive={false} for CTA
  ADDED: full liquid glass system with bubble oil effects to declaration
  
  MAINTAINED: All original AOS animations and delays across both sections
  MAINTAINED: Original hover states and transitions on problem cards
  MAINTAINED: Number badges and text hierarchy on problem cards
  MAINTAINED: All CTA content including atmosphere bridge, typography, and styling
  MAINTAINED: Original visual hierarchy and spacing throughout section
  
  LIQUID GLASS FEATURES: Mouse-tracking light refraction, soap bubble iridescence, surface tension morphing, three-layer system
*/

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { BadgeList } from "@/components/ui/Badge";
import { AlertTriangle } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";

const PROBLEMS = [
  "Artificial Sweeteners",
  "Dairy Bloat",
  "Cheap Fillers",
  "Harsh Digestion"
];

export function ProblemSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <SectionContainer variant="alt" id="problem" className="overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-20 py-12">
        <div className="lg:w-1/2 flex flex-col gap-4">
          <HeroEyebrow
            position="left"
            animated
            className="bg-label text-system-background"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-3" />
            The Market Status
          </HeroEyebrow>
          <h2
            data-aos="fade-right"
            data-aos-duration="800"
            data-aos-delay="200"
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-headline font-bold text-label leading-tight tracking-display"
          >
            Most Protein <br />
            <span className="text-secondary-label opacity-20 tracking-tight">Are Junk.</span>
          </h2>
          <p
            data-aos="fade-up"
            data-aos-duration="700"
            data-aos-delay="300"
            className="mt-12 text-xl text-secondary-label opacity-60 leading-normal tracking-body max-w-md italic"
          >
            The industry is built on compromises. We chose a different path—prioritizing gut health and biological performance over cheap manufacturing.
          </p>

          <BadgeList
            items={PROBLEMS}
            className="mt-16"
            animated
          />
        </div>

        <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {PROBLEMS.map((problem, i) => (
            <LiquidGlassCard
              key={problem}
              variant="default"
              intensity="subtle"
              interactive={true}
              className="min-h-[220px] p-10 flex flex-col items-start justify-between overflow-hidden squircle"
              data-aos="zoom-in-up"
              data-aos-duration="600"
              data-aos-delay={400 + i * 100}
            >
              <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent text-[10px] font-semibold tracking-headline group-hover:scale-110 transition-transform">
                0{i + 1}
              </div>
              <div>
                <h3 className="text-2xl font-headline font-bold text-label tracking-headline leading-tight group-hover:text-accent transition-colors">{problem}</h3>
                <div className="h-[2px] w-0 bg-accent/20 mt-4 group-hover:w-full transition-all duration-700" />
              </div>
            </LiquidGlassCard>
          ))}
        </div>
      </div>

      <div className="relative mt-40">
        {/* Atmosphere bridge - extreme soft gold bleed */}
        <div className="absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(circle_at_center,_#d7c5a3_0%,_transparent_70%)] opacity-[0.06] pointer-events-none blur-3xl" />

        <LiquidGlassCard
          variant="default"
          intensity="subtle"
          interactive={false}
          className="p-24 md:p-48 flex flex-col items-center justify-center squircle text-center relative overflow-hidden"
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="800"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#d7c5a3_0%,_transparent_70%)] opacity-10 pointer-events-none blur-3xl" />

          <span
            data-aos="fade-down"
            data-aos-duration="600"
            data-aos-delay="1000"
            className="text-[10px] font-bold uppercase tracking-[0.6em] text-accent mb-10 block"
          >
            Perspective
          </span>

          <h3
            data-aos="zoom-in"
            data-aos-duration="800"
            data-aos-delay="1200"
            className="relative z-10 text-4xl md:text-7xl font-headline font-bold tracking-display mb-12 leading-tight"
          >
            Your body deserves <br /> better fuel.
          </h3>

          <div className="w-12 h-[4px] bg-accent/30 mx-auto mb-12 rounded-full" />

          <p className="relative z-10 text-xl leading-normal tracking-body w-full italic opacity-70">
            "Don't build your foundation on sand. Choose a system <br className="hidden md:block" /> designed for longevity and power."
          </p>
        </LiquidGlassCard>
      </div>
    </SectionContainer>
  );
}

