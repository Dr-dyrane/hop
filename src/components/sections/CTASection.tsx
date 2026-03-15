"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useTheme } from "next-themes";

export function CTASection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleFinalCheckout = () => {
    const phoneNumber = "+2348060785487";
    const text = "Hello House of Prax, I'm ready to upgrade my protein intake. I'd like to place an order.";
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <SectionContainer className="flex items-center justify-center px-4 pb-32 pt-20 relative">
      {/* Atmosphere bridge - Extreme soft golden bleed */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-transparent to-[#d7c5a3]/5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="relative overflow-hidden w-full cta-inverse rounded-[3.5rem] md:rounded-[5rem] shadow-float max-w-6xl mx-auto"
      >
        {/* Abstract background elements - Vibrant Gold Depth */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[80%] h-full bg-[radial-gradient(circle_at_top_right,_#d7c5a3_0%,_transparent_70%)] opacity-20 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[60%] h-full bg-[radial-gradient(circle_at_bottom_left,_#d7c5a3_0%,_transparent_60%)] opacity-10 blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto py-24 px-6 md:px-12 md:py-36">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent mb-12 block">
              Join the House
            </span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
              Upgrade Your <br /> Protein.
            </h2>

            <div className="mt-16 flex flex-col items-center gap-10">
              <Button
                size="lg"
                variant="primary"
                className="px-12 md:px-20 !h-20 text-lg md:text-xl font-black uppercase tracking-widest !bg-accent !text-accent-foreground rounded-2xl shadow-float hover:scale-105 transition-all duration-700 ease-premium"
                whileTap={{ scale: 0.98 }}
                onClick={handleFinalCheckout}
              >
                Checkout Now — $54.99
              </Button>

              <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-[11px] font-black uppercase tracking-[0.4em] text-background/60">
                <span className="flex items-center gap-3 transition-colors hover:text-accent">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d7c5a3] shadow-[0_0_10px_rgba(215,197,163,0.5)]" /> 
                  Plant-Based
                </span>
                <span className="flex items-center gap-3 transition-colors hover:text-accent">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d7c5a3] shadow-[0_0_10px_rgba(215,197,163,0.5)]" /> 
                  Zero Additives
                </span>
                <span className="flex items-center gap-3 transition-colors hover:text-accent">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d7c5a3] shadow-[0_0_10px_rgba(215,197,163,0.5)]" /> 
                  Clean Fuel
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </SectionContainer>
  );
}

