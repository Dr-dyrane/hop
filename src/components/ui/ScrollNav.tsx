"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUI } from "@/components/providers/UIProvider";
import { useTheme } from "next-themes";
import { Home, AlertTriangle, Lightbulb, Sparkles, Leaf, Cog, Star, ShoppingBag, Rocket, TestTube, Sun, Moon, X, UnfoldVertical } from "lucide-react";
import { LucideProps } from "lucide-react";

interface ScrollNavProps {
  className?: string;
}

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
}

export function ScrollNav({ className }: ScrollNavProps) {
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [isVisible, setIsVisible] = useState(false);
  const { isMobileMenuOpen, isScrollNavCollapsed, setIsScrollNavCollapsed } = useUI();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const sections: Section[] = [
    { id: "hero", label: "Home", icon: Home },
    { id: "problem", label: "Problem", icon: AlertTriangle },
    { id: "solution", label: "Solution", icon: Lightbulb },
    { id: "benefits", label: "Benefits", icon: Sparkles },
    { id: "ingredients", label: "Ingredients", icon: Leaf },
    { id: "how-it-works", label: "How It Works", icon: Cog },
    { id: "lifestyle", label: "Lifestyle", icon: TestTube },
    { id: "shop", label: "Products", icon: ShoppingBag },
    { id: "social", label: "Reviews", icon: Star },
    { id: "cta", label: "Get Started", icon: Rocket },
  ];

  useEffect(() => {
    const handleScroll = () => {
      // Show/hide nav based on scroll position
      setIsVisible(window.scrollY > window.innerHeight * 0.25);

      // Update active section
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={cn(
        "fixed right-4 top-1/2 transform -translate-y-1/2 z-40 transition-all duration-500",
        isVisible && !isMobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none",
        className
      )}
    >
      <div className={cn(
        "flex flex-col gap-3 bg-surface/10 backdrop-blur-sm rounded-2xl shadow-lg transition-all duration-300",
        isScrollNavCollapsed ? "p-2" : "p-3"
      )}>
        {/* Collapse toggle */}
        <button
          onClick={() => setIsScrollNavCollapsed(!isScrollNavCollapsed)}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 text-xs cursor-pointer backdrop-blur-sm",
            isScrollNavCollapsed 
              ? "bg-foreground/10 text-foreground hover:bg-foreground/20" 
              : "text-muted hover:bg-foreground/10 w-full"
          )}
          aria-label={isScrollNavCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {isScrollNavCollapsed ? (
            <UnfoldVertical className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
        </button>

        {/* Theme toggle */}
        {!isScrollNavCollapsed && (
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 text-xs cursor-pointer backdrop-blur-sm",
              "text-muted hover:bg-foreground/10 w-full"
            )}
            aria-label="Toggle theme"
          >
            {mounted && (
              <div className="relative w-3 h-3">
                <Sun className={cn(
                  "absolute inset-0 w-3 h-3 transition-all duration-300",
                  theme === "dark" ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
                )} />
                <Moon className={cn(
                  "absolute inset-0 w-3 h-3 transition-all duration-300",
                  theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
                )} />
              </div>
            )}
          </button>
        )}

        {/* Navigation items */}
        {!isScrollNavCollapsed && sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "group relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 text-sm cursor-pointer backdrop-blur-sm",
              activeSection === section.id
                ? "bg-foreground/10 text-foreground shadow-md scale-110" 
                : "text-muted hover:bg-foreground/10 hover:text-foreground hover:scale-105"
            )}
            aria-label={`Scroll to ${section.label}`}
            title={section.label}
          >
            <section.icon className="w-4 h-4" />
            
            {/* Tooltip */}
            <div className={cn(
              "absolute right-full mr-2 px-3 py-1.5 text-xs text-foreground bg-surface/10 backdrop-blur-sm rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap top-1/2 -translate-y-1/2",
              activeSection === section.id && "opacity-100 bg-foreground/10 backdrop-blur-[16px] text-foreground"
            )}>
              <span className="font-medium">{section.label}</span>
            </div>
          </button>
        ))}
        
        {/* Progress indicator - only show when not collapsed */}
        {!isScrollNavCollapsed && (
          <div className="mt-3 flex flex-col items-center gap-1">
            <div className="text-xs text-muted font-medium uppercase tracking-wider">
              {Math.round((sections.findIndex(s => s.id === activeSection) + 1) / sections.length * 100)}%
            </div>
            <div className="w-8 h-1 bg-border-soft rounded-full overflow-hidden">
              <div 
                className="h-full bg-foreground transition-all duration-500 ease-out"
                style={{ 
                  width: `${((sections.findIndex(s => s.id === activeSection) + 1) / sections.length) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
