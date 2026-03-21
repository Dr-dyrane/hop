import { NextResponse } from "next/server";
import { getGuestTrackingSnapshot } from "@/lib/db/repositories/delivery-repository";
import { verifyGuestOrderAccessToken } from "@/lib/orders/access";

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

  const snapshot = await getGuestTrackingSnapshot(orderId);

  if (!snapshot) {
    return NextResponse.json(
      {
        ok: false,
        error: "Tracking not found.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: snapshot,
    },
    { status: 200 }
  );
}
