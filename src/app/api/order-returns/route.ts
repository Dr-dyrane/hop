import { NextResponse } from "next/server";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import { requestOrderReturn } from "@/lib/db/repositories/order-returns-repository";
import { resolveOrderProofAccess } from "@/lib/orders/proof-access";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: string;
    accessToken?: string;
    reason?: string;
    details?: string;
    items?: Array<{
      orderItemId?: string;
      quantity?: number;
    }>;
    refundBankName?: string;
    refundAccountName?: string;
    refundAccountNumber?: string;
  };

  const orderId = body.orderId?.trim();
  const reason = body.reason?.trim();
  const details = body.details?.trim() || null;

  if (!orderId || !reason) {
    return NextResponse.json(
      {
        ok: false,
        error: "Return details are incomplete.",
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

  try {
    const actor =
      access.mode === "session"
        ? await ensureUserByEmail(access.sessionEmail)
        : null;

    const returnCaseId = await requestOrderReturn({
      orderId,
      reason,
      details,
      items: body.items?.map((item) => ({
        orderItemId: item.orderItemId?.trim() ?? "",
        quantity: Number(item.quantity ?? 0),
      })),
      refundBankName: body.refundBankName?.trim() || null,
      refundAccountName: body.refundAccountName?.trim() || null,
      refundAccountNumber: body.refundAccountNumber?.trim() || null,
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
        data: {
          returnCaseId,
        },
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
