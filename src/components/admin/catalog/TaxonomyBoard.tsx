"use client";
/* eslint-disable @next/next/no-img-element */

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { useOverlayPresence } from "@/components/providers/UIProvider";
import { RouteFeedbackLink } from "@/components/ui/RouteFeedbackLink";
import type {
  AdminCatalogCategoryDetail,
  AdminCatalogIngredient,
} from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { deleteTaxonomyEntryAction } from "@/app/(admin)/admin/catalog/taxonomy/actions";

type TaxonomyEntry = {
  taxonomyType: "category" | "ingredient";
  taxonomyId: string;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
  variantCount: number;
  detail: string | null;
  benefit: string | null;
  aliases: string[];
  imagePath: string | null;
};

function normalizeTaxonomyEntries(
  categories: AdminCatalogCategoryDetail[],
  ingredients: AdminCatalogIngredient[]
) {
  return [
    ...categories.map(
      (category): TaxonomyEntry => ({
        taxonomyType: "category",
        taxonomyId: category.categoryId,
        name: category.categoryName,
        slug: category.categorySlug,
        sortOrder: category.sortOrder,
        productCount: category.productCount,
        variantCount: 0,
        detail: null,
        benefit: null,
        aliases: [],
        imagePath: category.imagePath ?? null,
      })
    ),
    ...ingredients.map(
      (ingredient): TaxonomyEntry => ({
        taxonomyType: "ingredient",
        taxonomyId: ingredient.ingredientId,
        name: ingredient.ingredientName,
        slug: ingredient.ingredientSlug,
        sortOrder: ingredient.sortOrder,
        productCount: ingredient.productCount,
        variantCount: ingredient.variantCount,
        detail: ingredient.detail,
        benefit: ingredient.benefit ?? null,
        aliases: ingredient.aliases,
        imagePath: ingredient.imagePath ?? null,
      })
    ),
  ].sort((left, right) => {
    if (left.taxonomyType !== right.taxonomyType) {
      return left.taxonomyType.localeCompare(right.taxonomyType);
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name);
  });
}

function getPreviewUrl(value: string | null) {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
    return value;
  }

  return null;
}

function isDeleteBlocked(entry: TaxonomyEntry) {
  if (entry.taxonomyType === "category") {
    return entry.productCount > 0;
  }

  return entry.variantCount > 0;
}

export function TaxonomyBoard({
  categories,
  ingredients,
}: {
  categories: AdminCatalogCategoryDetail[];
  ingredients: AdminCatalogIngredient[];
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const entries = useMemo(
    () => normalizeTaxonomyEntries(categories, ingredients),
    [categories, ingredients]
  );
  const activeEntry = useMemo(
    () => entries.find((entry) => entry.taxonomyId === activeId) ?? null,
    [activeId, entries]
  );

  useOverlayPresence("admin-catalog-taxonomy", activeEntry !== null);

  function runDelete(entry: TaxonomyEntry) {
    const actionKey = `${entry.taxonomyType}:${entry.taxonomyId}:delete`;
    setBusyKey(actionKey);
    setMessage(null);

    startTransition(async () => {
      const result = await deleteTaxonomyEntryAction(
        entry.taxonomyType,
        entry.taxonomyId
      );

      if (!result.success) {
        setMessage(result.error || "Unable to delete.");
        setBusyKey(null);
        return;
      }

      setBusyKey(null);
      setActiveId(null);
      router.refresh();
    });
  }

  if (entries.length === 0) {
    return (
      <section className="glass-morphism rounded-[28px] p-6 text-sm text-secondary-label shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        No taxonomy entries yet.
      </section>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {message ? <p className="text-sm text-red-500">{message}</p> : null}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {entries.map((entry) => (
            <TaxonomyCard
              key={`${entry.taxonomyType}:${entry.taxonomyId}`}
              entry={entry}
              onOpen={() => setActiveId(entry.taxonomyId)}
            />
          ))}
        </div>
      </div>

      <TaxonomyModal
        entry={activeEntry}
        pending={isPending}
        busyKey={busyKey}
        message={message}
        onClose={() => setActiveId(null)}
        onDelete={runDelete}
      />
    </>
  );
}

function TaxonomyCard({
  entry,
  onOpen,
}: {
  entry: TaxonomyEntry;
  onOpen: () => void;
}) {
  const previewUrl = getPreviewUrl(entry.imagePath);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-[0.82] overflow-hidden rounded-[28px] text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(15,23,42,0.12)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(243,239,229,0.90)_58%,rgba(230,223,210,0.72)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(14,17,14,0.94)_58%,rgba(8,10,8,1)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,61,46,0.08),transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(215,197,163,0.10),transparent_70%)]" />
      <div className="absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full bg-white/75 blur-3xl dark:bg-white/10 sm:top-8 sm:h-36 sm:w-36" />
      <div className="absolute inset-x-5 bottom-12 h-9 rounded-full bg-black/10 blur-2xl dark:bg-black/45 sm:inset-x-8 sm:bottom-14 sm:h-10" />

      {previewUrl ? (
        <img
          src={previewUrl}
          alt={entry.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-xl">
            <Icon name={entry.taxonomyType === "ingredient" ? "sparkles" : "tag"} size={24} />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-white/96 via-white/56 to-transparent dark:from-black/58 dark:via-black/18 sm:h-28" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-white/98 via-white/42 to-transparent dark:from-black/78 dark:via-black/24 sm:h-28" />

      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-5">
        <div className="min-w-0 text-label dark:text-white">
          <div className="truncate text-[0.92rem] font-semibold tracking-[-0.02em] sm:text-[1rem]">
            {entry.name}
          </div>
          <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-label/60 dark:text-white/62">
            {entry.slug}
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg",
            entry.taxonomyType === "ingredient"
              ? "bg-accent/14 text-accent"
              : "bg-[color:var(--surface)]/76 text-label"
          )}
        >
          {entry.taxonomyType}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5">
          <OverlayKpi label="PRD" value={entry.productCount} />
          <OverlayKpi
            label={entry.taxonomyType === "ingredient" ? "VAR" : "SRT"}
            value={entry.taxonomyType === "ingredient" ? entry.variantCount : entry.sortOrder}
          />
        </div>
      </div>
    </button>
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
    <div className="squircle bg-[color:var(--surface)]/56 px-3 py-1.5 backdrop-blur-md">
      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tracking-tight text-label">{value}</div>
    </div>
  );
}

function TaxonomyModal({
  entry,
  pending,
  busyKey,
  message,
  onClose,
  onDelete,
}: {
  entry: TaxonomyEntry | null;
  pending: boolean;
  busyKey: string | null;
  message: string | null;
  onClose: () => void;
  onDelete: (entry: TaxonomyEntry) => void;
}) {
  useEffect(() => {
    if (!entry) {
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
  }, [entry, onClose]);

  if (!entry) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const deleteKey = `${entry.taxonomyType}:${entry.taxonomyId}:delete`;
  const deleteBlocked = isDeleteBlocked(entry);
  const previewUrl = getPreviewUrl(entry.imagePath);

  return createPortal(
    <>
      <div
        className="z-layer-modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="z-layer-modal fixed inset-0 flex items-end justify-center px-2 pb-2 pt-8 sm:items-center sm:px-4 sm:py-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={entry.name}
          className="glass-morphism max-h-[calc(100svh-0.5rem)] w-full max-w-[min(980px,100%)] overflow-y-auto rounded-[34px] bg-[color:var(--surface)]/92 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_32px_120px_rgba(0,0,0,0.22)] sm:max-h-[92vh] sm:rounded-[40px] sm:p-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-system-fill/90 sm:hidden" />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-system-fill/66 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  {entry.taxonomyType}
                </span>
                {deleteBlocked ? (
                  <span className="rounded-full bg-system-fill/76 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    Linked
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                    Ready
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-display text-label">
                {entry.name}
              </h2>
              <p className="mt-2 text-sm text-secondary-label">{entry.slug}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/72 text-label transition-colors duration-200 hover:bg-system-fill"
              aria-label="Close taxonomy preview"
            >
              <Icon name="close" size={18} />
            </button>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <section className="overflow-hidden rounded-[32px] bg-system-fill/30 p-5">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={entry.name}
                  className="h-[340px] w-full rounded-[24px] object-contain"
                />
              ) : (
                <div className="flex h-[340px] items-center justify-center rounded-[24px] bg-[color:var(--surface)]/88">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-system-fill/56 text-accent">
                    <Icon
                      name={entry.taxonomyType === "ingredient" ? "sparkles" : "tag"}
                      size={26}
                    />
                  </div>
                </div>
              )}
            </section>

            <div className="space-y-4">
              <section className="rounded-[32px] bg-[color:var(--surface)]/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="grid grid-cols-2 gap-3">
                  <MetricCell label="Sort" value={`${entry.sortOrder}`} />
                  <MetricCell label="Products" value={`${entry.productCount}`} />
                  {entry.taxonomyType === "ingredient" ? (
                    <MetricCell label="Variants" value={`${entry.variantCount}`} />
                  ) : null}
                  {entry.taxonomyType === "ingredient" ? (
                    <MetricCell label="Aliases" value={`${entry.aliases.length}`} />
                  ) : null}
                </div>
              </section>

              {entry.taxonomyType === "ingredient" ? (
                <section className="rounded-[32px] bg-[color:var(--surface)]/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    Detail
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-label">
                    {entry.detail || "No detail."}
                  </p>
                  {entry.benefit ? (
                    <p className="mt-3 text-sm text-secondary-label">{entry.benefit}</p>
                  ) : null}
                </section>
              ) : null}

              <section className="rounded-[32px] bg-[color:var(--surface)]/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="grid gap-2 sm:grid-cols-2">
                  <RouteFeedbackLink
                    href={`/admin/catalog/taxonomy/${entry.taxonomyType}/${entry.taxonomyId}`}
                    className="button-primary min-h-[44px] justify-center text-[11px] font-semibold uppercase tracking-[0.16em]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon name="edit" size={15} />
                      Edit
                    </span>
                  </RouteFeedbackLink>
                  <button
                    type="button"
                    onClick={() => onDelete(entry)}
                    disabled={deleteBlocked || (pending && busyKey === deleteKey)}
                    className={cn(
                      "min-h-[44px] rounded-full bg-system-fill/56 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500 transition-colors duration-200 hover:bg-system-fill/76",
                      (deleteBlocked || (pending && busyKey === deleteKey)) &&
                        "pointer-events-none opacity-50"
                    )}
                  >
                    {pending && busyKey === deleteKey ? "Deleting" : "Delete"}
                  </button>
                </div>
                <p className="mt-3 text-xs text-secondary-label">
                  {deleteBlocked
                    ? entry.taxonomyType === "category"
                      ? "Move or archive linked products first."
                      : "Remove this ingredient from linked products first."
                    : message ?? "Ready to update."}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight text-label">{value}</div>
    </div>
  );
}
