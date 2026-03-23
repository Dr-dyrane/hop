"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for the entire grid's perspective
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(y, [-400, 400], [5, -5]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-400, 400], [-5, 5]), { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set(e.clientX - (rect.left + rect.width / 2));
    y.set(e.clientY - (rect.top + rect.height / 2));
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
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        ref={containerRef}
      >
        <div className="flex flex-col items-center text-center mb-24">
          <HeroEyebrow position="center" animated className="bg-label text-system-background">
            <AlertTriangle className="w-3.5 h-3.5 mr-3" />
            Industry Standard
          </HeroEyebrow>
          
          <h2 className="mt-12 text-6xl md:text-9xl font-headline font-bold text-label tracking-tighter leading-[0.8] text-center">
            Most Protein <br />
            <span className="opacity-20 italic">Are Junk.</span>
          </h2>
        </div>

        {/* The 3D Floating Grid */}
        <motion.div 
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-5xl mx-auto"
        >
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem}
              whileHover={{ scale: 1.02, z: 50 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <LiquidGlassCard
                variant="default"
                intensity="subtle"
                interactive={true}
                className="relative min-h-[220px] p-12 flex flex-col items-start justify-between overflow-hidden squircle shadow"
                data-aos="fade-up"
                data-aos-delay={i * 100}
              >
                {/* Internal Refraction Light */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
                
                <div className="text-[10px] font-bold text-accent tracking-[0.3em] opacity-40">
                  ISSUE_0{i + 1}
                </div>

                <div>
                  <h3 className="text-3xl font-headline font-bold text-label tracking-tight group-hover:text-accent transition-all duration-500">
                    {problem}
                  </h3>
                  <div className="h-[1px] w-full bg-gradient-to-r from-accent/40 to-transparent mt-4 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                </div>
              </LiquidGlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* The CTA Bridge (Refined for Immersion) */}
        <div className="mt-40 relative flex flex-col justify-center items-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
             <LiquidGlassCard
                variant="default"
                intensity="subtle"
                className="p-24 md:p-32 flex flex-col items-center gap-4 justify-center squircle overflow-hidden text-center"
              >  
                <span className="text-[10px] font-bold uppercase tracking-[0.8em] text-accent/60 mb-12">House of prax</span>
                <h3 className="text-5xl md:text-8xl font-headline font-bold tracking-tighter leading-[0.9] text-center mb-10">
                  Your body deserves <br /> better fuel.
                </h3>
             </LiquidGlassCard>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}