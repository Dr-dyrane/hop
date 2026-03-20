import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
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

export async function listOrdersForAdmin(limit = 40) {
  if (!isDatabaseConfigured()) {
    return [] satisfies OrderListRow[];
  }

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
    [limit]
  );

  return result.rows;
}

export async function listPaymentsForAdmin(limit = 40) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminPaymentQueueRow[];
  }

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
    [limit]
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

export async function listOrdersForPortal(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return [] satisfies PortalOrderListRow[];
  }

  if (!isDatabaseConfigured()) {
    return [] satisfies PortalOrderListRow[];
  }

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
        and o.status <> 'checkout_draft'
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
    [normalizedEmail]
  );

  return result.rows;
}

async function getOrderPaymentSummary(orderId: string) {
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
    [orderId]
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

async function listOrderItems(orderId: string) {
  const itemsResult = await query<PortalOrderLine>(
    `
      select
        title,
        sku,
        unit_price_ngn as "unitPriceNgn",
        quantity,
        line_total_ngn as "lineTotalNgn"
      from app.order_items
      where order_id = $1
      order by created_at asc
    `,
    [orderId]
  );

  return itemsResult.rows;
}

async function buildOrderDetail(
  detail: (PortalOrderDetail & {
    deliveryAddressSnapshot: Record<string, unknown>;
  }) | null
) {
  if (!detail) {
    return null;
  }

  const [payment, items] = await Promise.all([
    getOrderPaymentSummary(detail.orderId),
    listOrderItems(detail.orderId),
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
    [normalizedEmail, orderId]
  );

  return buildOrderDetail(detailResult.rows[0] ?? null);
}

export async function getGuestOrderDetail(orderId: string) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

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
    [orderId]
  );

  return buildOrderDetail(result.rows[0] ?? null);
}

export async function getAdminOrderDetail(orderId: string) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

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
    [orderId]
  );

  return buildOrderDetail(result.rows[0] ?? null);
}

export async function listOrderStatusEvents(orderId: string) {
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
    [orderId]
  );

  return result.rows;
}

export async function listPaymentReviewEvents(paymentId: string) {
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
    [paymentId]
  );

  return result.rows;
}

export async function listPaymentProofs(paymentId: string) {
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
    [paymentId]
  );

  return result.rows;
}

export async function createPaymentProof(
  paymentId: string,
  storageKey: string,
  publicUrl: string | null,
  mimeType: string,
  submittedByEmail: string | null
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await query(
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
  note: string | null
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const transition = PAYMENT_ACTIONS[action];

  if (!transition) {
    throw new Error("Unsupported payment action");
  }

  const paymentOrderResult = await query<{
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
    `,
    [paymentId]
  );

  const orderId = paymentOrderResult.rows[0]?.order_id;
  const currentStatus = paymentOrderResult.rows[0]?.status ?? null;

  if (!orderId) {
    throw new Error("Order not found for payment");
  }

  await query(
    `
      update app.payments
      set
        status = $1,
        reviewed_by_email = $2,
        reviewed_at = timezone('utc', now())
      where id = $3
    `,
    [transition.paymentStatus, actorEmail, paymentId]
  );

  await query(
    `
      insert into app.payment_review_events (
        payment_id,
        actor_email,
        action,
        note
      )
      values ($1, $2, $3, $4)
    `,
    [paymentId, actorEmail, transition.reviewAction, note]
  );

  await query(
    `
      update app.orders
      set
        payment_status = $1,
        status = $2,
        fulfillment_status = $3
      where id = $4
    `,
    [transition.paymentStatus, transition.orderStatus, transition.fulfillmentStatus, orderId]
  );

  await query(
    `
      insert into app.order_status_events (
        order_id,
        from_status,
        to_status,
        actor_type,
        actor_email,
        note
      )
      values ($1, $2, $3, 'admin', $4, $5)
    `,
    [orderId, currentStatus, transition.orderStatus, actorEmail, note]
  );
}
