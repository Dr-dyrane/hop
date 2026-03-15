"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";

const PROBLEMS = [
  "Artificial Sweeteners",
  "Dairy Bloat",
  "Cheap Fillers",
  "Harsh Digestion"
];

export function ProblemSection() {
  return (
    <SectionContainer variant="alt" id="problem">
      <div className="flex flex-col md:flex-row items-center gap-16 py-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex-1"
        >
          <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight">
            Most Protein Powders <br /> <span className="text-muted/40 text-accent">Are Junk.</span>
          </h2>
          <p className="mt-6 text-xl text-muted max-w-md">
            The industry is filled with hidden fillers and synthetic additives that compromise your health and performance.
          </p>
        </motion.div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card-premium p-8 flex flex-col items-start justify-between min-h-[160px]"
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                0{i + 1}
              </div>
              <h3 className="text-xl font-bold text-foreground mt-4">{problem}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="text-center mt-24 text-2xl font-serif italic text-accent opacity-80"
      >
        "Your body deserves better fuel."
      </motion.p>
    </SectionContainer>
  );
}
