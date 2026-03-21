import { notFound } from "next/navigation";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { getPortalTrackingSnapshot } from "@/lib/db/repositories/delivery-repository";
import { PortalTrackingExperience } from "@/components/delivery/PortalTrackingExperience";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await requireAuthenticatedSession(`/account/tracking/${orderId}`);
  const snapshot = await getPortalTrackingSnapshot(session.email, orderId);

  if (!snapshot) {
    notFound();
  }

  return (
    <PortalTrackingExperience
      initialSnapshot={snapshot}
      pollUrl={`/api/account/tracking/${orderId}`}
      streamUrl={`/api/account/tracking/${orderId}/stream`}
      backHref={`/account/orders/${orderId}`}
    />
  );
}
