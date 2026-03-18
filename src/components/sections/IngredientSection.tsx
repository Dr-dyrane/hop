"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { Badge } from "@/components/ui/Badge";
import { Leaf } from "lucide-react";
import { INGREDIENTS } from "@/lib/data";
import Image from "next/image";

export function IngredientSection() {
  return (
    <SectionContainer variant="white" id="ingredients">
      <div className="flex flex-col lg:flex-row items-start gap-20">
        <div className="lg:w-1/3 sticky top-32 flex flex-col gap-4">
          <HeroEyebrow 
            position="left"
            animated
          >
            <Leaf className="w-3.5 h-3.5 mr-3 text-label" />
            Transparency
          </HeroEyebrow>
          <h2 
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="200"
            className="mt-12 text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-label leading-tight tracking-display"
          >
            Nothing Hidden. <br /> Nothing Fake.
          </h2>
          <p 
            data-aos="fade-up"
            data-aos-duration="700"
            data-aos-delay="300"
            className="mt-12 text-xl text-secondary-label leading-normal tracking-body italic"
          >
            We believe in complete transparency. Every ingredient in House of Prax is meticulously selected for its purity and performance benefits.
          </p>
        </div>

        <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full backdrop-blur-sm">
          {INGREDIENTS.map((ing, i) => (
            <div
              key={ing.name}
              data-aos="zoom-in-up"
              data-aos-duration="600"
              data-aos-delay={400 + i * 100}
              className="relative h-[350px] squircle overflow-hidden card-premium hover:shadow-float transition-all duration-700"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="group relative w-full h-full"
              >
                <Image
                  src={ing.image}
                  alt={ing.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000 ease-out mask-white"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/30 to-transparent dark:from-[#0d0f0d]/60 dark:via-[#0d0f0d]/30 z-10" />

                <div className="absolute inset-0 p-10 flex flex-col justify-end z-20 group-hover:pointer-events-auto">
                  <motion.span 
                    className="text-[10px] font-semibold uppercase tracking-headline text-accent mb-4 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4 transition-all duration-500"
                  >
                    Essential Ingredient
                  </motion.span>
                  <h3 className="text-3xl font-headline font-bold tracking-headline text-label opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 translate-y-4 transition-all duration-500">{ing.name}</h3>
                  <motion.p 
                    className="mt-4 text-secondary-label text-sm leading-normal tracking-body max-w-[240px] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4 transition-all duration-500 delay-200"
                  >
                    {ing.detail}
                  </motion.p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

