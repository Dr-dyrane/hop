"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { formatNgn } from "@/lib/commerce";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import type {
  OrderReturnCaseRow,
  OrderReturnEventRow,
  OrderReturnProofRow,
  PortalOrderLine,
} from "@/lib/db/types";
import { OrderReturnProofUploadCard } from "@/components/orders/OrderReturnProofUploadCard";
import { getClientErrorMessage, normalizeDigits } from "@/lib/orders/client-form";
import {
  formatOrderStatusLabel,
  formatOrderTimestamp,
} from "@/lib/orders/detail-view";
import { cn } from "@/lib/utils";
import styles from "./order-detail/order-task-cards.module.css";

const RETURN_REASON_OPTIONS = [
  "Wrong item",
  "Damaged item",
  "Changed mind",
  "Not satisfied",
  "Other",
];

type ReturnStep = 1 | 2 | 3 | 4;
type FeedbackState = {
  tone: "success" | "error";
  text: string;
};

type ReturnFormErrors = {
  items?: string;
  reason?: string;
  details?: string;
  refundBankName?: string;
  refundAccountName?: string;
  refundAccountNumber?: string;
};

const SCENE_MOTION = {
  initial: { opacity: 0, y: 8, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -6, filter: "blur(4px)" },
  transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] as const },
};

export function OrderReturnRequestCard({
  orderId,
  accessToken,
  orderStatus,
  returnCase,
  returnEvents,
  proofs,
  items,
}: {
  orderId: string;
  accessToken?: string;
  orderStatus: string;
  returnCase: OrderReturnCaseRow | null;
  returnEvents: OrderReturnEventRow[];
  proofs: OrderReturnProofRow[];
  items: PortalOrderLine[];
}) {
  const router = useRouter();
  const feedback = useFeedback();
  const returnableItems = items.filter((item) => item.returnableQuantity > 0);
  const [step, setStep] = useState<ReturnStep>(1);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(returnableItems.map((item) => [item.orderItemId, 0]))
  );
  const [errors, setErrors] = useState<ReturnFormErrors>({});
  const [message, setMessage] = useState<FeedbackState | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  const selectedItems = useMemo(
    () =>
      returnableItems.filter((item) => (selectedQuantities[item.orderItemId] ?? 0) > 0),
    [returnableItems, selectedQuantities]
  );

  const selectedUnitCount = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + (selectedQuantities[item.orderItemId] ?? 0),
        0
      ),
    [selectedItems, selectedQuantities]
  );

  const selectedTotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) =>
          total + item.unitPriceNgn * (selectedQuantities[item.orderItemId] ?? 0),
        0
      ),
    [selectedItems, selectedQuantities]
  );

  const delivered = orderStatus === "delivered";
  const hasOpenCase = Boolean(returnCase);

  if (!delivered && !hasOpenCase) {
    return (
      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>Returns open after delivery</div>
        <div className={styles.infoText}>Available after delivery.</div>
      </div>
    );
  }

  if (delivered && !hasOpenCase && returnableItems.length === 0) {
    return <div className={styles.infoCard}>Nothing left to return.</div>;
  }

  function setError<K extends keyof ReturnFormErrors>(key: K, value?: string) {
    setErrors((current) => {
      const next = { ...current };
      if (!value) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  function nextFromItems() {
    if (selectedUnitCount === 0) {
      setError("items", "Select at least one item.");
      return;
    }

    setError("items");
    setMessage(null);
    setStep(2);
  }

  function nextFromReason() {
    if (!reason.trim()) {
      setError("reason", "Select a reason to continue.");
      return;
    }

    setError("reason");
    setMessage(null);
    setStep(3);
  }

  function nextFromDetails() {
    const nextErrors: ReturnFormErrors = {};

    if (!refundBankName.trim()) {
      nextErrors.refundBankName = "Bank is required.";
    }

    if (!refundAccountName.trim()) {
      nextErrors.refundAccountName = "Account name is required.";
    }

    if (!refundAccountNumber.trim()) {
      nextErrors.refundAccountNumber = "Account number is required.";
    } else if (refundAccountNumber.trim().length < 10) {
      nextErrors.refundAccountNumber = "Enter a valid account number.";
    }

    setErrors((current) => ({
      ...current,
      refundBankName: nextErrors.refundBankName,
      refundAccountName: nextErrors.refundAccountName,
      refundAccountNumber: nextErrors.refundAccountNumber,
    }));

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setMessage(null);
    setStep(4);
  }

  async function submitReturn() {
    startTransition(async () => {
      try {
        setMessage(null);

        const response = await fetch("/api/order-returns", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            accessToken,
            reason,
            details,
            items: selectedItems.map((item) => ({
              orderItemId: item.orderItemId,
              quantity: selectedQuantities[item.orderItemId] ?? 0,
            })),
            refundBankName,
            refundAccountName,
            refundAccountNumber,
          }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Unable to submit return request.");
        }

        setSubmitted(true);
        setMessage({ tone: "success", text: "Return request submitted." });
        feedback.success();
        router.refresh();
      } catch (submitError) {
        feedback.blocked();
        setMessage({
          tone: "error",
          text: getClientErrorMessage(submitError, "Unable to submit return request."),
        });
      }
    });
  }

  if (submitted) {
    return (
      <div className={styles.successCard}>
        <div className={styles.successTitle}>Return request submitted</div>
        <div className={styles.successText}>Request received. Status updates appear here.</div>
      </div>
    );
  }

  if (hasOpenCase && returnCase) {
    return (
      <div className={styles.card}>
        <div className={styles.statusCard}>
          <div className={styles.statusTitle}>Current status</div>
          <div className={styles.statusText}>{formatOrderStatusLabel(returnCase.status)}</div>
        </div>

        <div className={styles.metaGrid}>
          <MetaPill label="Requested" value={formatNgn(returnCase.requestedRefundAmountNgn)} />
          <MetaPill
            label="Refund"
            value={
              returnCase.approvedRefundAmountNgn !== null
                ? formatNgn(returnCase.approvedRefundAmountNgn)
                : "Pending"
            }
          />
        </div>

        {returnCase.refundBankName || returnCase.refundAccountName || returnCase.refundAccountNumber ? (
          <div className={styles.metaGridThree}>
            <MetaPill label="Bank" value={returnCase.refundBankName ?? "Pending"} />
            <MetaPill label="Name" value={returnCase.refundAccountName ?? "Pending"} />
            <MetaPill label="Number" value={returnCase.refundAccountNumber ?? "Pending"} />
          </div>
        ) : null}

        {returnCase.refundReference ? (
          <div className={styles.summaryRow}>
            <span>Reference</span>
            <span>{returnCase.refundReference}</span>
          </div>
        ) : null}

        {returnCase.resolutionNote ? (
          <div className={styles.infoCard}>{returnCase.resolutionNote}</div>
        ) : null}

        <OrderReturnProofUploadCard
          orderId={orderId}
          returnCaseId={returnCase.returnCaseId}
          accessToken={accessToken}
          disabled={["rejected", "refunded"].includes(returnCase.status)}
        />

        {(returnEvents.length > 0 || proofs.length > 0) && (
          <div className={styles.historyBlock}>
            {returnEvents.length > 0 ? (
              <div className={styles.historyCard}>
                <div className={styles.historyTitle}>Recent updates</div>
                <div className={styles.historyList}>
                  {returnEvents.slice(0, 4).map((event) => (
                    <div key={event.eventId} className={styles.historyItem}>
                      {formatOrderStatusLabel(event.action)} - {formatOrderTimestamp(event.createdAt)}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {proofs.length > 0 ? (
              <div className={styles.historyCard}>
                <div className={styles.historyTitle}>Attached proof</div>
                <div className={styles.historyList}>
                  {proofs.slice(0, 4).map((proof) =>
                    proof.publicUrl ? (
                      <a
                        key={proof.proofId}
                        href={proof.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.link}
                      >
                        View file - {formatOrderTimestamp(proof.createdAt)}
                      </a>
                    ) : (
                      <span key={proof.proofId} className={styles.historyItem}>
                        File pending - {formatOrderTimestamp(proof.createdAt)}
                      </span>
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Start a return</h3>
          <p className={styles.description}>Step by step.</p>
        </div>
        <div className={styles.stepPill}>Step {step} of 4</div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 1 ? (
          <motion.section
            key="return-step-1"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.sceneTitle}>Which item needs attention?</div>
            <div className={styles.choiceList}>
              {returnableItems.map((item) => {
                const quantity = selectedQuantities[item.orderItemId] ?? 0;

                return (
                  <div
                    key={item.orderItemId}
                    className={cn(
                      styles.choiceCard,
                      quantity > 0 && styles.choiceCardActive
                    )}
                  >
                    <div>
                      <div className={styles.choiceTitle}>{item.title}</div>
                      <div className={styles.choiceMeta}>
                        {item.returnableQuantity} returnable - {formatNgn(item.unitPriceNgn)} each
                      </div>
                    </div>

                    <div className={styles.choiceControls}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => {
                          feedback.tap();
                          setSelectedQuantities((current) => ({
                            ...current,
                            [item.orderItemId]: Math.max(0, (current[item.orderItemId] ?? 0) - 1),
                          }));
                        }}
                        aria-label={`Decrease ${item.title}`}
                      >
                        <Minus className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                      <div className={styles.choiceValue}>{quantity}</div>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => {
                          feedback.tap();
                          setSelectedQuantities((current) => ({
                            ...current,
                            [item.orderItemId]: Math.min(
                              item.returnableQuantity,
                              (current[item.orderItemId] ?? 0) + 1
                            ),
                          }));
                        }}
                        aria-label={`Increase ${item.title}`}
                      >
                        <Plus className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.footerBar}>
              <div className={styles.footerHint}>
                {selectedUnitCount === 0
                  ? "Select at least one item."
                  : `${selectedUnitCount} selected - ${formatNgn(selectedTotal)}`}
              </div>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  feedback.selection();
                  nextFromItems();
                }}
              >
                Continue
              </button>
            </div>

            {errors.items ? <div className={styles.errorBanner}>{errors.items}</div> : null}
          </motion.section>
        ) : null}

        {step === 2 ? (
          <motion.section
            key="return-step-2"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.sceneTitle}>What is the main reason?</div>
            <div className={styles.reasonGrid}>
              {RETURN_REASON_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(styles.reasonCard, reason === option && styles.reasonCardActive)}
                  onClick={() => {
                    feedback.tap();
                    setReason(option);
                    setError("reason");
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            {errors.reason ? <div className={styles.errorBanner}>{errors.reason}</div> : null}

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  feedback.selection();
                  setStep(1);
                }}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  feedback.selection();
                  nextFromReason();
                }}
              >
                Continue
              </button>
            </div>
          </motion.section>
        ) : null}

        {step === 3 ? (
          <motion.section
            key="return-step-3"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.sceneTitle}>Add details and refund destination</div>

            <textarea
              className={styles.textarea}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={5}
              placeholder="Optional details"
            />

            <div className={styles.fieldStack}>
              <label htmlFor="return-bank" className={styles.fieldLabel}>
                Refund bank
              </label>
              <input
                id="return-bank"
                className={styles.inputLike}
                value={refundBankName}
                onChange={(event) => {
                  setRefundBankName(event.target.value);
                  setError("refundBankName");
                }}
                placeholder="Bank"
              />
              {errors.refundBankName ? (
                <div className={styles.errorBanner}>{errors.refundBankName}</div>
              ) : null}
            </div>

            <div className={styles.fieldStack}>
              <label htmlFor="return-account-name" className={styles.fieldLabel}>
                Account name
              </label>
              <input
                id="return-account-name"
                className={styles.inputLike}
                value={refundAccountName}
                onChange={(event) => {
                  setRefundAccountName(event.target.value);
                  setError("refundAccountName");
                }}
                placeholder="Account name"
              />
              {errors.refundAccountName ? (
                <div className={styles.errorBanner}>{errors.refundAccountName}</div>
              ) : null}
            </div>

            <div className={styles.fieldStack}>
              <label htmlFor="return-account-number" className={styles.fieldLabel}>
                Account number
              </label>
              <input
                id="return-account-number"
                className={styles.inputLike}
                value={refundAccountNumber}
                onChange={(event) => {
                  setRefundAccountNumber(normalizeDigits(event.target.value));
                  setError("refundAccountNumber");
                }}
                placeholder="Account number"
                inputMode="numeric"
              />
              {errors.refundAccountNumber ? (
                <div className={styles.errorBanner}>{errors.refundAccountNumber}</div>
              ) : null}
            </div>

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  feedback.selection();
                  setStep(2);
                }}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  feedback.selection();
                  nextFromDetails();
                }}
              >
                Review
              </button>
            </div>
          </motion.section>
        ) : null}

        {step === 4 ? (
          <motion.section
            key="return-step-4"
            className={styles.scene}
            initial={SCENE_MOTION.initial}
            animate={SCENE_MOTION.animate}
            exit={SCENE_MOTION.exit}
            transition={SCENE_MOTION.transition}
          >
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>Review request</div>
              <div className={styles.summaryRow}>
                <span>Items</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Reason</span>
                <span>{reason}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Estimated value</span>
                <span>{formatNgn(selectedTotal)}</span>
              </div>
              {details.trim() ? <div className={styles.summaryNote}>{details.trim()}</div> : null}
            </div>

            {message && message.tone === "error" ? (
              <div className={styles.errorBanner}>{message.text}</div>
            ) : null}

            <div className={styles.actionsRow}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  feedback.selection();
                  setStep(3);
                }}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  feedback.selection();
                  void submitReturn();
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {message && message.tone === "success" ? (
        <div className={cn(styles.successCard, styles.successInline)}>{message.text}</div>
      ) : null}
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaPill}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={styles.metaValue}>{value}</div>
    </div>
  );
}

