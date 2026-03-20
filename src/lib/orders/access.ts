import "server-only";

import { createSignedToken, readSignedToken } from "@/lib/auth/tokens";

const GUEST_ORDER_ACCESS_TTL_DAYS = 30;

type GuestOrderAccessPayload = {
  scope: "guest_order_access";
  orderId: string;
  issuedAt: string;
  expiresAt: string;
};

function hasExpired(isoDate: string) {
  return new Date(isoDate).getTime() <= Date.now();
}

export function createGuestOrderAccessToken(orderId: string) {
  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + GUEST_ORDER_ACCESS_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  return createSignedToken({
    scope: "guest_order_access",
    orderId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } satisfies GuestOrderAccessPayload);
}

export function verifyGuestOrderAccessToken(
  token: string | undefined,
  orderId: string
) {
  const payload = readSignedToken<GuestOrderAccessPayload>(token);

  if (
    !payload ||
    payload.scope !== "guest_order_access" ||
    payload.orderId !== orderId ||
    hasExpired(payload.expiresAt)
  ) {
    return null;
  }

  return payload;
}
