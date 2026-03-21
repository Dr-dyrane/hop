import { requireAdminSession } from "@/lib/auth/guards";
import { getAdminDeliveryBoardSnapshot } from "@/lib/db/repositories/delivery-repository";
import { buildAdminDeliveryLiveSnapshot } from "@/lib/delivery/snapshot";
import { createSseResponse } from "@/lib/realtime/sse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireAdminSession("/admin/delivery");

  return createSseResponse({
    request,
    event: "delivery-live",
    intervalMs: 10000,
    load: async () => {
      const snapshot = await getAdminDeliveryBoardSnapshot({
        actorEmail: session.email,
      });
      return await buildAdminDeliveryLiveSnapshot(snapshot);
    },
  });
}
