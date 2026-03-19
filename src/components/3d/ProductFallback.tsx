"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface ProductFallbackProps {
  imagePath: string;
  className?: string;
  priority?: boolean;
}

export function ProductFallback({
  imagePath,
  className,
  priority = false,
}: ProductFallbackProps) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className={`relative ${className}`}
    >
      <Image
        src={imagePath}
        alt="Product"
        width={800}
        height={1000}
        priority={priority}
        className="w-full h-auto drop-shadow-2xl mask-radial"
      />
    </motion.div>
  );
}
