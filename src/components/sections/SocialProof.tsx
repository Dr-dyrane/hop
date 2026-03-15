"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { SOCIAL_PROOF } from "@/lib/data";
import { Star } from "lucide-react";

export function SocialProof() {
  const stats = [
    { label: "Elite Rating", value: `${SOCIAL_PROOF.rating}`, sub: "Verified Reviews" },
    { label: "Community", value: SOCIAL_PROOF.servings, sub: "Athletes Reached" },
    { label: "Ingredient Quality", value: "100%", sub: "Zero Fillers" }
  ];

  return (
    <SectionContainer variant="alt" id="social" className="overflow-hidden">
      <div className="flex flex-col items-center">
        <div className="text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center space-x-1 mb-8 text-accent/40"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="currentColor" stroke="none" />
            ))}
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tighter leading-[0.95]"
          >
            Trusted by the Driven.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24 max-w-6xl mx-auto w-full px-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="text-5xl md:text-8xl font-black text-foreground mb-6 tracking-tighter italic group-hover:scale-110 transition-transform duration-700">
                {stat.value}
              </div>
              <div className="text-[11px] font-black uppercase tracking-[0.4em] text-accent/60 mb-3">{stat.label}</div>
              <div className="w-1.5 h-1.5 rounded-full bg-accent/20 mx-auto my-8" />
              <div className="text-muted/40 text-[10px] font-black uppercase tracking-widest">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-32 opacity-20 filter grayscale"
        >
          {/* Subtle separator or secondary social proof */}
          <div className="text-[9px] font-black uppercase tracking-[0.5em] text-muted">
            Designed for Performance — Refined for Life
          </div>
        </motion.div>
      </div>
    </SectionContainer>
  );
}

