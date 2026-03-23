import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import { serverEnv } from "@/lib/config/server";
import { applyWorkspaceNotificationState } from "@/lib/db/repositories/notification-preferences-repository";
import type { WorkspaceNotification } from "@/lib/db/types";

type PendingWorkspaceNotification = Omit<WorkspaceNotification, "isRead">;

type CustomerOrderNotificationRow = {
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: string;
};

type CustomerReturnNotificationRow = {
  returnCaseId: string;
  orderId: string;
  orderNumber: string;
  status: string;
  createdAt: string;
};

type AdminOrderRequestRow = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
};

type AdminPaymentNotificationRow = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: string;
  createdAt: string;
};

type AdminDispatchNotificationRow = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
};

type AdminReturnNotificationRow = {
  returnCaseId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
};

type AdminLowStockNotificationRow = {
  productId: string;
  productName: string;
  variantName: string;
  availableUnits: number;
  reorderThreshold: number;
  createdAt: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildCustomerActor(email: string) {
  const normalizedEmail = normalizeEmail(email);

  return {
    email: normalizedEmail,
    role: "customer",
  } as const;
}

function buildAdminActor(email: string) {
  const normalizedEmail = normalizeEmail(email);

  return {
    email: normalizedEmail,
    role: "admin",
  } as const;
}

function sortAndLimit<T extends { createdAt: string }>(notifications: T[], limit: number) {
  return notifications
    .sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })
    .slice(0, limit);
}

function isLocalOidcRefreshError(error: unknown) {
  if (!serverEnv.isDevelopment) {
    return false;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("vercel oidc token") ||
    message.includes("oidc token") ||
    message.includes("oidc refresh")
  );
}

function handleNotificationReadFailure(
  scope: "customer" | "admin",
  error: unknown
) {
  if (!isLocalOidcRefreshError(error)) {
    throw error;
  }

  console.warn(
    `[workspace-notifications:${scope}] Falling back to an empty notification list in development because local Vercel OIDC refresh failed.`,
    error
  );

  return [] as WorkspaceNotification[];
}

function mapCustomerOrderNotification(
  row: CustomerOrderNotificationRow
): PendingWorkspaceNotification | null {
  if (row.status === "checkout_draft") {
    return {
      notificationId: `order:${row.orderId}`,
      eventKey: "workspace",
      title: "Request received",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "default",
      icon: "order",
    };
  }

  if (row.status === "awaiting_transfer") {
    return {
      notificationId: `order:${row.orderId}`,
      eventKey: "workspace",
      title: "Transfer ready",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "warning",
      icon: "payment",
    };
  }

  if (row.status === "payment_submitted" || row.status === "payment_under_review") {
    return {
      notificationId: `order:${row.orderId}`,
      eventKey: "workspace",
      title: "Payment in review",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "warning",
      icon: "payment",
    };
  }

  if (row.status === "payment_confirmed") {
    return {
      notificationId: `order:${row.orderId}`,
      eventKey: "workspace",
      title: "Payment confirmed",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "success",
      icon: "payment",
    };
  }

  if (row.status === "out_for_delivery") {
    return {
      notificationId: `order:${row.orderId}`,
      eventKey: "workspace",
      title: "Out for delivery",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "default",
      icon: "delivery",
    };
  }

  if (row.status === "delivered") {
    return {
      notificationId: `order:${row.orderId}`,
      eventKey: "workspace",
      title: "Delivered",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "success",
      icon: "delivery",
    };
  }

  if (row.status === "cancelled" || row.status === "expired") {
    return {
      notificationId: `order:${row.orderId}`,
      eventKey: "workspace",
      title: "Order closed",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "warning",
      icon: "alert",
    };
  }

  return null;
}

function mapCustomerReturnNotification(
  row: CustomerReturnNotificationRow
): PendingWorkspaceNotification | null {
  if (row.status === "approved") {
    return {
      notificationId: `return:${row.returnCaseId}`,
      eventKey: "workspace",
      title: "Return approved",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "success",
      icon: "return",
    };
  }

  if (row.status === "rejected") {
    return {
      notificationId: `return:${row.returnCaseId}`,
      eventKey: "workspace",
      title: "Return not approved",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "warning",
      icon: "return",
    };
  }

  if (row.status === "received") {
    return {
      notificationId: `return:${row.returnCaseId}`,
      eventKey: "workspace",
      title: "Return received",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "default",
      icon: "return",
    };
  }

  if (row.status === "refunded") {
    return {
      notificationId: `return:${row.returnCaseId}`,
      eventKey: "workspace",
      title: "Refund sent",
      detail: `#${row.orderNumber}`,
      href: `/account/orders/${row.orderId}`,
      createdAt: row.createdAt,
      tone: "success",
      icon: "return",
    };
  }

  return null;
}

export async function listWorkspaceNotificationsForCustomer(
  email: string,
  limit = 8
) {
  if (!email || !isDatabaseConfigured()) {
    return [] as WorkspaceNotification[];
  }

  const normalizedEmail = normalizeEmail(email);
  const actor = buildCustomerActor(normalizedEmail);
  const orderStatuses = [
    "checkout_draft",
    "awaiting_transfer",
    "payment_submitted",
    "payment_under_review",
    "payment_confirmed",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "expired",
  ];
  const returnStatuses = ["approved", "rejected", "received", "refunded"];

  try {
    const [ordersResult, returnsResult] = await Promise.all([
      query<CustomerOrderNotificationRow>(
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
          coalesce(
            case
              when o.status = 'delivered' then o.delivered_at
              when o.status in ('cancelled', 'expired') then o.cancelled_at
              when o.status = 'payment_confirmed' then o.confirmed_at
              when o.status in ('payment_submitted', 'payment_under_review') then p.submitted_at
              else o.placed_at
            end,
            o.placed_at
          ) as "createdAt"
        from app.orders o
        left join app.payments p
          on p.order_id = o.id
        left join matched_user mu
          on true
        where (
          (mu.id is not null and o.user_id = mu.id)
          or lower(o.customer_email) = $1
        )
          and o.status = any($2::text[])
        order by "createdAt" desc
        limit $3
      `,
        [normalizedEmail, orderStatuses, limit],
        { actor }
      ),
      query<CustomerReturnNotificationRow>(
        `
        with matched_user as (
          select id
          from app.users
          where lower(email) = $1
          limit 1
        )
        select
          rc.id as "returnCaseId",
          rc.order_id as "orderId",
          o.public_order_number as "orderNumber",
          rc.status,
          coalesce(
            case
              when rc.status = 'refunded' then rc.refunded_at
              when rc.status = 'received' then rc.received_at
              else rc.reviewed_at
            end,
            rc.created_at
          ) as "createdAt"
        from app.order_return_cases rc
        join app.orders o
          on o.id = rc.order_id
        left join matched_user mu
          on true
        where (
          (mu.id is not null and o.user_id = mu.id)
          or lower(o.customer_email) = $1
        )
          and rc.status = any($2::text[])
        order by "createdAt" desc
        limit $3
      `,
        [normalizedEmail, returnStatuses, limit],
        { actor }
      ),
    ]);

    const notifications: PendingWorkspaceNotification[] = [
      ...ordersResult.rows
        .map((row) => mapCustomerOrderNotification(row))
        .filter((row): row is PendingWorkspaceNotification => row !== null),
      ...returnsResult.rows
        .map((row) => mapCustomerReturnNotification(row))
        .filter((row): row is PendingWorkspaceNotification => row !== null),
    ];

    return applyWorkspaceNotificationState(
      normalizedEmail,
      sortAndLimit(notifications, limit)
    );
  } catch (error) {
    return handleNotificationReadFailure("customer", error);
  }
}

export async function listWorkspaceNotificationsForAdmin(email: string, limit = 8) {
  if (!email || !isDatabaseConfigured()) {
    return [] as WorkspaceNotification[];
  }

  const actor = buildAdminActor(email);

  try {
    const [
      requestsResult,
      paymentsResult,
      dispatchResult,
      returnsResult,
      stockResult,
    ] = await Promise.all([
      query<AdminOrderRequestRow>(
        `
        select
          o.id as "orderId",
          o.public_order_number as "orderNumber",
          o.customer_name as "customerName",
          o.placed_at as "createdAt"
        from app.orders o
        where o.status = 'checkout_draft'
        order by o.placed_at desc
        limit $1
      `,
        [limit],
        { actor }
      ),
      query<AdminPaymentNotificationRow>(
        `
        select
          p.id as "paymentId",
          o.id as "orderId",
          o.public_order_number as "orderNumber",
          o.customer_name as "customerName",
          p.status,
          coalesce(p.submitted_at, p.updated_at, p.created_at) as "createdAt"
        from app.payments p
        join app.orders o
          on o.id = p.order_id
        where p.status in ('submitted', 'under_review')
        order by "createdAt" desc
        limit $1
      `,
        [limit],
        { actor }
      ),
      query<AdminDispatchNotificationRow>(
        `
        select
          o.id as "orderId",
          o.public_order_number as "orderNumber",
          o.customer_name as "customerName",
          coalesce(ose.created_at, o.confirmed_at, o.placed_at) as "createdAt"
        from app.orders o
        left join lateral (
          select created_at
          from app.order_status_events
          where order_id = o.id
            and to_status = 'ready_for_dispatch'
          order by created_at desc
          limit 1
        ) ose
          on true
        where o.status = 'ready_for_dispatch'
        order by "createdAt" desc
        limit $1
      `,
        [limit],
        { actor }
      ),
      query<AdminReturnNotificationRow>(
        `
        select
          rc.id as "returnCaseId",
          rc.order_id as "orderId",
          o.public_order_number as "orderNumber",
          o.customer_name as "customerName",
          rc.created_at as "createdAt"
        from app.order_return_cases rc
        join app.orders o
          on o.id = rc.order_id
        where rc.status = 'requested'
        order by rc.created_at desc
        limit $1
      `,
        [limit],
        { actor }
      ),
      query<AdminLowStockNotificationRow>(
        `
        select
          p.id as "productId",
          coalesce(nullif(p.marketing_name, ''), p.name) as "productName",
          pv.name as "variantName",
          greatest(ii.on_hand - ii.reserved, 0) as "availableUnits",
          ii.reorder_threshold as "reorderThreshold",
          greatest(ii.updated_at, pv.updated_at, p.updated_at) as "createdAt"
        from app.inventory_items ii
        join app.product_variants pv
          on pv.id = ii.variant_id
        join app.products p
          on p.id = pv.product_id
        where ii.reorder_threshold is not null
          and ii.reorder_threshold > 0
          and greatest(ii.on_hand - ii.reserved, 0) <= ii.reorder_threshold
          and p.status = 'active'
          and pv.status = 'active'
          and p.is_available = true
          and p.merchandising_state <> 'hidden'
        order by "availableUnits" asc, "createdAt" desc
        limit $1
      `,
        [limit],
        { actor }
      ),
    ]);

    const notifications: PendingWorkspaceNotification[] = [
      ...requestsResult.rows.map((row) => ({
        notificationId: `request:${row.orderId}`,
        eventKey: "workspace" as const,
        title: "New request",
        detail: `#${row.orderNumber} ${row.customerName}`,
        href: `/admin/orders/${row.orderId}`,
        createdAt: row.createdAt,
        tone: "default" as const,
        icon: "order" as const,
      })),
      ...paymentsResult.rows.map((row) => ({
        notificationId: `payment:${row.paymentId}`,
        eventKey: "workspace" as const,
        title: row.status === "under_review" ? "Proof in review" : "Proof waiting",
        detail: `#${row.orderNumber} ${row.customerName}`,
        href: `/admin/orders/${row.orderId}`,
        createdAt: row.createdAt,
        tone: "warning" as const,
        icon: "payment" as const,
      })),
      ...dispatchResult.rows.map((row) => ({
        notificationId: `dispatch:${row.orderId}`,
        eventKey: "workspace" as const,
        title: "Ready for dispatch",
        detail: `#${row.orderNumber} ${row.customerName}`,
        href: `/admin/delivery`,
        createdAt: row.createdAt,
        tone: "default" as const,
        icon: "delivery" as const,
      })),
      ...returnsResult.rows.map((row) => ({
        notificationId: `return:${row.returnCaseId}`,
        eventKey: "workspace" as const,
        title: "Return request",
        detail: `#${row.orderNumber} ${row.customerName}`,
        href: `/admin/orders/${row.orderId}`,
        createdAt: row.createdAt,
        tone: "warning" as const,
        icon: "return" as const,
      })),
      ...stockResult.rows.map((row) => ({
        notificationId: `stock:${row.productId}:${row.variantName}`,
        eventKey: "workspace" as const,
        title: "Low stock",
        detail: `${row.productName} - ${row.availableUnits}/${row.reorderThreshold}`,
        href: `/admin/catalog/products/${row.productId}`,
        createdAt: row.createdAt,
        tone: "warning" as const,
        icon: "alert" as const,
      })),
    ];

    return applyWorkspaceNotificationState(email, sortAndLimit(notifications, limit));
  } catch (error) {
    return handleNotificationReadFailure("admin", error);
  }
}
