import { Variants, Transition } from "framer-motion";

// Apple's signature easing curves
export const appleEase = {
  smooth: [0.16, 1, 0.3, 1] as const,
  out: [0.22, 1, 0.36, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  spring: { type: "spring", stiffness: 300, damping: 30 } as const,
};

// Premium transitions
export const transitions = {
  fast: { duration: 0.3, ease: appleEase.smooth } as Transition,
  base: { duration: 0.6, ease: appleEase.out } as Transition,
  slow: { duration: 1.0, ease: appleEase.out } as Transition,
  slower: { duration: 1.4, ease: appleEase.smooth } as Transition,
  spring: appleEase.spring as Transition,
};

// Text reveal variants - word by word
export const textReveal: Variants = {
  hidden: { 
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const wordReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    filter: "blur(10px)",
  },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: appleEase.out,
    },
  },
};

// Character reveal for ultra-premium effect
export const charReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: appleEase.out,
    },
  },
};

// Scroll reveal variants
export const scrollReveal: Variants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    filter: "blur(8px)",
  },
  visible: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.0,
      ease: appleEase.out,
    },
  },
};

export const scrollRevealStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Fade up - basic but polished
export const fadeUp: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: transitions.base,
  },
};

// Fade in - subtle entrance
export const fadeIn: Variants = {
  hidden: { 
    opacity: 0,
  },
  visible: { 
    opacity: 1,
    transition: transitions.slow,
  },
};

// Scale reveal - for products/images
export const scaleReveal: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.85,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 1.2,
      ease: appleEase.out,
    },
  },
};

// Product cinematic reveal
export const productReveal: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 60,
    rotateX: 15,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 1.4,
      ease: appleEase.smooth,
    },
  },
};

// Slide in from sides
export const slideInLeft: Variants = {
  hidden: { 
    opacity: 0, 
    x: -60,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: transitions.base,
  },
};

export const slideInRight: Variants = {
  hidden: { 
    opacity: 0, 
    x: 60,
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: transitions.base,
  },
};

// Magnetic button effect values
export const magneticStrength = 0.3;
export const magneticRadius = 100;

// Hover lift effect
export const hoverLift = {
  y: -4,
  transition: transitions.fast,
};

// Card hover
export const cardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -8,
    transition: transitions.fast,
  },
};

// Stagger container
export const staggerContainer = (staggerChildren = 0.1, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Number counter spring
export const counterSpring = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

// Page transition
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: appleEase.out,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: appleEase.in,
    },
  },
};

// Viewport settings for scroll triggers
export const viewportOnce = { once: true, margin: "-100px" };
export const viewportAlways = { once: false, margin: "-100px" };

// Scroll progress thresholds
export const scrollThresholds = {
  start: 0,
  middle: 0.5,
  end: 1,
};
