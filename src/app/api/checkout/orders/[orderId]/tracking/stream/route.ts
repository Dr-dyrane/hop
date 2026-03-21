import { NextResponse } from "next/server";
import { getGuestTrackingSnapshot } from "@/lib/db/repositories/delivery-repository";
import { verifyGuestOrderAccessToken } from "@/lib/orders/access";
import { createSseResponse } from "@/lib/realtime/sse";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const accessToken = new URL(request.url).searchParams.get("access") ?? undefined;

  if (!verifyGuestOrderAccessToken(accessToken, orderId)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Tracking not found.",
      },
      { status: 404 }
    );
  }

  const initialSnapshot = await getGuestTrackingSnapshot(orderId);

  if (!initialSnapshot) {
    return NextResponse.json(
      {
        ok: false,
        error: "Tracking not found.",
      },
      { status: 404 }
    );
  }

  return createSseResponse({
    request,
    event: "tracking",
    intervalMs: 10000,
    load: async () => {
      const snapshot = await getGuestTrackingSnapshot(orderId);

      if (!snapshot) {
        throw new Error("Tracking not found.");
      }

      return snapshot;
    },
  });
}
