"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Save, Trash2 } from "lucide-react";
import { ProductMediaManager } from "@/components/admin/catalog/ProductMediaManager";
import { ProgressiveFormSection } from "@/components/forms/ProgressiveFormSection";
import { useUI } from "@/components/providers/UIProvider";
import { formatNgn } from "@/lib/commerce";
import { cn } from "@/lib/utils";
import type {
  AdminCatalogCategory,
  AdminCatalogProductDetail,
  AdminCatalogProductMedia,
} from "@/lib/db/types";
import {
  archiveProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/(admin)/admin/catalog/products/[productId]/actions";

export function ProductEditorForm({
  product,
  categories,
  media,
  variantTarget,
}: {
  product: AdminCatalogProductDetail;
  categories: AdminCatalogCategory[];
  media: AdminCatalogProductMedia[];
  variantTarget: {
    variantId: string;
    variantName: string;
  };
}) {
  const router = useRouter();
  const { hasActiveOverlay } = useUI();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateProductAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to save.");
        setMessageTone("error");
        return;
      }

      setMessage("Saved.");
      setMessageTone("success");
      router.refresh();
    });
  }

  function handleArchive() {
    setMessage(null);
    setMessageTone(null);

    startTransition(async () => {
      const result = await archiveProductAction(product.productId);

      if (!result.success) {
        setMessage(result.error || "Unable to archive.");
        setMessageTone("error");
        return;
      }

      setMessage("Archived.");
      setMessageTone("success");
      router.refresh();
    });
  }

  function handleDelete() {
    setMessage(null);
    setMessageTone(null);

    startTransition(async () => {
      const result = await deleteProductAction(product.productId);

      if (!result.success) {
        setMessage(result.error || "Unable to delete.");
        setMessageTone("error");
        return;
      }

      router.push(result.redirectTo || "/admin/catalog/products");
      router.refresh();
    });
  }

  return (
    <form id="admin-product-edit-form" onSubmit={handleSubmit} className="space-y-6 pb-24">
      <input type="hidden" name="productId" value={product.productId} />

      <div className="grid gap-6 min-[1500px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <EditorSection
            step="01"
            title="Identity"
            summary={
              [product.productName, product.productMarketingName || product.productTagline]
                .filter(Boolean)
                .join(" / ") || product.variantName
            }
            defaultOpen
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectGroup
                label="Category"
                name="categoryId"
                defaultValue={product.categoryId ?? ""}
                options={[
                  { label: "Unsorted", value: "" },
                  ...categories.map((category) => ({
                    label: category.categoryName,
                    value: category.categoryId,
                  })),
                ]}
              />
              <InputGroup
                label="Internal"
                name="productName"
                defaultValue={product.productName}
                required
              />
              <InputGroup
                label="Marketing"
                name="marketingName"
                defaultValue={product.productMarketingName || ""}
              />
              <InputGroup
                label="Tagline"
                name="tagline"
                defaultValue={product.productTagline || ""}
                className="md:col-span-2"
              />
            </div>

            <div className="mt-4 space-y-4">
              <TextAreaGroup
                label="Short"
                name="shortDescription"
                defaultValue={product.shortDescription}
                required
                rows={3}
              />
              <TextAreaGroup
                label="Long"
                name="longDescription"
                defaultValue={product.longDescription || ""}
                rows={5}
              />
            </div>
          </EditorSection>

          <EditorSection
            step="02"
            title="Sellable"
            summary={[formatNgn(product.priceNgn), product.variantName].join(" / ")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InputGroup
                label="Variant"
                name="variantName"
                defaultValue={product.variantName}
                required
              />
              <InputGroup
                label="SKU"
                name="sku"
                defaultValue={product.sku}
                readOnly
                className="opacity-60"
              />
              <InputGroup
                label="Price"
                name="priceNgn"
                type="number"
                defaultValue={product.priceNgn}
                required
              />
              <InputGroup
                label="Compare"
                name="compareAtPriceNgn"
                type="number"
                defaultValue={product.compareAtPriceNgn || ""}
              />
              <InputGroup
                label="Size"
                name="sizeLabel"
                defaultValue={product.sizeLabel || ""}
              />
              <InputGroup
                label="Unit"
                name="unitLabel"
                defaultValue={product.unitLabel || ""}
              />
            </div>
          </EditorSection>

          <ProductMediaManager
            productId={product.productId}
            media={media}
            variantTarget={variantTarget}
          />

          <EditorSection
            step="03"
            title="State"
            summary={[product.status, product.isAvailable ? "live" : "off"].join(" / ")}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectGroup
                label="Product"
                name="status"
                defaultValue={product.status}
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Active", value: "active" },
                  { label: "Archived", value: "archived" },
                ]}
              />
              <SelectGroup
                label="Variant"
                name="variantStatus"
                defaultValue={product.variantStatus}
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Active", value: "active" },
                  { label: "Archived", value: "archived" },
                ]}
              />
              <SelectGroup
                label="Merchandising"
                name="merchandisingState"
                defaultValue={product.merchandisingState}
                options={[
                  { label: "Standard", value: "standard" },
                  { label: "Featured", value: "featured" },
                  { label: "Hidden", value: "hidden" },
                ]}
              />
              <SelectGroup
                label="Live"
                name="isAvailable"
                defaultValue={product.isAvailable ? "true" : "false"}
                options={[
                  { label: "Yes", value: "true" },
                  { label: "No", value: "false" },
                ]}
              />
              <InputGroup
                label="Stock"
                name="inventoryOnHand"
                type="number"
                defaultValue={product.inventoryOnHand || 0}
                required
              />
              <InputGroup
                label="Reorder"
                name="reorderThreshold"
                type="number"
                defaultValue={product.reorderThreshold || ""}
              />
              <InputGroup
                label="Sort"
                name="sortOrder"
                type="number"
                defaultValue={product.sortOrder}
                required
              />
            </div>
          </EditorSection>
        </div>

        <aside className="space-y-4">
          <SignalCard
            title="Variant"
            items={[
              { label: "SKU", value: product.sku },
              { label: "Slug", value: product.variantSlug },
            ]}
          />
          <SignalCard
            title="Assets"
            items={[
              { label: "Ingredients", value: `${product.ingredientCount}` },
              { label: "Media", value: `${product.mediaCount}` },
            ]}
          />
          <SignalCard
            title="Inventory"
            items={[
              { label: "On hand", value: `${product.inventoryOnHand ?? 0}` },
              { label: "Reserved", value: `${product.inventoryReserved ?? 0}` },
            ]}
          />
        </aside>
      </div>

      <div
        className={cn(
          "z-layer-sticky-action sticky bottom-6",
          hasActiveOverlay && "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/56 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p
            className={cn(
              "text-xs font-medium",
              messageTone === "success" && "text-accent",
              messageTone === "error" && "text-red-500",
              !messageTone && "text-secondary-label"
            )}
          >
            {message ?? "Draft safe."}
          </p>
          <div className="flex items-center gap-2">
            {product.status !== "archived" ? (
              <button
                type="button"
                onClick={handleArchive}
                disabled={isPending}
                className={cn(
                  "min-h-[44px] rounded-full bg-system-fill/56 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500 transition-colors duration-200 hover:bg-system-fill/76",
                  isPending && "pointer-events-none opacity-50"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <Archive size={15} />
                  Archive
                </span>
              </button>
            ) : null}
            {product.status === "archived" ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className={cn(
                  "min-h-[44px] rounded-full bg-system-fill/56 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500 transition-colors duration-200 hover:bg-system-fill/76",
                  isPending && "pointer-events-none opacity-50"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 size={15} />
                  Delete
                </span>
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "button-primary min-h-[44px] min-w-[144px] gap-2 px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
                isPending && "pointer-events-none opacity-50"
              )}
            >
              <Save size={16} />
              <span>{isPending ? "Saving" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function EditorSection({
  step,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  step: string;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ProgressiveFormSection
      step={step}
      title={title}
      summary={summary}
      defaultOpen={defaultOpen}
      className="glass-morphism"
      bodyClassName="pt-0"
    >
      {children}
    </ProgressiveFormSection>
  );
}

function SignalCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <section className="glass-morphism rounded-[28px] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {title}
      </h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-[18px] bg-system-fill/42 px-4 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-medium text-label">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function InputGroup({
  label,
  className,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </label>
      <input
        {...props}
        className="flex min-h-[48px] w-full rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
      />
    </div>
  );
}

function TextAreaGroup({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </label>
      <textarea
        {...props}
        className="flex w-full resize-none rounded-[20px] bg-system-fill/42 px-4 py-3 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
      />
    </div>
  );
}

function SelectGroup({
  label,
  options,
  className,
  ...props
}: {
  label: string;
  options: { label: string; value: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </label>
      <select
        {...props}
        className="flex min-h-[48px] w-full appearance-none rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all focus:bg-system-fill/58"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
