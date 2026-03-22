import { notFound } from "next/navigation";
import { Eye, Layers3, Link2 } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { SectionEditorForm } from "@/components/admin/layout/SectionEditorForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { getLayoutDraftSectionDetail } from "@/lib/db/repositories/layout-repository";

export default async function AdminSectionEditPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const section = await getLayoutDraftSectionDetail(sectionId);

  if (!section) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <div className="space-y-3 md:hidden">
        <section className="rounded-[24px] bg-system-fill/40 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                Section
              </div>
              <div className="mt-1 truncate text-lg font-semibold tracking-tight text-label">
                {section.heading || section.sectionKey}
              </div>
              <div className="mt-1 text-sm text-secondary-label">
                {section.sectionType}
              </div>
            </div>
            <div className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-label">
              {section.isEnabled ? "Shown" : "Hidden"}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <CompactSectionStat label="Views" value={`${section.presentationCount}`} />
            <CompactSectionStat label="Links" value={`${section.bindingCount}`} />
            <CompactSectionStat label="Sort" value={`${section.sortOrder}`} />
          </div>
        </section>
      </div>

      <div className="hidden md:block">
        <WorkspaceContextPanel
          title={section.heading || section.sectionKey}
          detail="Edit copy, toggle live."
          tags={[
            { label: "Draft", tone: "muted" },
            { label: section.sectionType, tone: "muted" },
          ]}
        />
      </div>

      <div className="hidden md:block">
        <MetricRail
          items={[
            {
              label: "Viewports",
              value: `${section.presentationCount}`,
              detail: "Presentation slots",
              icon: Layers3,
            },
            {
              label: "Bindings",
              value: `${section.bindingCount}`,
              detail: "Connected entities",
              icon: Link2,
            },
            {
              label: "Visibility",
              value: section.isEnabled ? "On" : "Off",
              detail: section.isEnabled ? "Shown" : "Hidden",
              icon: Eye,
              tone: section.isEnabled ? "success" : "default",
            },
          ]}
          columns={3}
        />
      </div>

      <SectionEditorForm section={section} />
    </div>
  );
}

function CompactSectionStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[color:var(--surface)]/88 px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-label">{value}</div>
    </div>
  );
}
