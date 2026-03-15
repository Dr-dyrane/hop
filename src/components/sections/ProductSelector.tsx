"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { FLAVORS } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export function ProductSelector() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<keyof typeof FLAVORS>("chocolate");

  const toggleSelected = () => {
    setSelected(prev => prev === "chocolate" ? "vanilla" : "chocolate");
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleCheckout = (flavorKey: keyof typeof FLAVORS) => {
    const flavor = FLAVORS[flavorKey];
    const phoneNumber = "+2348060785487";
    const text = `Hello House of Prax, I'd like to order the ${flavor.name} protein ($54.99). Please let me know the next steps.`;
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <SectionContainer variant="white" id="shop">
      <div className="flex flex-col items-center">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground"
          >
            Choose Your Flavor.
          </motion.h2>
          <p className="mt-4 text-muted text-xl font-medium">Pure performance, two classic ways.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 w-full">
          {/* Flavor Toggles */}
          <div className="flex md:flex-col gap-4 order-2 md:order-1 w-full md:w-auto">
            {(Object.keys(FLAVORS) as Array<keyof typeof FLAVORS>).map((key) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  "flex-1 md:flex-none px-8 py-5 rounded-3xl transition-all duration-500 text-left md:min-w-[240px]",
                  selected === key 
                    ? "bg-foreground text-background shadow-float scale-105" 
                    : "bg-surface opacity-60 hover:opacity-100 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "text-[10px] font-black uppercase tracking-widest mb-1 opacity-50",
                  selected === key ? "text-background/60" : "text-muted"
                )}>
                  {key}
                </div>
                <div className="text-xl font-black">{FLAVORS[key].name}</div>
              </button>
            ))}
          </div>

          {/* Product Image Stage */}
          <div className="relative w-full max-w-sm h-[450px] flex items-center justify-center order-1 md:order-2 perspective-2000">
             <div className="absolute inset-0 bg-gradient-radial from-accent/10 to-transparent blur-3xl pointer-events-none opacity-50" />
             
             {/* Dust/Essence Particles */}
             {[...Array(6)].map((_, i) => (
               <motion.div
                 key={i}
                 initial={{ opacity: 0, x: 0, y: 0 }}
                 animate={{ 
                   opacity: [0.1, 0.4, 0.1], 
                   x: [0, Math.random() * 60 - 30, 0], 
                   y: [0, Math.random() * 60 - 30, 0] 
                 }}
                 transition={{ 
                   duration: 5 + Math.random() * 5, 
                   repeat: Infinity, 
                   ease: "easeInOut",
                   delay: i * 0.5 
                 }}
                 className="absolute w-1 h-1 bg-accent rounded-full blur-[1px] pointer-events-none"
                 style={{ 
                   top: `${20 + Math.random() * 60}%`, 
                   left: `${20 + Math.random() * 60}%` 
                 }}
               />
             ))}

             <AnimatePresence mode="wait">
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -20, z: -100 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0, z: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotateY: 20, z: 100 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="product-frame relative z-10 w-full flex justify-center preserve-3d cursor-pointer group/jar active:scale-95 transition-transform"
                  onClick={toggleSelected}
                >
                  <Image 
                    src={`/images/products/${selected}.png`} 
                    alt={selected}
                    width={500}
                    height={650}
                    className="w-[85%] h-auto max-w-[300px] drop-shadow-2xl animate-float mask-radial"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/jar:opacity-100 transition-opacity bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest pointer-events-none whitespace-nowrap">
                    Switch Flavor
                  </div>
                </motion.div>
             </AnimatePresence>
          </div>

          {/* Detail Side */}
          <div className="flex-1 order-3 text-center md:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xs mx-auto md:mx-0"
              >
                <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-accent px-4 py-2 bg-accent/10 rounded-full mb-10">
                  Premium Quality
                </span>
                <h3 className="text-4xl md:text-5xl font-black text-foreground leading-[0.9] tracking-tighter">
                  {FLAVORS[selected].name}
                </h3>
                <p className="mt-6 text-muted text-lg leading-relaxed font-medium">
                  {FLAVORS[selected].description} meticulously crafted with organic pea protein and pure extracts. No fillers, just fuel.
                </p>
                <div className="mt-10 pt-10">
                  <div className="flex items-baseline gap-2 mb-6 justify-center md:justify-start">
                    <span className="text-4xl font-black text-foreground">$54.</span>
                    <span className="text-xl font-bold text-foreground">99</span>
                    <span className="text-xs font-black uppercase tracking-widest text-muted ml-4 opacity-40">Per Jar</span>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full !h-16 rounded-2xl text-base font-black uppercase tracking-widest shadow-float hover:scale-[1.02] transition-transform duration-700 ease-smooth"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCheckout(selected)}
                  >
                    Checkout with WhatsApp
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}

