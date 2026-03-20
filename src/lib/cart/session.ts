import "server-only";

import { AUTH_SESSION_TTL_SECONDS } from "@/lib/auth/constants";
import { createSignedToken, readSignedToken } from "@/lib/auth/tokens";

export const CART_COOKIE_NAME = "hop_cart";
const CART_TTL_SECONDS = AUTH_SESSION_TTL_SECONDS;

type CartCookiePayload = {
  cartId: string;
  issuedAt: string;
  expiresAt: string;
};

function hasExpired(isoDate: string) {
  return new Date(isoDate).getTime() <= Date.now();
}

export function createCartCookieValue(cartId: string) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + CART_TTL_SECONDS * 1000);

  return createSignedToken({
    cartId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } satisfies CartCookiePayload);
}

export function readCartIdFromCookieValue(value: string | undefined) {
  const payload = readSignedToken<CartCookiePayload>(value);

  if (!payload || hasExpired(payload.expiresAt)) {
    return null;
  }

  return payload.cartId;
}

export function getCartCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: CART_TTL_SECONDS,
  };
}
