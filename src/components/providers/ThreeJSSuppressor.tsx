"use client";

import { useEffect } from "react";

function shouldSuppressThreeWarning(args: unknown[]) {
  const message = args.map((arg) => String(arg)).join(" ");

  return (
    message.includes("THREE.THREE.Clock: This module has been deprecated") ||
    (message.includes("THREE.WebGLProgram: Program Info Log:") &&
      message.includes("warning X4122"))
  );
}

export function ThreeJSSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        // Suppress known non-actionable Three.js development warnings.
        if (shouldSuppressThreeWarning(args)) {
          return;
        }

        originalWarn(...args);
      };

      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  return null;
}
