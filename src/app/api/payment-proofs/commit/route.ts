import { NextResponse } from "next/server";
import { createPaymentProof } from "@/lib/db/repositories/orders-repository";
import { resolveOrderProofAccess } from "@/lib/orders/proof-access";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: string;
    paymentId?: string;
    accessToken?: string;
    storageKey?: string;
    publicUrl?: string | null;
    mimeType?: string;
  };

  const orderId = body.orderId?.trim();
  const paymentId = body.paymentId?.trim();
  const storageKey = body.storageKey?.trim();
  const mimeType = body.mimeType?.trim() || "application/octet-stream";

  if (!orderId || !paymentId || !storageKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing proof reference.",
      },
      { status: 400 }
    );
  }

  const access = await resolveOrderProofAccess({
    orderId,
    accessToken: body.accessToken,
  });

  if (!access || access.order.paymentId !== paymentId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Order access is not valid.",
      },
      { status: 403 }
    );
  }

  await createPaymentProof(
    paymentId,
    storageKey,
    body.publicUrl?.trim() || null,
    mimeType,
    access.mode === "session" ? access.sessionEmail : access.order.customerEmail
  );

  return NextResponse.json(
    {
      ok: true,
      data: {
        paymentId,
      },
    },
    { status: 200 }
  );
}
