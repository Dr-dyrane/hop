"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Mail, Shield, UserRound } from "lucide-react";
import { useOverlayPresence } from "@/components/providers/UIProvider";
import type { AdminUserSummary } from "@/lib/db/types";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  resendAdminUserInviteAction,
  updateAdminUserAction,
} from "@/app/(admin)/admin/settings/team/actions";
import { cn } from "@/lib/utils";

type TeamScope = "all" | "admins" | "invited" | "suspended";

function parseTeamScope(value: string | null): TeamScope | null {
  if (value === "all" || value === "admins" || value === "invited" || value === "suspended") {
    return value;
  }

  return null;
}

export function AdminTeamManager({ users }: { users: AdminUserSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [sheetMode, setSheetMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const scope = parseTeamScope(searchParams.get("scope")) ?? "all";
  useOverlayPresence("admin-team-manager", sheetMode !== null);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (scope === "admins" && !user.isAdmin) {
        return false;
      }

      if (scope === "invited" && user.status !== "invited") {
        return false;
      }

      if (scope === "suspended" && user.status !== "suspended") {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [user.email, user.fullName ?? "", user.phone ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [normalizedQuery, scope, users]);

  const selectedUser =
    filteredUsers.find((user) => user.userId === editingUserId) ?? filteredUsers[0] ?? null;

  return (
    <>
      <section className="space-y-4">
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          scope={scope}
          onScopeChange={(nextScope) => {
            const nextParams = new URLSearchParams(searchParams.toString());

            if (nextScope === "all") {
              nextParams.delete("scope");
            } else {
              nextParams.set("scope", nextScope);
            }

            const queryString = nextParams.toString();
            router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
              scroll: false,
            });
          }}
          total={filteredUsers.length}
          onCreate={() => setSheetMode("create")}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.86fr)_minmax(320px,0.72fr)]">
          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const selected = selectedUser?.userId === user.userId;

              return (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => {
                    setEditingUserId(user.userId);
                    setSheetMode("edit");
                  }}
                  className={cn(
                    "glass-morphism w-full rounded-[30px] bg-[color:var(--surface)]/88 p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-colors duration-200 md:p-5",
                    selected && "bg-accent text-accent-label"
                  )}

                  style={
                    {
                      background: selected ? 'slate' : ''
                    }
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/52",
                            selected && "bg-[color:var(--surface)]/56"
                          )}
                        >
                          {user.isAdmin ? (
                            <Shield className="h-5 w-5" strokeWidth={1.8} />
                          ) : (
                            <UserRound className="h-5 w-5" strokeWidth={1.8} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold tracking-tight">
                            {user.fullName || user.email}
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 truncate text-sm",
                              selected ? "text-accent-label/72" : "text-secondary-label"
                            )}
                          >
                            {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatusPill
                          label={user.status}
                          selected={selected}
                        />
                        <StatusPill
                          label={user.isAdmin ? "Admin" : "Member"}
                          selected={selected}
                        />
                      </div>
                    </div>

                    <div
                      className={cn(
                        "rounded-full bg-system-fill/42 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                        selected ? "bg-[color:var(--surface)]/56 text-accent-label" : "text-secondary-label"
                      )}
                    >
                      {user.orderCount} orders
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredUsers.length === 0 ? (
              <div className="glass-morphism rounded-[30px] bg-[color:var(--surface)]/88 p-5 text-sm text-secondary-label shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                No teammates match this view.
              </div>
            ) : null}
          </div>

          <div className="hidden xl:block">
            {selectedUser ? (
              <TeamDetailPanel
                key={selectedUser.userId}
                user={selectedUser}
              />
            ) : (
              <EmptyStatePanel
                title="No teammate selected"
                detail="Pick a teammate to review access and account status."
              />
            )}
          </div>
        </div>
      </section>

      {sheetMode === "create" ? (
        <TeamSheet title="Invite teammate" onClose={() => setSheetMode(null)}>
          <TeamCreateForm onComplete={() => setSheetMode(null)} />
        </TeamSheet>
      ) : null}

      {sheetMode === "edit" && selectedUser ? (
        <TeamSheet title="Team member" onClose={() => setSheetMode(null)}>
          <TeamDetailPanel
            key={selectedUser.userId}
            user={selectedUser}
            compact
            onClose={() => setSheetMode(null)}
          />
        </TeamSheet>
      ) : null}
    </>
  );
}

function FilterBar({
  query,
  onQueryChange,
  scope,
  onScopeChange,
  total,
  onCreate,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  scope: TeamScope;
  onScopeChange: (value: TeamScope) => void;
  total: number;
  onCreate: () => void;
}) {
  return (
    <div className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="grid gap-2">
          <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            Search
          </span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Email or name"
            className="min-h-[48px] rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
          />
        </label>

        <div className="flex flex-wrap items-end gap-2">
          {[
            { label: "All", value: "all" as const },
            { label: "Admins", value: "admins" as const },
            { label: "Invited", value: "invited" as const },
            { label: "Suspended", value: "suspended" as const },
          ].map((option) => {
            const active = option.value === scope;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onScopeChange(option.value)}
                className={cn(
                  "min-h-[40px] rounded-full px-4 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200",
                  active
                    ? "bg-accent text-accent-label"
                    : "bg-system-fill/42 text-secondary-label hover:text-label"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-end justify-between gap-2 xl:justify-end">
          <span className="rounded-full bg-system-fill/42 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            {total}
          </span>
          <button
            type="button"
            onClick={onCreate}
            className="button-primary min-h-[42px] rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            Invite
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamCreateForm({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          const result = await createAdminUserAction(formData);

          if (!result.success) {
            setMessage(result.error || "Unable to create teammate.");
            return;
          }

          form.reset();
          setMessage(result.message || "Created.");
          router.refresh();
          onComplete();
        });
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" required />
        <Field label="Name" name="fullName" />
        <Field label="Phone" name="phone" />
        <SelectField
          label="Status"
          name="status"
          defaultValue="invited"
          options={[
            { label: "Invited", value: "invited" },
            { label: "Active", value: "active" },
            { label: "Suspended", value: "suspended" },
          ]}
        />
        <SelectField
          label="Role"
          name="isAdmin"
          defaultValue="false"
          options={[
            { label: "Member", value: "false" },
            { label: "Admin", value: "true" },
          ]}
          className="sm:col-span-2"
        />
      </div>

      <InlineStatus message={message ?? "Invite by email or add a live teammate directly."} />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "button-primary min-h-[42px] rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
            isPending && "pointer-events-none opacity-50"
          )}
        >
          {isPending ? "Saving" : "Invite"}
        </button>
      </div>
    </form>
  );
}

function TeamDetailPanel({
  user,
  compact = false,
  onClose,
}: {
  user: AdminUserSummary;
  compact?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const inviteable = user.status === "invited";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        formData.set("userId", user.userId);

        startTransition(async () => {
          const result = await updateAdminUserAction(formData);

          if (!result.success) {
            setMessage(result.error || "Unable to save teammate.");
            return;
          }

          setMessage("Saved.");
          router.refresh();
          onClose?.();
        });
      }}
      className={cn(
        "glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6",
        compact && "shadow-none"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            Team member
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-label">
            {user.fullName || user.email}
          </h2>
          <p className="mt-1 text-sm text-secondary-label">{user.email}</p>
        </div>

        {compact && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-full bg-system-fill/42 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricPill label="Orders" value={`${user.orderCount}`} />
        <MetricPill label="Places" value={`${user.addressCount}`} />
        <MetricPill
          label="Last seen"
          value={user.lastSignedInAt ? formatTimestamp(user.lastSignedInAt) : "Never"}
        />
        <MetricPill label="Joined" value={formatTimestamp(user.createdAt)} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="fullName" defaultValue={user.fullName ?? ""} />
        <Field label="Phone" name="phone" defaultValue={user.phone ?? ""} />
        <SelectField
          label="Status"
          name="status"
          defaultValue={user.status}
          options={[
            { label: "Active", value: "active" },
            { label: "Invited", value: "invited" },
            { label: "Suspended", value: "suspended" },
          ]}
        />
        <SelectField
          label="Role"
          name="isAdmin"
          defaultValue={user.isAdmin ? "true" : "false"}
          options={[
            { label: "Member", value: "false" },
            { label: "Admin", value: "true" },
          ]}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {inviteable ? (
          <ActionButton
            label="Resend invite"
            pending={isPending}
            onClick={() =>
              startTransition(async () => {
                setMessage(null);
                const result = await resendAdminUserInviteAction(user.userId);

                if (!result.success) {
                  setMessage(result.error || "Unable to send invite.");
                  return;
                }

                setMessage(result.message || "Invite sent.");
              })
            }
            icon={<Mail className="h-4 w-4" strokeWidth={1.8} />}
          />
        ) : null}
        <ActionButton
          label="Delete"
          pending={isPending}
          onClick={() =>
            startTransition(async () => {
              setMessage(null);
              const result = await deleteAdminUserAction(user.userId);

              if (!result.success) {
                setMessage(result.error || "Unable to delete teammate.");
                return;
              }

              router.refresh();
              onClose?.();
            })
          }
          danger
        />
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "button-primary ml-auto min-h-[42px] rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
            isPending && "pointer-events-none opacity-50"
          )}
        >
          {isPending ? "Saving" : "Save"}
        </button>
      </div>

      <InlineStatus
        message={
          message ??
          (inviteable
            ? "Invite pending."
            : user.status === "suspended"
              ? "Access is paused."
              : "Ready.")
        }
        className="mt-4"
      />
    </form>
  );
}

function TeamSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="z-layer-modal-backdrop fixed inset-0 bg-black/40 backdrop-blur-md"
      />
      <div className="z-layer-modal fixed inset-0 flex items-end justify-center px-3 py-3 sm:items-center sm:px-4 sm:py-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="glass-morphism flex max-h-[calc(100svh-1.5rem)] w-full max-w-[40rem] flex-col overflow-hidden rounded-[32px] bg-[color:var(--surface)]/92 shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                Settings
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-label">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-full bg-system-fill/42 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
            >
              Close
            </button>
          </div>
          <div className="overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
        </section>
      </div>
    </>
  );
}

function EmptyStatePanel({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-6 text-sm text-secondary-label shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="text-lg font-semibold tracking-tight text-label">{title}</div>
      <div className="mt-2 leading-relaxed">{detail}</div>
    </div>
  );
}

function StatusPill({
  label,
  selected,
}: {
  label: string;
  selected?: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
        selected
          ? "bg-[color:var(--surface)]/56 text-accent-label"
          : "bg-system-fill/42 text-secondary-label"
      )}
    >
      {label}
    </span>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}

function InlineStatus({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-[20px] bg-system-fill/42 px-4 py-3 text-sm text-secondary-label",
        className
      )}
    >
      {message}
    </p>
  );
}

function ActionButton({
  label,
  pending,
  onClick,
  danger = false,
  icon,
}: {
  label: string;
  pending: boolean;
  onClick: () => void;
  danger?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "min-h-[42px] rounded-full bg-system-fill/56 px-4 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 hover:bg-system-fill/76 inline-flex items-center gap-2",
        danger ? "text-red-500" : "text-label",
        pending && "pointer-events-none opacity-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
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

function SelectField({
  label,
  options,
  className,
  ...props
}: {
  label: string;
  options: { label: string; value: string }[];
  className?: string;
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

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
