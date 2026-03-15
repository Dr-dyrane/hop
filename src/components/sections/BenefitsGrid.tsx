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
    <SectionContainer variant="white" id="benefits">
      <div className="text-center mb-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-black text-foreground"
        >
          Built for <br /> <span className="text-muted/40">Real Performance.</span>
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {BENEFITS.map((benefit, i) => {
          const Icon = ICON_MAP[benefit.icon as keyof typeof ICON_MAP];
          return (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="card-soft group p-10 flex flex-col relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl surface border border-border-soft flex items-center justify-center mb-8 text-accent">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">{benefit.title}</h3>
                <p className="text-muted leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
