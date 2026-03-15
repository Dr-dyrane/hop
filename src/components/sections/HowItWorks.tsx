"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { Plus, MoveRight } from "lucide-react";
import Image from "next/image";

export function HowItWorks() {
  const steps = [
    { label: "1 Scoop", sub: "Clean Fuel" },
    { label: "Water", sub: "Or Milk" },
    { label: "Shake", sub: "30 Seconds" },
    { label: "Growth", sub: "Recover" }
  ];

  return (
    <SectionContainer variant="alt" id="how-it-works">
      <div className="text-center mb-24">
        <motion.span 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-[10px] font-black uppercase tracking-[0.5em] text-accent/60"
        >
          The Ritual
        </motion.span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-6 text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tighter"
        >
          Simple Daily Fuel.
        </motion.h2>
      </div>

      <div className="relative max-w-6xl mx-auto rounded-[3rem] md:rounded-[4rem] overflow-hidden bg-background shadow-float mb-20 group">
        <Image 
          src="/images/how-it-works.png" 
          alt="How it works ritual" 
          width={1200} 
          height={600} 
          className="w-full h-[300px] md:h-[500px] object-cover opacity-80 group-hover:scale-105 transition-transform duration-[3s] mask-soft-edge"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-8 relative z-10">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="flex flex-col items-center group"
            >
              <div className="w-20 h-20 rounded-2xl surface flex items-center justify-center mb-8 text-accent shadow-sm group-hover:scale-110 group-hover:shadow-float transition-all duration-700">
                <span className="text-[10px] font-black uppercase tracking-tighter text-accent/60">HOP</span>
              </div>
              <h3 className="text-xl font-black text-foreground tracking-tight">{step.label}</h3>
              <p className="text-[10px] text-accent font-black uppercase tracking-widest mt-3 opacity-60">{step.sub}</p>
            </motion.div>
            
            {i < steps.length - 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 + 0.3 }}
                viewport={{ once: true }}
                className="hidden md:flex text-border/40"
              >
                {i === steps.length - 2 ? <MoveRight size={24} strokeWidth={1} /> : <Plus size={20} />}
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 1 }}
        viewport={{ once: true }}
        className="mt-24 text-center"
      >
        <span className="surface px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest text-muted shadow-sm">
          Total Prep Time: <span className="text-accent underline decoration-2 underline-offset-4">Under 30 Seconds</span>
        </span>
      </motion.div>
    </SectionContainer>
  );
}

