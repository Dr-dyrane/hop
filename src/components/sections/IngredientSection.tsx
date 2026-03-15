"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { INGREDIENTS } from "@/lib/data";

export function IngredientSection() {
  return (
    <SectionContainer variant="white" id="ingredients">
      <div className="flex flex-col lg:flex-row items-start gap-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:w-1/3"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-muted/40">Transparency</span>
          <h2 className="mt-4 text-4xl md:text-5xl font-black text-foreground leading-[1.1]">
            Nothing Hidden. <br /> Nothing Fake.
          </h2>
          <p className="mt-8 text-xl text-muted leading-relaxed">
            Every ingredient in House of Nutrition serves a specific purpose for your recovery and performance.
          </p>
        </motion.div>

        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {INGREDIENTS.map((ing, i) => (
            <motion.div
              key={ing.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group card-premium p-8 flex flex-col justify-between min-h-[200px] hover:bg-accent hover:text-accent-foreground transition-all duration-500 cursor-pointer"
            >
              <div>
                <h3 className="text-2xl font-black tracking-tight text-foreground group-hover:text-accent-foreground transition-colors">{ing.name}</h3>
                <p className="mt-4 text-muted opacity-60 group-hover:text-accent-foreground group-hover:opacity-80 transition-all duration-300">
                   {ing.detail}
                </p>
              </div>
              
              <div className="mt-8 flex items-center space-x-2 overflow-hidden">
                <div className="w-8 h-[2px] bg-accent group-hover:bg-accent-foreground transition-colors origin-left scale-x-0 group-hover:scale-x-100 duration-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent group-hover:text-accent-foreground opacity-0 group-hover:opacity-100 transition-all duration-700">Essential</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
