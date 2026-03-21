"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressiveFormSection } from "@/components/forms/ProgressiveFormSection";
import { type AdminLayoutSection } from "@/lib/db/types";
import { updateSectionAction } from "@/app/(admin)/admin/layout/actions";

export function SectionEditorForm({
  section,
}: {
  section: AdminLayoutSection;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [activeStep, setActiveStep] = useState<"content" | "state">("content");
  const [isEnabled, setIsEnabled] = useState(section.isEnabled);
  const [draft, setDraft] = useState({
    eyebrow: section.eyebrow || "",
    heading: section.heading || "",
    body: section.body || "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);
    formData.set("isEnabled", isEnabled.toString());

    startTransition(async () => {
      const result = await updateSectionAction(formData);

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

  return (
    <form id="admin-layout-section-form" onSubmit={handleSubmit} className="space-y-6 pb-24">
      <input type="hidden" name="sectionId" value={section.sectionId} />

      <div className="grid gap-6 min-[1500px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <ProgressiveFormSection
            step="01"
            title="Content"
            summary={[draft.eyebrow, draft.heading].filter(Boolean).join(" / ") || section.sectionType}
            open={activeStep === "content"}
            onOpenChange={(open) => setActiveStep(open ? "content" : "state")}
            actions={
              <button
                type="button"
                onClick={() => setActiveStep("state")}
                className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
              >
                Continue
              </button>
            }
          >
            <div className="space-y-4">
              <InputGroup
                label="Eyebrow"
                name="eyebrow"
                value={draft.eyebrow}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, eyebrow: event.target.value }))
                }
              />
              <InputGroup
                label="Heading"
                name="heading"
                value={draft.heading}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, heading: event.target.value }))
                }
              />
              <TextAreaGroup
                label="Body"
                name="body"
                value={draft.body}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, body: event.target.value }))
                }
                rows={5}
              />
            </div>
          </ProgressiveFormSection>
        </div>

        <aside className="space-y-4">
          <ProgressiveFormSection
            step="02"
            title="State"
            summary={isEnabled ? "Shown" : "Hidden"}
            open={activeStep === "state"}
            onOpenChange={(open) => setActiveStep(open ? "state" : "state")}
            actions={
              <button
                type="button"
                onClick={() => setActiveStep("content")}
                className="rounded-full bg-system-fill/42 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
              >
                Back
              </button>
            }
          >
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsEnabled((current) => !current)}
                className="flex min-h-[48px] w-full items-center justify-between rounded-[20px] bg-system-fill/42 px-4 text-left"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                    Visibility
                  </p>
                  <p className="mt-1 text-sm font-medium text-label">
                    {isEnabled ? "Shown" : "Hidden"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex min-w-[58px] justify-center rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]",
                    isEnabled
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-system-fill/52 text-secondary-label"
                  )}
                >
                  {isEnabled ? "On" : "Off"}
                </span>
              </button>

              <SignalCard label="Type" value={section.sectionType} />
              <SignalCard label="Sort" value={`${section.sortOrder}`} />
            </div>
          </ProgressiveFormSection>
        </aside>
      </div>

      <div className="sticky bottom-6 z-30">
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
    </form>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-system-fill/42 px-4 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-label">{value}</p>
    </div>
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
