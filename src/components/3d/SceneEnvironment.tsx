"use client";

import React from "react";
import { Environment, Lightformer } from "@react-three/drei";

interface SceneEnvironmentProps {
  isDark?: boolean;
}

export function SceneEnvironment({ isDark = false }: SceneEnvironmentProps) {
  return (
    <Environment resolution={64}>
      <Lightformer
        intensity={isDark ? 2.2 : 2.8}
        color={isDark ? "#f7f1e8" : "#fff6e8"}
        position={[0, 4, 3]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
      <Lightformer
        intensity={isDark ? 1.1 : 1.4}
        color={isDark ? "#d7c5a3" : "#f0dcc6"}
        position={[-3.5, 1.5, 2]}
        rotation={[0, Math.PI / 5, 0]}
        scale={[5, 5, 1]}
      />
      <Lightformer
        intensity={isDark ? 1 : 1.25}
        color={isDark ? "#cfc2b4" : "#ffffff"}
        position={[3.5, 1.5, 2]}
        rotation={[0, -Math.PI / 5, 0]}
        scale={[5, 5, 1]}
      />
      <Lightformer
        intensity={isDark ? 0.55 : 0.7}
        color={isDark ? "#6b5a4a" : "#c9b49a"}
        position={[0, -2, 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[6, 6, 1]}
      />
    </Environment>
  );
}
