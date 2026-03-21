import { NextResponse } from "next/server";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import { submitOrderReview } from "@/lib/db/repositories/review-repository";
import { resolveOrderProofAccess } from "@/lib/orders/proof-access";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      accessToken?: string;
      rating?: number;
      title?: string;
      body?: string;
    };

    const orderId = body.orderId?.trim();
    const rating = Number(body.rating);

    if (!orderId || !Number.isFinite(rating)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Review details are incomplete.",
        },
        { status: 400 }
      );
    }

    const access = await resolveOrderProofAccess({
      orderId,
      accessToken: body.accessToken,
    });

    if (!access) {
      return NextResponse.json(
        {
          ok: false,
          error: "Order access is not valid.",
        },
        { status: 403 }
      );
    }

    const actor =
      access.mode === "session"
        ? await ensureUserByEmail(access.sessionEmail)
        : null;

    await submitOrderReview({
      orderId,
      rating,
      title: body.title?.trim() || null,
      body: body.body?.trim() || null,
      actorEmail:
        access.mode === "session"
          ? access.sessionEmail
          : access.order.customerEmail,
      actorUserId: actor?.userId ?? null,
      guestOrderId: access.mode === "guest" ? orderId : null,
    });

    return NextResponse.json(
      {
        ok: true,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Try again.",
      },
      { status: 400 }
    );
  }
}
