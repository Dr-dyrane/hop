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
import { usePathname } from "next/navigation";
import { getRouteTransitionDirection, normalizePathname } from "@/lib/app-shell";

interface LiquidGlassState {
  mousePosition: { x: number; y: number };
  scrollVelocity: number;
  isScrolling: boolean;
}

export type PerformanceMode = "premium" | "safe" | "flat";
export type NavigationDirection = "forward" | "back" | "lateral" | "none";

interface NavUIContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isScrollNavCollapsed: boolean;
  setIsScrollNavCollapsed: (collapsed: boolean) => void;
  hasActiveOverlay: boolean;
  setOverlayActive: (id: string, active: boolean) => void;
  performanceMode: PerformanceMode;
  navigationDirection: NavigationDirection;
  pendingPathname: string | null;
  startRouteNavigation: (
    nextPathname: string | null,
    direction?: NavigationDirection
  ) => void;
}

interface LiquidGlassContextType {
  liquidGlassState: LiquidGlassState;
  performanceMode: PerformanceMode;
}

const NavUIContext = createContext<NavUIContextType | undefined>(undefined);
const LiquidGlassContext = createContext<LiquidGlassContextType | undefined>(undefined);

const defaultLiquidGlassState: LiquidGlassState = {
  mousePosition: { x: 50, y: 50 },
  scrollVelocity: 0,
  isScrolling: false,
};

export function UIProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrollNavCollapsed, setIsScrollNavCollapsed] = useState(true);
  const [activeOverlayIds, setActiveOverlayIds] = useState<string[]>([]);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("premium");
  const [navigationDirection, setNavigationDirection] =
    useState<NavigationDirection>("none");
  const [pendingPathname, setPendingPathname] = useState<string | null>(null);
  const [liquidGlassState, setLiquidGlassState] = useState(defaultLiquidGlassState);
  const stateRef = useRef(defaultLiquidGlassState);
  const previousPathnameRef = useRef(normalizePathname(pathname));

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const deviceNavigator = navigator as Navigator & { deviceMemory?: number };

    const resolvePerformanceMode = (): PerformanceMode => {
      if (reducedMotionQuery.matches) {
        return "flat";
      }

      const userAgent = navigator.userAgent.toLowerCase();
      const isAndroid = userAgent.includes("android");
      const deviceMemory = deviceNavigator.deviceMemory ?? null;
      const hardwareConcurrency = navigator.hardwareConcurrency ?? null;
      const lowPowerDevice =
        (typeof deviceMemory === "number" && deviceMemory <= 4) ||
        (typeof hardwareConcurrency === "number" && hardwareConcurrency <= 4);

      if (isAndroid || lowPowerDevice) {
        return "safe";
      }

      return "premium";
    };

    const applyPerformanceMode = () => {
      setPerformanceMode(resolvePerformanceMode());
    };

    applyPerformanceMode();
    reducedMotionQuery.addEventListener("change", applyPerformanceMode);

    return () => {
      reducedMotionQuery.removeEventListener("change", applyPerformanceMode);
    };
  }, []);

  useEffect(() => {
    const canTrackPointer =
      performanceMode === "premium" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const shouldTrackScrollVelocity = performanceMode === "premium";
    let rafId: number | null = null;
    let lastScrollY = window.scrollY;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    if (!shouldTrackScrollVelocity) {
      stateRef.current = defaultLiquidGlassState;
    }

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
      if (!shouldTrackScrollVelocity) return;

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
    if (shouldTrackScrollVelocity) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (canTrackPointer) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      if (shouldTrackScrollVelocity) {
        window.removeEventListener("scroll", handleScroll);
      }
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [performanceMode]);

  const setOverlayActive = useCallback((id: string, active: boolean) => {
    setActiveOverlayIds((current) => {
      if (active) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((value) => value !== id);
    });
  }, []);

  const startRouteNavigation = useCallback(
    (nextPathname: string | null, direction: NavigationDirection = "forward") => {
      setNavigationDirection(direction);
      setPendingPathname(nextPathname ? normalizePathname(nextPathname) : null);
    },
    []
  );

  const hasActiveOverlay = activeOverlayIds.length > 0;

  useEffect(() => {
    document.body.dataset.overlayActive = hasActiveOverlay ? "true" : "false";

    return () => {
      delete document.body.dataset.overlayActive;
    };
  }, [hasActiveOverlay]);

  useEffect(() => {
    document.documentElement.dataset.performanceMode = performanceMode;

    return () => {
      delete document.documentElement.dataset.performanceMode;
    };
  }, [performanceMode]);

  useEffect(() => {
    const normalizedPathname = normalizePathname(pathname);
    const previousPathname = previousPathnameRef.current;

    if (normalizedPathname === previousPathname) {
      return;
    }

    setNavigationDirection((current) =>
      current === "none"
        ? getRouteTransitionDirection(previousPathname, normalizedPathname)
        : current
    );
    setPendingPathname(null);
    previousPathnameRef.current = normalizedPathname;
  }, [pathname]);

  useEffect(() => {
    if (navigationDirection === "none") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNavigationDirection("none");
    }, 420);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [navigationDirection]);

  const navValue = useMemo(
    () => ({
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isScrollNavCollapsed,
      setIsScrollNavCollapsed,
      hasActiveOverlay,
      setOverlayActive,
      performanceMode,
      navigationDirection,
      pendingPathname,
      startRouteNavigation,
    }),
    [
      hasActiveOverlay,
      isMobileMenuOpen,
      isScrollNavCollapsed,
      navigationDirection,
      pendingPathname,
      performanceMode,
      setOverlayActive,
      startRouteNavigation,
    ]
  );

  const liquidGlassValue = useMemo(
    () => ({ liquidGlassState, performanceMode }),
    [liquidGlassState, performanceMode]
  );

  return (
    <NavUIContext.Provider value={navValue}>
      <LiquidGlassContext.Provider value={liquidGlassValue}>
        {performanceMode === "premium" ? (
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
        ) : null}
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
