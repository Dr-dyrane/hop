import "server-only";

import {
  isDatabaseConfigured,
  query,
  type DatabaseActorContext,
  withTransaction,
} from "@/lib/db/client";
import type {
  AdminReviewRow,
  OrderReviewRequestRow,
  OrderReviewRow,
  PortalPendingReview,
  PortalReviewRow,
} from "@/lib/db/types";

type MatchedUser = {
  userId: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function buildCustomerActor(email: string): DatabaseActorContext | undefined {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "customer",
  };
}

function buildAdminActor(email?: string | null): DatabaseActorContext | undefined {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "admin",
  };
}

async function getMatchedUser(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<MatchedUser>(
    `
      select id as "userId"
      from app.users
      where lower(email) = $1
      limit 1
    `,
    [normalizedEmail]
  );

  return result.rows[0] ?? null;
}

export async function listPendingReviewsForPortal(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return [] satisfies PortalPendingReview[];
  }

  const result = await query<PortalPendingReview>(
    `
      with matched_user as (
        select id
        from app.users
        where lower(email) = $1
        limit 1
      )
      select
        rr.id as "requestId",
        rr.order_id as "orderId",
        o.public_order_number as "orderNumber",
        o.delivered_at as "completedAt",
        o.customer_name as "customerName"
      from app.review_requests rr
      inner join app.orders o
        on o.id = rr.order_id
      left join matched_user mu
        on mu.id = rr.user_id
      left join app.reviews r
        on r.order_id = rr.order_id
      where rr.status = 'pending'
        and r.id is null
        and (
          mu.id is not null
          or lower(o.customer_email) = $1
        )
      order by o.delivered_at desc nulls last, rr.created_at desc
    `,
    [normalizedEmail],
    { actor: buildCustomerActor(normalizedEmail) }
  );

  return result.rows;
}

export async function getOrderReviewRequest(
  orderId: string,
  actor?: DatabaseActorContext
) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<OrderReviewRequestRow>(
    `
      select
        id as "requestId",
        order_id as "orderId",
        status,
        created_at as "createdAt",
        completed_at as "completedAt",
        expires_at as "expiresAt"
      from app.review_requests
      where order_id = $1
      order by created_at desc
      limit 1
    `,
    [orderId],
    { actor }
  );

  return result.rows[0] ?? null;
}

export async function getOrderReview(
  orderId: string,
  actor?: DatabaseActorContext
) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<OrderReviewRow>(
    `
      select
        id as "reviewId",
        order_id as "orderId",
        rating,
        title,
        body,
        status,
        is_featured as "isFeatured",
        created_at as "createdAt",
        moderated_at as "moderatedAt"
      from app.reviews
      where order_id = $1
      order by created_at desc
      limit 1
    `,
    [orderId],
    { actor }
  );

  return result.rows[0] ?? null;
}

export async function listReviewsForPortal(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return [] satisfies PortalReviewRow[];
  }

  const result = await query<PortalReviewRow>(
    `
      with matched_user as (
        select id
        from app.users
        where lower(email) = $1
        limit 1
      )
      select
        r.id as "reviewId",
        r.order_id as "orderId",
        o.public_order_number as "orderNumber",
        r.rating,
        r.title,
        r.body,
        r.status,
        r.is_featured as "isFeatured",
        r.created_at as "createdAt",
        r.moderated_at as "moderatedAt"
      from app.reviews r
      inner join app.orders o
        on o.id = r.order_id
      left join matched_user mu
        on mu.id = r.user_id
      where mu.id is not null
         or lower(o.customer_email) = $1
      order by r.created_at desc
    `,
    [normalizedEmail],
    { actor: buildCustomerActor(normalizedEmail) }
  );

  return result.rows;
}

export async function submitOrderReview(input: {
  orderId: string;
  rating: number;
  title: string | null;
  body: string | null;
  actorEmail?: string | null;
  actorUserId?: string | null;
  guestOrderId?: string | null;
}) {
  const normalizedEmail = normalizeEmail(input.actorEmail ?? "");
  const rating = Math.floor(input.rating);
  const title = input.title?.trim() || null;
  const body = input.body?.trim() || null;

  if (!isDatabaseConfigured()) {
    throw new Error("Review is unavailable.");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Choose a rating.");
  }

  return withTransaction(async (queryFn) => {
    const requestResult = await queryFn<{
      requestId: string;
      orderId: string;
      requestStatus: string;
      orderStatus: string;
      customerEmail: string | null;
      userId: string | null;
    }>(
      `
        select
          rr.id as "requestId",
          rr.order_id as "orderId",
          rr.status as "requestStatus",
          o.status as "orderStatus",
          o.customer_email as "customerEmail",
          o.user_id as "userId"
        from app.review_requests rr
        inner join app.orders o
          on o.id = rr.order_id
        where rr.order_id = $1
        for update
      `,
      [input.orderId]
    );
    const request = requestResult.rows[0] ?? null;

    if (!request) {
      throw new Error("Review request not found.");
    }

    if (request.orderStatus !== "delivered") {
      throw new Error("Review is not available yet.");
    }

    if (request.requestStatus !== "pending") {
      throw new Error("Review already completed.");
    }

    if (request.userId) {
      if (!input.actorUserId || input.actorUserId !== request.userId) {
        throw new Error("Review access denied.");
      }
    } else if (
      !(input.guestOrderId && input.guestOrderId === input.orderId) &&
      (!normalizedEmail || request.customerEmail?.toLowerCase() !== normalizedEmail)
    ) {
      throw new Error("Review access denied.");
    }

    const existingReview = await queryFn<{ reviewId: string }>(
      `
        select id as "reviewId"
        from app.reviews
        where order_id = $1
        limit 1
        for update
      `,
      [input.orderId]
    );

    if (existingReview.rows[0]) {
      throw new Error("Review already submitted.");
    }

    await queryFn(
      `
        insert into app.reviews (
          order_id,
          user_id,
          rating,
          title,
          body,
          status,
          is_featured
        )
        values ($1, $2, $3, $4, $5, 'pending', false)
      `,
      [input.orderId, input.actorUserId ?? request.userId, rating, title, body]
    );

    await queryFn(
      `
        update app.review_requests
        set
          status = 'completed',
          completed_at = timezone('utc', now())
        where id = $1
      `,
      [request.requestId]
    );
  }, {
    actor: {
      email: normalizedEmail || null,
      userId: input.actorUserId ?? null,
      role: "customer",
      guestOrderId: input.guestOrderId ?? null,
    },
  });
}

export async function submitPortalReview(input: {
  email: string;
  orderId: string;
  rating: number;
  title: string | null;
  body: string | null;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const rating = Math.floor(input.rating);
  const title = input.title?.trim() || null;
  const body = input.body?.trim() || null;

  if (!normalizedEmail || !isDatabaseConfigured()) {
    throw new Error("Review is unavailable.");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Choose a rating.");
  }

  const user = await getMatchedUser(normalizedEmail);

  return submitOrderReview({
    orderId: input.orderId,
    rating,
    title,
    body,
    actorEmail: normalizedEmail,
    actorUserId: user?.userId ?? null,
  });
}

export async function listReviewsForAdmin(actorEmail?: string | null) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminReviewRow[];
  }

  const result = await query<AdminReviewRow>(
    `
      select
        r.id as "reviewId",
        r.order_id as "orderId",
        o.public_order_number as "orderNumber",
        o.customer_name as "customerName",
        o.customer_email as "customerEmail",
        r.rating,
        r.title,
        r.body,
        r.status,
        r.is_featured as "isFeatured",
        r.created_at as "createdAt",
        r.moderated_at as "moderatedAt",
        r.moderated_by_email as "moderatedByEmail"
      from app.reviews r
      inner join app.orders o
        on o.id = r.order_id
      order by
        case r.status
          when 'pending' then 0
          when 'approved' then 1
          else 2
        end asc,
        r.created_at desc
    `,
    [],
    { actor: buildAdminActor(actorEmail) }
  );

  return result.rows;
}

export async function moderateReview(input: {
  reviewId: string;
  action: "approve" | "hide" | "feature" | "unfeature";
  actorUserId: string | null;
  actorEmail: string | null;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Review moderation is unavailable.");
  }

  return withTransaction(async (queryFn) => {
    const reviewResult = await queryFn<{
      reviewId: string;
      status: string;
      isFeatured: boolean;
    }>(
      `
        select
          id as "reviewId",
          status,
          is_featured as "isFeatured"
        from app.reviews
        where id = $1
        for update
      `,
      [input.reviewId]
    );
    const review = reviewResult.rows[0] ?? null;

    if (!review) {
      throw new Error("Review not found.");
    }

    switch (input.action) {
      case "approve":
        await queryFn(
          `
            update app.reviews
            set
              status = 'approved',
              moderated_by_user_id = $1,
              moderated_by_email = $2,
              moderated_at = timezone('utc', now())
            where id = $3
          `,
          [input.actorUserId, input.actorEmail, input.reviewId]
        );
        break;
      case "hide":
        await queryFn(
          `
            update app.reviews
            set
              status = 'hidden',
              is_featured = false,
              moderated_by_user_id = $1,
              moderated_by_email = $2,
              moderated_at = timezone('utc', now())
            where id = $3
          `,
          [input.actorUserId, input.actorEmail, input.reviewId]
        );
        break;
      case "feature":
        if (review.status !== "approved") {
          throw new Error("Approve review first.");
        }
        await queryFn(
          `
            update app.reviews
            set
              is_featured = true,
              moderated_by_user_id = $1,
              moderated_by_email = $2,
              moderated_at = timezone('utc', now())
            where id = $3
          `,
          [input.actorUserId, input.actorEmail, input.reviewId]
        );
        break;
      case "unfeature":
        await queryFn(
          `
            update app.reviews
            set
              is_featured = false,
              moderated_by_user_id = $1,
              moderated_by_email = $2,
              moderated_at = timezone('utc', now())
            where id = $3
          `,
          [input.actorUserId, input.actorEmail, input.reviewId]
        );
        break;
      default:
        throw new Error("Unsupported review action.");
    }
  }, {
    actor: {
      userId: input.actorUserId,
      email: input.actorEmail,
      role: "admin",
    },
  });
}
