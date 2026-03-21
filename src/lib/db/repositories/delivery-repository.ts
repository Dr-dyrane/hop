import "server-only";

import {
  isDatabaseConfigured,
  query,
  type DatabaseActorContext,
  withTransaction,
} from "@/lib/db/client";
import { finalizeInventoryForDeliveredOrder } from "@/lib/db/repositories/order-inventory";
import { getDeliveryDefaultsSetting } from "@/lib/db/repositories/settings-repository";
import { sendDeliveryStatusNotification } from "@/lib/email/orders";
import { readCourierAccessToken } from "@/lib/delivery/access";
import { getDeliveryRouteEstimate } from "@/lib/delivery/route-estimate";
import { getTrackingCoords } from "@/lib/delivery/tracking";
import type {
  AdminDeliveryOrder,
  AdminDeliveryRider,
  DeliveryCourierSession,
  DeliveryTimelineEvent,
  DeliveryTrackingPoint,
  PortalTrackingSnapshot,
} from "@/lib/db/types";
import { normalizePhoneToE164 } from "@/lib/phone";

const ACTIVE_ORDER_ASSIGNMENT_STATUSES = [
  "unassigned",
  "assigned",
  "picked_up",
  "out_for_delivery",
  "failed",
] as const;

const ACTIVE_RIDER_ASSIGNMENT_STATUSES = [
  "assigned",
  "picked_up",
  "out_for_delivery",
] as const;

const DELIVERY_TRANSITIONS: Record<string, readonly string[]> = {
  unassigned: ["assigned"],
  assigned: ["unassigned", "picked_up"],
  picked_up: ["assigned", "out_for_delivery"],
  out_for_delivery: ["delivered", "failed"],
  failed: ["assigned", "returned"],
  delivered: [],
  returned: [],
};

type MutableOrderState = {
  orderId: string;
  userId: string | null;
  status: string;
  fulfillmentStatus: string;
};

type DeliveryAssignmentState = {
  assignmentId: string;
  orderId: string;
  riderId: string | null;
  status: string;
};

type RiderIdentity = {
  riderId: string;
  name: string;
  phone: string;
  vehicleType: string | null;
};

type OrderStatusUpdate = {
  orderStatus: string;
  fulfillmentStatus: string;
  deliveredAt: string | null;
};

function requireDatabase() {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function buildAdminActor(email?: string | null): DatabaseActorContext | undefined {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "admin",
  };
}

function buildCustomerActor(email?: string | null): DatabaseActorContext | undefined {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "customer",
  };
}

function getOrderStatusUpdate(nextAssignmentStatus: string): OrderStatusUpdate {
  switch (nextAssignmentStatus) {
    case "unassigned":
    case "assigned":
    case "returned":
      return {
        orderStatus: "ready_for_dispatch",
        fulfillmentStatus: "ready_for_dispatch",
        deliveredAt: null,
      };
    case "picked_up":
    case "out_for_delivery":
    case "failed":
      return {
        orderStatus: "out_for_delivery",
        fulfillmentStatus: "out_for_delivery",
        deliveredAt: null,
      };
    case "delivered":
      return {
        orderStatus: "delivered",
        fulfillmentStatus: "delivered",
        deliveredAt: new Date().toISOString(),
      };
    default:
      throw new Error("Unsupported delivery state.");
  }
}

async function getMutableOrderStateForUpdate(
  queryFn: typeof query,
  orderId: string
) {
  const result = await queryFn<MutableOrderState>(
    `
      select
        id as "orderId",
        user_id as "userId",
        status,
        fulfillment_status as "fulfillmentStatus"
      from app.orders
      where id = $1
      for update
    `,
    [orderId]
  );

  return result.rows[0] ?? null;
}

async function getActiveAssignmentForOrder(
  queryFn: typeof query,
  orderId: string
) {
  const result = await queryFn<DeliveryAssignmentState>(
    `
      select
        id as "assignmentId",
        order_id as "orderId",
        rider_id as "riderId",
        status
      from app.delivery_assignments
      where order_id = $1
        and status = any($2::text[])
      order by updated_at desc, created_at desc
      limit 1
      for update
    `,
    [orderId, ACTIVE_ORDER_ASSIGNMENT_STATUSES]
  );

  return result.rows[0] ?? null;
}

async function getAssignmentStateForUpdate(
  queryFn: typeof query,
  assignmentId: string
) {
  const result = await queryFn<DeliveryAssignmentState>(
    `
      select
        id as "assignmentId",
        order_id as "orderId",
        rider_id as "riderId",
        status
      from app.delivery_assignments
      where id = $1
      for update
    `,
    [assignmentId]
  );

  return result.rows[0] ?? null;
}

async function ensureRiderAvailable(
  queryFn: typeof query,
  riderId: string,
  currentOrderId: string
) {
  const result = await queryFn<{ orderId: string }>(
    `
      select order_id as "orderId"
      from app.delivery_assignments
      where rider_id = $1
        and order_id <> $2
        and status = any($3::text[])
      limit 1
    `,
    [riderId, currentOrderId, ACTIVE_RIDER_ASSIGNMENT_STATUSES]
  );

  if (result.rows[0]) {
    throw new Error("Rider is busy.");
  }
}

async function appendDeliveryEvent(
  queryFn: typeof query,
  input: {
    orderId: string;
    assignmentId: string | null;
    eventType: string;
    actorUserId: string | null;
    actorEmail: string | null;
    note: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await queryFn(
    `
      insert into app.delivery_events (
        order_id,
        assignment_id,
        event_type,
        actor_type,
        actor_user_id,
        actor_email,
        note,
        metadata
      )
      values ($1, $2, $3, 'admin', $4, $5, $6, $7::jsonb)
    `,
    [
      input.orderId,
      input.assignmentId,
      input.eventType,
      input.actorUserId,
      input.actorEmail,
      input.note,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

async function appendOrderStatusEventIfChanged(
  queryFn: typeof query,
  input: {
    orderId: string;
    fromStatus: string;
    toStatus: string;
    actorUserId: string | null;
    actorEmail: string | null;
    note: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  if (input.fromStatus === input.toStatus) {
    return;
  }

  await queryFn(
    `
      insert into app.order_status_events (
        order_id,
        from_status,
        to_status,
        actor_type,
        actor_user_id,
        actor_email,
        note,
        metadata
      )
      values ($1, $2, $3, 'admin', $4, $5, $6, $7::jsonb)
    `,
    [
      input.orderId,
      input.fromStatus,
      input.toStatus,
      input.actorUserId,
      input.actorEmail,
      input.note,
      JSON.stringify(input.metadata ?? {}),
    ]
  );
}

async function createReviewRequestIfNeeded(
  queryFn: typeof query,
  input: {
    orderId: string;
    userId: string | null;
  }
) {
  await queryFn(
    `
      insert into app.review_requests (
        order_id,
        user_id,
        status,
        sent_at,
        completed_at,
        expires_at
      )
      values (
        $1,
        $2,
        'pending',
        timezone('utc', now()),
        null,
        timezone('utc', now()) + interval '30 days'
      )
      on conflict (order_id)
      do nothing
    `,
    [input.orderId, input.userId]
  );
}

async function updateOrderForDeliveryState(
  queryFn: typeof query,
  input: {
    orderId: string;
    currentOrderStatus: string;
    nextAssignmentStatus: string;
    actorUserId: string | null;
    actorEmail: string | null;
    note: string | null;
  }
) {
  const next = getOrderStatusUpdate(input.nextAssignmentStatus);

  await queryFn(
    `
      update app.orders
      set
        status = $1,
        fulfillment_status = $2,
        delivered_at = case
          when $3::timestamptz is not null then $3::timestamptz
          else app.orders.delivered_at
        end
      where id = $4
    `,
    [next.orderStatus, next.fulfillmentStatus, next.deliveredAt, input.orderId]
  );

  await appendOrderStatusEventIfChanged(queryFn, {
    orderId: input.orderId,
    fromStatus: input.currentOrderStatus,
    toStatus: next.orderStatus,
    actorUserId: input.actorUserId,
    actorEmail: input.actorEmail,
    note: input.note,
    metadata: {
      source: "delivery_board",
      assignmentStatus: input.nextAssignmentStatus,
    },
  });
}

export async function listAdminDeliveryBoardOrders(
  limit = 60,
  actorEmail?: string | null
) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminDeliveryOrder[];
  }

  const result = await query<AdminDeliveryOrder>(
    `
      with delivery_orders as (
        select
          o.id as "orderId",
          o.public_order_number as "orderNumber",
          o.customer_name as "customerName",
          o.customer_phone_e164 as "customerPhone",
          o.status,
          o.fulfillment_status as "fulfillmentStatus",
          case
            when o.status = 'out_for_delivery'
              or o.fulfillment_status = 'out_for_delivery'
              then 'out_for_delivery'
            when o.status = 'ready_for_dispatch'
              or o.fulfillment_status = 'ready_for_dispatch'
              then 'ready_for_dispatch'
            else 'preparing'
          end as "deliveryStage",
          o.total_ngn as "totalNgn",
          o.placed_at as "placedAt",
          o.transfer_reference as "transferReference",
          o.delivery_address_snapshot as "deliveryAddressSnapshot"
        from app.orders o
        where o.status in ('preparing', 'ready_for_dispatch', 'out_for_delivery')
           or o.fulfillment_status in ('preparing', 'ready_for_dispatch', 'out_for_delivery')
      )
      select
        delivery_order."orderId",
        delivery_order."orderNumber",
        delivery_order."customerName",
        delivery_order."customerPhone",
        delivery_order.status,
        delivery_order."fulfillmentStatus",
        delivery_order."deliveryStage",
        delivery_order."totalNgn",
        delivery_order."placedAt",
        delivery_order."transferReference",
        coalesce(sum(oi.quantity), 0)::int as "itemCount",
        delivery_order."deliveryAddressSnapshot",
        da."assignmentId",
        da."assignmentStatus",
        da."riderId",
        da."riderName",
        da."riderPhone",
        da."riderVehicleType",
        de."latestDeliveryEventType",
        de."latestDeliveryEventAt",
        tp."latestTrackingLatitude",
        tp."latestTrackingLongitude",
        tp."latestTrackingHeading",
        tp."latestTrackingAccuracyMeters",
        tp."latestTrackingRecordedAt"
      from delivery_orders delivery_order
      left join app.order_items oi
        on oi.order_id = delivery_order."orderId"
      left join lateral (
        select
          a.id as "assignmentId",
          a.status as "assignmentStatus",
          r.id as "riderId",
          r.name as "riderName",
          r.phone_e164 as "riderPhone",
          r.vehicle_type as "riderVehicleType"
        from app.delivery_assignments a
        left join app.riders r
          on r.id = a.rider_id
        where a.order_id = delivery_order."orderId"
        order by
          case
            when a.status = any($2::text[]) then 0
            else 1
          end asc,
          a.updated_at desc,
          a.created_at desc
        limit 1
      ) da on true
      left join lateral (
        select
          event_type as "latestDeliveryEventType",
          created_at as "latestDeliveryEventAt"
        from app.delivery_events
        where order_id = delivery_order."orderId"
        order by created_at desc
        limit 1
      ) de on true
      left join lateral (
        select
          latitude::float8 as "latestTrackingLatitude",
          longitude::float8 as "latestTrackingLongitude",
          heading::float8 as "latestTrackingHeading",
          accuracy_meters::float8 as "latestTrackingAccuracyMeters",
          recorded_at as "latestTrackingRecordedAt"
        from app.tracking_points
        where assignment_id = da."assignmentId"
        order by recorded_at desc
        limit 1
      ) tp on true
      group by
        delivery_order."orderId",
        delivery_order."orderNumber",
        delivery_order."customerName",
        delivery_order."customerPhone",
        delivery_order.status,
        delivery_order."fulfillmentStatus",
        delivery_order."deliveryStage",
        delivery_order."totalNgn",
        delivery_order."placedAt",
        delivery_order."transferReference",
        delivery_order."deliveryAddressSnapshot",
        da."assignmentId",
        da."assignmentStatus",
        da."riderId",
        da."riderName",
        da."riderPhone",
        da."riderVehicleType",
        de."latestDeliveryEventType",
        de."latestDeliveryEventAt",
        tp."latestTrackingLatitude",
        tp."latestTrackingLongitude",
        tp."latestTrackingHeading",
        tp."latestTrackingAccuracyMeters",
        tp."latestTrackingRecordedAt"
      order by
        case delivery_order."deliveryStage"
          when 'out_for_delivery' then 0
          when 'ready_for_dispatch' then 1
          else 2
        end asc,
        delivery_order."placedAt" asc
      limit $1
    `,
    [limit, ACTIVE_ORDER_ASSIGNMENT_STATUSES],
    { actor: buildAdminActor(actorEmail) }
  );

  return result.rows;
}

export async function listAdminDeliveryRiders(limit = 24, actorEmail?: string | null) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminDeliveryRider[];
  }

  const result = await query<AdminDeliveryRider>(
    `
      select
        r.id as "riderId",
        r.name,
        r.phone_e164 as phone,
        r.vehicle_type as "vehicleType",
        r.is_active as "isActive",
        count(a.id) filter (
          where a.status = any($2::text[])
        )::int as "activeAssignmentCount",
        max(o.public_order_number) filter (
          where a.status = any($2::text[])
        ) as "activeOrderNumber"
      from app.riders r
      left join app.delivery_assignments a
        on a.rider_id = r.id
      left join app.orders o
        on o.id = a.order_id
      where r.is_active = true
      group by r.id, r.name, r.phone_e164, r.vehicle_type, r.is_active
      order by
        count(a.id) filter (where a.status = any($2::text[])) asc,
        r.name asc
      limit $1
    `,
    [limit, ACTIVE_RIDER_ASSIGNMENT_STATUSES],
    { actor: buildAdminActor(actorEmail) }
  );

  return result.rows;
}

export async function getAdminDeliveryBoardSnapshot(input?: {
  orderLimit?: number;
  riderLimit?: number;
  actorEmail?: string | null;
}) {
  const orderLimit = input?.orderLimit ?? 60;
  const riderLimit = input?.riderLimit ?? 24;
  const [orders, riders, deliveryDefaults] = await Promise.all([
    listAdminDeliveryBoardOrders(orderLimit, input?.actorEmail),
    listAdminDeliveryRiders(riderLimit, input?.actorEmail),
    getDeliveryDefaultsSetting(),
  ]);

  return {
    orders,
    riders,
    trackingEnabled: deliveryDefaults.trackingEnabled,
  };
}

export async function createOrUpdateRider(input: {
  name: string;
  phoneNumber: string;
  vehicleType: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  requireDatabase();

  const name = input.name.trim();
  const phone = normalizePhoneToE164(input.phoneNumber);
  const vehicleType = input.vehicleType?.trim() || null;

  if (name.length < 2) {
    throw new Error("Enter a rider name.");
  }

  if (!phone) {
    throw new Error("Enter a valid rider phone.");
  }

  const result = await query<RiderIdentity>(
    `
      insert into app.riders (
        name,
        phone_e164,
        vehicle_type,
        is_active
      )
      values ($1, $2, $3, true)
      on conflict (phone_e164)
      do update set
        name = excluded.name,
        vehicle_type = excluded.vehicle_type,
        is_active = true,
        updated_at = timezone('utc', now())
      returning
        id as "riderId",
        name,
        phone_e164 as phone,
        vehicle_type as "vehicleType"
    `,
    [name, phone, vehicleType],
    {
      actor: {
        userId: input.actorUserId ?? null,
        email: input.actorEmail ?? null,
        role: "admin",
      },
    }
  );

  return result.rows[0] ?? null;
}

export async function markOrderReadyForDispatch(input: {
  orderId: string;
  actorUserId: string | null;
  actorEmail: string | null;
  note: string | null;
}) {
  requireDatabase();

  return withTransaction(async (queryFn) => {
    const order = await getMutableOrderStateForUpdate(queryFn, input.orderId);

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status === "ready_for_dispatch") {
      return order;
    }

    if (!["preparing", "payment_confirmed"].includes(order.status)) {
      throw new Error("Order is not ready for dispatch.");
    }

    await queryFn(
      `
        update app.orders
        set
          status = 'ready_for_dispatch',
          fulfillment_status = 'ready_for_dispatch'
        where id = $1
      `,
      [input.orderId]
    );

    await appendOrderStatusEventIfChanged(queryFn, {
      orderId: input.orderId,
      fromStatus: order.status,
      toStatus: "ready_for_dispatch",
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      note: input.note,
      metadata: { source: "delivery_board" },
    });

    await appendDeliveryEvent(queryFn, {
      orderId: input.orderId,
      assignmentId: null,
      eventType: "marked_ready",
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      note: input.note,
    });

    return {
      ...order,
      status: "ready_for_dispatch",
      fulfillmentStatus: "ready_for_dispatch",
    };
  }, {
    actor: {
      userId: input.actorUserId,
      email: input.actorEmail,
      role: "admin",
    },
  });
}

export async function assignRiderToOrder(input: {
  orderId: string;
  riderId: string;
  actorUserId: string | null;
  actorEmail: string | null;
  note: string | null;
}) {
  requireDatabase();

  return withTransaction(async (queryFn) => {
    const order = await getMutableOrderStateForUpdate(queryFn, input.orderId);

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status !== "ready_for_dispatch") {
      throw new Error("Order must be ready before assignment.");
    }

    const riderResult = await queryFn<RiderIdentity>(
      `
        select
          id as "riderId",
          name,
          phone_e164 as phone,
          vehicle_type as "vehicleType"
        from app.riders
        where id = $1
          and is_active = true
        limit 1
      `,
      [input.riderId]
    );
    const rider = riderResult.rows[0];

    if (!rider) {
      throw new Error("Rider not found.");
    }

    const existingAssignment = await getActiveAssignmentForOrder(
      queryFn,
      input.orderId
    );

    await ensureRiderAvailable(queryFn, input.riderId, input.orderId);

    if (
      existingAssignment &&
      ["picked_up", "out_for_delivery"].includes(existingAssignment.status)
    ) {
      throw new Error("Delivery is already in motion.");
    }

    let assignmentId = existingAssignment?.assignmentId ?? null;
    const eventType =
      existingAssignment && existingAssignment.riderId && existingAssignment.riderId !== input.riderId
        ? "reassigned"
        : "assigned";

    if (existingAssignment) {
      await queryFn(
        `
          update app.delivery_assignments
          set
            rider_id = $1,
            status = 'assigned',
            assigned_by_user_id = $2,
            assigned_by_email = $3,
            assigned_at = timezone('utc', now()),
            note = $4
          where id = $5
        `,
        [
          input.riderId,
          input.actorUserId,
          input.actorEmail,
          input.note,
          existingAssignment.assignmentId,
        ]
      );
      assignmentId = existingAssignment.assignmentId;
    } else {
      const inserted = await queryFn<{ assignmentId: string }>(
        `
          insert into app.delivery_assignments (
            order_id,
            rider_id,
            status,
            assigned_by_user_id,
            assigned_by_email,
            assigned_at,
            note
          )
          values ($1, $2, 'assigned', $3, $4, timezone('utc', now()), $5)
          returning id as "assignmentId"
        `,
        [input.orderId, input.riderId, input.actorUserId, input.actorEmail, input.note]
      );
      assignmentId = inserted.rows[0]?.assignmentId ?? null;
    }

    await appendDeliveryEvent(queryFn, {
      orderId: input.orderId,
      assignmentId,
      eventType,
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      note: input.note,
      metadata: {
        riderId: rider.riderId,
        riderName: rider.name,
        riderPhone: rider.phone,
      },
    });

    return {
      assignmentId,
      rider,
    };
  }, {
    actor: {
      userId: input.actorUserId,
      email: input.actorEmail,
      role: "admin",
    },
  });
}

export async function updateDeliveryAssignmentStatus(input: {
  assignmentId: string;
  nextStatus: string;
  actorUserId: string | null;
  actorEmail: string | null;
  note: string | null;
}) {
  requireDatabase();

  const result = await withTransaction(async (queryFn) => {
    const assignment = await getAssignmentStateForUpdate(queryFn, input.assignmentId);

    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    if (assignment.status === input.nextStatus) {
      return assignment;
    }

    const allowedTransitions = DELIVERY_TRANSITIONS[assignment.status] ?? [];

    if (!allowedTransitions.includes(input.nextStatus)) {
      throw new Error("Unsupported delivery transition.");
    }

    if (
      ["assigned", "picked_up", "out_for_delivery"].includes(input.nextStatus) &&
      !assignment.riderId
    ) {
      throw new Error("Assign a rider first.");
    }

    if (assignment.riderId) {
      await ensureRiderAvailable(queryFn, assignment.riderId, assignment.orderId);
    }

    await queryFn(
      `
        update app.delivery_assignments
        set
          status = $1,
          picked_up_at = case
            when $1 = 'picked_up' then timezone('utc', now())
            else picked_up_at
          end,
          delivered_at = case
            when $1 = 'delivered' then timezone('utc', now())
            else delivered_at
          end,
          failed_at = case
            when $1 = 'failed' then timezone('utc', now())
            else failed_at
          end,
          returned_at = case
            when $1 = 'returned' then timezone('utc', now())
            else returned_at
          end,
          note = $2
        where id = $3
      `,
      [input.nextStatus, input.note, input.assignmentId]
    );

    const order = await getMutableOrderStateForUpdate(queryFn, assignment.orderId);

    if (!order) {
      throw new Error("Order not found.");
    }

    await updateOrderForDeliveryState(queryFn, {
      orderId: assignment.orderId,
      currentOrderStatus: order.status,
      nextAssignmentStatus: input.nextStatus,
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      note: input.note,
    });

    if (input.nextStatus === "delivered") {
      await finalizeInventoryForDeliveredOrder(queryFn, assignment.orderId);

      await createReviewRequestIfNeeded(queryFn, {
        orderId: assignment.orderId,
        userId: order.userId,
      });
    }

    await appendDeliveryEvent(queryFn, {
      orderId: assignment.orderId,
      assignmentId: assignment.assignmentId,
      eventType: input.nextStatus,
      actorUserId: input.actorUserId,
      actorEmail: input.actorEmail,
      note: input.note,
    });

    return {
      ...assignment,
      status: input.nextStatus,
    };
  }, {
    actor: {
      userId: input.actorUserId,
      email: input.actorEmail,
      role: "admin",
    },
  });

  if (["out_for_delivery", "delivered"].includes(input.nextStatus)) {
    await sendDeliveryStatusNotification({
      orderId: result.orderId,
      status: input.nextStatus as "out_for_delivery" | "delivered",
    });
  }

  return result;
}

function normalizeCoordinate(value: number, min: number, max: number, label: string) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Invalid ${label}.`);
  }

  return value;
}

function normalizeOptionalNumber(value: number | null | undefined) {
  if (value == null) {
    return null;
  }

  return Number.isFinite(value) ? value : null;
}

export async function getCourierSessionByToken(token: string) {
  const payload = readCourierAccessToken(token);

  if (!payload || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<DeliveryCourierSession>(
    `
      select
        a.id as "assignmentId",
        a.order_id as "orderId",
        o.public_order_number as "orderNumber",
        a.status as "assignmentStatus",
        r.id as "riderId",
        r.name as "riderName",
        r.phone_e164 as "riderPhone",
        o.delivery_address_snapshot as "deliveryAddressSnapshot"
      from app.delivery_assignments a
      inner join app.orders o
        on o.id = a.order_id
      left join app.riders r
        on r.id = a.rider_id
      where a.id = $1
        and a.order_id = $2
      limit 1
    `,
    [payload.assignmentId, payload.orderId]
  );

  const session = result.rows[0] ?? null;

  if (!session) {
    return null;
  }

  if (payload.riderId && session.riderId && payload.riderId !== session.riderId) {
    return null;
  }

  return session;
}

export async function recordCourierTrackingPoint(input: {
  token: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  accuracyMeters?: number | null;
  recordedAt?: string | null;
}) {
  requireDatabase();
  const deliveryDefaults = await getDeliveryDefaultsSetting();

  if (!deliveryDefaults.trackingEnabled) {
    throw new Error("Tracking is off.");
  }

  const session = await getCourierSessionByToken(input.token);

  if (!session) {
    throw new Error("Courier link is not valid.");
  }

  if (!["assigned", "picked_up", "out_for_delivery"].includes(session.assignmentStatus)) {
    throw new Error("Assignment is not accepting tracking.");
  }

  const latitude = normalizeCoordinate(input.latitude, -90, 90, "latitude");
  const longitude = normalizeCoordinate(input.longitude, -180, 180, "longitude");
  const heading = normalizeOptionalNumber(input.heading);
  const accuracyMeters = normalizeOptionalNumber(input.accuracyMeters);
  const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();

  if (Number.isNaN(recordedAt.getTime())) {
    throw new Error("Invalid tracking timestamp.");
  }

  return withTransaction(async (queryFn) => {
    const assignment = await getAssignmentStateForUpdate(queryFn, session.assignmentId);

    if (!assignment) {
      throw new Error("Assignment not found.");
    }

    if (!["assigned", "picked_up", "out_for_delivery"].includes(assignment.status)) {
      throw new Error("Assignment is not accepting tracking.");
    }

    const trackingCountResult = await queryFn<{ count: number }>(
      `
        select count(*)::int as count
        from app.tracking_points
        where assignment_id = $1
      `,
      [assignment.assignmentId]
    );
    const trackingCount = trackingCountResult.rows[0]?.count ?? 0;

    const inserted = await queryFn<DeliveryTrackingPoint>(
      `
        insert into app.tracking_points (
          assignment_id,
          latitude,
          longitude,
          heading,
          accuracy_meters,
          recorded_at
        )
        values ($1, $2, $3, $4, $5, $6)
        returning
          id as "pointId",
          assignment_id as "assignmentId",
          latitude::float8 as latitude,
          longitude::float8 as longitude,
          heading::float8 as heading,
          accuracy_meters::float8 as "accuracyMeters",
          recorded_at as "recordedAt"
      `,
      [
        assignment.assignmentId,
        latitude,
        longitude,
        heading,
        accuracyMeters,
        recordedAt.toISOString(),
      ]
    );

    if (trackingCount === 0) {
      await queryFn(
        `
          insert into app.delivery_events (
            order_id,
            assignment_id,
            event_type,
            actor_type,
            note,
            metadata
          )
          values ($1, $2, 'tracking_started', 'rider', null, $3::jsonb)
        `,
        [
          assignment.orderId,
          assignment.assignmentId,
          JSON.stringify({
            riderId: session.riderId,
            riderName: session.riderName,
          }),
        ]
      );
    }

    return inserted.rows[0] ?? null;
  });
}

export async function listDeliveryEventsForOrder(
  orderId: string,
  limit = 16,
  actor?: DatabaseActorContext
) {
  if (!orderId || !isDatabaseConfigured()) {
    return [] satisfies DeliveryTimelineEvent[];
  }

  const result = await query<DeliveryTimelineEvent>(
    `
      select
        id as "eventId",
        order_id as "orderId",
        assignment_id as "assignmentId",
        event_type as "eventType",
        actor_type as "actorType",
        actor_email as "actorEmail",
        note,
        metadata,
        created_at as "createdAt"
      from app.delivery_events
      where order_id = $1
      order by created_at desc
      limit $2
    `,
    [orderId, limit],
    actor ? { actor } : undefined
  );

  return result.rows;
}

type TrackingSnapshotRow = Omit<PortalTrackingSnapshot, "latestPoint" | "events" | "routeEstimate"> & {
  latestTrackingPointId: string | null;
  latestTrackingLatitude: number | null;
  latestTrackingLongitude: number | null;
  latestTrackingHeading: number | null;
  latestTrackingAccuracyMeters: number | null;
  latestTrackingRecordedAt: string | null;
};

async function buildTrackingSnapshot(
  row: TrackingSnapshotRow,
  orderId: string,
  actor?: DatabaseActorContext
) {
  const deliveryDefaults = await getDeliveryDefaultsSetting();
  const events = await listDeliveryEventsForOrder(orderId, 16, actor);
  const latestPoint =
    deliveryDefaults.trackingEnabled && row.latestTrackingPointId
      ? {
          pointId: row.latestTrackingPointId,
          assignmentId: row.assignmentId ?? "",
          latitude: row.latestTrackingLatitude ?? 0,
          longitude: row.latestTrackingLongitude ?? 0,
          heading: row.latestTrackingHeading,
          accuracyMeters: row.latestTrackingAccuracyMeters,
          recordedAt: row.latestTrackingRecordedAt ?? new Date(0).toISOString(),
        }
      : null;
  const routeEstimate =
    deliveryDefaults.trackingEnabled && latestPoint
      ? await getDeliveryRouteEstimate(
          {
            lat: latestPoint.latitude,
            lng: latestPoint.longitude,
          },
          getTrackingCoords(row.deliveryAddressSnapshot)
        )
      : null;

  return {
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    status: row.status,
    fulfillmentStatus: row.fulfillmentStatus,
    trackingEnabled: deliveryDefaults.trackingEnabled,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    deliveryAddressSnapshot: row.deliveryAddressSnapshot,
    assignmentId: row.assignmentId,
    assignmentStatus: row.assignmentStatus,
    riderName: row.riderName,
    riderPhone: row.riderPhone,
    riderVehicleType: row.riderVehicleType,
    latestPoint,
    routeEstimate,
    events,
  } satisfies PortalTrackingSnapshot;
}

export async function getPortalTrackingSnapshot(email: string, orderId: string) {
  const normalizedEmail = normalizeEmail(email) ?? "";

  if (!normalizedEmail || !orderId || !isDatabaseConfigured()) {
    return null;
  }

  const actor = buildCustomerActor(normalizedEmail);
  const result = await query<TrackingSnapshotRow>(
    `
      with matched_user as (
        select id
        from app.users
        where lower(email) = $1
        limit 1
      )
      select
        o.id as "orderId",
        o.public_order_number as "orderNumber",
        o.status,
        o.fulfillment_status as "fulfillmentStatus",
        o.customer_name as "customerName",
        o.customer_phone_e164 as "customerPhone",
        o.delivery_address_snapshot as "deliveryAddressSnapshot",
        a.id as "assignmentId",
        a.status as "assignmentStatus",
        r.name as "riderName",
        r.phone_e164 as "riderPhone",
        r.vehicle_type as "riderVehicleType",
        tp."pointId" as "latestTrackingPointId",
        tp.latitude as "latestTrackingLatitude",
        tp.longitude as "latestTrackingLongitude",
        tp.heading as "latestTrackingHeading",
        tp."accuracyMeters" as "latestTrackingAccuracyMeters",
        tp."recordedAt" as "latestTrackingRecordedAt"
      from app.orders o
      left join matched_user mu
        on mu.id = o.user_id
      left join lateral (
        select
          id,
          status,
          rider_id
        from app.delivery_assignments
        where order_id = o.id
        order by
          case
            when status in ('assigned', 'picked_up', 'out_for_delivery', 'failed', 'delivered') then 0
            else 1
          end asc,
          updated_at desc
        limit 1
      ) a on true
      left join app.riders r
        on r.id = a.rider_id
      left join lateral (
        select
          id as "pointId",
          latitude::float8 as latitude,
          longitude::float8 as longitude,
          heading::float8 as heading,
          accuracy_meters::float8 as "accuracyMeters",
          recorded_at as "recordedAt"
        from app.tracking_points
        where assignment_id = a.id
        order by recorded_at desc
        limit 1
      ) tp on true
      where o.id = $2
        and (mu.id is not null or lower(o.customer_email) = $1)
      limit 1
    `,
    [normalizedEmail, orderId],
    actor ? { actor } : undefined
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return buildTrackingSnapshot(row, orderId, actor);
}

export async function getGuestTrackingSnapshot(orderId: string) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

  const actor = {
    role: "customer" as const,
    guestOrderId: orderId,
  };
  const result = await query<TrackingSnapshotRow>(
    `
      select
        o.id as "orderId",
        o.public_order_number as "orderNumber",
        o.status,
        o.fulfillment_status as "fulfillmentStatus",
        o.customer_name as "customerName",
        o.customer_phone_e164 as "customerPhone",
        o.delivery_address_snapshot as "deliveryAddressSnapshot",
        a.id as "assignmentId",
        a.status as "assignmentStatus",
        r.name as "riderName",
        r.phone_e164 as "riderPhone",
        r.vehicle_type as "riderVehicleType",
        tp."pointId" as "latestTrackingPointId",
        tp.latitude as "latestTrackingLatitude",
        tp.longitude as "latestTrackingLongitude",
        tp.heading as "latestTrackingHeading",
        tp."accuracyMeters" as "latestTrackingAccuracyMeters",
        tp."recordedAt" as "latestTrackingRecordedAt"
      from app.orders o
      left join lateral (
        select
          id,
          status,
          rider_id
        from app.delivery_assignments
        where order_id = o.id
        order by
          case
            when status in ('assigned', 'picked_up', 'out_for_delivery', 'failed', 'delivered') then 0
            else 1
          end asc,
          updated_at desc
        limit 1
      ) a on true
      left join app.riders r
        on r.id = a.rider_id
      left join lateral (
        select
          id as "pointId",
          latitude::float8 as latitude,
          longitude::float8 as longitude,
          heading::float8 as heading,
          accuracy_meters::float8 as "accuracyMeters",
          recorded_at as "recordedAt"
        from app.tracking_points
        where assignment_id = a.id
        order by recorded_at desc
        limit 1
      ) tp on true
      where o.id = $1
      limit 1
    `,
    [orderId],
    { actor }
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return buildTrackingSnapshot(row, orderId, actor);
}
