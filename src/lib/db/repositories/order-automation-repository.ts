import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import { expireStaleAwaitingTransferOrders } from "@/lib/db/repositories/orders-repository";
import {
  sendPaymentQueueReminderNotification,
  sendReviewReminderNotification,
  sendReturnQueueReminderNotification,
  sendTransferReminderNotification,
} from "@/lib/email/orders";

const TRANSFER_REMINDER_WINDOW_MINUTES = 15;
const PAYMENT_QUEUE_REMINDER_DELAY_MINUTES = 30;
const REVIEW_REMINDER_DELAY_HOURS = 12;
const RETURN_QUEUE_REMINDER_DELAY_HOURS = 18;

type TransferReminderCandidate = {
  orderId: string;
  paymentId: string;
};

type ReviewReminderCandidate = {
  orderId: string;
  requestId: string;
};

type PaymentQueueReminderCandidate = {
  orderId: string;
  paymentId: string;
};

type ReturnQueueReminderCandidate = {
  orderId: string;
  returnCaseId: string;
  status: "requested" | "approved" | "received";
};

export type OrderAutomationRunResult = {
  expiredOrders: number;
  transferRemindersSent: number;
  paymentQueueRemindersSent: number;
  reviewRemindersSent: number;
  returnQueueRemindersSent: number;
};

async function listTransferReminderCandidates(limit: number) {
  if (!isDatabaseConfigured()) {
    return [] satisfies TransferReminderCandidate[];
  }

  const result = await query<TransferReminderCandidate>(
    `
      select
        o.id as "orderId",
        p.id as "paymentId"
      from app.orders o
      inner join app.payments p
        on p.order_id = o.id
      where o.status = 'awaiting_transfer'
        and p.status = 'awaiting_transfer'
        and o.customer_email is not null
        and o.transfer_deadline_at is not null
        and o.transfer_deadline_at > timezone('utc', now())
        and o.transfer_deadline_at <= timezone('utc', now()) + ($1::int * interval '1 minute')
        and coalesce(p.customer_reminder_count, 0) = 0
      order by o.transfer_deadline_at asc
      limit $2
    `,
    [TRANSFER_REMINDER_WINDOW_MINUTES, limit],
    {
      actor: {
        role: "admin",
      },
    }
  );

  return result.rows;
}

async function markTransferReminderSent(paymentId: string) {
  await query(
    `
      update app.payments
      set
        last_customer_reminder_at = timezone('utc', now()),
        customer_reminder_count = customer_reminder_count + 1
      where id = $1
    `,
    [paymentId],
    {
      actor: {
        role: "admin",
      },
    }
  );
}

async function listPaymentQueueReminderCandidates(limit: number) {
  if (!isDatabaseConfigured()) {
    return [] satisfies PaymentQueueReminderCandidate[];
  }

  const result = await query<PaymentQueueReminderCandidate>(
    `
      select
        o.id as "orderId",
        p.id as "paymentId"
      from app.orders o
      inner join app.payments p
        on p.order_id = o.id
      where p.status in ('submitted', 'under_review')
        and (
          (p.submitted_at is not null and p.submitted_at <= timezone('utc', now()) - ($1::int * interval '1 minute'))
          or (p.submitted_at is null and p.created_at <= timezone('utc', now()) - ($1::int * interval '1 minute'))
        )
        and coalesce(p.admin_reminder_count, 0) = 0
      order by coalesce(p.submitted_at, p.created_at) asc
      limit $2
    `,
    [PAYMENT_QUEUE_REMINDER_DELAY_MINUTES, limit],
    {
      actor: {
        role: "admin",
      },
    }
  );

  return result.rows;
}

async function markPaymentQueueReminderSent(paymentId: string) {
  await query(
    `
      update app.payments
      set
        last_admin_reminder_at = timezone('utc', now()),
        admin_reminder_count = admin_reminder_count + 1
      where id = $1
    `,
    [paymentId],
    {
      actor: {
        role: "admin",
      },
    }
  );
}

async function listReviewReminderCandidates(limit: number) {
  if (!isDatabaseConfigured()) {
    return [] satisfies ReviewReminderCandidate[];
  }

  const result = await query<ReviewReminderCandidate>(
    `
      select
        rr.order_id as "orderId",
        rr.id as "requestId"
      from app.review_requests rr
      inner join app.orders o
        on o.id = rr.order_id
      left join app.reviews r
        on r.order_id = rr.order_id
      where rr.status = 'pending'
        and r.id is null
        and o.status = 'delivered'
        and o.customer_email is not null
        and o.delivered_at is not null
        and o.delivered_at <= timezone('utc', now()) - ($1::int * interval '1 hour')
        and (rr.expires_at is null or rr.expires_at > timezone('utc', now()))
        and coalesce(rr.reminder_count, 0) = 0
      order by o.delivered_at asc
      limit $2
    `,
    [REVIEW_REMINDER_DELAY_HOURS, limit],
    {
      actor: {
        role: "admin",
      },
    }
  );

  return result.rows;
}

async function markReviewReminderSent(requestId: string) {
  await query(
    `
      update app.review_requests
      set
        last_reminder_sent_at = timezone('utc', now()),
        reminder_count = reminder_count + 1
      where id = $1
    `,
    [requestId],
    {
      actor: {
        role: "admin",
      },
    }
  );
}

async function listReturnQueueReminderCandidates(limit: number) {
  if (!isDatabaseConfigured()) {
    return [] satisfies ReturnQueueReminderCandidate[];
  }

  const result = await query<ReturnQueueReminderCandidate>(
    `
      select
        rc.order_id as "orderId",
        rc.id as "returnCaseId",
        rc.status
      from app.order_return_cases rc
      where rc.status in ('requested', 'approved', 'received')
        and rc.updated_at <= timezone('utc', now()) - ($1::int * interval '1 hour')
        and coalesce(rc.admin_reminder_count, 0) = 0
      order by rc.updated_at asc
      limit $2
    `,
    [RETURN_QUEUE_REMINDER_DELAY_HOURS, limit],
    {
      actor: {
        role: "admin",
      },
    }
  );

  return result.rows;
}

async function markReturnQueueReminderSent(returnCaseId: string) {
  await query(
    `
      update app.order_return_cases
      set
        last_admin_reminder_at = timezone('utc', now()),
        admin_reminder_count = admin_reminder_count + 1
      where id = $1
    `,
    [returnCaseId],
    {
      actor: {
        role: "admin",
      },
    }
  );
}

export async function runOrderAutomationPass(limitPerKind = 25) {
  if (!isDatabaseConfigured()) {
    return {
      expiredOrders: 0,
      transferRemindersSent: 0,
      paymentQueueRemindersSent: 0,
      reviewRemindersSent: 0,
      returnQueueRemindersSent: 0,
    } satisfies OrderAutomationRunResult;
  }

  const expiredOrders = await expireStaleAwaitingTransferOrders();
  let transferRemindersSent = 0;
  let paymentQueueRemindersSent = 0;
  let reviewRemindersSent = 0;
  let returnQueueRemindersSent = 0;

  const transferCandidates = await listTransferReminderCandidates(limitPerKind);

  for (const candidate of transferCandidates) {
    const sent = await sendTransferReminderNotification({
      orderId: candidate.orderId,
    });

    if (sent) {
      await markTransferReminderSent(candidate.paymentId);
      transferRemindersSent += 1;
    }
  }

  const paymentQueueCandidates = await listPaymentQueueReminderCandidates(limitPerKind);

  for (const candidate of paymentQueueCandidates) {
    const sent = await sendPaymentQueueReminderNotification({
      orderId: candidate.orderId,
    });

    if (sent) {
      await markPaymentQueueReminderSent(candidate.paymentId);
      paymentQueueRemindersSent += 1;
    }
  }

  const reviewCandidates = await listReviewReminderCandidates(limitPerKind);

  for (const candidate of reviewCandidates) {
    const sent = await sendReviewReminderNotification({
      orderId: candidate.orderId,
    });

    if (sent) {
      await markReviewReminderSent(candidate.requestId);
      reviewRemindersSent += 1;
    }
  }

  const returnQueueCandidates = await listReturnQueueReminderCandidates(limitPerKind);

  for (const candidate of returnQueueCandidates) {
    const sent = await sendReturnQueueReminderNotification({
      orderId: candidate.orderId,
      status: candidate.status,
    });

    if (sent) {
      await markReturnQueueReminderSent(candidate.returnCaseId);
      returnQueueRemindersSent += 1;
    }
  }

  return {
    expiredOrders,
    transferRemindersSent,
    paymentQueueRemindersSent,
    reviewRemindersSent,
    returnQueueRemindersSent,
  } satisfies OrderAutomationRunResult;
}
