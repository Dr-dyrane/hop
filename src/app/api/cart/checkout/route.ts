import { NextResponse } from "next/server";
import {
  createFreshCartCookiePayload,
  getCurrentCartContext,
} from "@/lib/cart/server-context";
import { createCheckoutOrder } from "@/lib/checkout/service";

function resolveCheckoutStatus(message: string) {
  if (message === "Cart is empty." || message === "Cart is no longer active.") {
    return 409;
  }

  if (message === "Cart expired." || message === "Cart is unavailable.") {
    return 410;
  }

  return 400;
}

export async function POST(request: Request) {
  const context = await getCurrentCartContext();

  if (!context) {
    return NextResponse.json(
      {
        ok: false,
        error: "Checkout is unavailable.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      deliveryLocation?: string;
      notes?: string;
    };

    const created = await createCheckoutOrder({
      cartId: context.cartId,
      userId: context.user?.userId ?? null,
      customerName: body.customerName ?? "",
      customerEmail: body.customerEmail ?? context.session?.email ?? null,
      customerPhone: body.customerPhone ?? "",
      deliveryLocation: body.deliveryLocation ?? "",
      notes: body.notes ?? null,
    });

    const redirectTo = created.guestAccessToken
      ? `/checkout/orders/${created.orderId}?access=${encodeURIComponent(created.guestAccessToken)}`
      : `/account/orders/${created.orderId}`;
    const nextCartCookie = await createFreshCartCookiePayload(
      context.user?.userId ?? null
    );

    const response = NextResponse.json(
      {
        ok: true,
        data: {
          redirectTo,
          orderId: created.orderId,
          orderNumber: created.orderNumber,
        },
      },
      { status: 200 }
    );

    if (nextCartCookie) {
      response.cookies.set(
        nextCartCookie.cookieName,
        nextCartCookie.cookieValue,
        nextCartCookie.cookieOptions
      );
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to place order.";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: resolveCheckoutStatus(message) }
    );
  }
}
