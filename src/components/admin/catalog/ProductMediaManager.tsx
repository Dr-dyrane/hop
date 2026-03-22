"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, LoaderCircle, Star, Trash2 } from "lucide-react";
import type { AdminCatalogProductMedia } from "@/lib/db/types";
import {
  deleteProductMediaAction,
  setProductMediaPrimaryAction,
  updateProductMediaAction,
} from "@/app/(admin)/admin/catalog/products/[productId]/actions";
import {
  ProductMediaPreviewSurface,
  ProductMediaTypeBadge,
  ProductMediaViewer,
} from "@/components/admin/catalog/ProductMediaViewer";
import { cn } from "@/lib/utils";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Try again.";
}

function getAcceptValue(mediaType: "image" | "model_3d" | "video") {
  if (mediaType === "image") {
    return "image/*";
  }

  if (mediaType === "model_3d") {
    return ".glb,.gltf,model/gltf-binary,model/gltf+json,application/octet-stream";
  }

  return "video/*";
}

function formatMediaTypeLabel(mediaType: string) {
  return mediaType === "model_3d" ? "3D" : mediaType;
}

export function ProductMediaManager({
  productId,
  media,
  variantTarget,
}: {
  productId: string;
  media: AdminCatalogProductMedia[];
  variantTarget: {
    variantId: string;
    variantName: string;
  };
}) {
  const router = useRouter();
  const [isUploading, startUploadTransition] = useTransition();
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadTone, setUploadTone] = useState<"success" | "error" | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "model_3d" | "video">("image");
  const [mediaTarget, setMediaTarget] = useState<"product" | "variant">("product");
  const [altText, setAltText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<AdminCatalogProductMedia | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];

    if (!file) {
      setUploadMessage("Choose a file.");
      setUploadTone("error");
      return;
    }

    startUploadTransition(async () => {
      try {
        setUploadMessage(null);
        setUploadTone(null);

        const presignResponse = await fetch("/api/admin/catalog/media/presign", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            variantId: mediaTarget === "variant" ? variantTarget.variantId : null,
            mediaType,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        });

        const presignPayload = (await presignResponse.json()) as {
          ok: boolean;
          error?: string;
          data?: {
            uploadUrl: string;
            storageKey: string;
            publicUrl: string;
            contentType: string;
          };
        };

        if (!presignResponse.ok || !presignPayload.ok || !presignPayload.data) {
          throw new Error(presignPayload.error || "Try again.");
        }

        const uploadResponse = await fetch(presignPayload.data.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": presignPayload.data.contentType,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Try again.");
        }

        const commitResponse = await fetch("/api/admin/catalog/media/commit", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId,
            variantId: mediaTarget === "variant" ? variantTarget.variantId : null,
            mediaType,
            storageKey: presignPayload.data.storageKey,
            publicUrl: presignPayload.data.publicUrl,
            contentType: presignPayload.data.contentType,
            fileName: file.name,
            altText,
          }),
        });

        const commitPayload = (await commitResponse.json()) as {
          ok: boolean;
          error?: string;
        };

        if (!commitResponse.ok || !commitPayload.ok) {
          throw new Error(commitPayload.error || "Try again.");
        }

        if (inputRef.current) {
          inputRef.current.value = "";
        }

        setAltText("");
        setUploadMessage("Added.");
        setUploadTone("success");
        router.refresh();
      } catch (error) {
        setUploadMessage(getErrorMessage(error));
        setUploadTone("error");
      }
    });
  }

  return (
    <section className="glass-morphism rounded-[28px] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-label">Media</h2>
        <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          {media.length}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[140px_140px_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <select
          value={mediaTarget}
          onChange={(event) => setMediaTarget(event.target.value as "product" | "variant")}
          className="min-h-[48px] rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all focus:bg-system-fill/58"
        >
          <option value="product">Product</option>
          <option value="variant">{variantTarget.variantName}</option>
        </select>
        <select
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value as "image" | "model_3d" | "video")}
          className="min-h-[48px] rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all focus:bg-system-fill/58"
        >
          <option value="image">Image</option>
          <option value="model_3d">3D</option>
          <option value="video">Video</option>
        </select>
        <input
          ref={inputRef}
          type="file"
          accept={getAcceptValue(mediaType)}
          className="min-w-0 rounded-[20px] bg-system-fill/42 px-4 py-3 text-sm text-label file:mr-3 file:rounded-full file:bg-[color:var(--surface)] file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-label"
        />
        <input
          type="text"
          value={altText}
          onChange={(event) => setAltText(event.target.value)}
          placeholder="Alt text"
          className="min-h-[48px] rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
        />
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={isUploading}
          className="button-primary min-h-[48px] px-5 text-[11px] font-semibold uppercase tracking-[0.16em] disabled:translate-y-0 disabled:opacity-60"
        >
          {isUploading ? "Adding" : "Add"}
        </button>
      </div>

      <div className="mt-3 text-xs text-secondary-label">
        {uploadMessage ? (
          <span
            className={cn(
              uploadTone === "success" && "text-accent",
              uploadTone === "error" && "text-red-500"
            )}
          >
            {uploadMessage}
          </span>
        ) : (
          "Product, variant, image, 3D, video."
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {media.length === 0 ? (
          <div className="rounded-[22px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label">
            No media yet.
          </div>
        ) : (
          media.map((item) => (
            <MediaRow
              key={item.mediaId}
              item={item}
              productId={productId}
              onView={() => setSelectedMedia(item)}
            />
          ))
        )}
      </div>

      <ProductMediaViewer item={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </section>
  );
}

function MediaRow({
  item,
  productId,
  onView,
}: {
  item: AdminCatalogProductMedia;
  productId: string;
  onView: () => void;
}) {
  const router = useRouter();
  const [altText, setAltText] = useState(item.altText ?? "");
  const [sortOrder, setSortOrder] = useState(String(item.sortOrder));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("mediaId", item.mediaId);
    formData.set("altText", altText);
    formData.set("sortOrder", sortOrder);

    startTransition(async () => {
      const result = await updateProductMediaAction(formData);

      if (!result.success) {
        setMessage(result.error || "Try again.");
        return;
      }

      setMessage("Saved.");
      router.refresh();
    });
  }

  function handlePrimary() {
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("mediaId", item.mediaId);

    startTransition(async () => {
      const result = await setProductMediaPrimaryAction(formData);

      if (!result.success) {
        setMessage(result.error || "Try again.");
        return;
      }

      setMessage("Primary.");
      router.refresh();
    });
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("mediaId", item.mediaId);

    startTransition(async () => {
      const result = await deleteProductMediaAction(formData);

      if (!result.success) {
        setMessage(result.error || "Try again.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <article className="rounded-[24px] bg-system-fill/42 p-4">
      <div className="grid gap-4 lg:grid-cols-[120px_minmax(0,1fr)_auto]">
        <ProductMediaPreviewSurface
          item={item}
          onOpen={onView}
          className="aspect-square h-[120px] w-[120px]"
        />

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ProductMediaTypeBadge mediaType={item.mediaType} />
            <span className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              {item.targetLabel}
            </span>
            {item.isPrimary ? (
              <span className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                Primary
              </span>
            ) : null}
            <button
              type="button"
              onClick={onView}
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label transition-colors duration-300 hover:text-label"
            >
              <Eye size={12} />
              View
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
            <input
              type="text"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Alt text"
              className="min-h-[44px] rounded-[18px] bg-[color:var(--surface)]/88 px-4 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-[color:var(--surface)]"
            />
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="min-h-[44px] rounded-[18px] bg-[color:var(--surface)]/88 px-4 text-sm text-label outline-none transition-all focus:bg-[color:var(--surface)]"
            />
          </div>

          <div className="text-xs text-secondary-label">
            {message ?? `${formatMediaTypeLabel(item.mediaType)} ready.`}
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-end gap-2">
          {!item.isPrimary ? (
            <button
              type="button"
              onClick={handlePrimary}
              disabled={isPending}
              className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
            >
              <Star size={14} />
              Primary
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
          >
            {isPending ? <LoaderCircle className="animate-spin" size={14} /> : null}
            Save
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-full bg-[color:var(--surface)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label transition-colors duration-300 hover:text-label"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
