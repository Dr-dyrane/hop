"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { AlertTriangle } from "lucide-react";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useMobile } from "@/hooks/useMobile";

const PROBLEMS = [
  "Artificial Sweeteners",
  "Dairy Bloat",
  "Cheap Fillers",
  "Harsh Digestion"
];

export function ProblemSection() {
  const isMobile = useMobile();
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const enableTilt = !isMobile && !prefersReducedMotion;

  // Mouse tracking for the entire grid's perspective
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(y, [-400, 400], [5, -5]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-400, 400], [-5, 5]), { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!enableTilt) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(e.clientX - (rect.left + rect.width / 2));
    y.set(e.clientY - (rect.top + rect.height / 2));
  };

  const handleMouseLeave = () => {
    if (!enableTilt) return;
    x.set(0);
    y.set(0);
  };

  return (
    <SectionContainer variant="alt" id="problem" spacing="flow" className="relative overflow-hidden">
      {/* Background Liquid Blobs (Matching your "Circles" requirement) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px]" />
      </div>

      <div 
        className="mx-auto w-full max-w-6xl relative z-10"
        onMouseMove={enableTilt ? handleMouseMove : undefined}
        onMouseLeave={enableTilt ? handleMouseLeave : undefined}
        ref={containerRef}
      >
        <div className="mb-16 flex flex-col items-center text-center sm:mb-20 md:mb-24">
          <HeroEyebrow position="center" animated className="bg-label text-system-background">
            <AlertTriangle className="w-3.5 h-3.5 mr-3" />
            Industry Standard
          </HeroEyebrow>
          
          <h2 className="mt-12 text-6xl md:text-9xl font-headline font-bold text-label tracking-tighter leading-[0.8] text-center">
            Most Protein <br />
            <span className="opacity-70 italic">Are Junk.</span>
          </h2>
        </div>

        {/* The 3D Floating Grid */}
        <motion.div 
          style={
            enableTilt
              ? { rotateX, rotateY, transformStyle: "preserve-3d" }
              : undefined
          }
          className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 sm:gap-5 md:gap-8"
        >
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem}
              whileHover={enableTilt ? { scale: 1.02, z: 50 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <LiquidGlassCard
                variant="default"
                intensity="subtle"
                interactive={true}
                className="relative flex min-h-[160px] flex-col items-start justify-between overflow-hidden p-5 squircle shadow sm:min-h-[190px] sm:p-8 lg:min-h-[220px] lg:p-12"
              >
                {/* Internal Refraction Light */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                
                <div className="text-[8px] font-bold tracking-[0.24em] text-accent opacity-40 sm:text-[9px] sm:tracking-[0.28em] lg:text-[10px] lg:tracking-[0.3em]">
                  ISSUE_0{i + 1}
                </div>

                <div>
                  <h3 className="text-lg font-headline font-bold tracking-tight text-label transition-all duration-500 group-hover:text-accent sm:text-2xl lg:text-3xl">
                    {problem}
                  </h3>
                  <div className="h-[1px] w-full bg-gradient-to-r from-accent/40 to-transparent mt-4 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                </div>
              </LiquidGlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* The CTA Bridge (Refined for Immersion) */}
        <div className="relative mt-24 flex flex-col items-center justify-center sm:mt-32 lg:mt-40">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
             <LiquidGlassCard
                variant="default"
                intensity="subtle"
                className="flex flex-col items-center justify-center gap-4 overflow-hidden p-10 text-center squircle sm:p-16 md:p-32"
              >  
                <span className="mb-6 text-[9px] font-bold uppercase tracking-[0.45em] text-accent/60 sm:mb-8 sm:text-[10px] sm:tracking-[0.6em] md:mb-12 md:tracking-[0.8em]">House of prax</span>
                <h3 className="mb-4 text-center text-3xl font-headline font-bold tracking-tighter leading-[0.95] sm:mb-6 sm:text-5xl md:mb-10 md:text-8xl md:leading-[0.9]">
                  Your body deserves <br /> better fuel.
                </h3>
             </LiquidGlassCard>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}
