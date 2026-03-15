"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { useTheme } from "next-themes";
import { FLAVORS } from "@/lib/data";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentFlavor, setCurrentFlavor] = useState<keyof typeof FLAVORS>("chocolate");

  const toggleFlavor = () => {
    setCurrentFlavor(prev => prev === "chocolate" ? "vanilla" : "chocolate");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const flavorData = {
    chocolate: {
      image: "/images/products/chocolate.png",
      bgGlow: "bg-[#4A2C2A]/20",
      accent: "text-[#D7C5A3]",
    },
    vanilla: {
      image: "/images/products/vanilla.png",
      bgGlow: "bg-[#F3E5AB]/10",
      accent: "text-[#D7C5A3]",
    }
  };

  const revealVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.1,
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  return (
    <section className="hero-shell relative flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Atmosphere Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-grain-layer" />

        {/* Dynamic Glow based on flavor */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFlavor + (isDark ? "-dark" : "-light")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <div className={cn(
              "absolute inset-0 blur-[120px] opacity-30 transition-colors duration-1000",
              currentFlavor === "chocolate" ? "bg-[#4A2C2A]/20" : "bg-[#F3E5AB]/10"
            )} />
            
            {/* Custom glows for depth */}
            <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-forest/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-beige/10 rounded-full blur-[150px]" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="container-shell relative z-10 grid items-center gap-12 lg:grid-cols-2 min-h-[calc(100svh-120px)] py-24 lg:py-0">
        {/* Copy Layer */}
        <div className="max-w-xl text-center lg:text-left pt-12 lg:pt-0 mx-auto lg:mx-0">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="flex justify-center lg:justify-start mb-8"
          >
            <span className="hero-eyebrow">
              <Image
                src="/images/hero/hop-mark.svg"
                alt=""
                width={14}
                height={14}
                className="mr-2 dark:invert"
              />
              Plant-Based Performance
            </span>
          </motion.div>

          <motion.h1 
            custom={1}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="font-headline text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] tracking-[-0.03em] text-foreground"
          >
            Clean Plant Protein
            <span className="block mt-4 sm:mt-6 text-muted italic">Built for Real Training</span>
          </motion.h1>

          <motion.div 
            custom={2}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start"
          >
            <Button
              size="lg"
              variant="primary"
              className="px-10"
              onClick={() => {
                const el = document.getElementById("shop");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Start Your Order
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="px-10"
              onClick={() => {
                const el = document.getElementById("ingredients");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              View Ingredients
            </Button>
          </motion.div>

          <motion.div 
            custom={3}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-[10px] font-black tracking-[0.25em] text-muted uppercase opacity-60"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-accent" />
              <span>Plant-Based</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-accent" />
              <span>Clean Ingredients</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-accent" />
              <span>Easy Digestion</span>
            </div>
          </motion.div>
        </div>

        {/* Product Layer */}
        <div className="relative flex flex-col items-center justify-center lg:justify-end h-full min-h-[450px] lg:min-h-[550px]">
          <div className="relative w-full max-w-[440px] lg:max-w-[500px] aspect-square flex items-center justify-center">
            {/* Ambient Shadow */}
            <div className="product-shadow-wrap absolute bottom-0 md:bottom-[-5%] w-full">
              <div className={cn(
                "w-full h-8 bg-black/10 blur-[40px] rounded-full scale-x-75 transition-opacity duration-1000",
                isDark ? "opacity-30" : "opacity-20"
              )} />
            </div>

            {/* Floating Jar with Crossfade */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFlavor + (isDark ? "-dark" : "-light")}
                initial={{ opacity: 0, scale: 0.85, y: 40, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20, rotateY: 15 }}
                transition={{ 
                  duration: 1.2, 
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.8 }
                }}
                className="relative z-10 w-full flex justify-center perspective-[1000px]"
              >
                <div 
                  className="relative w-[85%] max-w-[380px] drop-shadow-[0_35px_35px_rgba(0,0,0,0.15)] group transition-all duration-700 hover:scale-105 preserve-3d cursor-pointer active:scale-95"
                  onClick={toggleFlavor}
                >
                   <Image
                    src={flavorData[currentFlavor].image}
                    alt={`${currentFlavor} protein jar`}
                    width={800}
                    height={1000}
                    priority
                    className="w-full h-auto drop-shadow-2xl animate-float-slow mask-radial"
                  />
                  
                  {/* Floating elements to enhance 3D feel in the whitespace */}
                  <motion.div 
                    animate={{ y: [0, -20, 0], x: [0, 10, 0], rotate: [0, 15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-12 -right-12 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none"
                  />
                  <motion.div 
                    animate={{ y: [0, 30, 0], x: [0, -15, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-16 -left-16 w-32 h-32 bg-forest/5 rounded-full blur-3xl pointer-events-none"
                  />

                  {/* Tiny click indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest pointer-events-none whitespace-nowrap">
                    Click to Toggle
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Flavor Selection Chips - Interactive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex items-center gap-3 mt-8 bg-surface/50 backdrop-blur-md p-2 rounded-full shadow-soft"
          >
            {(Object.keys(FLAVORS) as Array<keyof typeof FLAVORS>).map((flavor) => (
              <button
                key={flavor}
                onClick={() => setCurrentFlavor(flavor)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-500",
                  currentFlavor === flavor
                    ? "bg-foreground text-background shadow-lg scale-105"
                    : "text-muted hover:text-foreground hover:bg-surface"
                )}
              >
                {flavor}
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}


