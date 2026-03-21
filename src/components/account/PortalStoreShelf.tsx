"use client";
/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Box, ShoppingBag, X } from "lucide-react";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { useOverlayPresence } from "@/components/providers/UIProvider";
import { formatNgn } from "@/lib/commerce";
import { isStorefrontVisibleProduct } from "@/lib/catalog/storefront";
import type { PublishedCatalogProduct } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const Product3DViewer = dynamic(
  () => import("@/components/3d/Product3DViewer").then((mod) => mod.Product3DViewer),
  {
    ssr: false,
  }
);

function getProductTitle(product: PublishedCatalogProduct) {
  return product.productMarketingName || product.productName;
}

function getProductSubtitle(product: PublishedCatalogProduct) {
  return product.productTagline || null;
}

export function PortalStoreShelf({
  products,
}: {
  products: PublishedCatalogProduct[];
}) {
  const { addItem } = useCommerce();
  const { resolvedTheme } = useTheme();
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const availableProducts = products.filter((product) =>
    isStorefrontVisibleProduct(product)
  );
  const activeProduct =
    availableProducts.find((product) => product.productId === activeProductId) ?? null;
  useOverlayPresence("portal-store-preview", activeProduct !== null);

  useEffect(() => {
    if (!activeProduct) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveProductId(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeProduct]);

  if (availableProducts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 lg:grid-cols-3 md:gap-x-5 md:gap-y-6 xl:grid-cols-4 xl:gap-y-8">
        {availableProducts.map((product) => {
          const title = getProductTitle(product);

          return (
            <article
              key={product.productId}
              className="group relative overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(243,239,229,0.90)_58%,rgba(230,223,210,0.72)_100%)] shadow-[0_18px_50px_rgba(15,23,42,0.06)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(14,17,14,0.94)_58%,rgba(8,10,8,1)_100%)]"
            >
              <button
                type="button"
                onClick={() => setActiveProductId(product.productId)}
                className="absolute inset-0 z-10 block"
                aria-label={`Open ${title}`}
              />

              <div className="relative aspect-[0.82] overflow-hidden sm:aspect-[0.9]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,61,46,0.08),transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(215,197,163,0.10),transparent_70%)]" />
                <div className="absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full bg-white/75 blur-3xl dark:bg-white/10 sm:top-8 sm:h-36 sm:w-36" />
                <div className="absolute inset-x-5 bottom-12 h-9 rounded-full bg-black/10 blur-2xl dark:bg-black/45 sm:inset-x-8 sm:bottom-14 sm:h-10" />

                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-contain px-2 py-3 transition-transform duration-500 group-hover:scale-[1.02] sm:px-4 sm:py-5"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Box className="h-9 w-9 text-label/70 sm:h-10 sm:w-10" strokeWidth={1.6} />
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-white/96 via-white/56 to-transparent dark:from-black/58 dark:via-black/18 sm:h-28" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-white/98 via-white/42 to-transparent dark:from-black/78 dark:via-black/24 sm:h-28" />

                <div className="pointer-events-none absolute left-3 top-3 z-30 max-w-[58%] text-label dark:text-white sm:left-4 sm:top-4">
                  <div className="truncate text-[0.88rem] font-semibold tracking-[-0.02em] sm:text-[1rem]">
                    {title}
                  </div>
                </div>

                <div className="pointer-events-none absolute right-3 top-3 z-30 text-[0.76rem] font-medium tracking-[-0.01em] text-label/80 dark:text-white/88 sm:right-4 sm:top-4 sm:text-[0.85rem]">
                  {formatNgn(product.priceNgn)}
                </div>

                <div className="pointer-events-none absolute bottom-3 right-3 z-30 sm:bottom-4 sm:right-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      addItem(product.productSlug);
                    }}
                    className="pointer-events-auto button-primary min-h-[44px] shrink-0 px-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-[1.01] sm:px-4"
                  >
                    Add
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div
        className={cn(
          "z-layer-modal-backdrop fixed inset-0 transition-opacity duration-300",
          activeProduct ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <button
          type="button"
          aria-label="Close product preview"
          onClick={() => setActiveProductId(null)}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
      </div>

      <div
        className={cn(
          "z-layer-modal pointer-events-none fixed inset-0 flex items-end justify-center p-3 sm:items-center sm:p-6",
          activeProduct ? "opacity-100" : "opacity-0"
        )}
      >
        {activeProduct ? (
          <section className="pointer-events-auto glass-morphism w-full max-w-[1120px] rounded-[38px] bg-system-background/94 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-label sm:text-3xl">
                {getProductTitle(activeProduct)}
              </h2>

              <button
                type="button"
                onClick={() => setActiveProductId(null)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/80 text-label transition-colors duration-300 hover:bg-system-fill"
                aria-label="Close product preview"
              >
                <X className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
              <div className="relative isolate h-[360px] overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(243,239,229,0.90)_58%,rgba(230,223,210,0.74)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),rgba(14,17,14,0.94)_58%,rgba(8,10,8,1)_100%)] sm:h-[480px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,61,46,0.10),transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(215,197,163,0.12),transparent_70%)]" />
                <div className="absolute left-1/2 top-12 h-40 w-40 -translate-x-1/2 rounded-full bg-white/80 blur-3xl dark:bg-white/10" />
                <div className="absolute inset-x-10 bottom-5 h-12 rounded-full bg-black/10 blur-2xl dark:bg-black/50" />

                {activeProduct.modelUrl ? (
                  <div className="relative z-10 h-full w-full p-3 sm:p-5">
                    <Product3DViewer
                      modelPath={activeProduct.modelUrl}
                      fallbackImagePath={activeProduct.imageUrl ?? undefined}
                      theme={resolvedTheme === "dark" ? "dark" : "light"}
                      className="h-full w-full"
                      sectionId={`portal-${activeProduct.productSlug}`}
                      scrollActive
                    />
                  </div>
                ) : activeProduct.imageUrl ? (
                  <img
                    src={activeProduct.imageUrl}
                    alt={getProductTitle(activeProduct)}
                    className="absolute inset-0 h-full w-full object-contain p-6 sm:p-8"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Box className="h-12 w-12 text-label/70" strokeWidth={1.6} />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-end">
                {getProductSubtitle(activeProduct) ? (
                  <div className="text-sm text-secondary-label">
                    {getProductSubtitle(activeProduct)}
                  </div>
                ) : null}

                <div className="mt-3 text-4xl font-semibold tracking-tight text-label">
                  {formatNgn(activeProduct.priceNgn)}
                </div>

                <p className="mt-5 text-base leading-relaxed text-secondary-label">
                  {activeProduct.shortDescription}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => addItem(activeProduct.productSlug)}
                    className="button-primary min-h-[48px] flex-1 gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  >
                    <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveProductId(null)}
                    className="button-secondary min-h-[48px] px-5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
