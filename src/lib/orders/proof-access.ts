import "server-only";

import { getCurrentSession } from "@/lib/auth/session";
import {
  getGuestOrderDetail,
  getPortalOrderDetail,
} from "@/lib/db/repositories/orders-repository";
import { verifyGuestOrderAccessToken } from "@/lib/orders/access";

export async function resolveOrderProofAccess(params: {
  orderId: string;
  accessToken?: string | null;
}) {
  if (params.accessToken) {
    if (!verifyGuestOrderAccessToken(params.accessToken, params.orderId)) {
      return null;
    }

    const order = await getGuestOrderDetail(params.orderId);

    if (!order) {
      return null;
    }

    return {
      mode: "guest" as const,
      sessionEmail: null,
      order,
    };
  }

  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  const order = await getPortalOrderDetail(session.email, params.orderId);

  if (!order) {
    return null;
  }

  return {
    mode: "session" as const,
    sessionEmail: session.email,
    order,
  };
}
