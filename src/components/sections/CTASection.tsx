"use client";

import React from "react";
import Link from "next/link";
import { Rocket, ShoppingBag, ArrowRight, Zap } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { Button } from "@/components/ui/Button";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import {
  SHOT_BUNDLE,
  formatNgn,
  getProductPriceSnapshot,
  isShotProduct,
} from "@/lib/commerce";
import type { ProductId } from "@/lib/marketing/types";

export function CTASection() {
  const { homeSectionsByKey, productIds, productsById } = useMarketingContent();
  const { addItem, itemCount, openCart } = useCommerce();
  
  const ctaSettings = homeSectionsByKey.cta?.settings as { defaultProductId?: ProductId } | undefined;
  const defaultProductId = ctaSettings?.defaultProductId && productsById[ctaSettings.defaultProductId]
      ? ctaSettings.defaultProductId
      : productIds[0] ?? null;

  if (!defaultProductId || !productsById[defaultProductId]) return null;

  const flagshipProduct = productsById[defaultProductId];
  const flagshipPricing = getProductPriceSnapshot(productsById, defaultProductId);
  const shotPreviewProductId = productIds.find((productId) =>
    isShotProduct(productsById, productId)
  );
  const shotPreviewImage =
    (shotPreviewProductId ? productsById[shotPreviewProductId]?.image : null) ??
    "/images/products/shot_glow.png";

  const handlePrimaryAction = () => {
    if (itemCount > 0) {
      openCart();
      return;
    }
    addItem(defaultProductId);
  };

  return (
    <SectionContainer id="cta" className="relative pb-40 pt-24 overflow-hidden">
      {/* Background Atmosphere: Convergent Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square bg-accent/[0.03] rounded-full blur-[160px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl relative z-10 px-6">
        <div className="flex flex-col items-center text-center mb-20">
          <HeroEyebrow position="center" animated className="bg-label text-system-background">
            <Rocket className="mr-3 h-3.5 w-3.5" />
            Get Started
          </HeroEyebrow>
          
          <h2 className="mt-12 text-6xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.75]">
            Upgrade Your <br />
            <span className="italic opacity-20">Protein.</span>
          </h2>
        </div>

        {/* The Glass CTA Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Action Side */}
          <div className="lg:col-span-7 space-y-10 order-2 lg:order-1">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-12 bg-accent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent">The Protocol</span>
              </div>
              <p className="text-2xl md:text-3xl text-label/50 italic leading-relaxed font-light max-w-xl">
                Train hard. Stack smart. {SHOT_BUNDLE.shortLabel} for <span className="text-label font-bold not-italic">{formatNgn(4499)}</span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="!h-[80px] px-12 rounded-[24px] bg-label text-system-background text-sm font-bold uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-transform group"
                onClick={handlePrimaryAction}
              >
                {itemCount > 0 ? (
                  <span className="flex items-center gap-3">
                    <ShoppingBag size={18} strokeWidth={2.5} />
                    Finalize Order
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Zap size={18} fill="currentColor" />
                    Deploy Fuel
                  </span>
                )}
              </Button>

              <Link
                href="#shop"
                className="h-[80px] px-12 rounded-[24px]  liquid-glass flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.3em] text-label/40 hover:bg-label/[0.02] transition-all group"
              >
                Browse All
                <ArrowRight size={14} className="ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Product Preview Side */}
          <div className="lg:col-span-5 order-1 lg:order-2 relative">
            <motion.div
              whileHover={{ scale: 1.02, rotateY: -5 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <LiquidGlassCard 
                variant="default" 
                intensity="subtle" 
                className="p-10 squircle  relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full" />
                
                <div className="flex items-center justify-between mb-12">
                   <div className="space-y-1">
                     <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Current Selection</div>
                     <div className="text-xl font-headline font-bold text-label">{flagshipProduct.name}</div>
                   </div>
                   <div className="w-12 h-12 rounded-2xl bg-white/[0.03]   flex items-center justify-center text-label/20">
                     <Zap size={18} />
                   </div>
                </div>

                <div className="relative aspect-square w-full max-w-[240px] mx-auto mb-10">
                  <div className="absolute inset-0 bg-accent/10 blur-[80px] rounded-full scale-125" />
                  <Image
                    src={flagshipProduct.image ?? "/images/products/protein_chocolate.png"}
                    alt={flagshipProduct.name}
                    fill
                    className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.4)]"
                  />
                </div>

                <div className="flex items-end justify-between pt-8">
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-label/20 italic">Unit Price</div>
                    <div className="text-3xl font-headline font-bold text-label">{formatNgn(flagshipPricing.currentNgn)}</div>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                    <span className="relative h-5 w-5 overflow-hidden rounded-md bg-system-background/55 ring-1 ring-accent/15">
                      <Image
                        src={shotPreviewImage}
                        alt="Shot bundle"
                        fill
                        sizes="20px"
                        className="object-contain p-[1px]"
                      />
                    </span>
                    {SHOT_BUNDLE.shortLabel}
                  </div>
                </div>
              </LiquidGlassCard>
            </motion.div>
          </div>

        </div>
      </div>
    </SectionContainer>
  );
}
