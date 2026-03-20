import { NextResponse } from "next/server";
import type { CartSnapshot } from "@/lib/db/types";
import { getCurrentCartContext } from "@/lib/cart/server-context";
import {
  addCartItem,
  getCartSnapshot,
  removeCartItem,
  setCartItemQuantity,
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

async function buildSnapshotResponse(context: NonNullable<Awaited<ReturnType<typeof getCurrentCartContext>>>) {
  const snapshot =
    (await getCartSnapshot(context.cartId)) ?? buildEmptySnapshot(context.cartId);

  return withCartCookie(
    NextResponse.json({ ok: true, data: snapshot }, { status: 200 }),
    context
  );
}

export async function POST(request: Request) {
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

  try {
    const body = (await request.json()) as {
      productId?: string;
      quantity?: number;
    };

    if (!body.productId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Product is required.",
        },
        { status: 400 }
      );
    }

    await addCartItem(context.cartId, body.productId, body.quantity ?? 1);
    return buildSnapshotResponse(context);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to update cart.",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
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

  try {
    const body = (await request.json()) as {
      productId?: string;
      quantity?: number;
    };

    if (!body.productId || typeof body.quantity !== "number") {
      return NextResponse.json(
        {
          ok: false,
          error: "Product and quantity are required.",
        },
        { status: 400 }
      );
    }

    await setCartItemQuantity(context.cartId, body.productId, body.quantity);
    return buildSnapshotResponse(context);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unable to update cart.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
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
    productId?: string;
  };

  if (!body.productId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Product is required.",
      },
      { status: 400 }
    );
  }

  await removeCartItem(context.cartId, body.productId);
  return buildSnapshotResponse(context);
}
