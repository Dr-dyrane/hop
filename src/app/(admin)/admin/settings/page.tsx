import { requireAdminSession } from "@/lib/auth/guards";
import { getAdminSettingsSnapshot } from "@/lib/db/repositories/admin-repository";

function formatSettingValue(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default async function AdminSettingsPage() {
  await requireAdminSession("/admin/settings");
  const snapshot = await getAdminSettingsSnapshot();

  return (
    <div className="space-y-8">
      <section className="glass-morphism rounded-[36px] bg-system-background/86 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Settings
        </p>
        <h2 className="text-3xl font-bold tracking-display text-label">
          Operational settings
        </h2>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Bank
          </p>
          <div className="mt-4 space-y-2 text-sm text-secondary-label">
            <div className="text-lg font-semibold text-label">
              {snapshot.bankAccount?.bankName ?? "Pending"}
            </div>
            <div>{snapshot.bankAccount?.accountName ?? "Pending"}</div>
            <div className="text-2xl font-semibold tracking-tight text-label">
              {snapshot.bankAccount?.accountNumber ?? "Pending"}
            </div>
            {snapshot.bankAccount?.instructions ? (
              <div>{snapshot.bankAccount.instructions}</div>
            ) : null}
          </div>
        </article>

        <article className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Registry
          </p>
          <div className="mt-4 grid gap-3 text-sm text-secondary-label">
            {snapshot.siteSettings.map((setting) => (
              <div
                key={setting.key}
                className="rounded-[24px] bg-system-fill/70 p-4"
              >
                <div className="text-[11px] font-semibold uppercase tracking-headline text-label">
                  {setting.key}
                </div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-secondary-label">
                  {formatSettingValue(setting.value)}
                </pre>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
