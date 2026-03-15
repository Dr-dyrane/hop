"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { Plus, MoveRight } from "lucide-react";

export function HowItWorks() {
  const steps = [
    { label: "1 Scoop", sub: "Clean Fuel" },
    { label: "Water", sub: "Or Milk" },
    { label: "Shake", sub: "30 Seconds" },
    { label: "Growth", sub: "Recover" }
  ];

  return (
    <SectionContainer variant="white" id="how-it-works">
      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-5xl font-black text-foreground">Simple Daily Fuel.</h2>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto gap-8">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-full surface border border-border-soft flex items-center justify-center mb-6 text-accent">
                <span className="text-xs font-black uppercase tracking-tighter">HON</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">{step.label}</h3>
              <p className="text-sm text-muted/40 font-medium uppercase tracking-widest mt-2">{step.sub}</p>
            </motion.div>
            
            {i < steps.length - 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 + 0.1 }}
                viewport={{ once: true }}
                className="hidden md:flex text-muted/20"
              >
                {i === steps.length - 2 ? <MoveRight size={32} strokeWidth={1} /> : <Plus size={24} />}
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-20 surface py-4 px-8 rounded-full text-center border border-border-soft inline-block"
      >
        <span className="text-sm font-bold text-muted/60">Total Prep Time: <span className="text-accent">Under 30 Seconds</span></span>
      </motion.div>
    </SectionContainer>
  );
}
