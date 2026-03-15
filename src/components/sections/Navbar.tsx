"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { NAVIGATION } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-6",
          isScrolled
            ? "py-4 bg-background/80 backdrop-blur-md border-b border-border-soft"
            : "bg-transparent"
        )}
      >
        <div className="container-shell flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2 z-50">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            {NAVIGATION.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-semibold uppercase tracking-widest text-muted hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Action Button & Theme Toggle */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="#shop"
              className="hidden sm:inline-flex button-primary min-h-[44px] px-8 text-xs font-black uppercase tracking-[0.2em]"
            >
              Get HON
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-1.5 z-50"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <span
                className={cn(
                  "block w-6 h-0.5 bg-foreground transition-all duration-300 ease-premium",
                  isMobileMenuOpen && "rotate-45 translate-y-2"
                )}
              />
              <span
                className={cn(
                  "block w-6 h-0.5 bg-foreground transition-all duration-300 ease-premium",
                  isMobileMenuOpen && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "block w-6 h-0.5 bg-foreground transition-all duration-300 ease-premium",
                  isMobileMenuOpen && "-rotate-45 -translate-y-2"
                )}
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-background/95 backdrop-blur-lg"
              onClick={closeMobileMenu}
            />

            {/* Mobile Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="relative flex flex-col items-center justify-center min-h-screen gap-8 px-6"
            >
              {NAVIGATION.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.15 + index * 0.05,
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="text-2xl font-semibold uppercase tracking-widest text-foreground hover:text-accent transition-colors"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.15 + NAVIGATION.length * 0.05,
                }}
                className="mt-4"
              >
                <Link
                  href="#shop"
                  onClick={closeMobileMenu}
                  className="button-primary min-h-[52px] px-10 text-sm font-black uppercase tracking-[0.2em]"
                >
                  Get HON
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
