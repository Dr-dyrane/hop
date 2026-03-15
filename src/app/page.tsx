import { Navbar } from "@/components/sections/Navbar";
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

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <BenefitsGrid />
      <IngredientSection />
      <HowItWorks />
      <LifestyleGallery />
      <ProductSelector />
      <SocialProof />
      <CTASection />
      <Footer />
      
      {/* 
        The following sections will be built out to match the README:
        - SolutionSection (White)
        - BenefitsGrid (White)
        - IngredientSection (Cream)
        - HowItWorks (White)
        - LifestyleGallery (Image Full)
        - ProductSelector (Cream)
        - SocialProof (White)
        - CTASection (Forest)
        - Footer
      */}
    </main>
  );
}
