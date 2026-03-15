"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { SOCIAL_PROOF } from "@/lib/data";
import { Star } from "lucide-react";

export function SocialProof() {
  const stats = [
    { label: "Average Rating", value: `${SOCIAL_PROOF.rating}★`, sub: "Verified Reviews" },
    { label: "Servings Shipped", value: SOCIAL_PROOF.servings, sub: "Clean Energy Provided" },
    { label: "Athletes", value: "100%", sub: "Performance Focused" }
  ];

  return (
    <SectionContainer variant="alt" id="social">
      <div className="text-center mb-16">
        <div className="flex items-center justify-center space-x-1 mb-6 text-accent">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={20} fill="currentColor" />
          ))}
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-foreground">Trusted by Athletes.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="text-6xl font-black text-foreground mb-2 tracking-tighter italic">{stat.value}</div>
            <div className="text-sm font-black uppercase tracking-[0.2em] text-muted/40">{stat.label}</div>
            <div className="mt-4 text-muted/60 text-sm font-medium">{stat.sub}</div>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  );
}
