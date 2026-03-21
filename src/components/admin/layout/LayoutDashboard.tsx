"use client";

import { useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  History,
  Layers,
  Plus,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AdminLayoutDraftDetail,
  PublishedPageSection,
} from "@/lib/db/types";
import {
  createDraftAction,
  publishDraftAction,
} from "@/app/(admin)/admin/layout/actions";
import { SectionList } from "@/components/admin/layout/SectionList";

export function LayoutDashboard({
  publishedSections,
  draftDetail,
}: {
  publishedSections: PublishedPageSection[];
  draftDetail: AdminLayoutDraftDetail | null;
}) {
  const [view, setView] = useState<"published" | "draft">(
    draftDetail ? "draft" : "published"
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasDraft = Boolean(draftDetail);
  const sections =
    view === "draft" && draftDetail ? draftDetail.sections : publishedSections;

  async function handleCreateDraft() {
    setError(null);
    startTransition(async () => {
      const result = await createDraftAction();
      if (result.success) {
        setView("draft");
        return;
      }

      setError(result.error || "Failed to create draft");
    });
  }

  async function handlePublish() {
    if (!draftDetail) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await publishDraftAction(draftDetail.version.versionId);
      if (result.success) {
        setSuccess(true);
        setView("published");
        return;
      }

      setError(result.error || "Failed to publish draft");
    });
  }

  return (
    <div className="space-y-6 pb-20 md:space-y-8">
      {(success || error) ? (
        <div
          className={cn(
            "z-layer-toast fixed bottom-8 right-8 flex items-center gap-3 rounded-2xl px-6 py-4 shadow-float animate-in fade-in slide-in-from-bottom-4 duration-300",
            success
              ? "bg-accent/10 text-accent backdrop-blur-xl"
              : "bg-red-500/10 text-red-500 backdrop-blur-xl"
          )}
        >
          {success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">
            {success ? "Layout published successfully" : error}
          </span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col gap-3 min-[1500px]:flex-row min-[1500px]:items-center min-[1500px]:justify-between">
          <div className="rounded-[22px] bg-system-fill/42 p-1.5 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setView("published")}
                className={cn(
                  "flex min-h-[42px] items-center justify-center gap-2 rounded-[18px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all",
                  view === "published"
                    ? "bg-system-fill/82 text-label shadow-soft"
                    : "text-secondary-label hover:text-label"
                )}
              >
                <History size={14} />
                <span>Live</span>
              </button>
              <button
                onClick={() => setView("draft")}
                disabled={!hasDraft}
                className={cn(
                  "flex min-h-[42px] items-center justify-center gap-2 rounded-[18px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all",
                  view === "draft"
                    ? "bg-system-fill/82 text-label shadow-soft"
                    : "text-secondary-label hover:text-label",
                  !hasDraft && "cursor-not-allowed opacity-30"
                )}
              >
                <Layers size={14} />
                <span>Draft</span>
              </button>
            </div>
          </div>

          <div className="rounded-[22px] bg-system-fill/42 p-1.5 backdrop-blur-xl self-start min-[1500px]:self-auto">
            <div className="flex items-center gap-1.5">
              {view === "draft" && hasDraft ? (
                <>
                  <a
                    href="/?preview=true"
                    target="_blank"
                    aria-label="Preview"
                    className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-[18px] text-secondary-label transition-all hover:bg-system-fill/82 hover:text-label"
                  >
                    <Eye size={16} />
                  </a>
                  <button
                    onClick={handlePublish}
                    disabled={isPending}
                    className="button-primary min-h-[42px] gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  >
                    <Rocket size={16} />
                    <span>{isPending ? "Publishing" : "Publish"}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreateDraft}
                  disabled={isPending || hasDraft}
                  className="button-primary min-h-[42px] gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  <Plus size={16} />
                  <span>{isPending ? "Starting" : hasDraft ? "Draft Ready" : "New Draft"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-[24px] px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-accent/10 text-accent">
              {view === "published" ? <CheckCircle2 size={18} /> : <Layers size={18} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-label">
                {view === "published" ? "Live version" : "Draft version"}
              </h3>
              <p className="mt-0.5 text-sm text-secondary-label">
                {view === "published"
                  ? "Visible now."
                  : `${draftDetail?.version.label}. Publish when ready.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-label">
            Content Sections ({sections.length})
          </h2>
          {view === "draft" ? (
            <span className="text-[10px] font-medium text-tertiary-label">Draft</span>
          ) : null}
        </div>

        <SectionList sections={sections} isEditable={view === "draft"} />
      </div>
    </div>
  );
}
