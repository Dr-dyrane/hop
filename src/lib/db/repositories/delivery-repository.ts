import "server-only";

import { isDatabaseConfigured, query, withTransaction } from "@/lib/db/client";
import type { AdminDeliveryOrder, AdminDeliveryRider } from "@/lib/db/types";
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

export async function listAdminDeliveryBoardOrders(limit = 60) {
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
        do."orderId",
        do."orderNumber",
        do."customerName",
        do."customerPhone",
        do.status,
        do."fulfillmentStatus",
        do."deliveryStage",
        do."totalNgn",
        do."placedAt",
        do."transferReference",
        coalesce(sum(oi.quantity), 0)::int as "itemCount",
        do."deliveryAddressSnapshot",
        da."assignmentId",
        da."assignmentStatus",
        da."riderId",
        da."riderName",
        da."riderPhone",
        da."riderVehicleType",
        de."latestDeliveryEventType",
        de."latestDeliveryEventAt"
      from delivery_orders do
      left join app.order_items oi
        on oi.order_id = do."orderId"
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
        where a.order_id = do."orderId"
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
        where order_id = do."orderId"
        order by created_at desc
        limit 1
      ) de on true
      group by
        do."orderId",
        do."orderNumber",
        do."customerName",
        do."customerPhone",
        do.status,
        do."fulfillmentStatus",
        do."deliveryStage",
        do."totalNgn",
        do."placedAt",
        do."transferReference",
        do."deliveryAddressSnapshot",
        da."assignmentId",
        da."assignmentStatus",
        da."riderId",
        da."riderName",
        da."riderPhone",
        da."riderVehicleType",
        de."latestDeliveryEventType",
        de."latestDeliveryEventAt"
      order by
        case do."deliveryStage"
          when 'out_for_delivery' then 0
          when 'ready_for_dispatch' then 1
          else 2
        end asc,
        do."placedAt" asc
      limit $1
    `,
    [limit, ACTIVE_ORDER_ASSIGNMENT_STATUSES]
  );

  return result.rows;
}

export async function listAdminDeliveryRiders(limit = 24) {
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
    [limit, ACTIVE_RIDER_ASSIGNMENT_STATUSES]
  );

  return result.rows;
}

export async function createOrUpdateRider(input: {
  name: string;
  phoneNumber: string;
  vehicleType: string | null;
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
    [name, phone, vehicleType]
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

  return withTransaction(async (queryFn) => {
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
  });
}
