"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { BRAND } from "@/lib/data";
import { CleanIcon, PlantIcon, DigestionIcon } from "@/components/ui/Icons";
import Image from "next/image";

const TRUST_INDICATORS = [
  { label: "Clean Ingredients", icon: CleanIcon },
  { label: "Plant-Based", icon: PlantIcon },
  { label: "Easy Digestion", icon: DigestionIcon },
  { label: "Zero Additives", icon: CleanIcon }
];

export function SolutionSection() {
  return (
    <SectionContainer variant="white" id="solution">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="block text-[10px] font-black uppercase tracking-[0.5em] text-accent mb-12">The System</span>
          <h2 className="mt-12 text-5xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-none">
            Meet {BRAND.name}
          </h2>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-xl text-muted max-w-2xl font-medium leading-relaxed italic"
        >
          "Protein redesigned for the modern athlete. No fillers, no excuses. Just pure, plant-powered performance."
        </motion.p>

        <div className="mt-24 w-full grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-24 max-w-5xl">
          {TRUST_INDICATORS.map((indicator, i) => {
            const Icon = indicator.icon;
            return (
              <motion.div
                key={indicator.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className="flex flex-col items-center group"
              >
                <div className="w-16 h-16 rounded-2xl surface flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:shadow-float transition-all duration-700">
                   <Icon size={28} className="text-accent" />
                </div>
                <span className="text-[11px] font-black text-foreground tracking-widest uppercase max-w-[120px] leading-tight opacity-70 group-hover:opacity-100 transition-opacity">
                  {indicator.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="mt-32 relative group perspective-2000"
        >
          <div className="absolute inset-0 bg-accent/5 rounded-full blur-[100px] group-hover:bg-accent/10 transition-colors duration-1000" />
          
          {/* Floating background markers to use whitespace */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/[0.02] rounded-full pointer-events-none"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-accent/[0.03] rounded-full pointer-events-none"
          />

          <Image 
            src="/images/products/chocolate.png"
            alt="HOP Product Solution"
            width={500}
            height={600}
            className="relative z-10 mx-auto w-64 md:w-80 drop-shadow-[0_45px_45px_rgba(0,0,0,0.12)] animate-float mask-radial"
          />
        </motion.div>
      </div>
    </SectionContainer>
  );
}

