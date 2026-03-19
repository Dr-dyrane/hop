"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PresentationControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ProductFallback } from "./ProductFallback";
import { SceneEnvironment } from "./SceneEnvironment";
import { cn } from "@/lib/utils";

// Global WebGL context tracking
let activeWebGLContexts: Set<string> = new Set();
let globalSectionLock: string | null = null;

interface Product3DViewerProps {
  modelPath: string;
  theme: "light" | "dark";
  className?: string;
  sectionId?: string;
  scrollActive?: boolean;
}

function Model({ url, isReady, scrollActive }: { url: string; isReady: boolean; scrollActive?: boolean }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const rotationSpeed = useRef(0.22);
  const targetScale = useRef(0.78);
  const lastFrameTime = useRef(0);

  useFrame((_, delta) => {
    if (!modelRef.current) return;

    // Limit frame rate for performance
    const now = performance.now();
    if (now - lastFrameTime.current < 16) return; // Cap at ~60fps
    lastFrameTime.current = now;

    // Adjust rotation speed based on scroll activity
    if (!hovered) {
      if (scrollActive) {
        // Faster rotation when scrolling into section
        rotationSpeed.current = Math.min(rotationSpeed.current + 0.01, 0.4);
      } else {
        // Slower rotation when not scrolling
        rotationSpeed.current = Math.max(rotationSpeed.current - 0.005, 0.22);
      }
      modelRef.current.rotation.y += delta * rotationSpeed.current;
    }

    // Smooth scale animation on load
    if (modelRef.current.scale.x < targetScale.current && isReady) {
      const currentScale = modelRef.current.scale.x;
      const newScale = currentScale + (targetScale.current - currentScale) * 0.05;
      modelRef.current.scale.set(newScale, newScale, newScale);
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={[isReady ? 0.78 : 0.65, isReady ? 0.78 : 0.65, isReady ? 0.78 : 0.65]}
      position={[0, -0.12, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    />
  );
}

export function Product3DViewer({
  modelPath,
  theme,
  className,
  sectionId,
  scrollActive,
}: Product3DViewerProps) {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Unique key for this instance to prevent Three.js conflicts
  const instanceKey = `${sectionId || 'unknown'}-${modelPath}`;

  useEffect(() => {
    if (scrollActive) {
      const safeSectionId = sectionId || 'unknown';

      if (globalSectionLock && globalSectionLock !== safeSectionId) {
        return;
      }

      activeWebGLContexts.clear();
      globalSectionLock = safeSectionId;

      const timer = setTimeout(() => {
        if (scrollActive && !activeWebGLContexts.has(safeSectionId) && globalSectionLock === safeSectionId) {
          activeWebGLContexts.add(safeSectionId);
          setIsReady(true);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      const safeSectionId = sectionId || 'unknown';

      if (globalSectionLock === safeSectionId) {
        globalSectionLock = null;
      }

      activeWebGLContexts.delete(safeSectionId);
      setIsReady(false);
    }
  }, [scrollActive, sectionId]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      setIsReady(false);
      setHasError(false);
    };
  }, []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    setIsWebGLSupported(!!gl);
  }, []);

  const lightingConfig =
    theme === "dark"
      ? {
          ambient: 0.5,
          directional: 0.95,
          directionalPosition: [4, 5, 4] as [number, number, number],
        }
      : {
          ambient: 0.7,
          directional: 1.2,
          directionalPosition: [-4, 5, 4] as [number, number, number],
        };

  if (!isWebGLSupported || hasError) {
    const fallbackImagePath = modelPath
      .replace("/models/products/", "/images/products/")
      .replace(".glb", ".png");

    return (
      <ProductFallback
        imagePath={fallbackImagePath}
        className={className}
      />
    );
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Fallback Layer: Only hide when Three.js is confirmed ready */}
      <div className={cn(
        "absolute inset-0 transition-all duration-1000",
        isReady ? "opacity-0 scale-95" : "opacity-100 scale-100"
      )}>
        <ProductFallback
          imagePath={modelPath.replace("/models/products/", "/images/products/").replace(".glb", ".png")}
          className="w-full h-full"
        />
      </div>

      {/* Only render Canvas when section is active to prevent WebGL context conflicts */}
      {scrollActive && (
        <Canvas
          key={instanceKey} // Unique key prevents Three.js context conflicts
          camera={{ position: [0, 0.75, 4.15], fov: 32 }}
          frameloop="always"
          className={cn(
            "h-full w-full rounded-[2rem] transition-all duration-1000",
            isReady ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 1.5]}
          onCreated={() => {
            setTimeout(() => {
              setIsReady(true);
            }, 200);
          }}
          onError={() => {
            setHasError(true);
          }}
        >
          <ambientLight intensity={lightingConfig.ambient} />

          <directionalLight
            position={lightingConfig.directionalPosition}
            intensity={lightingConfig.directional}
          />

          <Suspense fallback={null}>
            <SceneEnvironment isDark={theme === "dark"} />

            <PresentationControls
              global
              cursor={false}
              speed={1.2}
              rotation={[0, -0.08, 0]}
              polar={[-0.12, 0.18]}
              azimuth={[-0.28, 0.28]}
              snap={false}
            >
              <Model url={modelPath} isReady={isReady} scrollActive={scrollActive} />
            </PresentationControls>
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
