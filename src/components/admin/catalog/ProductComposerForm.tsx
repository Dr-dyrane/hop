"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminCatalogCategory } from "@/lib/db/types";
import { ProgressiveFormSection } from "@/components/forms/ProgressiveFormSection";
import { createProductAction } from "@/app/(admin)/admin/catalog/products/[productId]/actions";
import { useUI } from "@/components/providers/UIProvider";
import { cn } from "@/lib/utils";

export function ProductComposerForm({
  categories,
}: {
  categories: AdminCatalogCategory[];
}) {
  const router = useRouter();
  const { hasActiveOverlay } = useUI();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success" | null>(null);
  const [activeStep, setActiveStep] = useState<"identity" | "sellable">("identity");
  const [draft, setDraft] = useState({
    productName: "",
    marketingName: "",
    categoryId: "",
    variantName: "",
    priceNgn: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createProductAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to create product.");
        setMessageTone("error");
        return;
      }

      setMessage("Draft created.");
      setMessageTone("success");

      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <form id="admin-product-create-form" onSubmit={handleSubmit} className="space-y-4 pb-20">
      <ProgressiveFormSection
        step="01"
        title="Identity"
        summary={[draft.productName, draft.marketingName].filter(Boolean).join(" / ") || "Product"}
        open={activeStep === "identity"}
        onOpenChange={(open) => setActiveStep(open ? "identity" : "sellable")}
        actions={
          <button
            type="button"
            onClick={() => setActiveStep("sellable")}
            className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            Continue
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputGroup
            label="Product"
            name="productName"
            required
            placeholder="Natural Energy"
            value={draft.productName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, productName: event.target.value }))
            }
          />
          <InputGroup
            label="Marketing"
            name="marketingName"
            placeholder="Natural Energy"
            value={draft.marketingName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, marketingName: event.target.value }))
            }
          />
          <SelectGroup
            label="Category"
            name="categoryId"
            value={draft.categoryId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, categoryId: event.target.value }))
            }
            options={[
              { label: "Unsorted", value: "" },
              ...categories.map((category) => ({
                label: category.categoryName,
                value: category.categoryId,
              })),
            ]}
          />
          <InputGroup
            label="Variant"
            name="variantName"
            placeholder="Default"
            value={draft.variantName}
            onChange={(event) =>
              setDraft((current) => ({ ...current, variantName: event.target.value }))
            }
          />
        </div>
      </ProgressiveFormSection>

      <ProgressiveFormSection
        step="02"
        title="Sellable"
        summary={draft.priceNgn ? `NGN ${draft.priceNgn}` : "Price"}
        open={activeStep === "sellable"}
        onOpenChange={(open) => setActiveStep(open ? "sellable" : "sellable")}
        actions={
          <button
            type="button"
            onClick={() => setActiveStep("identity")}
            className="rounded-full bg-system-fill/42 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
          >
            Back
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputGroup
            label="Price"
            name="priceNgn"
            type="number"
            min={0}
            required
            placeholder="25000"
            value={draft.priceNgn}
            onChange={(event) =>
              setDraft((current) => ({ ...current, priceNgn: event.target.value }))
            }
          />
        </div>
      </ProgressiveFormSection>

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
              messageTone === "error" && "text-red-500",
              messageTone === "success" && "text-accent",
              !messageTone && "text-secondary-label"
            )}
          >
            {message ?? "Draft first."}
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="button-primary min-h-[44px] min-w-[132px] px-5 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            {isPending ? "Starting" : "Create"}
          </button>
        </div>
      </div>
    </form>
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
