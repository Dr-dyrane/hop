"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface LiquidGlassState {
  mousePosition: { x: number; y: number };
  scrollVelocity: number;
  isScrolling: boolean;
}

interface NavUIContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isScrollNavCollapsed: boolean;
  setIsScrollNavCollapsed: (collapsed: boolean) => void;
  hasActiveOverlay: boolean;
  setOverlayActive: (id: string, active: boolean) => void;
}

interface LiquidGlassContextType {
  liquidGlassState: LiquidGlassState;
}

const NavUIContext = createContext<NavUIContextType | undefined>(undefined);
const LiquidGlassContext = createContext<LiquidGlassContextType | undefined>(undefined);

const defaultLiquidGlassState: LiquidGlassState = {
  mousePosition: { x: 50, y: 50 },
  scrollVelocity: 0,
  isScrolling: false,
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrollNavCollapsed, setIsScrollNavCollapsed] = useState(true);
  const [activeOverlayIds, setActiveOverlayIds] = useState<string[]>([]);
  const [liquidGlassState, setLiquidGlassState] = useState(defaultLiquidGlassState);
  const stateRef = useRef(defaultLiquidGlassState);

  useEffect(() => {
    const canTrackPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let rafId: number | null = null;
    let lastScrollY = window.scrollY;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      rafId = null;
      setLiquidGlassState({ ...stateRef.current });
    };

    const scheduleFlush = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(flush);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!canTrackPointer) return;

      stateRef.current = {
        ...stateRef.current,
        mousePosition: {
          x: (event.clientX / window.innerWidth) * 100,
          y: (event.clientY / window.innerHeight) * 100,
        },
      };

      scheduleFlush();
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      stateRef.current = {
        ...stateRef.current,
        scrollVelocity: Math.abs(currentScrollY - lastScrollY),
        isScrolling: true,
      };
      lastScrollY = currentScrollY;
      scheduleFlush();

      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        stateRef.current = {
          ...stateRef.current,
          scrollVelocity: 0,
          isScrolling: false,
        };
        scheduleFlush();
      }, 140);
    };

    if (canTrackPointer) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (canTrackPointer) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  const setOverlayActive = useCallback((id: string, active: boolean) => {
    setActiveOverlayIds((current) => {
      if (active) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((value) => value !== id);
    });
  }, []);

  const hasActiveOverlay = activeOverlayIds.length > 0;

  useEffect(() => {
    document.body.dataset.overlayActive = hasActiveOverlay ? "true" : "false";

    return () => {
      delete document.body.dataset.overlayActive;
    };
  }, [hasActiveOverlay]);

  const navValue = useMemo(
    () => ({
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isScrollNavCollapsed,
      setIsScrollNavCollapsed,
      hasActiveOverlay,
      setOverlayActive,
    }),
    [hasActiveOverlay, isMobileMenuOpen, isScrollNavCollapsed, setOverlayActive]
  );

  const liquidGlassValue = useMemo(
    () => ({ liquidGlassState }),
    [liquidGlassState]
  );

  return (
    <NavUIContext.Provider value={navValue}>
      <LiquidGlassContext.Provider value={liquidGlassValue}>
        <svg
          aria-hidden="true"
          focusable="false"
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        >
          <filter id="liquid-distortion">
            <feTurbulence
              baseFrequency="0.02"
              numOctaves="3"
              result="turbulence"
              seed={0}
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
        {children}
      </LiquidGlassContext.Provider>
    </NavUIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(NavUIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}

export function useOverlayPresence(id: string, isActive: boolean) {
  const { setOverlayActive } = useUI();

  useEffect(() => {
    setOverlayActive(id, isActive);

    return () => {
      setOverlayActive(id, false);
    };
  }, [id, isActive, setOverlayActive]);
}

export function useLiquidGlass() {
  const context = useContext(LiquidGlassContext);
  if (context === undefined) {
    throw new Error("useLiquidGlass must be used within a UIProvider");
  }
  return context;
}
