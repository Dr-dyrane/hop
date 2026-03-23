"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { BadgeList } from "@/components/ui/Badge";
import { Camera, ChevronRight, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const IMAGES = [
  {
    src: "/images/lifestyle/gym.png",
    alt: "Workout session",
    title: "Train with intent",
    caption: "Strength work, clean recovery, no shortcuts.",
    tag: "Performance"
  },
  {
    src: "/images/lifestyle/smoothie.png",
    alt: "Smoothie prep",
    title: "Build the ritual",
    caption: "One scoop, one shake, ready in seconds.",
    tag: "Ritual"
  },
  {
    src: "/images/lifestyle/desk.png",
    alt: "Desk work",
    title: "Sustain the day",
    caption: "Steady fuel for focus and performance.",
    tag: "Focus"
  },
  {
    src: "/images/lifestyle/recovery.png",
    alt: "Post-gym recovery",
    title: "Recover with purpose",
    caption: "Consistent habits, measurable progress.",
    tag: "Restoration"
  },
];

export function LifestyleGallery() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((prev) => (prev + 1) % IMAGES.length);
  const prev = () => setIndex((prev) => (prev - 1 + IMAGES.length) % IMAGES.length);

  return (
    <SectionContainer 
      id="gallery" 
      spacing="flow"
      className="bg-system-background relative overflow-hidden"
    >
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 30, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] aspect-square rounded-full bg-accent/10 blur-[120px]" 
        />
        <div className="absolute inset-0 backdrop-blur-3xl bg-system-background/20" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        {/* Header Section */}
        <div className="mb-20 flex flex-col items-center text-center">
          <HeroEyebrow position="center" animated>
            <Camera className="w-3.5 h-3.5 mr-3 text-label" />
            The Living System
          </HeroEyebrow>
          <h2 className="mt-8 text-6xl sm:text-8xl md:text-9xl font-headline font-bold text-label tracking-tighter leading-[0.8] mb-8">
            Live the <span className="italic opacity-30">Ritual.</span>
          </h2>
          <BadgeList 
            items={["Daily Energy", "Muscle Growth", "Quick Recovery", "Clean Fuel"]}
            className="mb-8"
            animated
          />
        </div>

        {/* Main Cinematic Stage */}
        <div className="relative h-[65vh] md:h-[75vh] w-full flex items-center justify-center [perspective:2000px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {IMAGES.map((image, i) => {
              const isCenter = i === index;
              const isNext = i === (index + 1) % IMAGES.length;
              const isPrev = i === (index - 1 + IMAGES.length) % IMAGES.length;

              if (!isCenter && !isNext && !isPrev) return null;

              return (
                <motion.div
                  key={image.src}
                  initial={{ opacity: 0, scale: 0.8, x: isNext ? 500 : -500, rotateY: isNext ? -45 : 45 }}
                  animate={{
                    opacity: isCenter ? 1 : 0.4,
                    scale: isCenter ? 1 : 0.85,
                    x: isCenter ? 0 : isNext ? "65%" : "-65%",
                    rotateY: isCenter ? 0 : isNext ? -35 : 35,
                    z: isCenter ? 0 : -300,
                    filter: isCenter ? "blur(0px)" : "blur(10px)",
                  }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.4 } }}
                  transition={{ type: "spring", stiffness: 180, damping: 24 }}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "absolute w-full max-w-[900px] aspect-[16/10] rounded-[40px] md:rounded-[60px] overflow-hidden cursor-pointer",
                    isCenter ? "z-30 shadow-2xl" : "z-10 shadow-lg"
                  )}
                >
                  <div className="relative w-full h-full group">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      priority
                      className="object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    
                    {/* Theme-aware readability mask only under the text zone */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-system-background/94 via-system-background/54 to-transparent dark:from-system-background/88 dark:via-system-background/34 dark:to-transparent" />

                    {/* Content Layer (Only visible on active) */}
                    {isCenter && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end"
                      >
                        <span className="text-label/65 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
                          {image.tag}
                        </span>
                        <h3 className="text-4xl md:text-6xl font-headline font-bold text-label mb-4 tracking-tight">
                          {image.title}
                        </h3>
                        <p className="text-secondary-label text-lg max-w-md font-light italic">
                          {image.caption}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Invisible Interaction Zones */}
          <div className="absolute inset-0 z-40 pointer-events-none flex justify-between px-4 md:px-12">
            <button onClick={prev} className="pointer-events-auto h-full w-1/4" aria-label="Previous" />
            <button onClick={next} className="pointer-events-auto h-full w-1/4" aria-label="Next" />
          </div>
        </div>

        {/* Minimal Navigation Control */}
        <div className="mt-16 flex items-center justify-between px-6">
          <div className="flex gap-4">
            <button onClick={prev} className="p-4 rounded-full bg-label/5 hover:bg-label/10 text-label transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="p-4 rounded-full bg-label/5 hover:bg-label/10 text-label transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold tracking-widest text-label/20 uppercase">Gallery View</span>
            <div className="flex gap-2">
              {IMAGES.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    width: i === index ? 40 : 8,
                    backgroundColor: i === index ? "var(--label)" : "var(--quaternary-label)" 
                  }}
                  className="h-1 rounded-full transition-all cursor-pointer"
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
