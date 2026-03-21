"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { PreferenceToggleRow } from "@/components/forms/PreferenceToggleRow";
import {
  updateNotificationPreferenceAction,
  updateBankAccountAction,
  updateDeliveryDefaultsAction,
  updateLayoutPreviewAction,
} from "@/app/(admin)/admin/settings/actions";
import { cn } from "@/lib/utils";
import type {
  AdminDeliveryDefaults,
  AdminLayoutPreviewSetting,
  BankAccountRow,
  WorkspaceNotificationPreference,
} from "@/lib/db/types";

export function AdminSettingsEditor({
  bankAccount,
  deliveryDefaults,
  layoutPreview,
  notificationPreference,
}: {
  bankAccount: BankAccountRow | null;
  deliveryDefaults: AdminDeliveryDefaults;
  layoutPreview: AdminLayoutPreviewSetting;
  notificationPreference: WorkspaceNotificationPreference;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <BankAccountPanel bankAccount={bankAccount} />
      <div className="space-y-4">
        <DeliveryDefaultsPanel deliveryDefaults={deliveryDefaults} />
        <NotificationPanel notificationPreference={notificationPreference} />
        <LayoutPreviewPanel layoutPreview={layoutPreview} />
      </div>
    </section>
  );
}

function BankAccountPanel({ bankAccount }: { bankAccount: BankAccountRow | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error" | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setTone(null);

    startTransition(async () => {
      const result = await updateBankAccountAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to save.");
        setTone("error");
        return;
      }

      setMessage("Saved.");
      setTone("success");
      router.refresh();
    });
  }

  return (
    <SettingsCard
      title="Bank"
      subtitle="Transfer details"
      formAction={handleSubmit}
      footer={message ?? "Active default"}
      tone={tone}
      pending={isPending}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InputGroup
          label="Bank"
          name="bankName"
          defaultValue={bankAccount?.bankName ?? ""}
          required
        />
        <InputGroup
          label="Account"
          name="accountName"
          defaultValue={bankAccount?.accountName ?? ""}
          required
        />
        <InputGroup
          label="Number"
          name="accountNumber"
          defaultValue={bankAccount?.accountNumber ?? ""}
          required
          inputMode="numeric"
        />
        <InputGroup
          label="Instructions"
          name="instructions"
          defaultValue={bankAccount?.instructions ?? ""}
          className="md:col-span-2"
        />
      </div>
    </SettingsCard>
  );
}

function DeliveryDefaultsPanel({
  deliveryDefaults,
}: {
  deliveryDefaults: AdminDeliveryDefaults;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error" | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(deliveryDefaults.trackingEnabled);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setTone(null);
    formData.set("trackingEnabled", trackingEnabled ? "true" : "false");

    startTransition(async () => {
      const result = await updateDeliveryDefaultsAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to save.");
        setTone("error");
        return;
      }

      setMessage("Saved.");
      setTone("success");
      router.refresh();
    });
  }

  return (
    <SettingsCard
      title="Delivery"
      subtitle="Defaults"
      formAction={handleSubmit}
      footer={message ?? "Current defaults"}
      tone={tone}
      pending={isPending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <PreferenceToggleRow
          label="Tracking"
          detail="Live route updates"
          value={trackingEnabled}
          onChange={setTrackingEnabled}
        />
        <InputGroup
          label="Stale Window"
          name="staleTransferWindowMinutes"
          defaultValue={`${deliveryDefaults.staleTransferWindowMinutes}`}
          type="number"
          min={5}
          max={720}
          required
        />
      </div>
    </SettingsCard>
  );
}

function LayoutPreviewPanel({
  layoutPreview,
}: {
  layoutPreview: AdminLayoutPreviewSetting;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error" | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setTone(null);

    startTransition(async () => {
      const result = await updateLayoutPreviewAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to save.");
        setTone("error");
        return;
      }

      setMessage("Saved.");
      setTone("success");
      router.refresh();
    });
  }

  return (
    <SettingsCard
      title="Preview"
      subtitle="Layout"
      formAction={handleSubmit}
      footer={message ?? "Current mode"}
      tone={tone}
      pending={isPending}
    >
      <SelectGroup
        label="Mode"
        name="mode"
        defaultValue={layoutPreview.mode}
        options={[
          { label: "Simulated", value: "simulated" },
          { label: "Draft Route", value: "draft_route" },
        ]}
      />
    </SettingsCard>
  );
}

function NotificationPanel({
  notificationPreference,
}: {
  notificationPreference: WorkspaceNotificationPreference;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error" | null>(null);
  const [workspaceEmailEnabled, setWorkspaceEmailEnabled] = useState(
    notificationPreference.workspaceEmailEnabled
  );
  const [workspaceInAppEnabled, setWorkspaceInAppEnabled] = useState(
    notificationPreference.workspaceInAppEnabled
  );
  const [workspacePushEnabled] = useState(notificationPreference.workspacePushEnabled);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setTone(null);
    formData.set("workspaceEmailEnabled", workspaceEmailEnabled ? "true" : "false");
    formData.set("workspaceInAppEnabled", workspaceInAppEnabled ? "true" : "false");
    formData.set("workspacePushEnabled", workspacePushEnabled ? "true" : "false");

    startTransition(async () => {
      const result = await updateNotificationPreferenceAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to save.");
        setTone("error");
        return;
      }

      setMessage("Saved.");
      setTone("success");
      router.refresh();
    });
  }

  return (
    <SettingsCard
      title="Notifications"
      subtitle="Operator"
      formAction={handleSubmit}
      footer={message ?? "Important milestones only"}
      tone={tone}
      pending={isPending}
    >
      <div className="grid gap-3">
        <PreferenceToggleRow
          label="Email"
          detail="Important messages"
          value={workspaceEmailEnabled}
          onChange={setWorkspaceEmailEnabled}
        />
        <PreferenceToggleRow
          label="In-app"
          detail="Notification sheet"
          value={workspaceInAppEnabled}
          onChange={setWorkspaceInAppEnabled}
        />
      </div>
    </SettingsCard>
  );
}

function SettingsCard({
  title,
  subtitle,
  children,
  formAction,
  footer,
  tone,
  pending,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  formAction: (formData: FormData) => void;
  footer: string;
  tone: "success" | "error" | null;
  pending: boolean;
}) {
  return (
    <form action={formAction} className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            {subtitle}
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-label">{title}</h2>
        </div>
      </div>

      <div className="mt-5">{children}</div>

      <div className="mt-5 flex flex-col gap-3 rounded-[24px] bg-system-fill/42 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            "rounded-[18px] bg-system-fill/32 px-3 py-2 text-xs font-medium",
            tone === "success" && "text-accent",
            tone === "error" && "text-red-500",
            !tone && "text-secondary-label"
          )}
        >
          {footer}
        </p>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "button-primary min-h-[40px] w-full min-w-[120px] gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] sm:w-auto",
            pending && "pointer-events-none opacity-50"
          )}
        >
          <Save size={14} />
          <span>{pending ? "Saving" : "Save"}</span>
        </button>
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
