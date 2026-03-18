'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'clear' | 'tinted'
  intensity?: 'subtle' | 'medium' | 'strong'
  interactive?: boolean
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className,
  variant = 'default',
  intensity = 'medium',
  interactive = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 30, y: 40 })
  const [scrollVelocity, setScrollVelocity] = useState(0)
  const lastScrollY = useRef(0)

  // Mouse tracking for dynamic light refraction
  useEffect(() => {
    if (!interactive) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      
      const rect = cardRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      
      setMousePosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) })
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const velocity = Math.abs(currentScrollY - lastScrollY.current)
      setScrollVelocity(velocity)
      lastScrollY.current = currentScrollY
      
      // Reset velocity after scroll stops
      setTimeout(() => setScrollVelocity(0), 150)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [interactive])

  // Dynamic CSS variables for mouse position
  useEffect(() => {
    if (!cardRef.current) return
    
    cardRef.current.style.setProperty('--mouse-x', `${mousePosition.x}%`)
    cardRef.current.style.setProperty('--mouse-y', `${mousePosition.y}%`)
  }, [mousePosition])

  // Velocity-based blur intensity
  const getBlurClass = () => {
    if (scrollVelocity > 20) return 'scrolling-fast'
    if (scrollVelocity > 5) return 'scrolling-slow'
    return ''
  }

  const variantStyles = {
    default: 'liquid-glass',
    clear: 'liquid-glass-clear',
    tinted: 'liquid-glass-tinted'
  }

  const intensityStyles = {
    subtle: 'liquid-glass-subtle',
    medium: 'liquid-glass-medium',
    strong: 'liquid-glass-strong'
  }

  return (
    <>
      {/* SVG Filter for Liquid Distortion */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id="liquid-distortion">
          <feTurbulence 
            baseFrequency="0.02" 
            numOctaves="3" 
            result="turbulence"
            seed={interactive ? mousePosition.x + mousePosition.y : 0}
          >
            <animate 
              attributeName="baseFrequency" 
              values="0.02;0.025;0.02" 
              dur="8s" 
              repeatCount="indefinite" 
            />
          </feTurbulence>
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="turbulence" 
            scale="3" 
            xChannelSelector="R" 
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.5" />
          <feColorMatrix 
            values="1 0 0 0 0
                    0 1 0 0 0  
                    0 0 1 0 0
                    0 0 0 0.95 0" 
          />
        </filter>
      </svg>

      <motion.div
        ref={cardRef}
        className={cn(
          variantStyles[variant],
          intensityStyles[intensity],
          getBlurClass(),
          'group relative overflow-hidden',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={interactive ? {
          scale: 1.005,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        } : undefined}
      >
        {/* Iridescent overlay for soap bubble effect */}
        <div className="iridescent-overlay" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {children}
        </div>
      </motion.div>
    </>
  )
}

export default LiquidGlassCard
