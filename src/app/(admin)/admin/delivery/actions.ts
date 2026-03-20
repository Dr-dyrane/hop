"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  assignRiderToOrder,
  createOrUpdateRider,
  markOrderReadyForDispatch,
  updateDeliveryAssignmentStatus,
} from "@/lib/db/repositories/delivery-repository";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";

async function getAdminActor(returnTo: string) {
  const session = await requireAdminSession(returnTo);
  const user = await ensureUserByEmail(session.email);

  return {
    userId: user?.userId ?? null,
    email: session.email,
  };
}

function normalizeOptionalNote(value: FormDataEntryValue | null) {
  const note = value?.toString().trim() || null;
  return note;
}

function revalidateDeliverySurfaces(orderId?: string | null) {
  revalidatePath("/admin/delivery");

  if (orderId) {
    revalidatePath(`/admin/orders/${orderId}`);
  }
}

export async function createRiderAction(formData: FormData) {
  await getAdminActor("/admin/delivery");

  await createOrUpdateRider({
    name: formData.get("name")?.toString() ?? "",
    phoneNumber: formData.get("phoneNumber")?.toString() ?? "",
    vehicleType: formData.get("vehicleType")?.toString() ?? null,
  });

  revalidateDeliverySurfaces();
}

export async function markReadyAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();

  if (!orderId) {
    throw new Error("Order is required.");
  }

  const actor = await getAdminActor(`/admin/delivery`);

  await markOrderReadyForDispatch({
    orderId,
    actorUserId: actor.userId,
    actorEmail: actor.email,
    note: normalizeOptionalNote(formData.get("note")),
  });

  revalidateDeliverySurfaces(orderId);
}

export async function assignRiderAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const riderId = formData.get("riderId")?.toString();

  if (!orderId || !riderId) {
    throw new Error("Order and rider are required.");
  }

  const actor = await getAdminActor(`/admin/delivery`);

  await assignRiderToOrder({
    orderId,
    riderId,
    actorUserId: actor.userId,
    actorEmail: actor.email,
    note: normalizeOptionalNote(formData.get("note")),
  });

  revalidateDeliverySurfaces(orderId);
}

export async function updateAssignmentStatusAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const assignmentId = formData.get("assignmentId")?.toString();
  const nextStatus = formData.get("nextStatus")?.toString();

  if (!orderId || !assignmentId || !nextStatus) {
    throw new Error("Assignment update is incomplete.");
  }

  const actor = await getAdminActor(`/admin/delivery`);

  await updateDeliveryAssignmentStatus({
    assignmentId,
    nextStatus,
    actorUserId: actor.userId,
    actorEmail: actor.email,
    note: normalizeOptionalNote(formData.get("note")),
  });

  revalidateDeliverySurfaces(orderId);
}
