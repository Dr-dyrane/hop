import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { resolveOrderProofAccess } from "@/lib/orders/proof-access";
import { createPresignedUploadUrl, getStorageBucket } from "@/lib/storage/s3";

function buildSafeFileName(name: string) {
  const trimmed = name.trim() || "proof";
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    orderId?: string;
    paymentId?: string;
    accessToken?: string;
    fileName?: string;
    contentType?: string;
  };

  const orderId = body.orderId?.trim();
  const paymentId = body.paymentId?.trim();
  const fileName = body.fileName?.trim();
  const contentType = body.contentType?.trim() || "application/octet-stream";

  if (!orderId || !paymentId || !fileName) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing upload reference.",
      },
      { status: 400 }
    );
  }

  const storageBucket = getStorageBucket();

  if (!storageBucket) {
    return NextResponse.json(
      {
        ok: false,
        error: "Storage bucket is not configured.",
      },
      { status: 503 }
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

  const safeName = buildSafeFileName(fileName);
  const key = `${storageBucket.prefix}/payment-proofs/${orderId}/${Date.now()}-${randomBytes(3).toString("hex")}-${safeName}`;
  const signed = await createPresignedUploadUrl({
    key,
    contentType,
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        uploadUrl: signed.uploadUrl,
        storageKey: key,
        publicUrl: signed.publicUrl,
        contentType,
      },
    },
    { status: 200 }
  );
}
