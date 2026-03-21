import "server-only";

import {
  isDatabaseConfigured,
  query,
  type DatabaseActorContext,
  withTransaction,
} from "@/lib/db/client";
import { releaseInventoryReservationForOrder } from "@/lib/db/repositories/order-inventory";
import {
  sendOrderCancelledNotification,
  sendOrderPlacedNotifications,
  sendPaymentDecisionNotification,
} from "@/lib/email/orders";
import { reserveInventoryForOrder } from "@/lib/db/repositories/order-inventory";
import { getDeliveryDefaultsSetting } from "@/lib/db/repositories/settings-repository";
import type {
  AdminPaymentQueueRow,
  BankAccountRow,
  OrderListRow,
  OrderStatusEventRow,
  PaymentProofRow,
  PaymentReviewEventRow,
  PortalOrderDetail,
  PortalOrderLine,
  PortalOrderListRow,
} from "@/lib/db/types";

function buildAdminActor(email: string | null | undefined): DatabaseActorContext | undefined {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "admin",
  };
}

function buildCustomerActor(input: {
  email?: string | null;
  guestOrderId?: string | null;
}): DatabaseActorContext | undefined {
  const normalizedEmail = input.email?.trim().toLowerCase() ?? null;

  if (!normalizedEmail && !input.guestOrderId) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "customer",
    guestOrderId: input.guestOrderId ?? null,
  };
}

function buildTransferDeadlineAt(staleTransferWindowMinutes: number) {
  return new Date(
    Date.now() + staleTransferWindowMinutes * 60 * 1000
  ).toISOString();
}

export async function expireStaleAwaitingTransferOrders() {
  if (!isDatabaseConfigured()) {
    return 0;
  }

  return withTransaction(async (queryFn) => {
    const staleOrdersResult = await queryFn<{
      orderId: string;
      paymentId: string | null;
      orderStatus: string;
      paymentStatus: string;
    }>(
      `
        select
          o.id as "orderId",
          p.id as "paymentId",
          o.status as "orderStatus",
          coalesce(p.status, o.payment_status) as "paymentStatus"
        from app.orders o
        left join app.payments p
          on p.order_id = o.id
        where o.status = 'awaiting_transfer'
          and o.transfer_deadline_at is not null
          and o.transfer_deadline_at <= timezone('utc', now())
        for update of o
      `
    );

    for (const staleOrder of staleOrdersResult.rows) {
      await releaseInventoryReservationForOrder(queryFn, staleOrder.orderId);

      await queryFn(
        `
          update app.payments
          set
            status = 'expired',
            expires_at = coalesce(expires_at, timezone('utc', now()))
          where order_id = $1
            and status in ('awaiting_transfer', 'rejected')
        `,
        [staleOrder.orderId]
      );

      if (staleOrder.paymentId) {
        await queryFn(
          `
            insert into app.payment_review_events (
              payment_id,
              actor_user_id,
              actor_email,
              action,
              note
            )
            values ($1, null, null, 'expired', 'Transfer window elapsed.')
          `,
          [staleOrder.paymentId]
        );
      }

      await queryFn(
        `
          update app.orders
          set
            status = 'expired',
            payment_status = 'expired',
            fulfillment_status = 'cancelled'
          where id = $1
        `,
        [staleOrder.orderId]
      );

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
          values ($1, $2, 'expired', 'system', null, null, 'Transfer window elapsed.', $3::jsonb)
        `,
        [
          staleOrder.orderId,
          staleOrder.orderStatus,
          JSON.stringify({ source: "expiry_guard" }),
        ]
      );
    }
    return staleOrdersResult.rows.length;
  }, {
    actor: {
      role: "admin",
    },
  });
}

export async function listOrdersForAdmin(limit = 40, actorEmail?: string | null) {
  if (!isDatabaseConfigured()) {
    return [] satisfies OrderListRow[];
  }

  await expireStaleAwaitingTransferOrders();

  const result = await query<OrderListRow>(
    `
    select
      o.id as "orderId",
      o.public_order_number as "orderNumber",
        o.customer_name as "customerName",
        o.customer_email as "customerEmail",
        o.customer_phone_e164 as "customerPhone",
        o.status,
        o.payment_status as "paymentStatus",
        o.fulfillment_status as "fulfillmentStatus",
        o.total_ngn as "totalNgn",
        o.placed_at as "placedAt",
        o.transfer_deadline_at as "transferDeadlineAt",
        coalesce(sum(oi.quantity), 0)::int as "itemCount"
      from app.orders o
      left join app.order_items oi on oi.order_id = o.id
      group by
        o.id,
        o.public_order_number,
        o.customer_name,
        o.customer_email,
        o.customer_phone_e164,
        o.status,
        o.payment_status,
        o.fulfillment_status,
        o.total_ngn,
        o.placed_at,
        o.transfer_deadline_at
      order by o.placed_at desc
      limit $1
    `,
    [limit],
    { actor: buildAdminActor(actorEmail) }
  );

  return result.rows;
}

export async function listPaymentsForAdmin(limit = 40, actorEmail?: string | null) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminPaymentQueueRow[];
  }

  await expireStaleAwaitingTransferOrders();

  const result = await query<AdminPaymentQueueRow>(
    `
      select
        p.id as "paymentId",
        o.id as "orderId",
        o.public_order_number as "orderNumber",
        p.status,
        p.expected_amount_ngn as "expectedAmountNgn",
        p.submitted_amount_ngn as "submittedAmountNgn",
        ba.bank_name as "bankName",
        ba.account_name as "accountName",
        ba.account_number as "accountNumber",
        p.payer_name as "payerName",
        p.submitted_at as "submittedAt",
        p.expires_at as "expiresAt"
      from app.payments p
      inner join app.orders o on o.id = p.order_id
      left join app.bank_accounts ba on ba.id = p.bank_account_id
      where p.status in ('awaiting_transfer', 'submitted', 'under_review')
      order by p.status desc, p.created_at desc
      limit $1
    `,
    [limit],
    { actor: buildAdminActor(actorEmail) }
  );

  return result.rows;
}

export async function getDefaultBankAccount() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const result = await query<BankAccountRow>(
    `
      select
        id as "bankAccountId",
        bank_name as "bankName",
        account_name as "accountName",
        account_number as "accountNumber",
        instructions,
        is_default as "isDefault"
      from app.bank_accounts
      where is_active = true
      order by is_default desc, created_at desc
      limit 1
    `
  );

  return result.rows[0] ?? null;
}

export async function acceptOrderRequestByAdmin(
  orderId: string,
  actorEmail: string | null,
  actorUserId: string | null,
  note: string | null
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const deliveryDefaults = await getDeliveryDefaultsSetting();
  const transferDeadlineAt = buildTransferDeadlineAt(
    deliveryDefaults.staleTransferWindowMinutes
  );
  let acceptedOrderId: string | null = null;

  await withTransaction(async (queryFn) => {
    const orderResult = await queryFn<{
      orderId: string;
      status: string;
      paymentId: string | null;
      totalNgn: number;
    }>(
      `
        select
          o.id as "orderId",
          o.status,
          p.id as "paymentId",
          o.total_ngn as "totalNgn"
        from app.orders o
        left join app.payments p
          on p.order_id = o.id
        where o.id = $1
        limit 1
        for update of o
      `,
      [orderId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status !== "checkout_draft") {
      throw new Error("Request is not waiting for acceptance.");
    }

    if (order.paymentId) {
      throw new Error("Payment already exists for this order.");
    }

    const bankAccountResult = await queryFn<{ bankAccountId: string }>(
      `
        select id as "bankAccountId"
        from app.bank_accounts
        where is_active = true
        order by is_default desc, created_at desc
        limit 1
      `
    );
    const bankAccountId = bankAccountResult.rows[0]?.bankAccountId ?? null;

    await reserveInventoryForOrder(queryFn, order.orderId);

    await queryFn(
      `
        insert into app.payments (
          order_id,
          bank_account_id,
          payment_method,
          status,
          expected_amount_ngn,
          expires_at
        )
        values ($1, $2, 'bank_transfer', 'awaiting_transfer', $3, $4)
      `,
      [order.orderId, bankAccountId, order.totalNgn, transferDeadlineAt]
    );

    await queryFn(
      `
        update app.orders
        set
          status = 'awaiting_transfer',
          payment_status = 'awaiting_transfer',
          fulfillment_status = 'pending',
          transfer_deadline_at = $2
        where id = $1
      `,
      [order.orderId, transferDeadlineAt]
    );

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
        values ($1, 'checkout_draft', 'awaiting_transfer', 'admin', $2, $3, $4, $5::jsonb)
      `,
      [
        order.orderId,
        actorUserId,
        actorEmail,
        note,
        JSON.stringify({ source: "request_accept" }),
      ]
    );

    acceptedOrderId = order.orderId;
  }, {
    actor: {
      userId: actorUserId,
      email: actorEmail,
      role: "admin",
    },
  });

  if (acceptedOrderId) {
    await sendOrderPlacedNotifications({
      orderId: acceptedOrderId,
      notifyAdmin: false,
    });
  }
}

export async function listOrdersForPortal(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return [] satisfies PortalOrderListRow[];
  }

  if (!isDatabaseConfigured()) {
    return [] satisfies PortalOrderListRow[];
  }

  await expireStaleAwaitingTransferOrders();

  const result = await query<PortalOrderListRow>(
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
        o.payment_status as "paymentStatus",
        o.fulfillment_status as "fulfillmentStatus",
        o.total_ngn as "totalNgn",
        o.placed_at as "placedAt",
        o.status not in ('delivered', 'cancelled', 'expired') as "active",
        coalesce(sum(oi.quantity), 0)::int as "itemCount"
      from app.orders o
      left join app.order_items oi on oi.order_id = o.id
      left join matched_user mu on mu.id = o.user_id
      where (mu.id is not null or lower(o.customer_email) = $1)
      group by
        o.id,
        o.public_order_number,
        o.status,
        o.payment_status,
        o.fulfillment_status,
        o.total_ngn,
        o.placed_at
      order by o.placed_at desc
      limit 50
    `,
    [normalizedEmail],
    { actor: buildCustomerActor({ email: normalizedEmail }) }
  );

  return result.rows;
}

async function getOrderPaymentSummary(
  orderId: string,
  actor?: DatabaseActorContext
) {
  const paymentResult = await query<{
    status: string;
    expected_amount_ngn: number;
    submitted_amount_ngn: number | null;
    reviewed_by_email: string | null;
    expires_at: string | null;
    bank_name: string | null;
    account_name: string | null;
    account_number: string | null;
    instructions: string | null;
  }>(
    `
      select
        p.status,
        p.expected_amount_ngn,
        p.submitted_amount_ngn,
        p.reviewed_by_email,
        p.expires_at,
        ba.bank_name,
        ba.account_name,
        ba.account_number,
        ba.instructions
      from app.payments p
      left join app.bank_accounts ba on ba.id = p.bank_account_id
      where p.order_id = $1
      limit 1
    `,
    [orderId],
    { actor }
  );

  const payment = paymentResult.rows[0];

  if (!payment) {
    return null;
  }

  return {
    status: payment.status,
    expectedAmountNgn: payment.expected_amount_ngn,
    submittedAmountNgn: payment.submitted_amount_ngn,
    reviewedByEmail: payment.reviewed_by_email,
    expiresAt: payment.expires_at,
    bankName: payment.bank_name,
    accountName: payment.account_name,
    accountNumber: payment.account_number,
    instructions: payment.instructions,
  };
}

async function listOrderItems(orderId: string, actor?: DatabaseActorContext) {
  const itemsResult = await query<PortalOrderLine>(
    `
      with prior_returns as (
        select
          rci.order_item_id,
          sum(rci.quantity)::int as returned_quantity
        from app.order_return_case_items rci
        inner join app.order_return_cases rc
          on rc.id = rci.return_case_id
        where rci.order_id = $1
          and rc.status <> 'rejected'
        group by rci.order_item_id
      )
      select
        oi.id as "orderItemId",
        oi.title,
        oi.sku,
        oi.unit_price_ngn as "unitPriceNgn",
        oi.quantity,
        oi.line_total_ngn as "lineTotalNgn",
        coalesce(pr.returned_quantity, 0)::int as "returnedQuantity",
        greatest(oi.quantity - coalesce(pr.returned_quantity, 0), 0)::int as "returnableQuantity"
      from app.order_items oi
      left join prior_returns pr
        on pr.order_item_id = oi.id
      where oi.order_id = $1
      order by oi.created_at asc
    `,
    [orderId],
    { actor }
  );

  return itemsResult.rows;
}

async function buildOrderDetail(
  detail: (PortalOrderDetail & {
    deliveryAddressSnapshot: Record<string, unknown>;
  }) | null,
  actor?: DatabaseActorContext
) {
  if (!detail) {
    return null;
  }

  const [payment, items] = await Promise.all([
    getOrderPaymentSummary(detail.orderId, actor),
    listOrderItems(detail.orderId, actor),
  ]);

  return {
    ...detail,
    payment,
    deliveryAddressSnapshot: detail.deliveryAddressSnapshot ?? {},
    items,
  } satisfies PortalOrderDetail;
}

export async function getPortalOrderDetail(email: string, orderId: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !orderId || !isDatabaseConfigured()) {
    return null;
  }

  await expireStaleAwaitingTransferOrders();

  const detailResult = await query<
    PortalOrderDetail & { deliveryAddressSnapshot: Record<string, unknown> }
  >(
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
        o.customer_name as "customerName",
        o.customer_email as "customerEmail",
        o.customer_phone_e164 as "customerPhone",
        o.status,
        o.payment_status as "paymentStatus",
        o.fulfillment_status as "fulfillmentStatus",
        o.subtotal_ngn as "subtotalNgn",
        o.discount_ngn as "discountNgn",
        o.delivery_fee_ngn as "deliveryFeeNgn",
        o.total_ngn as "totalNgn",
        o.notes,
        o.transfer_reference as "transferReference",
        o.transfer_deadline_at as "transferDeadlineAt",
        o.placed_at as "placedAt",
        o.confirmed_at as "confirmedAt",
        o.cancelled_at as "cancelledAt",
        o.delivered_at as "deliveredAt",
        o.delivery_address_snapshot as "deliveryAddressSnapshot",
        p.id as "paymentId"
      from app.orders o
      left join matched_user mu on mu.id = o.user_id
      left join app.payments p on p.order_id = o.id
      where o.id = $2
        and (mu.id is not null or lower(o.customer_email) = $1)
      limit 1
    `,
    [normalizedEmail, orderId],
    { actor: buildCustomerActor({ email: normalizedEmail }) }
  );

  return buildOrderDetail(
    detailResult.rows[0] ?? null,
    buildCustomerActor({ email: normalizedEmail })
  );
}

export async function preparePortalReorder(email: string, orderId: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !orderId || !isDatabaseConfigured()) {
    return {
      items: [],
      unavailableItems: [],
      changedPriceCount: 0,
    };
  }

  const result = await query<{
    productId: string | null;
    quantity: number;
    title: string;
    previousUnitPriceNgn: number;
    currentUnitPriceNgn: number | null;
    canReorder: boolean;
  }>(
    `
      with matched_user as (
        select id
        from app.users
        where lower(email) = $1
        limit 1
      )
      select
        coalesce(oi.snapshot ->> 'productId', p.slug) as "productId",
        oi.quantity,
        oi.title,
        oi.unit_price_ngn as "previousUnitPriceNgn",
        cv.price_ngn as "currentUnitPriceNgn",
        (cv.id is not null)::boolean as "canReorder"
      from app.orders o
      inner join app.order_items oi
        on oi.order_id = o.id
      left join app.product_variants ov
        on ov.id = oi.variant_id
      left join app.products p
        on p.id = ov.product_id
      left join lateral (
        select v.id, v.price_ngn
        from app.products cp
        inner join app.product_variants v
          on v.product_id = cp.id
         and v.is_default = true
         and v.status = 'active'
        where cp.slug = coalesce(oi.snapshot ->> 'productId', p.slug)
          and cp.status = 'active'
          and cp.is_available = true
          and cp.merchandising_state <> 'hidden'
        limit 1
      ) cv on true
      left join matched_user mu
        on mu.id = o.user_id
      where o.id = $2
        and (mu.id is not null or lower(o.customer_email) = $1)
    `,
    [normalizedEmail, orderId],
    { actor: buildCustomerActor({ email: normalizedEmail }) }
  );

  const items = result.rows
    .filter((row) => row.canReorder && row.productId)
    .map((row) => ({
      productId: row.productId as string,
      quantity: row.quantity,
    }));
  const unavailableItems = result.rows
    .filter((row) => !row.canReorder)
    .map((row) => row.title);
  const changedPriceCount = result.rows.filter(
    (row) =>
      row.canReorder &&
      row.currentUnitPriceNgn != null &&
      row.currentUnitPriceNgn !== row.previousUnitPriceNgn
  ).length;

  return {
    items,
    unavailableItems,
    changedPriceCount,
  };
}

export async function getGuestOrderDetail(orderId: string) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

  await expireStaleAwaitingTransferOrders();

  const result = await query<
    PortalOrderDetail & { deliveryAddressSnapshot: Record<string, unknown> }
  >(
    `
      select
        o.id as "orderId",
        o.public_order_number as "orderNumber",
        o.customer_name as "customerName",
        o.customer_email as "customerEmail",
        o.customer_phone_e164 as "customerPhone",
        o.status,
        o.payment_status as "paymentStatus",
        o.fulfillment_status as "fulfillmentStatus",
        o.subtotal_ngn as "subtotalNgn",
        o.discount_ngn as "discountNgn",
        o.delivery_fee_ngn as "deliveryFeeNgn",
        o.total_ngn as "totalNgn",
        o.notes,
        o.transfer_reference as "transferReference",
        o.transfer_deadline_at as "transferDeadlineAt",
        o.placed_at as "placedAt",
        o.confirmed_at as "confirmedAt",
        o.cancelled_at as "cancelledAt",
        o.delivered_at as "deliveredAt",
        o.delivery_address_snapshot as "deliveryAddressSnapshot",
        p.id as "paymentId"
      from app.orders o
      left join app.payments p on p.order_id = o.id
      where o.id = $1
      limit 1
    `,
    [orderId],
    { actor: buildCustomerActor({ guestOrderId: orderId }) }
  );

  return buildOrderDetail(
    result.rows[0] ?? null,
    buildCustomerActor({ guestOrderId: orderId })
  );
}

export async function getAdminOrderDetail(orderId: string, actorEmail?: string | null) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

  await expireStaleAwaitingTransferOrders();

  const result = await query<
    PortalOrderDetail & { deliveryAddressSnapshot: Record<string, unknown> }
  >(
    `
      select
        o.id as "orderId",
        o.public_order_number as "orderNumber",
        o.customer_name as "customerName",
        o.customer_email as "customerEmail",
        o.customer_phone_e164 as "customerPhone",
        o.status,
        o.payment_status as "paymentStatus",
        o.fulfillment_status as "fulfillmentStatus",
        o.subtotal_ngn as "subtotalNgn",
        o.discount_ngn as "discountNgn",
        o.delivery_fee_ngn as "deliveryFeeNgn",
        o.total_ngn as "totalNgn",
        o.notes,
        o.transfer_reference as "transferReference",
        o.transfer_deadline_at as "transferDeadlineAt",
        o.placed_at as "placedAt",
        o.confirmed_at as "confirmedAt",
        o.cancelled_at as "cancelledAt",
        o.delivered_at as "deliveredAt",
        o.delivery_address_snapshot as "deliveryAddressSnapshot",
        p.id as "paymentId"
      from app.orders o
      left join app.payments p on p.order_id = o.id
      where o.id = $1
      limit 1
    `,
    [orderId],
    { actor: buildAdminActor(actorEmail) }
  );

  return buildOrderDetail(result.rows[0] ?? null, buildAdminActor(actorEmail));
}

export async function listOrderStatusEvents(
  orderId: string,
  actor?: DatabaseActorContext
) {
  if (!orderId || !isDatabaseConfigured()) {
    return [] satisfies OrderStatusEventRow[];
  }

  const result = await query<OrderStatusEventRow>(
    `
      select
        id as "eventId",
        order_id as "orderId",
        from_status as "fromStatus",
        to_status as "toStatus",
        actor_type as "actorType",
        actor_email as "actorEmail",
        note,
        created_at as "createdAt"
      from app.order_status_events
      where order_id = $1
      order by created_at desc
    `,
    [orderId],
    { actor }
  );

  return result.rows;
}

export async function listPaymentReviewEvents(
  paymentId: string,
  actorEmail?: string | null
) {
  if (!paymentId || !isDatabaseConfigured()) {
    return [] satisfies PaymentReviewEventRow[];
  }

  const result = await query<PaymentReviewEventRow>(
    `
      select
        id as "eventId",
        payment_id as "paymentId",
        actor_email as "actorEmail",
        action,
        note,
        created_at as "createdAt"
      from app.payment_review_events
      where payment_id = $1
      order by created_at desc
    `,
    [paymentId],
    { actor: buildAdminActor(actorEmail) }
  );

  return result.rows;
}

export async function listPaymentProofs(
  paymentId: string,
  actor?: DatabaseActorContext
) {
  if (!paymentId || !isDatabaseConfigured()) {
    return [] satisfies PaymentProofRow[];
  }

  const result = await query<PaymentProofRow>(
    `
      select
        id as "proofId",
        payment_id as "paymentId",
        storage_key as "storageKey",
        public_url as "publicUrl",
        mime_type as "mimeType",
        submitted_by_email as "submittedByEmail",
        created_at as "createdAt"
      from app.payment_proofs
      where payment_id = $1
      order by created_at desc
    `,
    [paymentId],
    { actor }
  );

  return result.rows;
}

export async function createPaymentProof(
  paymentId: string,
  storageKey: string,
  publicUrl: string | null,
  mimeType: string,
  submittedByEmail: string | null,
  options?: { guestOrderId?: string | null }
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await withTransaction(async (queryFn) => {
    const paymentResult = await queryFn<{
      orderId: string;
      paymentStatus: string;
      orderStatus: string;
    }>(
      `
        select
          p.order_id as "orderId",
          p.status as "paymentStatus",
          o.status as "orderStatus"
        from app.payments p
        inner join app.orders o
          on o.id = p.order_id
        where p.id = $1
        limit 1
        for update
      `,
      [paymentId]
    );

    const payment = paymentResult.rows[0];

    if (!payment) {
      throw new Error("Payment not found.");
    }

    if (["confirmed", "expired"].includes(payment.paymentStatus) || payment.orderStatus === "expired") {
      throw new Error("Payment is closed.");
    }

    await queryFn(
      `
        insert into app.payment_proofs (
          payment_id,
          storage_key,
          public_url,
          mime_type,
          submitted_by_email
        )
        values ($1, $2, $3, $4, $5)
      `,
      [paymentId, storageKey, publicUrl, mimeType, submittedByEmail]
    );

    await markPaymentSubmitted(queryFn, {
      paymentId,
      orderId: payment.orderId,
      paymentStatus: payment.paymentStatus,
      orderStatus: payment.orderStatus,
      submittedByEmail,
      source: "payment_proof_upload",
    });
  }, {
    actor: buildCustomerActor({
      email: submittedByEmail,
      guestOrderId: options?.guestOrderId ?? null,
    }),
  });
}

async function markPaymentSubmitted(
  queryFn: <TRow extends import("pg").QueryResultRow>(
    text: string,
    values?: unknown[]
  ) => Promise<import("pg").QueryResult<TRow>>,
  input: {
    paymentId: string;
    orderId: string;
    paymentStatus: string;
    orderStatus: string;
    submittedByEmail: string | null;
    source: "payment_proof_upload" | "payment_confirmation";
  }
) {
  const shouldTransitionToSubmitted = ["awaiting_transfer", "rejected"].includes(
    input.paymentStatus
  );

  if (!["submitted", "under_review"].includes(input.paymentStatus)) {
    await queryFn(
      `
        update app.payments
        set
          status = case
            when status in ('awaiting_transfer', 'rejected') then 'submitted'
            else status
          end,
          submitted_amount_ngn = coalesce(submitted_amount_ngn, expected_amount_ngn),
          submitted_at = coalesce(submitted_at, timezone('utc', now()))
        where id = $1
      `,
      [input.paymentId]
    );
  } else {
    await queryFn(
      `
        update app.payments
        set
          submitted_amount_ngn = coalesce(submitted_amount_ngn, expected_amount_ngn),
          submitted_at = coalesce(submitted_at, timezone('utc', now()))
        where id = $1
      `,
      [input.paymentId]
    );
  }

  if (shouldTransitionToSubmitted) {
    await queryFn(
      `
        insert into app.payment_review_events (
          payment_id,
          actor_user_id,
          actor_email,
          action,
          note
        )
        values ($1, null, $2, 'submitted', null)
      `,
      [input.paymentId, input.submittedByEmail]
    );

    await queryFn(
      `
        update app.orders
        set
          payment_status = 'submitted',
          status = 'payment_submitted',
          fulfillment_status = 'pending'
        where id = $1
      `,
      [input.orderId]
    );

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
        values ($1, $2, 'payment_submitted', 'customer', null, $3, null, $4::jsonb)
      `,
      [
        input.orderId,
        input.orderStatus,
        input.submittedByEmail,
        JSON.stringify({ source: input.source }),
      ]
    );
  }
}

export async function submitPaymentForReview(
  paymentId: string,
  submittedByEmail: string | null,
  options?: { guestOrderId?: string | null }
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await withTransaction(async (queryFn) => {
    const paymentResult = await queryFn<{
      orderId: string;
      paymentStatus: string;
      orderStatus: string;
    }>(
      `
        select
          p.order_id as "orderId",
          p.status as "paymentStatus",
          o.status as "orderStatus"
        from app.payments p
        inner join app.orders o
          on o.id = p.order_id
        where p.id = $1
        limit 1
        for update
      `,
      [paymentId]
    );

    const payment = paymentResult.rows[0];

    if (!payment) {
      throw new Error("Payment not found.");
    }

    if (["confirmed", "expired"].includes(payment.paymentStatus) || payment.orderStatus === "expired") {
      throw new Error("Payment is closed.");
    }

    await markPaymentSubmitted(queryFn, {
      paymentId,
      orderId: payment.orderId,
      paymentStatus: payment.paymentStatus,
      orderStatus: payment.orderStatus,
      submittedByEmail,
      source: "payment_confirmation",
    });
  }, {
    actor: buildCustomerActor({
      email: submittedByEmail,
      guestOrderId: options?.guestOrderId ?? null,
    }),
  });
}

const CANCELLABLE_ORDER_STATUSES = [
  "checkout_draft",
  "awaiting_transfer",
  "payment_submitted",
  "payment_under_review",
  "payment_confirmed",
  "preparing",
  "ready_for_dispatch",
];

const PRE_CONFIRMATION_PAYMENT_STATUSES = [
  "awaiting_transfer",
  "submitted",
  "under_review",
  "rejected",
];

export async function cancelOrderByAdmin(
  orderId: string,
  actorEmail: string | null,
  actorUserId: string | null,
  note: string | null
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  let cancelledOrderId: string | null = null;

  await withTransaction(async (queryFn) => {
    const orderResult = await queryFn<{
      orderId: string;
      status: string;
      paymentStatus: string;
      fulfillmentStatus: string;
      paymentId: string | null;
      assignmentId: string | null;
      assignmentStatus: string | null;
    }>(
      `
        select
          o.id as "orderId",
          o.status,
          o.payment_status as "paymentStatus",
          o.fulfillment_status as "fulfillmentStatus",
          p.id as "paymentId",
          da.id as "assignmentId",
          da.status as "assignmentStatus"
        from app.orders o
        left join app.payments p
          on p.order_id = o.id
        left join lateral (
          select
            id,
            status
          from app.delivery_assignments
          where order_id = o.id
            and status in ('unassigned', 'assigned', 'picked_up', 'out_for_delivery', 'failed')
          order by updated_at desc, created_at desc
          limit 1
        ) da on true
        where o.id = $1
        limit 1
        for update of o, p
      `,
      [orderId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error("Order not found.");
    }

    if (["cancelled", "expired", "delivered"].includes(order.status)) {
      throw new Error("Order is already closed.");
    }

    if (!CANCELLABLE_ORDER_STATUSES.includes(order.status)) {
      throw new Error("Order cannot be cancelled here.");
    }

    if (["picked_up", "out_for_delivery"].includes(order.assignmentStatus ?? "")) {
      throw new Error("Order is already with a rider.");
    }

    await releaseInventoryReservationForOrder(queryFn, order.orderId);

    if (order.paymentId && PRE_CONFIRMATION_PAYMENT_STATUSES.includes(order.paymentStatus)) {
      await queryFn(
        `
          update app.payments
          set
            status = 'expired',
            expires_at = coalesce(expires_at, timezone('utc', now())),
            reviewed_by_user_id = coalesce(reviewed_by_user_id, $2),
            reviewed_by_email = coalesce(reviewed_by_email, $3),
            reviewed_at = coalesce(reviewed_at, timezone('utc', now())),
            rejection_reason = coalesce(rejection_reason, $4)
          where id = $1
        `,
        [order.paymentId, actorUserId, actorEmail, note]
      );

      await queryFn(
        `
          insert into app.payment_review_events (
            payment_id,
            actor_user_id,
            actor_email,
            action,
            note,
            metadata
          )
          values ($1, $2, $3, 'expired', $4, $5::jsonb)
        `,
        [
          order.paymentId,
          actorUserId,
          actorEmail,
          note,
          JSON.stringify({ source: "admin_cancel" }),
        ]
      );
    }

    if (order.assignmentId) {
      await queryFn(
        `
          update app.delivery_assignments
          set
            status = 'returned',
            returned_at = coalesce(returned_at, timezone('utc', now())),
            note = $2
          where id = $1
        `,
        [order.assignmentId, note]
      );

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
          values ($1, $2, 'cancelled', 'admin', $3, $4, $5, $6::jsonb)
        `,
        [
          order.orderId,
          order.assignmentId,
          actorUserId,
          actorEmail,
          note,
          JSON.stringify({ source: "admin_cancel" }),
        ]
      );
    }

    const nextPaymentStatus = PRE_CONFIRMATION_PAYMENT_STATUSES.includes(order.paymentStatus)
      ? "expired"
      : order.paymentStatus;

    await queryFn(
      `
        update app.orders
        set
          status = 'cancelled',
          payment_status = $2,
          fulfillment_status = 'cancelled',
          cancelled_at = coalesce(cancelled_at, timezone('utc', now()))
        where id = $1
      `,
      [order.orderId, nextPaymentStatus]
    );

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
        values ($1, $2, 'cancelled', 'admin', $3, $4, $5, $6::jsonb)
      `,
      [
        order.orderId,
        order.status,
        actorUserId,
        actorEmail,
        note,
        JSON.stringify({ source: "admin_cancel" }),
      ]
    );

    cancelledOrderId = order.orderId;
  }, {
    actor: {
      userId: actorUserId,
      email: actorEmail,
      role: "admin",
    },
  });

  if (cancelledOrderId) {
    await sendOrderCancelledNotification({
      orderId: cancelledOrderId,
      note,
    });
  }
}

const PAYMENT_ACTIONS: Record<
  string,
  {
    paymentStatus: string;
    orderStatus: string;
    fulfillmentStatus: string;
    reviewAction: string;
  }
> = {
  submitted: {
    paymentStatus: "submitted",
    orderStatus: "payment_submitted",
    fulfillmentStatus: "pending",
    reviewAction: "submitted",
  },
  under_review: {
    paymentStatus: "under_review",
    orderStatus: "payment_under_review",
    fulfillmentStatus: "pending",
    reviewAction: "marked_under_review",
  },
  confirmed: {
    paymentStatus: "confirmed",
    orderStatus: "preparing",
    fulfillmentStatus: "preparing",
    reviewAction: "confirmed",
  },
  rejected: {
    paymentStatus: "rejected",
    orderStatus: "awaiting_transfer",
    fulfillmentStatus: "pending",
    reviewAction: "rejected",
  },
};

export async function reviewPayment(
  paymentId: string,
  action: keyof typeof PAYMENT_ACTIONS,
  actorEmail: string | null,
  actorUserId: string | null,
  note: string | null
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const transition = PAYMENT_ACTIONS[action];

  if (!transition) {
    throw new Error("Unsupported payment action");
  }

  let updatedOrderId: string | null = null;

  await withTransaction(async (queryFn) => {
    const paymentOrderResult = await queryFn<{
      order_id: string;
      status: string;
    }>(
      `
        select
          p.order_id,
          o.status
        from app.payments p
        inner join app.orders o on o.id = p.order_id
        where p.id = $1
        limit 1
        for update
      `,
      [paymentId]
    );

    const orderId = paymentOrderResult.rows[0]?.order_id;
    const currentStatus = paymentOrderResult.rows[0]?.status ?? null;

    if (!orderId) {
      throw new Error("Order not found for payment");
    }

    await queryFn(
      `
        update app.payments
        set
          status = $1,
          rejection_reason = $2,
          reviewed_by_user_id = $3,
          reviewed_by_email = $4,
          reviewed_at = timezone('utc', now())
        where id = $5
      `,
      [
        transition.paymentStatus,
        action === "rejected" ? note : null,
        actorUserId,
        actorEmail,
        paymentId,
      ]
    );

    await queryFn(
      `
        insert into app.payment_review_events (
          payment_id,
          actor_user_id,
          actor_email,
          action,
          note
        )
        values ($1, $2, $3, $4, $5)
      `,
      [paymentId, actorUserId, actorEmail, transition.reviewAction, note]
    );

    await queryFn(
      `
        update app.orders
        set
          payment_status = $1,
          status = $2,
          fulfillment_status = $3,
          confirmed_at = case
            when $1 = 'confirmed' then timezone('utc', now())
            else confirmed_at
          end
        where id = $4
      `,
      [transition.paymentStatus, transition.orderStatus, transition.fulfillmentStatus, orderId]
    );

    await queryFn(
      `
        insert into app.order_status_events (
          order_id,
          from_status,
          to_status,
          actor_type,
          actor_user_id,
          actor_email,
          note
        )
        values ($1, $2, $3, 'admin', $4, $5, $6)
      `,
      [orderId, currentStatus, transition.orderStatus, actorUserId, actorEmail, note]
    );

    updatedOrderId = orderId;
  }, {
    actor: {
      userId: actorUserId,
      email: actorEmail,
      role: "admin",
    },
  });

  if (updatedOrderId && ["under_review", "confirmed", "rejected"].includes(action)) {
    await sendPaymentDecisionNotification({
      orderId: updatedOrderId,
      action: action as "under_review" | "confirmed" | "rejected",
      note,
    });
  }
}
