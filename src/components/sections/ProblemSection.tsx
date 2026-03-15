"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { SectionContainer } from "@/components/ui/SectionContainer";

const PROBLEMS = [
  "Artificial Sweeteners",
  "Dairy Bloat",
  "Cheap Fillers",
  "Harsh Digestion"
];

export function ProblemSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <SectionContainer variant="alt" id="problem" className="overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-20 py-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="lg:w-1/2"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent/60 mb-12 block">The Market Status</span>
          <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-foreground leading-[0.9] tracking-tighter">
            Most Protein <br />
            <span className="text-muted/20">Are Junk.</span>
          </h2>
          <p className="mt-12 text-xl text-muted/60 font-medium leading-relaxed max-w-md italic">
            The industry is built on compromises. We chose a different path—prioritizing gut health and biological performance over cheap manufacturing.
          </p>
        </motion.div>

        <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-background/40 backdrop-blur-sm p-10 flex flex-col items-start justify-between min-h-[220px] rounded-[2.5rem] group hover:bg-background transition-all duration-700 hover:shadow-float"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent text-[10px] font-black tracking-widest group-hover:scale-110 transition-transform">
                0{i + 1}
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tighter leading-tight group-hover:text-accent transition-colors">{problem}</h3>
                <div className="h-[2px] w-0 bg-accent/20 mt-4 group-hover:w-full transition-all duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative mt-40">
        {/* Atmosphere bridge - extreme soft gold bleed */}
        <div className="absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(circle_at_center,_#d7c5a3_0%,_transparent_70%)] opacity-[0.06] pointer-events-none blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="p-24 md:p-48 rounded-[3.5rem] md:rounded-[6rem] cta-inverse text-center relative overflow-hidden shadow-[0_50px_100px_-30px_rgba(0,0,0,0.3)] dark:shadow-none"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#d7c5a3_0%,_transparent_70%)] opacity-10 pointer-events-none blur-3xl" />

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-[10px] font-black uppercase tracking-[0.6em] text-accent mb-10 block"
          >
            Perspective
          </motion.span>

          <h3 className="relative z-10 text-4xl md:text-7xl font-black tracking-tighter mb-12 leading-[0.9]">
            Your body deserves <br /> better fuel.
          </h3>

          <div className="w-12 h-[2px] bg-accent/30 mx-auto mb-12" />

          <p className="relative z-10 text-xl font-medium max-w-2xl mx-auto italic opacity-70">
            "Don't build your foundation on sand. Choose a system <br className="hidden md:block" /> designed for longevity and power."
          </p>
        </motion.div>
      </div>
    </SectionContainer>
  );
}

