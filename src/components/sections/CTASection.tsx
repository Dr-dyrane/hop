"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <SectionContainer className="overflow-hidden bg-accent text-accent-foreground">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[60%] h-full bg-cream rounded-full blur-[150px] translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[40%] h-full bg-beige rounded-full blur-[120px] -translate-x-1/2" />
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-7xl font-black text-accent-foreground leading-[0.9] tracking-tight">
            Upgrade Your <br /> Protein.
          </h2>
          <p className="mt-8 text-xl text-accent-foreground/70 max-w-lg mx-auto leading-relaxed">
            Clean plant-based protein for real performance. No junk, no fillers, just fuel.
          </p>
          
          <div className="mt-12 flex flex-col items-center gap-8">
            <Button size="lg" variant="secondary" className="px-16 text-lg bg-background text-foreground border-none">Buy Now — $54.99</Button>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-black uppercase tracking-[0.2em] text-accent-foreground/40">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-beige" /> Plant-Based</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-beige" /> No Additives</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-beige" /> Easy Digestion</span>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionContainer>
  );
}
