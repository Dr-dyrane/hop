import "server-only";

import { createOrderFromCart } from "@/lib/db/repositories/cart-repository";
import { createGuestOrderAccessToken } from "@/lib/orders/access";
import { normalizePhoneToE164 } from "@/lib/phone";

export type CheckoutPayload = {
  cartId: string;
  userId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryLocation: string;
  notes: string | null;
};

export function validateCheckoutPayload(payload: Omit<CheckoutPayload, "customerPhone"> & {
  customerPhone: string;
}) {
  const customerName = payload.customerName.trim();
  const deliveryLocation = payload.deliveryLocation.trim();
  const customerEmail = payload.customerEmail?.trim().toLowerCase() || null;
  const notes = payload.notes?.trim() || null;
  const customerPhoneE164 = normalizePhoneToE164(payload.customerPhone);

  if (customerName.length < 2) {
    throw new Error("Enter a name.");
  }

  if (!customerPhoneE164) {
    throw new Error("Enter a valid phone number.");
  }

  if (deliveryLocation.length < 3) {
    throw new Error("Enter a delivery location.");
  }

  return {
    cartId: payload.cartId,
    userId: payload.userId,
    customerName,
    customerEmail,
    customerPhoneE164,
    deliveryLocation,
    notes,
  };
}

export async function createCheckoutOrder(payload: CheckoutPayload) {
  const validated = validateCheckoutPayload(payload);
  const createdOrder = await createOrderFromCart(validated);
  const guestAccessToken = validated.userId
    ? null
    : createGuestOrderAccessToken(createdOrder.orderId);

  return {
    ...createdOrder,
    guestAccessToken,
  };
}
