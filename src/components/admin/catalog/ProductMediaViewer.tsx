"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bounds,
  Center,
  ContactShadows,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { Image as ImageIcon, Play, X } from "lucide-react";
import { useTheme } from "next-themes";
import * as THREE from "three";
import type { AdminCatalogProductMedia } from "@/lib/db/types";
import { SceneEnvironment } from "@/components/3d/SceneEnvironment";
import { useOverlayPresence } from "@/components/providers/UIProvider";
import { cn } from "@/lib/utils";

function getMediaLabel(mediaType: AdminCatalogProductMedia["mediaType"]) {
  if (mediaType === "model_3d") {
    return "3D";
  }

  if (mediaType === "video") {
    return "Video";
  }

  return "Image";
}

function resolveFileName(item: AdminCatalogProductMedia) {
  const fileName = item.metadata.fileName;
  return typeof fileName === "string" && fileName.trim() ? fileName.trim() : item.storageKey;
}

function ModelAsset({
  url,
  autoRotate = true,
}: {
  url: string;
  autoRotate?: boolean;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useFrame((_, delta) => {
    if (!autoRotate || !groupRef.current) {
      return;
    }

    groupRef.current.rotation.y += delta * 0.38;
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
}

function ModelViewport({
  url,
  interactive = false,
  className,
}: {
  url: string;
  interactive?: boolean;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={cn("relative overflow-hidden rounded-[26px] bg-system-fill/24", className)}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.2, 4.2], fov: 28 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={isDark ? 0.7 : 0.92} />
        <directionalLight
          position={[3.4, 4.6, 4.8]}
          intensity={isDark ? 1.28 : 1.52}
        />

        <Suspense fallback={null}>
          <SceneEnvironment isDark={isDark} />
          <Bounds fit clip observe margin={1.16}>
            <Center>
              <ModelAsset url={url} autoRotate={!interactive} />
            </Center>
          </Bounds>
          <ContactShadows
            position={[0, -1.4, 0]}
            opacity={isDark ? 0.34 : 0.22}
            scale={6}
            blur={1.8}
            far={2.2}
            resolution={512}
          />
          <OrbitControls
            enablePan={false}
            enableZoom={interactive}
            autoRotate={!interactive}
            autoRotateSpeed={1.8}
            minDistance={2.5}
            maxDistance={7}
            minPolarAngle={Math.PI / 2.5}
            maxPolarAngle={Math.PI / 1.75}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function ProductMediaPreviewSurface({
  item,
  onOpen,
  className,
}: {
  item: AdminCatalogProductMedia;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative overflow-hidden rounded-[18px] bg-[color:var(--surface)]/88 text-left transition-transform duration-200 hover:-translate-y-[1px]",
        className
      )}
      aria-label={`View ${getMediaLabel(item.mediaType)} preview`}
    >
      {item.mediaType === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.publicUrl}
          alt={item.altText || ""}
          className="aspect-square h-full w-full object-cover"
        />
      ) : item.mediaType === "video" ? (
        <div className="relative aspect-square h-full w-full">
          <video
            src={item.publicUrl}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <span className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--surface)]/88 text-label shadow-soft">
            <Play size={16} fill="currentColor" />
          </span>
        </div>
      ) : (
        <ModelViewport url={item.publicUrl} className="aspect-square h-full w-full" />
      )}
      <span className="absolute left-3 top-3 rounded-full bg-[color:var(--surface)]/88 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-label shadow-soft">
        {getMediaLabel(item.mediaType)}
      </span>
    </button>
  );
}

export function ProductMediaViewer({
  item,
  onClose,
}: {
  item: AdminCatalogProductMedia | null;
  onClose: () => void;
}) {
  useOverlayPresence("admin-product-media", item !== null);

  useEffect(() => {
    if (!item) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  return (
    <div
      className="z-layer-modal fixed inset-0 flex items-center justify-center bg-[color:var(--surface)]/54 px-4 py-6 backdrop-blur-2xl"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="glass-morphism max-h-[90vh] w-full max-w-[min(980px,100%)] overflow-y-auto rounded-[36px] bg-[color:var(--surface)]/84 p-4 shadow-[0_32px_80px_rgba(15,23,42,0.16)] md:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              {getMediaLabel(item.mediaType)}
            </p>
            <h2 className="mt-2 truncate text-lg font-semibold tracking-tight text-label">
              {resolveFileName(item)}
            </h2>
            <p className="mt-1 text-sm text-secondary-label">
              {item.altText?.trim() || "Preview"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/56 text-secondary-label transition-colors duration-200 hover:text-label"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-[30px] bg-system-fill/28 p-3 md:p-4">
          {item.mediaType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.publicUrl}
              alt={item.altText || ""}
              className="h-[min(72vh,680px)] w-full rounded-[24px] object-contain"
            />
          ) : item.mediaType === "video" ? (
            <video
              src={item.publicUrl}
              controls
              playsInline
              className="h-[min(72vh,680px)] w-full rounded-[24px] object-contain"
            />
          ) : (
            <ModelViewport
              url={item.publicUrl}
              interactive
              className="h-[min(72vh,680px)] w-full rounded-[24px]"
            />
          )}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MetaCell label="Type" value={getMediaLabel(item.mediaType)} />
          <MetaCell label="Order" value={`${item.sortOrder}`} />
          <MetaCell label="State" value={item.isPrimary ? "Primary" : "Library"} />
        </div>
      </div>
    </div>
  );
}

function MetaCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-label">{value}</p>
    </div>
  );
}

export function ProductMediaTypeBadge({
  mediaType,
}: {
  mediaType: AdminCatalogProductMedia["mediaType"];
}) {
  const Icon = mediaType === "video" ? Play : mediaType === "image" ? ImageIcon : null;

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
      {Icon ? <Icon size={12} /> : null}
      {getMediaLabel(mediaType)}
    </span>
  );
}
