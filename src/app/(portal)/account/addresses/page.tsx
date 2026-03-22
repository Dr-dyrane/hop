import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listPortalAddresses } from "@/lib/db/repositories/account-repository";
import { AddressBook } from "@/components/account/AddressBook";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";

export default async function AddressesPage() {
  const session = await requireAuthenticatedSession("/account/addresses");
  const addresses = await listPortalAddresses(session.email);

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <div className="rounded-[24px] bg-[color:var(--surface)]/88 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:hidden">
        <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Addresses
        </div>
        <div className="mt-2 text-lg font-semibold tracking-tight text-label">Places</div>
        <div className="mt-1 text-sm text-secondary-label">{addresses.length} saved</div>
      </div>

      <div className="hidden md:block">
        <WorkspaceContextPanel
          title="Places"
          detail={`${addresses.length} saved`}
          tags={[{ label: `${addresses.length}`, tone: "muted" }]}
        />
      </div>

      <AddressBook addresses={addresses} />
    </div>
  );
}
