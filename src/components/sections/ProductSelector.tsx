"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { formatNgn, getProductPriceSnapshot } from "@/lib/commerce";
import { Button } from "@/components/ui/Button";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { cn } from "@/lib/utils";
import type { ProductId } from "@/lib/marketing/types";

const Product3DViewer = dynamic(
  () => import("@/components/3d/Product3DViewer").then((mod) => mod.Product3DViewer),
  { ssr: false }
);

export function ProductSelector() {
  const { categories, productIds, productsById } = useMarketingContent();
  const { resolvedTheme } = useTheme();
  const { addItem } = useCommerce();

  // Filter Categories that actually have products
  const visibleCategories = categories.filter((cat) => 
    productIds.some((id) => productsById[id].categoryId === cat.id)
  );

  const [activeCategory, setActiveCategory] = useState(visibleCategories[0]?.id ?? "");
  const [selectedProduct, setSelectedProduct] = useState<ProductId>(productIds[0]);
  const isDark = resolvedTheme === "dark";
  const scrollActive = true;

  // Logic for filtered products based on category
  const filteredProducts = productIds.filter((id) => productsById[id].categoryId === activeCategory);
  const safeSelectedProduct = filteredProducts.includes(selectedProduct) ? selectedProduct : filteredProducts[0];
  const activeProduct = productsById[safeSelectedProduct];
  const pricing = getProductPriceSnapshot(productsById, safeSelectedProduct);

  if (!activeProduct) return null;

  return (
    <SectionContainer variant="alt" id="shop" className="overflow-visible">
      <div className="mx-auto max-w-7xl relative">
        
        {/* Cinematic Header */}
        <div className="mb-20 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-full bg-label/[0.03] backdrop-blur-md px-4 py-2 -white/5 mb-10"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-label/60">Elite Selection</span>
          </motion.div>

          <h2 className="text-6xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.75]">
            Choose Your <br />
            <span className="italic opacity-20">Fuel.</span>
          </h2>
        </div>

        {/* Main Interface: The Glass Stage */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT: Product Details & Stats */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={safeSelectedProduct}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-12"
              >
                <div>
                  <h3 className="text-4xl md:text-6xl font-headline font-bold text-label tracking-tight">
                    {activeProduct.name}
                  </h3>
                  <p className="mt-6 text-lg text-label/40 italic leading-relaxed font-light">
                    {activeProduct.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(activeProduct.stats).map(([key, val]) => (
                    <div key={key} className="p-6 rounded-3xl bg-label/[0.02] -white/5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">{key}</div>
                      <div className="text-2xl font-headline font-bold text-label">{val as string}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CENTER: The Visual Pedestal */}
          <div className="lg:col-span-5 relative order-1 lg:order-2">
            <div className="absolute inset-0 bg-accent/5 blur-[120px] rounded-full scale-150 pointer-events-none" />
            <div className="relative aspect-[4/5] w-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={safeSelectedProduct}
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -30 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 w-full h-full"
                >
                  {activeProduct.model ? (
                    <Product3DViewer
                      modelPath={activeProduct.model}
                      theme={isDark ? "dark" : "light"}
                      className="h-full w-full"
                      sectionId={`shop-${safeSelectedProduct}`}
                      scrollActive={scrollActive}
                    />
                  ) : (
                    <Image
                      src={activeProduct.image || ""}
                      alt={activeProduct.name}
                      fill
                      className="object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.3)]"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* The Floating Price Badge */}
            <motion.div 
              layoutId="price-badge"
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-xs"
            >
              <LiquidGlassCard variant="default" intensity="subtle" className="p-4 flex items-center justify-between gap-4 -white/10 squircle">
                <div className="pl-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-accent">Investment</div>
                  <div className="text-xl font-bold text-label">{formatNgn(pricing.currentNgn)}</div>
                </div>
                <Button 
                  onClick={() => addItem(safeSelectedProduct)}
                  className="rounded-2xl h-12 px-6 font-bold uppercase text-[10px] tracking-widest"
                >
                  Deploy Fuel
                </Button>
              </LiquidGlassCard>
            </motion.div>
          </div>

          {/* RIGHT: Selection Controls */}
          <div className="lg:col-span-3 order-3 space-y-10">
            {/* Category Toggle */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-label/30 ml-2">Category</span>
              <div className="flex flex-col gap-1 p-1 bg-label/[0.03] rounded-[24px] -white/5">
                {visibleCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      const first = productIds.find(id => productsById[id].categoryId === cat.id);
                      if (first) setSelectedProduct(first);
                    }}
                    className={cn(
                      "px-6 py-3 rounded-[20px] text-[10px] font-bold uppercase tracking-widest transition-all",
                      activeCategory === cat.id ? "bg-label text-system-background shadow-xl" : "text-label/40 hover:text-label"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            {/* Flavor/Variant Grid */}
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-label/30 ml-2">Variants</span>
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((id) => (
                  <button
                    key={id}
                    onClick={() => setSelectedProduct(id)}
                    className={cn(
                      "group relative aspect-square rounded-3xl transition-all duration-500 overflow-hidden",
                      selectedProduct === id ? "border-accent bg-accent/5 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]" : "border-white/5 bg-label/[0.02] hover:border-white/20"
                    )}
                  >
                    <Image 
                      src={productsById[id].image || ""} 
                      alt="" 
                      width={120} height={120} 
                      className="object-contain p-4 group-hover:scale-110 transition-transform duration-500" 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </SectionContainer>
  );
}
