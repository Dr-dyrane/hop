"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { BadgeList } from "@/components/ui/Badge";
import { Camera } from "lucide-react";
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
        <HeroEyebrow 
          position="center"
          animated
        >
          <Camera className="w-3.5 h-3.5 mr-3 text-label" />
          Life in HOP
        </HeroEyebrow>
        <h2 
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-delay="200"
          className="mt-12 text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-label tracking-display leading-tight"
        >
          Fuel Your Training.
        </h2>
        <BadgeList 
          items={["Daily Energy", "Muscle Growth", "Quick Recovery", "Clean Fuel"]}
          className="my-10"
          animated
        />
        <p
          data-aos="fade-up"
          data-aos-duration="700"
          data-aos-delay="300"
          className="mt-12 text-xl text-secondary-label leading-normal tracking-body font-medium italic max-w-xl"
        >
          Designed for the athlete, refined for the everyday. Witness House of Prax in action.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[250px] md:auto-rows-[300px] max-w-7xl mx-auto">
        {IMAGES.map((img, i) => (
          <div
            key={i}
            data-aos="zoom-in-up"
            data-aos-duration="600"
            data-aos-delay={400 + i * 100}
            className={cn(
              "relative squircle overflow-hidden group shadow-card",
              img.span
            )}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full"
            >
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700 z-10" />
              <Image 
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading={img.src.includes("gym") ? "eager" : "lazy"}
                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out mask-soft-edge"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-8 left-10 z-30 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700"
              >
                 <span className="text-[11px] font-semibold uppercase tracking-headline text-white bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
                   {img.alt}
                 </span>
                </motion.div>
            </motion.div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}

