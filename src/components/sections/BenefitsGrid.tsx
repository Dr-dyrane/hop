"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { BENEFITS } from "@/lib/data";
import { Zap, Wind, Activity, Leaf } from "lucide-react";

const ICON_MAP = {
  Zap: Zap,
  Wind: Wind,
  Activity: Activity,
  Leaf: Leaf,
};

export function BenefitsGrid() {
  return (
    <SectionContainer variant="alt" id="benefits">
      <div className="flex flex-col lg:flex-row items-start justify-between mb-32 gap-y-12 gap-x-20">
        <div className="max-w-4xl">
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="block text-[11px] font-black uppercase tracking-[0.5em] text-accent mb-12"
          >
            Capabilities
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl lg:text-9xl font-black text-foreground tracking-tighter leading-[0.85] text-balance"
          >
            Built for <br /> <span className="text-muted/20">Real Performance.</span>
          </motion.h2>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="text-muted/60 text-lg md:text-xl font-medium max-w-md lg:text-right leading-relaxed mt-12 lg:mt-48 italic"
        >
          Each benefit is a result of meticulous engineering and plant-powered science.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {BENEFITS.map((benefit, i) => {
          const Icon = ICON_MAP[benefit.icon as keyof typeof ICON_MAP];
          return (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="group relative min-h-[380px] rounded-[2.5rem] bg-background p-10 flex flex-col justify-between overflow-hidden hover:shadow-float shadow-soft transition-all duration-700"
            >
              {/* Subtle background texture/glow */}
              <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl surface flex items-center justify-center mb-10 text-accent shadow-sm group-hover:scale-110 group-hover:shadow-soft transition-all duration-700">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-6 tracking-tighter">{benefit.title}</h3>
                <p className="text-muted/60 text-sm font-medium leading-relaxed">
                  {benefit.description}
                </p>
              </div>
              
              <div className="relative z-10 flex items-center gap-2 overflow-hidden">
                <div className="h-[1px] w-8 bg-accent/30 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                <span className="text-[9px] font-black uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-700">Measured Result</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionContainer>
  );
}

