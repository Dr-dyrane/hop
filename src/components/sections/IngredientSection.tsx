"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 50;

export function IngredientSection() {
  const { ingredients } = useMarketingContent();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // 3D Tilt Values
  const springConfig = { stiffness: 150, damping: 20 };
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), springConfig);

  // Custom Cursor Values
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorSpringX = useSpring(cursorX, { stiffness: 500, damping: 28 });
  const cursorSpringY = useSpring(cursorY, { stiffness: 500, damping: 28 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, [cursorX, cursorY]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovering(false);
  };

  const onDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const { offset, velocity } = info;
    if (offset.x < -DRAG_THRESHOLD || velocity.x < -500) {
      setActiveIndex((prev) => (prev + 1) % ingredients.length);
    } else if (offset.x > DRAG_THRESHOLD || velocity.x > 500) {
      setActiveIndex((prev) => (prev - 1 + ingredients.length) % ingredients.length);
    }
    handleMouseLeave();
  };

  return (
    <section className="relative h-[100vh] min-h-[700px] w-full overflow-hidden bg-system-background flex items-center justify-center cursor-none">
      {/* Custom Magnetic Cursor */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[100] flex items-center justify-center rounded-full bg-label mix-blend-difference"
        style={{
          x: cursorSpringX,
          y: cursorSpringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 100 : 12,
          height: isHovering ? 100 : 12,
        }}
      >
        {isHovering && (
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-[10px] font-bold uppercase tracking-tighter text-system-background"
          >
            Drag
          </motion.span>
        )}
      </motion.div>

      {/* Background Blur Circles */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full bg-accent blur-[160px]" 
        />
        <div className="absolute inset-0 backdrop-blur-[120px] bg-system-background/56" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col justify-center">
        <div 
          className="relative h-[65vh] w-full flex items-center justify-center [perspective:2000px] touch-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => setIsHovering(true)}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {ingredients.map((ing, index) => {
              let offset = index - activeIndex;
              if (offset > ingredients.length / 2) offset -= ingredients.length;
              if (offset < -ingredients.length / 2) offset += ingredients.length;

              const absOffset = Math.abs(offset);
              const isActive = absOffset === 0;

              if (absOffset > 2) return null;

              return (
                <motion.div
                  key={ing.id}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={onDragEnd}
                  initial={{ opacity: 0, scale: 0.8, z: -500 }}
                  animate={{
                    x: offset * 540, 
                    scale: isActive ? 1 : 0.7 - absOffset * 0.1,
                    rotateY: isActive ? rotateY.get() : offset * -40,
                    rotateX: isActive ? rotateX.get() : 0,
                    z: isActive ? 0 : -800 * absOffset,
                    opacity: 1 - absOffset * 0.4,
                    filter: `blur(${isActive ? 0 : 15}px)`,
                  }}
                  style={{ 
                    zIndex: 10 - absOffset,
                    rotateX: isActive ? rotateX : 0,
                    rotateY: isActive ? rotateY : (offset * -40),
                  }}
                  transition={{ type: "spring", stiffness: 140, damping: 20 }}
                  className={cn(
                    "absolute w-[90vw] max-w-[1000px] aspect-[16/10] rounded-[60px] overflow-hidden shadow-card",
                    isActive
                      ? "shadow-float ring-1 ring-ring/55"
                      : "pointer-events-none ring-1 ring-separator/45"
                  )}
                >
                  <div className="relative h-full w-full">
                    <Image src={ing.image} alt={ing.name} fill priority={isActive} className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-system-background/90 via-system-background/56 to-transparent dark:from-system-background/88 dark:via-system-background/30" />
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute inset-0 p-12 md:p-20 flex flex-col justify-end"
                        >
                          <span className="w-fit bg-system-background/62 dark:bg-system-fill/65 backdrop-blur-3xl px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-label/75 mb-8">
                            {ing.category}
                          </span>
                          <h2 className="text-8xl md:text-[140px] font-headline font-bold text-label tracking-tighter leading-[0.7] mb-10">
                            {ing.name}
                          </h2>
                          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
                            <p className="max-w-md text-xl text-secondary-label font-light leading-snug">
                              {ing.detail}
                            </p>
                            <span className="text-[11px] font-bold uppercase tracking-widest text-accent pb-1">
                              {ing.benefit}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Cinematic Progress Bar */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <span className="text-[10px] font-bold text-secondary-label/70">01</span>
          <div className="flex gap-2">
            {ingredients.map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  width: i === activeIndex ? 60 : 10,
                  backgroundColor:
                    i === activeIndex
                      ? "var(--label)"
                      : "color-mix(in srgb, var(--label) 16%, transparent)"
                }}
                className="h-[2px] rounded-full transition-all duration-700"
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-secondary-label/70">
            {ingredients.length.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}
