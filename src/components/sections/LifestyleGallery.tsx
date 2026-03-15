"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import Image from "next/image";
import { cn } from "@/lib/utils";

const IMAGES = [
  { src: "/images/lifestyle/gym.png", alt: "Workout session", span: "row-span-2" },
  { src: "/images/lifestyle/smoothie.png", alt: "Smoothie prep", span: "" },
  { src: "/images/lifestyle/desk.png", alt: "Desk work", span: "" },
  { src: "/images/lifestyle/recovery.png", alt: "Post-gym recovery", span: "col-span-2" },
];

export function LifestyleGallery() {
  return (
    <SectionContainer variant="white" id="lifestyle" className="overflow-hidden">
      <div className="flex flex-col items-center text-center mb-16">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="block text-[11px] font-black uppercase tracking-[0.5em] text-accent mb-12"
        >
          Life in HOP
        </motion.span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          className="mt-12 text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight"
        >
          Fuel Your Training.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-12 text-xl text-muted font-medium italic max-w-xl"
        >
          Designed for the athlete, refined for the everyday. Witness the House of Prax in action.
        </motion.p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[250px] md:auto-rows-[300px] max-w-7xl mx-auto">
        {IMAGES.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
            className={cn(
              "relative rounded-[2rem] md:rounded-[3rem] overflow-hidden group shadow-soft",
              img.span
            )}
          >
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700 z-10" />
            <Image 
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out mask-soft-edge"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
            <div className="absolute bottom-8 left-10 z-30 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
                 {img.alt}
               </span>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  );
}

