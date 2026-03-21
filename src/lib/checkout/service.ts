import "server-only";

import { createOrderFromCart } from "@/lib/db/repositories/cart-repository";
import { serverEnv } from "@/lib/config/server";
import { sendOrderPlacedNotifications } from "@/lib/email/orders";
import { createGuestOrderAccessToken } from "@/lib/orders/access";
import { getPhoneValidationMessage, normalizePhoneToE164 } from "@/lib/phone";

export type CheckoutPayload = {
  cartId: string;
  userId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryLocation: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
};

function normalizeCoordinate(
  value: number | null,
  min: number,
  max: number,
  label: string
) {
  if (value == null) {
    return null;
  }

  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Invalid ${label}.`);
  }

  return Number(value.toFixed(6));
}

export function validateCheckoutPayload(payload: Omit<CheckoutPayload, "customerPhone"> & {
  customerPhone: string;
}) {
  const customerName = payload.customerName.trim();
  const deliveryLocation = payload.deliveryLocation.trim();
  const customerEmail = payload.customerEmail?.trim().toLowerCase() || null;
  const notes = payload.notes?.trim() || null;
  const customerPhoneE164 = normalizePhoneToE164(payload.customerPhone);
  const latitude = normalizeCoordinate(payload.latitude, -90, 90, "latitude");
  const longitude = normalizeCoordinate(payload.longitude, -180, 180, "longitude");

  if (customerName.length < 2) {
    throw new Error("Enter a name.");
  }

  if (!customerPhoneE164) {
    throw new Error(getPhoneValidationMessage());
  }

  if (deliveryLocation.length < 3) {
    throw new Error("Enter a delivery address.");
  }

  return {
    cartId: payload.cartId,
    userId: payload.userId,
    customerName,
    customerEmail,
    customerPhoneE164,
    deliveryLocation,
    notes,
    latitude,
    longitude,
  };
}

export async function createCheckoutOrder(payload: CheckoutPayload) {
  const validated = validateCheckoutPayload(payload);
  const createdOrder = await createOrderFromCart(validated);
  const guestAccessToken = validated.userId
    ? null
    : createGuestOrderAccessToken(createdOrder.orderId);
  const customerLink = guestAccessToken
    ? `${serverEnv.public.appUrl}/checkout/orders/${createdOrder.orderId}?access=${encodeURIComponent(guestAccessToken)}`
    : `${serverEnv.public.appUrl}/account/orders/${createdOrder.orderId}`;

  await sendOrderPlacedNotifications({
    orderId: createdOrder.orderId,
    customerLink: validated.customerEmail ? customerLink : null,
  });

  return {
    ...createdOrder,
    guestAccessToken,
  };
}
