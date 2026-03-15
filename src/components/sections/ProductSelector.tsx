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

  React.useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";
  const [selected, setSelected] = useState<keyof typeof FLAVORS>("chocolate");

  return (
    <SectionContainer variant="white" id="shop">
      <div className="flex flex-col items-center">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-foreground">Choose Your Flavor.</h2>
          <p className="mt-4 text-muted text-xl font-medium">Pure performance, two classic ways.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 w-full">
          <div className="flex md:flex-col gap-4 order-2 md:order-1">
            {Object.entries(FLAVORS).map(([key, flavor]) => (
              <button
                key={key}
                onClick={() => setSelected(key as keyof typeof FLAVORS)}
                className={cn(
                  "px-8 py-4 rounded-3xl transition-all duration-500 text-left min-w-[200px]",
                  selected === key 
                    ? "bg-accent text-accent-foreground shadow-float translate-x-2" 
                    : "bg-surface shadow-sm opacity-60 hover:opacity-100 hover:shadow-md"
                )}
              >
                <div className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">{key}</div>
                <div className="text-xl font-bold">{flavor.name}</div>
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-sm h-[450px] flex items-center justify-center order-1 md:order-2">
             <AnimatePresence mode="wait">
                {mounted && (
                  <motion.div
                    key={selected + (isDark ? "-dark" : "-light")}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="product-frame relative z-10 w-full flex justify-center"
                  >
                    <Image 
                      src={isDark ? "/images/hero/hero-product-dark.png" : "/images/hero/hero-product.png"} 
                      alt={selected}
                      width={400}
                      height={500}
                      className="w-full h-auto max-w-[280px]"
                    />
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="flex-1 order-3 text-center md:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xs mx-auto md:mx-0"
              >
                <span className="text-xs font-black uppercase tracking-widest text-accent px-3 py-1 bg-accent/10 rounded-full">Available Now</span>
                <h3 className="text-4xl font-black text-foreground mt-6">{FLAVORS[selected].name}</h3>
                <p className="mt-4 text-muted text-lg leading-relaxed">
                  {FLAVORS[selected].description} meticulously crafted with organic pea protein and pure cocoa.
                </p>
                <div className="mt-10 flex flex-col gap-4">
                  <div className="text-3xl font-black text-foreground">$54.<span className="text-lg">99</span></div>
                  <Button size="lg" className="w-full">Add to Cart</Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
