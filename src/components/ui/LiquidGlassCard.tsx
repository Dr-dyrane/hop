'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLiquidGlass } from '@/components/providers/UIProvider'

/**
 * Props for the LiquidGlassCard component
 * @interface LiquidGlassCardProps
 */
interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'clear' | 'tinted'
  intensity?: 'subtle' | 'medium' | 'strong'
  interactive?: boolean
}

/**
 * LiquidGlassCard - Premium glass morphism component with dynamic effects
 * 
 * Features:
 * - Mouse-responsive lighting effects
 * - Scroll-based blur intensity changes
 * - Hardware-accelerated performance optimizations
 * - Mobile-optimized backdrop filters
 * - Intersection Observer for visibility-based rendering
 * 
 * Performance:
 * - Uses global UI provider to prevent duplicate event listeners
 * - SVG filters only render when card is visible
 * - 60fps throttled updates for smooth animations
 * - Mobile-specific optimizations for iOS/Android
 */
export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className,
  variant = 'default',
  intensity = 'medium',
  interactive = true
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { liquidGlassState } = useLiquidGlass()

  useEffect(() => {
    const node = cardRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? false)
      },
      { threshold: 0.1 }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

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

  const cssVariables = useMemo(() => {
    if (!interactive || !isVisible) {
      return {
        '--mouse-x': '50%',
        '--mouse-y': '50%'
      } as Record<string, string>
    }

    return {
      '--mouse-x': `${liquidGlassState.mousePosition.x}%`,
      '--mouse-y': `${liquidGlassState.mousePosition.y}%`
    } as Record<string, string>
  }, [interactive, isVisible, liquidGlassState.mousePosition.x, liquidGlassState.mousePosition.y])

  const blurClass = useMemo(() => {
    if (!isVisible) return ''
    if (liquidGlassState.scrollVelocity > 20) return 'scrolling-fast'
    if (liquidGlassState.scrollVelocity > 5) return 'scrolling-slow'
    return ''
  }, [isVisible, liquidGlassState.scrollVelocity])

  return (
    <>
      <motion.div
        ref={cardRef}
        className={cn(
          variantStyles[variant],
          intensityStyles[intensity],
          blurClass,
          'group relative overflow-hidden',
          className
        )}
        style={cssVariables as React.CSSProperties}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={interactive ? {
          scale: 1.005,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        } : undefined}
      >
        {/* Iridescent overlay for soap bubble effect - only render if visible */}
        {isVisible && <div className="iridescent-overlay" />}
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {children}
        </div>
      </motion.div>
    </>
  )
}

export default LiquidGlassCard
