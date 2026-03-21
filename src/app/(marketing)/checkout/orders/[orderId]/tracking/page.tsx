import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalTrackingExperience } from "@/components/delivery/PortalTrackingExperience";
import { getGuestTrackingSnapshot } from "@/lib/db/repositories/delivery-repository";
import { verifyGuestOrderAccessToken } from "@/lib/orders/access";

export default async function GuestTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const [{ orderId }, { access: accessToken }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!verifyGuestOrderAccessToken(accessToken, orderId)) {
    return (
      <main className="mx-auto min-h-[100svh] w-full max-w-[840px] px-4 pb-16 pt-24 sm:px-6">
        <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
          Link expired.
          <div className="mt-4">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const snapshot = await getGuestTrackingSnapshot(orderId);

  if (!snapshot) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-[100svh] w-full max-w-[840px] px-4 pb-16 pt-24 sm:px-6">
      <PortalTrackingExperience
        initialSnapshot={snapshot}
        pollUrl={`/api/checkout/orders/${orderId}/tracking?access=${encodeURIComponent(accessToken ?? "")}`}
        streamUrl={`/api/checkout/orders/${orderId}/tracking/stream?access=${encodeURIComponent(accessToken ?? "")}`}
        backHref={`/checkout/orders/${orderId}?access=${encodeURIComponent(accessToken ?? "")}`}
      />
    </main>
  );
}
