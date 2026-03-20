import "server-only";

import { cookies } from "next/headers";
import { getCurrentSession } from "@/lib/auth/session";
import { serverEnv } from "@/lib/config/server";
import { getOrCreateCartContext } from "@/lib/db/repositories/cart-repository";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import {
  CART_COOKIE_NAME,
  createCartCookieValue,
  getCartCookieOptions,
  readCartIdFromCookieValue,
} from "@/lib/cart/session";

export async function getCurrentCartContext() {
  const cookieStore = await cookies();
  const currentCartId = readCartIdFromCookieValue(
    cookieStore.get(CART_COOKIE_NAME)?.value
  );
  const session = await getCurrentSession();
  const user = session ? await ensureUserByEmail(session.email) : null;
  const context = await getOrCreateCartContext(currentCartId, user?.userId ?? null);

  if (!context) {
    return null;
  }

  return {
    cartId: context.cartId,
    userId: context.userId,
    cookieName: CART_COOKIE_NAME,
    cookieValue: createCartCookieValue(context.cartId),
    cookieOptions: getCartCookieOptions(serverEnv.isProduction),
    session,
    user,
  };
}

export async function createFreshCartCookiePayload(userId: string | null) {
  const context = await getOrCreateCartContext(null, userId);

  if (!context) {
    return null;
  }

  return {
    cookieName: CART_COOKIE_NAME,
    cookieValue: createCartCookieValue(context.cartId),
    cookieOptions: getCartCookieOptions(serverEnv.isProduction),
  };
}
