"use client";

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Landmark } from "lucide-react";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import {
  getClientErrorMessage,
  readJsonPayload,
  validateUploadFile,
} from "@/lib/orders/client-form";
import { cn } from "@/lib/utils";
import styles from "./order-detail/order-task-cards.module.css";

type PaymentStep = "idle" | "pick" | "confirm" | "success";

type FeedbackState = {
  tone: "success" | "error";
  text: string;
};

const MAX_FILE_MB = 8;
const RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const SCENE_MOTION = {
  initial: { opacity: 0, y: 8, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -6, filter: "blur(4px)" },
  transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] as const },
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isStorageUnavailableError(message: string) {
  return message.toLowerCase().includes("storage bucket is not configured");
}

function getPaymentStateMessage(paymentStatus: string) {
  switch (paymentStatus) {
    case "submitted":
      return "Submitted.";
    case "under_review":
      return "Under review.";
    case "confirmed":
      return "Confirmed.";
    case "expired":
      return "Transfer window closed.";
    default:
      return "Locked.";
  }
}

function getStepLabel(step: PaymentStep) {
  switch (step) {
    case "idle":
      return "Ready";
    case "pick":
      return "Choose";
    case "confirm":
      return "Confirm";
    case "success":
      return "Done";
    default:
      return "Ready";
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
  const [step, setStep] = useState<PaymentStep>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState<FeedbackState | null>(null);
  const [isSubmitting, startTransition] = useTransition();
  const { tap, paymentReceived, blocked } = useFeedback();

  const isLocked =
    typeof paymentStatus === "string" &&
    !["awaiting_transfer", "rejected"].includes(paymentStatus);

  const helperText = useMemo(() => {
    if (isLocked) {
      return getPaymentStateMessage(paymentStatus ?? "submitted");
    }

    if (paymentStatus === "submitted") {
      return "Proof submitted.";
    }

    return "Upload proof file.";
  }, [isLocked, paymentStatus]);

  if (!paymentId) {
    return null;
  }

  function openPicker() {
    if (isLocked) return;
    inputRef.current?.click();
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const validationError = validateUploadFile(file, RECEIPT_TYPES, MAX_FILE_MB);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      setStep("pick");
      return;
    }

    setError("");
    setSelectedFile(file);
    setStep("confirm");
  }

  async function submitProof() {
    if (!selectedFile) {
      setError("Choose a file before submitting.");
      setStep("pick");
      return;
    }

    startTransition(async () => {
      try {
        setMessage(null);
        setError("");

        let storagePayload:
          | {
              storageKey: string;
              publicUrl: string;
              contentType: string;
            }
          | null = null;

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
            fileName: selectedFile.name,
            contentType: selectedFile.type || "application/octet-stream",
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
            body: selectedFile,
          });

          if (!uploadResponse.ok) {
            throw new Error("Upload failed. Please try again.");
          }

          storagePayload = {
            storageKey: presignPayload.data.storageKey,
            publicUrl: presignPayload.data.publicUrl,
            contentType: presignPayload.data.contentType,
          };
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

        setMessage({
          tone: "success",
          text:
            selectedFile && !storagePayload
              ? "Transfer confirmed. Add proof later."
              : "Proof uploaded.",
        });
        setStep("success");
        paymentReceived();
        router.refresh();
      } catch (submitError) {
        setError(getClientErrorMessage(submitError));
        setMessage({
          tone: "error",
          text: getClientErrorMessage(submitError),
        });
        blocked();
      }
    });
  }

  function resetFlow() {
    setSelectedFile(null);
    setNote("");
    setError("");
    setStep("pick");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className={styles.card}>
      <input
        ref={inputRef}
        type="file"
        className={styles.hiddenInput}
        accept=".png,.jpg,.jpeg,.webp,.pdf"
        onChange={onFileChange}
      />

      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Payment proof</h3>
          <p className={styles.description}>{helperText}</p>
        </div>
        <div className={styles.statusPill}>{isLocked ? "Locked" : getStepLabel(step)}</div>
      </div>

      {!isLocked && step === "idle" ? (
        <div className={styles.compactScene}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              tap();
              setStep("pick");
            }}
          >
            Upload proof
          </button>
          <p className={styles.sceneHint}>One file only.</p>
        </div>
      ) : null}

      <AnimatePresence mode="wait" initial={false}>
        {step === "pick" && !isLocked ? (
          <motion.section
            key="pick"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <button type="button" className={styles.dropZone} onClick={openPicker}>
              <span className={styles.dropZoneTitle}>Choose a file</span>
              <span className={styles.dropZoneText}>
                PNG, JPG, WEBP, or PDF up to {MAX_FILE_MB} MB
              </span>
            </button>

            {error ? <div className={styles.errorBanner}>{error}</div> : null}

            <div className={styles.actionsRow}>
              <button type="button" className={styles.primaryButton} onClick={openPicker}>
                Browse files
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setStep("idle")}
              >
                Cancel
              </button>
            </div>
          </motion.section>
        ) : null}

        {step === "confirm" && selectedFile && !isLocked ? (
          <motion.section
            key="confirm"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.fileCard}>
              <div className={styles.fileName}>{selectedFile.name}</div>
              <div className={styles.fileMeta}>
                {selectedFile.type || "Unknown type"} - {formatFileSize(selectedFile.size)}
              </div>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Optional note</span>
              <textarea
                className={styles.textarea}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note"
                rows={3}
              />
            </label>

            {error ? <div className={styles.errorBanner}>{error}</div> : null}

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={resetFlow}
                disabled={isSubmitting}
              >
                Replace
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void submitProof()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Uploading..." : "Submit proof"}
              </button>
            </div>
          </motion.section>
        ) : null}

        {step === "success" ? (
          <motion.section
            key="success"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.successCard}>
              <div className={styles.successTitle}>Proof uploaded</div>
              <div className={styles.successText}>Received. Pending review.</div>
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={resetFlow}
              >
                Upload another file
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {message ? (
        <div
          className={cn(
            styles.banner,
            message.tone === "success" ? styles.bannerSuccess : styles.bannerError
          )}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span>{message.text}</span>
        </div>
      ) : null}

      {isLocked ? (
        <div className={styles.successCard}>
          <div className={styles.successTitle}>Payment already reviewed</div>
          <div className={styles.successText}>Not editable for this status.</div>
        </div>
      ) : null}

      {!isLocked ? (
        <div className={styles.banner}>
          <Landmark className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span>Reference linked to this order.</span>
        </div>
      ) : null}
    </div>
  );
}

