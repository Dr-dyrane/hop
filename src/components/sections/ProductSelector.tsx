"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { CATEGORIES, PRODUCTS } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

export function ProductSelector() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [selectedProduct, setSelectedProduct] = useState<keyof typeof PRODUCTS>("protein_chocolate");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleCheckout = (prodKey: keyof typeof PRODUCTS) => {
    const product = PRODUCTS[prodKey] as any;
    const phoneNumber = "+2348060785487";
    const text = `Hello House of Prax, I'd like to order the ${product.name}${product.flavor ? ` (${product.flavor})` : ''} ($${product.price}). Please let me know the next steps.`;
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const filteredProducts = Object.keys(PRODUCTS).filter(
    (key) => PRODUCTS[key as keyof typeof PRODUCTS].category === activeCategory
  );

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
            Choose Your Fuel.
          </motion.h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const firstInCat = Object.keys(PRODUCTS).find(k => PRODUCTS[k as keyof typeof PRODUCTS].category === cat.id);
                  if (firstInCat) setSelectedProduct(firstInCat as any);
                }}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  activeCategory === cat.id 
                    ? "bg-accent text-white" 
                    : "bg-surface text-muted hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24 w-full">
          {/* Product Toggles */}
          <div className="flex flex-col md:flex-row gap-4 order-2 md:order-1 w-full md:w-auto">
            <div className="flex flex-row md:flex-col gap-4 w-full md:w-auto overflow-hidden md:overflow-hidden">
              {filteredProducts.map((key) => {
              const prod = PRODUCTS[key as keyof typeof PRODUCTS] as any;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedProduct(key as any)}
                  className={cn(
                    "flex-1 px-6 py-4 rounded-3xl transition-all duration-500 text-left",
                    selectedProduct === key 
                      ? "bg-foreground text-background shadow-float scale-105" 
                      : "bg-surface opacity-60 hover:opacity-100 hover:shadow-md"
                  )}
                >
                  <div className={cn(
                    "text-[10px] font-black uppercase tracking-widest mb-1 opacity-50",
                    selectedProduct === key ? "text-background/60" : "text-muted"
                  )}>
                    {prod.category}
                  </div>
                  <div className="text-xl font-black">{prod.flavor || prod.name}</div>
                </button>
              );
            })}
            </div>
          </div>

          {/* Product Image Stage */}
          <div className="relative w-full max-w-sm h-[450px] flex items-center justify-center order-1 md:order-2 perspective-2000">
             <div className="absolute inset-0 bg-gradient-radial from-accent/10 to-transparent blur-3xl pointer-events-none opacity-50" />
             
             <AnimatePresence mode="wait">
                <motion.div
                  key={selectedProduct}
                  initial={{ opacity: 0, scale: 0.8, rotateY: -20, z: -100 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0, z: 0 }}
                  exit={{ opacity: 0, scale: 1.1, rotateY: 20, z: 100 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="product-frame relative z-10 w-full flex justify-center preserve-3d group/jar transition-transform"
                >
                  <Image 
                    src={PRODUCTS[selectedProduct as keyof typeof PRODUCTS].image} 
                    alt={selectedProduct.toString()}
                    width={500}
                    height={650}
                    className="w-[85%] h-auto max-w-[300px] drop-shadow-2xl animate-float mask-radial"
                  />
                </motion.div>
             </AnimatePresence>
          </div>

          {/* Detail Side */}
          <div className="flex-1 order-3 text-center md:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProduct}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xs mx-auto md:mx-0"
              >
                <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-accent px-4 py-2 bg-accent/10 rounded-full mb-10">
                  Premium Quality
                </span>
                <h3 className="text-4xl md:text-5xl font-black text-foreground leading-[0.9] tracking-tighter">
                  {PRODUCTS[selectedProduct as keyof typeof PRODUCTS].name}
                </h3>
                <p className="mt-6 text-muted text-lg leading-relaxed font-medium">
                  {PRODUCTS[selectedProduct as keyof typeof PRODUCTS].description}
                </p>
                
                {(PRODUCTS[selectedProduct as keyof typeof PRODUCTS] as any).stats && (
                  <div className="mt-10 flex flex-wrap gap-4 justify-center md:justify-start">
                    {Object.entries((PRODUCTS[selectedProduct as keyof typeof PRODUCTS] as any).stats).map(([statKey, val]: [string, any]) => (
                      <div key={statKey} className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted">{statKey}</span>
                        <span className="text-lg font-black text-foreground">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-10 pt-10">
                  <div className="flex items-baseline gap-2 mb-6 justify-center md:justify-start">
                    <span className="text-4xl font-black text-foreground">${Math.floor(PRODUCTS[selectedProduct as keyof typeof PRODUCTS].price)}.</span>
                    <span className="text-xl font-bold text-foreground">{(PRODUCTS[selectedProduct as keyof typeof PRODUCTS].price % 1).toFixed(2).split('.')[1]}</span>
                    <span className="text-xs font-black uppercase tracking-widest text-muted ml-4 opacity-40">Per Unit</span>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full !h-16 rounded-2xl text-base font-black uppercase tracking-widest shadow-float hover:scale-[1.02] transition-transform duration-700 ease-smooth"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCheckout(selectedProduct as any)}
                  >
                    Order via WhatsApp
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
