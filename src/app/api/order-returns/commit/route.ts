import { NextResponse } from "next/server";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import {
  createOrderReturnProof,
  getLatestOrderReturnCase,
} from "@/lib/db/repositories/order-returns-repository";
import { sendOrderReturnProofSubmittedNotifications } from "@/lib/email/orders";
import { resolveOrderProofAccess } from "@/lib/orders/proof-access";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      returnCaseId?: string;
      accessToken?: string;
      storageKey?: string;
      publicUrl?: string | null;
      mimeType?: string;
    };

    const orderId = body.orderId?.trim();
    const returnCaseId = body.returnCaseId?.trim();
    const storageKey = body.storageKey?.trim();
    const mimeType = body.mimeType?.trim() || "application/octet-stream";

    if (!orderId || !returnCaseId || !storageKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing upload reference.",
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
      access.mode === "guest"
        ? { role: "customer" as const, guestOrderId: orderId }
        : { role: "customer" as const, email: access.sessionEmail };
    const returnCase = await getLatestOrderReturnCase(orderId, actor);

    if (!returnCase || returnCase.returnCaseId !== returnCaseId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Return case is not valid.",
        },
        { status: 403 }
      );
    }

    const matchedUser =
      access.mode === "session" ? await ensureUserByEmail(access.sessionEmail) : null;

    await createOrderReturnProof({
      returnCaseId,
      storageKey,
      publicUrl: body.publicUrl?.trim() || null,
      mimeType,
      submittedByEmail:
        access.mode === "session"
          ? access.sessionEmail
          : access.order.customerEmail,
      actorUserId: matchedUser?.userId ?? null,
      guestOrderId: access.mode === "guest" ? orderId : null,
    });

    await sendOrderReturnProofSubmittedNotifications({
      orderId,
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
      { status: 500 }
    );
  }
}
