"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { Star, Users, ShieldCheck, Trophy } from "lucide-react";

export function SocialProof() {
  const { socialProof } = useMarketingContent();
  
  const stats = [
    { label: "Elite Rating", value: `${socialProof.rating}`, sub: "Verified Reviews", icon: Star },
    { label: "Community", value: socialProof.servings, sub: "Athletes Reached", icon: Users },
    { label: "Ingredient Quality", value: "100%", sub: "Zero Fillers", icon: ShieldCheck }
  ];

  return (
    <SectionContainer variant="alt" id="social" spacing="flow" className="relative overflow-hidden">
      {/* Background Atmosphere: The "Vignette" Look */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] aspect-square bg-accent/5 rounded-full blur-[140px]" />
      </div>

      <div className="mx-auto w-full max-w-7xl relative z-10">
        <div className="mb-16 flex flex-col items-center text-center sm:mb-20 lg:mb-24">
          <HeroEyebrow position="center" animated className="bg-label text-system-background">
            <Trophy className="w-3.5 h-3.5 mr-3" />
            Social Validation
          </HeroEyebrow>
          
          <h2 className="mt-12 text-6xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.75] text-balance">
            Trusted by <br /> 
            <span className="italic opacity-70">the Driven.</span>
          </h2>
        </div>

        {/* The Glass Stat Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true }}
                className={i === stats.length - 1 ? "col-span-2 flex justify-center md:col-span-1 md:block" : undefined}
              >
                <LiquidGlassCard
                  variant="default"
                  intensity="subtle"
                  interactive
                  className={`group flex h-full min-h-[220px] flex-col items-center justify-center overflow-hidden p-5 text-center squircle ${
                    i === stats.length - 1
                      ? "w-full max-w-[15rem] sm:max-w-[17rem] md:max-w-none"
                      : ""
                  } sm:min-h-[250px] sm:p-6 md:min-h-[300px] md:p-10`}
                >
                  {/* Subtle Background Icon Scanline */}
                  <Icon
                    size={96}
                    className="absolute -bottom-4 -right-4 -rotate-12 text-label/[0.02] transition-transform duration-1000 group-hover:rotate-0 sm:h-[108px] sm:w-[108px] md:h-[120px] md:w-[120px]"
                  />
                  
                  <div className="relative z-10 space-y-4 sm:space-y-5 md:space-y-6">
                    <div className="text-4xl font-headline font-bold italic tracking-tighter text-label sm:text-5xl md:text-7xl">
                      {stat.value}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-accent sm:text-[10px] sm:tracking-[0.3em] md:text-[11px] md:tracking-[0.4em]">
                        {stat.label}
                      </div>
                      <div className="text-label/30 text-sm font-light italic">
                        {stat.sub}
                      </div>
                    </div>

                    {/* Progress Indicator (Cinematic Detail) */}
                    <div className="flex items-center justify-center gap-1.5 pt-2 sm:pt-3 md:pt-4">
                      {[...Array(5)].map((_, i) => (
                        <motion.div 
                          key={i}
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 0.5 + (i * 0.1) }}
                          className="w-1 h-1 rounded-full bg-accent/40"
                        />
                      ))}
                    </div>
                  </div>
                </LiquidGlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* The Trusted By Marquee/Badge */}
        <div className="mt-16 text-center sm:mt-20 md:mt-24">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="inline-flex flex-wrap items-center justify-center gap-3 rounded-full bg-white/[0.02] px-5 py-3 text-center backdrop-blur-xl sm:gap-4 sm:px-6 md:gap-6 md:px-8 md:py-4"
          >
            <div className="text-[9px] font-bold uppercase tracking-[0.26em] text-label/70 sm:text-[10px] sm:tracking-[0.32em] md:tracking-[0.4em]">Validated By</div>
            <div className="hidden h-4 w-[1px] bg-white/10 sm:block" />
            <div className="text-[11px] font-semibold text-label/60 italic tracking-wide">
              {socialProof.trustedBy}
            </div>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}
