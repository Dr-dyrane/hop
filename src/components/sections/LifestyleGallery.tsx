"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import Image from "next/image";
import { cn } from "@/lib/utils";

const IMAGES = [
  { src: "/images/hero/hero-product.png", alt: "Workout session", span: "row-span-2" },
  { src: "/images/hero/hero-product.png", alt: "Smoothie prep", span: "" },
  { src: "/images/hero/hero-product.png", alt: "Desk work", span: "" },
  { src: "/images/hero/hero-product.png", alt: "Post-gym recovery", span: "col-span-2" },
];

export function LifestyleGallery() {
  return (
    <SectionContainer variant="white" id="lifestyle" className="overflow-hidden">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-muted/40">Life in HON</span>
        <h2 className="mt-4 text-4xl md:text-5xl font-black text-foreground">Fuel Your Training.</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px] md:auto-rows-[250px] max-w-6xl mx-auto">
        {IMAGES.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
            viewport={{ once: true }}
            className={cn(
              "relative rounded-[2.5rem] overflow-hidden group card-premium hover:shadow-float transition-all duration-700",
              img.span
            )}
          >
            {/* Using placeholder coloring for now since we don't have lifestyle shots yet */}
            <div className="absolute inset-0 bg-accent/5 group-hover:bg-accent/10 transition-colors duration-500" />
            <Image 
              src={img.src}
              alt={img.alt}
              fill
              className="object-contain p-12 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000"
            />
            <div className="absolute bottom-6 left-8">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted/30 group-hover:text-accent transition-colors">{img.alt}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  );
}
