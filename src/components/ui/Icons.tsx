import React from "react";
import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

export function CleanIcon({ className, size = 32 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent", className)}
    >
      <path d="M20 3L6 10V20C6 28.5 20 37 20 37C20 37 34 28.5 34 20V10L20 3Z" stroke="currentColor" strokeWidth="2" />
      <path d="M20 12C20 12 15 17 15 22C15 25 17.5 27 20 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 12C20 12 25 17 25 22C25 25 22.5 27 20 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PlantIcon({ className, size = 32 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent", className)}
    >
      <path d="M20 32V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 20C20 20 12 18 12 12C12 8 16 6 20 10V20Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M20 20C20 20 28 18 28 12C28 8 24 6 20 10V20Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="20" cy="34" r="2" fill="currentColor" />
    </svg>
  );
}

export function DigestionIcon({ className, size = 32 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-accent", className)}
    >
      <path d="M20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5C11.7157 5 5 11.7157 5 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 10C14.4772 10 10 14.4772 10 20C10 25.5228 14.4772 30 20 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
      <path d="M20 20C20 20 24 18 24 23C24 28 20 27 20 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="27" cy="13" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
