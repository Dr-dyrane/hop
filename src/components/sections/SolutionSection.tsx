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
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-muted/40">The System</span>
          <h2 className="mt-4 text-5xl md:text-6xl font-black text-foreground">
            Meet {BRAND.name}
          </h2>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="text-xl text-muted max-w-2xl"
        >
          {BRAND.subtext}
        </motion.p>

        <div className="mt-20 w-full grid grid-cols-2 md:grid-cols-4 gap-12 lg:gap-24">
          {TRUST_INDICATORS.map((indicator, i) => {
            const Icon = indicator.icon;
            return (
              <motion.div
                key={indicator.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="flex flex-col items-center group"
              >
                <div className="w-16 h-16 rounded-full surface border border-border-soft flex items-center justify-center mb-8 group-hover:scale-110 group-hover:shadow-soft transition-all duration-500">
                   <Icon size={32} className="text-accent" />
                </div>
                <span className="text-sm font-black text-foreground tracking-tight uppercase max-w-[100px] leading-tight">
                  {indicator.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mt-24 relative product-frame"
        >
          <Image 
            src="/images/hero/hero-product.png"
            alt="HON Product Solution"
            width={300}
            height={400}
            className="relative z-10 mx-auto w-48 opacity-90"
          />
        </motion.div>
      </div>
    </SectionContainer>
  );
}
