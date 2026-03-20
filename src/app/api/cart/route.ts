import { NextResponse } from "next/server";
import type { CartSnapshot } from "@/lib/db/types";
import { getCurrentCartContext } from "@/lib/cart/server-context";
import {
  clearCart,
  getCartSnapshot,
  replaceCartItems,
} from "@/lib/db/repositories/cart-repository";

function buildEmptySnapshot(cartId: string) {
  return {
    cartId,
    itemCount: 0,
    items: [],
  } satisfies CartSnapshot;
}

function withCartCookie(response: NextResponse, context: NonNullable<Awaited<ReturnType<typeof getCurrentCartContext>>>) {
  response.cookies.set(
    context.cookieName,
    context.cookieValue,
    context.cookieOptions
  );

  return response;
}

export async function GET() {
  const context = await getCurrentCartContext();

  if (!context) {
    return NextResponse.json(
      {
        ok: true,
        data: buildEmptySnapshot("unavailable"),
      },
      { status: 200 }
    );
  }

  const snapshot =
    (await getCartSnapshot(context.cartId)) ?? buildEmptySnapshot(context.cartId);

  return withCartCookie(
    NextResponse.json({ ok: true, data: snapshot }, { status: 200 }),
    context
  );
}

export async function PUT(request: Request) {
  const context = await getCurrentCartContext();

  if (!context) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cart is unavailable.",
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as {
    items?: Array<{ productId?: string; quantity?: number }>;
  };

  await replaceCartItems(
    context.cartId,
    (body.items ?? []).flatMap((item) =>
      item.productId && typeof item.quantity === "number"
        ? [{ productId: item.productId, quantity: item.quantity }]
        : []
    )
  );

  const snapshot =
    (await getCartSnapshot(context.cartId)) ?? buildEmptySnapshot(context.cartId);

  return withCartCookie(
    NextResponse.json({ ok: true, data: snapshot }, { status: 200 }),
    context
  );
}

export async function DELETE() {
  const context = await getCurrentCartContext();

  if (!context) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cart is unavailable.",
      },
      { status: 503 }
    );
  }

  await clearCart(context.cartId);
  const snapshot = buildEmptySnapshot(context.cartId);

  return withCartCookie(
    NextResponse.json({ ok: true, data: snapshot }, { status: 200 }),
    context
  );
}
