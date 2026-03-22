"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import {
  getClientErrorMessage,
  readJsonPayload,
} from "@/lib/orders/client-form";

export function OrderReturnProofUploadCard({
  orderId,
  returnCaseId,
  accessToken,
  disabled,
}: {
  orderId: string;
  returnCaseId: string;
  accessToken?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (disabled) {
    return (
      <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
        Proof locked.
      </div>
    );
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];

    startTransition(async () => {
      try {
        setMessage(null);

        if (!file) {
          throw new Error("Choose a file.");
        }

        const presignResponse = await fetch("/api/order-returns/presign", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            returnCaseId,
            accessToken,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        });

        const presignPayload = await readJsonPayload<{
          ok: boolean;
          error?: string;
          data?: {
            uploadUrl: string;
            storageKey: string;
            publicUrl: string;
            contentType: string;
          };
        }>(presignResponse);

        if (!presignResponse.ok || !presignPayload?.ok || !presignPayload.data) {
          throw new Error(presignPayload?.error || "Try again.");
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

        const commitResponse = await fetch("/api/order-returns/commit", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            returnCaseId,
            accessToken,
            storageKey: presignPayload.data.storageKey,
            publicUrl: presignPayload.data.publicUrl,
            mimeType: presignPayload.data.contentType,
          }),
        });

        const commitPayload = await readJsonPayload<{
          ok: boolean;
          error?: string;
        }>(commitResponse);

        if (!commitResponse.ok || !commitPayload?.ok) {
          throw new Error(commitPayload?.error || "Try again.");
        }

        if (inputRef.current) {
          inputRef.current.value = "";
        }

        setMessage("Added.");
        router.refresh();
      } catch (error) {
        setMessage(getClientErrorMessage(error));
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
        Add proof if you have it.
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="min-w-0 flex-1 rounded-[24px] bg-system-fill/70 px-3 py-3 text-xs text-label file:mr-3 file:rounded-full file:bg-system-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-label"
        />
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={isPending}
          className="button-secondary min-h-[48px] shrink-0 justify-center text-xs font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none md:px-5"
        >
          <Upload className="h-4 w-4" strokeWidth={1.8} />
          {isPending ? "Sending" : "Add proof"}
        </button>
        {message ? (
          <div className="flex items-center gap-2 rounded-[18px] bg-system-fill/32 px-3 py-2 text-xs text-secondary-label md:min-w-[72px] md:justify-end md:text-right">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-label" strokeWidth={1.8} />
            <span>{message}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
