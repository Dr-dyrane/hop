import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { getPortalProfile } from "@/lib/db/repositories/account-repository";
import { PortalProfileForm } from "@/components/account/PortalProfileForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";

export default async function ProfilePage() {
  const session = await requireAuthenticatedSession("/account/profile");
  const profile = await getPortalProfile(session.email);

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <div className="rounded-[24px] bg-[color:var(--surface)]/88 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:hidden">
        <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Profile
        </div>
        <div className="mt-2 text-lg font-semibold tracking-tight text-label">
          {profile.fullName || "You"}
        </div>
        <div className="mt-1 text-sm text-secondary-label">{profile.email}</div>
      </div>

      <div className="hidden md:block">
        <WorkspaceContextPanel
          title={profile.fullName || "You"}
          detail={profile.email}
          tags={[{ label: "Profile", tone: "muted" }]}
        />
      </div>

      <div className="max-w-5xl">
        <PortalProfileForm profile={profile} />
      </div>
    </div>
  );
}
