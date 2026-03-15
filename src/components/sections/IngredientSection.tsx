"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { INGREDIENTS } from "@/lib/data";
import Image from "next/image";

export function IngredientSection() {
  return (
    <SectionContainer variant="white" id="ingredients">
      <div className="flex flex-col lg:flex-row items-start gap-20">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:w-1/3 sticky top-32"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/60">Transparency</span>
          <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.05] tracking-tight">
            Nothing Hidden. <br /> Nothing Fake.
          </h2>
          <p className="mt-10 text-xl text-muted leading-relaxed font-medium">
            We believe in complete transparency. Every ingredient in House of Prax is meticulously selected for its purity and performance benefits.
          </p>
        </motion.div>

        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {INGREDIENTS.map((ing, i) => (
            <motion.div
              key={ing.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              className="group relative h-[350px] rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#0d0f0d] shadow-soft hover:shadow-float transition-all duration-700"
            >
              <Image 
                src={ing.image}
                alt={ing.name}
                fill
                className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000 ease-out mask-white"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent dark:from-[#0d0f0d] dark:via-[#0d0f0d]/70 z-10" />
              
              <div className="absolute inset-0 p-10 flex flex-col justify-end z-20">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mb-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                  Essential Ingredient
                </span>
                <h3 className="text-3xl font-black tracking-tighter text-foreground transition-transform duration-500 group-hover:-translate-y-2">{ing.name}</h3>
                <p className="mt-4 text-muted text-sm font-medium leading-relaxed max-w-[240px] translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 delay-100">
                   {ing.detail}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

