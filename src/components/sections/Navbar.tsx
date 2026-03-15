"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { Equal, X } from "lucide-react";
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "py-3 bg-background/80 backdrop-blur-xl"
            : "py-6 bg-transparent"
        )}
      >
        <div className="container-shell flex items-center justify-between relative">
          {/* Logo */}
          <div className="flex w-auto md:w-1/4">
            <Link href="/" className="z-50 shrink-0">
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 w-1/2">
            {NAVIGATION.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors duration-300"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-3 md:gap-4 w-auto md:w-1/4">
            <motion.div layout className="hidden md:flex">
              <ThemeToggle />
            </motion.div>
            
            <AnimatePresence>
              {isScrolled && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <Link
                    href="#shop"
                    className="hidden md:inline-flex items-center justify-center button-primary !h-[32px] !min-h-[32px] px-6 text-[9px] font-black uppercase tracking-[0.2em] rounded-full whitespace-nowrap shadow-float hover:scale-105 transition-transform"
                  >
                    Start Order
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="md:hidden relative z-50 h-10 w-10 flex items-center justify-center"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMobileMenuOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  ) : (
                    <Equal className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background"
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative flex flex-col justify-center min-h-screen px-8"
            >
              <nav className="flex flex-col">
                {NAVIGATION.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.1 + index * 0.06,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="group flex items-center py-5"
                    >
                      <span className="text-4xl font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors duration-300">
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.1 + NAVIGATION.length * 0.06,
                }}
                className="mt-12 flex flex-col gap-8"
              >
                <div className="flex items-center justify-between px-2">
                  <span className="text-xl font-medium text-muted">Appearance</span>
                  <ThemeToggle />
                </div>

                <Link
                  href="#shop"
                  onClick={closeMobileMenu}
                  className="button-primary w-full justify-center min-h-[56px] text-xs font-semibold uppercase tracking-[0.15em]"
                >
                  Choose Your Flavor
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
