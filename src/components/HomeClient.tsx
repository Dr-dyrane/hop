"use client";

import type { ReactNode } from "react";
import { useScrollAware3D } from "@/hooks/useScrollAware3D";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { Navbar } from "@/components/sections/Navbar";
import { ScrollNav } from "@/components/ui/ScrollNav";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { BenefitsGrid } from "@/components/sections/BenefitsGrid";
import { IngredientSection } from "@/components/sections/IngredientSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LifestyleGallery } from "@/components/sections/LifestyleGallery";
import { ProductSelector } from "@/components/sections/ProductSelector";
import { SocialProof } from "@/components/sections/SocialProof";
import { CTASection } from "@/components/sections/CTASection";
import { Footer } from "@/components/sections/Footer";

export function HomeClient() {
  const { homeSections } = useMarketingContent();
  // Centralized scroll-aware 3D animation - only ONE Intersection Observer instance
  const { isScrollingIntoSection } = useScrollAware3D({
    sectionIds: ["hero", "solution", "shop"],
  });

  const renderedSections: ReactNode[] = homeSections.map((section) => {
    switch (section.sectionType) {
      case "hero":
        return <HeroSection key={section.sectionKey} />;
      case "problem_statement":
        return <ProblemSection key={section.sectionKey} />;
      case "science_strip":
        return (
          <SolutionSection
            key={section.sectionKey}
            isScrollingIntoSection={isScrollingIntoSection}
          />
        );
      case "benefit_grid":
        return <BenefitsGrid key={section.sectionKey} />;
      case "ingredient_story":
        return <IngredientSection key={section.sectionKey} />;
      case "process_steps":
      case "delivery_reassurance":
        return <HowItWorks key={section.sectionKey} />;
      case "lifestyle_gallery":
        return <LifestyleGallery key={section.sectionKey} />;
      case "featured_products":
        return (
          <ProductSelector
            key={section.sectionKey}
            isScrollingIntoSection={isScrollingIntoSection}
          />
        );
      case "review_highlight":
        return <SocialProof key={section.sectionKey} />;
      case "final_cta":
        return <CTASection key={section.sectionKey} />;
      default:
        return null;
    }
  });

  return (
    <main className="relative max-w-screen overflow-clip">
      <Navbar />
      <ScrollNav />
      {renderedSections}
      <Footer />
    </main>
  );
}
