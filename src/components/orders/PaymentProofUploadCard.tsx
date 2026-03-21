"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Landmark, Upload } from "lucide-react";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Try again.";
}

function isStorageUnavailableError(message: string) {
  return message.toLowerCase().includes("storage bucket is not configured");
}

async function readJsonPayload<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function getPaymentStateMessage(paymentStatus: string) {
  switch (paymentStatus) {
    case "submitted":
      return "Money sent. Waiting for confirmation.";
    case "under_review":
      return "Payment is being checked.";
    case "confirmed":
      return "Payment confirmed.";
    case "expired":
      return "Transfer window closed.";
    default:
      return "Handled.";
  }
}

export function PaymentProofUploadCard({
  orderId,
  paymentId,
  accessToken,
  paymentStatus,
}: {
  orderId: string;
  paymentId: string | null;
  accessToken?: string;
  paymentStatus?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!paymentId) {
    return null;
  }

  if (paymentStatus && !["awaiting_transfer", "rejected"].includes(paymentStatus)) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-label" strokeWidth={1.8} />
        <span>{getPaymentStateMessage(paymentStatus)}</span>
      </div>
    );
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];

    startTransition(async () => {
      try {
        setMessage(null);

        let storagePayload:
          | {
              storageKey: string;
              publicUrl: string;
              contentType: string;
            }
          | null = null;

        if (file) {
          const presignResponse = await fetch("/api/payment-proofs/presign", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId,
              paymentId,
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
            const presignError = presignPayload?.error || "Try again.";

            if (!presignResponse.ok && isStorageUnavailableError(presignError)) {
              storagePayload = null;
            } else {
              throw new Error(presignError);
            }
          } else {
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

            storagePayload = {
              storageKey: presignPayload.data.storageKey,
              publicUrl: presignPayload.data.publicUrl,
              contentType: presignPayload.data.contentType,
            };
          }
        }

        const commitResponse = await fetch("/api/payment-proofs/commit", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            paymentId,
            accessToken,
            storageKey: storagePayload?.storageKey,
            publicUrl: storagePayload?.publicUrl,
            mimeType: storagePayload?.contentType,
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

        setMessage(
          file && !storagePayload ? "Money sent. Add proof later." : "Money sent."
        );
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
        <div className="flex items-start gap-3">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-label" strokeWidth={1.8} />
          <div className="space-y-1">
            <div className="text-label">Send the transfer, then tap once for confirmation.</div>
            <div>Receipt is optional.</div>
          </div>
        </div>
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
          className="button-primary min-h-[44px] shrink-0 text-xs font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none md:px-5"
        >
          <Upload className="h-4 w-4" strokeWidth={1.8} />
          {isPending ? "Sending" : "I sent the money"}
        </button>
        {message ? (
          <p className="text-xs text-secondary-label md:min-w-[72px] md:text-right">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
