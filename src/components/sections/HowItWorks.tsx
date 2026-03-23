"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { Cog, Plus, MoveRight, Timer } from "lucide-react";
import Image from "next/image";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const steps = [
    { label: "1 Scoop", sub: "Clean Fuel" },
    { label: "Water", sub: "Or Milk" },
    { label: "Shake", sub: "30 Seconds" },
    { label: "Growth", sub: "Recover" }
  ];

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 0.5], [1.1, 1]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.3, 0.6], [0.5, 1, 0.8]);

  return (
    <SectionContainer variant="alt" id="how-it-works" spacing="flow" className="relative overflow-hidden">
      {/* Cinematic Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square bg-accent/5 rounded-full blur-[140px]" />
      </div>

      <div className="mb-24 flex flex-col items-center text-center relative z-10">
        <HeroEyebrow position="center" animated className="bg-label text-system-background">
          <Cog className="w-3.5 h-3.5 mr-3" />
          The Ritual
        </HeroEyebrow>
        
        <h2 className="mt-12 text-6xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.75]">
          Simple Daily <br />
          <span className="italic opacity-20">Fuel.</span>
        </h2>

        <p className="mt-12 text-xl md:text-2xl text-secondary-label/40 max-w-2xl font-light italic leading-relaxed">
          A minimalist ritual designed for the maximalist life. <br />
          Pure performance in under 30 seconds.
        </p>
      </div>

      {/* Central Visual Showcase */}
      <div ref={containerRef} className="relative max-w-6xl mx-auto mb-24 perspective-2000">
        <motion.div
          style={{ scale: imageScale, opacity: imageOpacity }}
          className="relative aspect-[21/9] w-full squircle overflow-hidden -white/10 shadow-2xl"
        >
          <Image
            src="/images/how-it-works.png"
            alt="The Ritual"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-[5s]"
          />
          {/* Liquid Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-system-background via-transparent to-transparent opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
        </motion.div>
      </div>

      {/* Kinetic Step Flow */}
      <div className="mx-auto relative z-10 w-full max-w-6xl">
        <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-between gap-4 md:gap-0">
          {steps.map((step, i) => (
            <React.Fragment key={step.label}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <LiquidGlassCard
                  variant="default"
                  intensity="subtle"
                  interactive
                  className="p-8 flex flex-col items-center text-center squircle"
                >
                  <div className="w-16 h-16 bg-accent/5 rounded-2xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-all duration-700">
                    <span className="text-[9px] font-bold tracking-[0.2em]">0{i + 1}</span>
                  </div>
                  <h3 className="text-xl font-headline font-bold text-label tracking-tight">{step.label}</h3>
                  <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mt-3 opacity-40">{step.sub}</p>
                </LiquidGlassCard>
              </motion.div>

              {/* Connecting Physics */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center px-4 text-accent/20">
                  <motion.div
                    animate={{ x: [0, 5, 0], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {i === steps.length - 2 ? <MoveRight size={24} strokeWidth={1} /> : <Plus size={20} />}
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* The Closing Cinematic Badge */}
      <div className="mt-32 text-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-4 bg-label/[0.03] backdrop-blur-md pl-6 pr-10 py-5 rounded-full shadow-2xl group"
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Timer size={18} strokeWidth={1.5} className="group-hover:rotate-[360deg] transition-transform duration-1000" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-label/40">Efficiency Metric</div>
            <div className="text-sm font-headline font-bold text-label">
              Activation in <span className="text-accent underline decoration-accent/30 underline-offset-4">Under 30 Seconds</span>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionContainer>
  );
}