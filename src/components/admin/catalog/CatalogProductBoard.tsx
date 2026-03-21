"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Eye,
  EyeOff,
  Pencil,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Product3DViewer } from "@/components/3d/Product3DViewer";
import type { AdminCatalogProduct } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { formatNgn } from "@/lib/commerce";
import {
  archiveProductAction,
  deleteProductAction,
  setProductMerchandisingAction,
  toggleProductAvailabilityAction,
} from "@/app/(admin)/admin/catalog/products/[productId]/actions";

const statusTone = {
  active: "bg-accent/14 text-accent",
  draft: "bg-system-background/76 text-label",
  archived: "bg-system-fill/76 text-secondary-label",
} as const;

type PreviewMode = "image" | "model";

export function CatalogProductBoard({
  products,
}: {
  products: AdminCatalogProduct[];
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const activeProduct = useMemo(
    () => products.find((product) => product.productId === activeProductId) ?? null,
    [activeProductId, products]
  );

  function runQuickAction(
    key: string,
    run: () => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  ) {
    setBusyKey(key);
    setMessage(null);

    startTransition(async () => {
      const result = await run();

      if (!result.success) {
        setMessage(result.error || "Update failed.");
        setBusyKey(null);
        return;
      }

      setBusyKey(null);

      if (result.redirectTo) {
        setActiveProductId(null);
        router.push(result.redirectTo);
      }

      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <section className="glass-morphism rounded-[28px] p-6 text-sm text-secondary-label shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        No products yet.
      </section>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {message ? <p className="text-sm text-red-500">{message}</p> : null}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const name = product.productMarketingName ?? product.productName;
            const availableUnits = Math.max(
              (product.inventoryOnHand ?? 0) - (product.inventoryReserved ?? 0),
              0
            );

            return (
              <button
                key={product.productId}
                type="button"
                onClick={() => setActiveProductId(product.productId)}
                className="group relative aspect-[0.82] overflow-hidden rounded-[32px] bg-system-fill/20 text-left transition-all duration-500 hover:shadow-[0_24px_48px_rgba(0,0,0,0.12)] hover:-translate-y-1"
              >
                {/* Main Image Layer */}
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-system-fill/40 to-system-fill/10" />
                )}

                {/* Glass Overlay for Text Legibility (Vignette) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-80 transition-opacity group-hover:opacity-90" />

                {/* Top Section: Header & Price */}
                <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
                  <div className="min-w-0 drop-shadow-md">
                    <div className="truncate text-lg font-bold tracking-tight text-white">
                      {name}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                      {product.variantName}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-full px-3 py-2 text-[11px] font-bold backdrop-blur-md text-white shadow-xl">
                    {formatNgn(product.priceNgn)}
                  </div>
                </div>

                {/* Center Placeholder (If no image) */}
                {!product.imageUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white">
                      <Tag className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                  </div>
                )}

                {/* Bottom Section: KPIs & Status */}
                <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-5">
                  <div className="flex flex-wrap gap-1.5">
                    <OverlayKpi label="STK" value={availableUnits} />
                    <OverlayKpi label="MED" value={product.mediaCount} />
                    <OverlayKpi label="Ing" value={`${product.ingredientCount}`} />
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Status Badge with Glass Effect */}
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest backdrop-blur-md  shadow-lg",
                        statusTone[product.status], // Ensure these classes include text-white or high contrast
                        "bg-opacity-80"
                      )}
                    >
                      {product.status}
                    </span>

                    {product.merchandisingState === "featured" && (
                      <span className="rounded-full bg-accent px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg animate-pulse">
                      Featured
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <CatalogProductModal
        key={activeProduct?.productId ?? "catalog-product-modal"}
        product={activeProduct}
        busyKey={busyKey}
        isPending={isPending}
        message={message}
        onClose={() => setActiveProductId(null)}
        onToggleAvailability={(product) =>
          runQuickAction(`${product.productId}:availability`, () =>
            toggleProductAvailabilityAction(product.productId, !product.isAvailable)
          )
        }
        onToggleMerchandising={(product) =>
          runQuickAction(`${product.productId}:merchandising`, () =>
            setProductMerchandisingAction(
              product.productId,
              product.merchandisingState === "featured" ? "standard" : "featured"
            )
          )
        }
        onArchive={(product) =>
          runQuickAction(`${product.productId}:archive`, () =>
            archiveProductAction(product.productId)
          )
        }
        onDelete={(product) =>
          runQuickAction(`${product.productId}:delete`, () =>
            deleteProductAction(product.productId)
          )
        }
      />
    </>
  );
}

function OverlayKpi({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="squircle bg-black/40 px-3 py-1.5 backdrop-blur-md dark:bg-black/36">
      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/62">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

function CatalogProductModal({
  product,
  busyKey,
  isPending,
  message,
  onClose,
  onToggleAvailability,
  onToggleMerchandising,
  onArchive,
  onDelete,
}: {
  product: AdminCatalogProduct | null;
  busyKey: string | null;
  isPending: boolean;
  message: string | null;
  onClose: () => void;
  onToggleAvailability: (product: AdminCatalogProduct) => void;
  onToggleMerchandising: (product: AdminCatalogProduct) => void;
  onArchive: (product: AdminCatalogProduct) => void;
  onDelete: (product: AdminCatalogProduct) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [previewMode, setPreviewMode] = useState<PreviewMode>(
    product?.imageUrl ? "image" : "model"
  );

  useEffect(() => {
    if (!product) {
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
  }, [onClose, product]);

  if (!product) {
    return null;
  }

  const name = product.productMarketingName ?? product.productName;
  const availableUnits = Math.max(
    (product.inventoryOnHand ?? 0) - (product.inventoryReserved ?? 0),
    0
  );
  const canShowImage = Boolean(product.imageUrl);
  const canShowModel = Boolean(product.modelUrl);
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const availabilityKey = `${product.productId}:availability`;
  const merchandisingKey = `${product.productId}:merchandising`;
  const archiveKey = `${product.productId}:archive`;
  const deleteKey = `${product.productId}:delete`;

  return (
    <>
      <div
        className="fixed inset-0 z-[2147483630] bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[2147483640] flex items-center justify-center px-4 py-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          className="glass-morphism max-h-[92vh] w-full max-w-[min(1120px,100%)] overflow-y-auto rounded-[40px] bg-system-background/92 p-4 shadow-[0_32px_120px_rgba(0,0,0,0.22)] md:p-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                    statusTone[product.status]
                  )}
                >
                  {product.status}
                </span>
                {product.merchandisingState === "featured" ? (
                  <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-label)]">
                    Featured
                  </span>
                ) : null}
                {!product.isAvailable ? (
                  <span className="rounded-full bg-system-fill/76 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    Hidden
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-display text-label">{name}</h2>
              {product.productTagline ? (
                <p className="mt-2 text-base text-secondary-label">{product.productTagline}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/72 text-label transition-colors duration-200 hover:bg-system-fill"
              aria-label="Close product"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[36px] bg-system-fill/28 p-4">
                <div className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(15,61,46,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,242,234,0.82)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(215,197,163,0.12),transparent_42%),linear-gradient(180deg,rgba(24,28,24,0.98)_0%,rgba(14,17,14,0.92)_100%)]">
                  {previewMode === "model" && product.modelUrl ? (
                    <Product3DViewer
                      modelPath={product.modelUrl}
                      fallbackImagePath={product.imageUrl ?? undefined}
                      theme={theme}
                      sectionId={`admin-catalog-${product.productId}`}
                      scrollActive
                      className="h-[420px] w-full"
                    />
                  ) : product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={name}
                      className="h-[420px] w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-[420px] items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-system-background/72 text-accent shadow-soft">
                        <Tag className="h-9 w-9" strokeWidth={1.8} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {canShowImage || canShowModel ? (
                <div className="flex flex-wrap gap-2">
                  {canShowImage ? (
                    <button
                      type="button"
                      onClick={() => setPreviewMode("image")}
                      className={cn(
                        "rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
                        previewMode === "image"
                          ? "bg-[var(--accent)] text-[var(--accent-label)]"
                          : "bg-system-fill/56 text-label"
                      )}
                    >
                      Image
                    </button>
                  ) : null}
                  {canShowModel ? (
                    <button
                      type="button"
                      onClick={() => setPreviewMode("model")}
                      className={cn(
                        "rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
                        previewMode === "model"
                          ? "bg-[var(--accent)] text-[var(--accent-label)]"
                          : "bg-system-fill/56 text-label"
                      )}
                    >
                      3D
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <section className="rounded-[32px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCell label="Price" value={formatNgn(product.priceNgn)} />
                  <MetricCell label="Stock" value={`${availableUnits}`} />
                  <MetricCell label="Media" value={`${product.mediaCount}`} />
                  <MetricCell label="Ing" value={`${product.ingredientCount}`} />
                </div>
              </section>

              <section className="rounded-[32px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="grid grid-cols-2 gap-3">
                  <MetaCell label="Category" value={product.categoryName ?? "Unsorted"} />
                  <MetaCell label="SKU" value={product.sku} />
                  <MetaCell label="Sort" value={`${product.sortOrder}`} />
                  <MetaCell label="Variant" value={product.variantName} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-secondary-label">
                  {product.shortDescription}
                </p>
              </section>

              <section className="rounded-[32px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="grid gap-2 sm:grid-cols-2">
                  <QuickActionButton
                    icon={product.isAvailable ? EyeOff : Eye}
                    label={product.isAvailable ? "Hide" : "Live"}
                    pending={isPending && busyKey === availabilityKey}
                    onClick={() => onToggleAvailability(product)}
                  />
                  <QuickActionButton
                    icon={Sparkles}
                    label={
                      product.merchandisingState === "featured" ? "Standard" : "Feature"
                    }
                    pending={isPending && busyKey === merchandisingKey}
                    onClick={() => onToggleMerchandising(product)}
                  />
                  {product.status !== "archived" ? (
                    <QuickActionButton
                      icon={Archive}
                      label="Archive"
                      pending={isPending && busyKey === archiveKey}
                      onClick={() => onArchive(product)}
                    />
                  ) : (
                    <QuickActionButton
                      icon={Trash2}
                      label="Delete"
                      pending={isPending && busyKey === deleteKey}
                      onClick={() => onDelete(product)}
                      tone="danger"
                    />
                  )}
                  <Link
                    href={`/admin/catalog/products/${product.productId}`}
                    className="button-primary min-h-[44px] justify-center text-[11px] font-semibold uppercase tracking-[0.16em]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Pencil size={15} />
                      Edit
                    </span>
                  </Link>
                </div>

                {message ? <p className="mt-4 text-sm text-red-500">{message}</p> : null}
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-label">{value}</div>
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
    <div className="rounded-[24px] bg-system-fill/36 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  pending,
  tone = "default",
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  pending: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-system-fill/56 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-system-fill/76",
        tone === "danger" && "text-red-500",
        pending && "pointer-events-none opacity-50"
      )}
    >
      <Icon size={15} />
      <span>{pending ? "..." : label}</span>
    </button>
  );
}
