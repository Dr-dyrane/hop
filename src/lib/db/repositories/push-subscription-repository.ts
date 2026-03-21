import "server-only";

import type { QueryResult, QueryResultRow } from "pg";
import {
  isDatabaseConfigured,
  query,
  withTransaction,
} from "@/lib/db/client";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import type { WorkspacePushSubscription } from "@/lib/db/types";

type WorkspaceRole = "customer" | "admin";

export type WebPushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSubscription(input: WebPushSubscriptionInput | null | undefined) {
  const endpoint = input?.endpoint?.trim() ?? "";
  const p256dh = input?.keys?.p256dh?.trim() ?? "";
  const auth = input?.keys?.auth?.trim() ?? "";
  const userAgent = normalizeOptionalText(input?.userAgent);

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    p256dh,
    auth,
    userAgent,
  };
}

async function syncWorkspacePushPreference(
  queryFn: <TRow extends QueryResultRow>(
    text: string,
    values?: unknown[]
  ) => Promise<QueryResult<TRow>>,
  userId: string
) {
  await queryFn(
    `
      insert into app.notification_preferences (
        user_id,
        workspace_push_enabled
      )
      values (
        $1,
        exists (
          select 1
          from app.push_subscriptions
          where user_id = $1
            and is_active = true
        )
      )
      on conflict (user_id)
      do update set
        workspace_push_enabled = exists (
          select 1
          from app.push_subscriptions
          where user_id = $1
            and is_active = true
        ),
        updated_at = timezone('utc', now())
    `,
    [userId]
  );
}

export async function savePushSubscriptionForEmail(
  email: string,
  input: WebPushSubscriptionInput,
  role: WorkspaceRole = "customer"
) {
  const normalizedEmail = normalizeEmail(email);
  const subscription = normalizeSubscription(input);

  if (!normalizedEmail || !subscription || !isDatabaseConfigured()) {
    throw new Error("Push notifications are unavailable.");
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Push notifications are unavailable.");
  }

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        insert into app.push_subscriptions (
          user_id,
          endpoint,
          p256dh,
          auth,
          user_agent,
          is_active,
          last_seen_at
        )
        values ($1, $2, $3, $4, $5, true, timezone('utc', now()))
        on conflict (endpoint)
        do update set
          user_id = excluded.user_id,
          p256dh = excluded.p256dh,
          auth = excluded.auth,
          user_agent = excluded.user_agent,
          is_active = true,
          last_seen_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
      `,
      [
        user.userId,
        subscription.endpoint,
        subscription.p256dh,
        subscription.auth,
        subscription.userAgent,
      ]
    );

    await syncWorkspacePushPreference(queryFn, user.userId);
  }, {
    actor: {
      userId: user.userId,
      email: normalizedEmail,
      role,
    },
  });
}

export async function deactivatePushSubscriptionForEmail(
  email: string,
  endpoint: string,
  role: WorkspaceRole = "customer"
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedEndpoint = endpoint.trim();

  if (!normalizedEmail || !normalizedEndpoint || !isDatabaseConfigured()) {
    return;
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    return;
  }

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        update app.push_subscriptions
        set
          is_active = false,
          last_seen_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        where user_id = $1
          and endpoint = $2
      `,
      [user.userId, normalizedEndpoint]
    );

    await syncWorkspacePushPreference(queryFn, user.userId);
  }, {
    actor: {
      userId: user.userId,
      email: normalizedEmail,
      role,
    },
  });
}

export async function deactivateAllPushSubscriptionsForEmail(
  email: string,
  role: WorkspaceRole = "customer"
) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return;
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    return;
  }

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        update app.push_subscriptions
        set
          is_active = false,
          last_seen_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        where user_id = $1
          and is_active = true
      `,
      [user.userId]
    );

    await syncWorkspacePushPreference(queryFn, user.userId);
  }, {
    actor: {
      userId: user.userId,
      email: normalizedEmail,
      role,
    },
  });
}

export async function listActivePushSubscriptionsForEmails(emails: string[]) {
  const normalizedEmails = Array.from(
    new Set(emails.map((email) => normalizeEmail(email)).filter(Boolean))
  );

  if (!isDatabaseConfigured() || normalizedEmails.length === 0) {
    return [] as WorkspacePushSubscription[];
  }

  const result = await query<WorkspacePushSubscription>(
    `
      select
        ps.id as "subscriptionId",
        u.id as "userId",
        u.email as email,
        ps.endpoint,
        ps.p256dh,
        ps.auth,
        ps.user_agent as "userAgent",
        ps.is_active as "isActive",
        ps.last_seen_at as "lastSeenAt"
      from app.push_subscriptions ps
      inner join app.users u
        on u.id = ps.user_id
      left join app.notification_preferences np
        on np.user_id = u.id
      where lower(u.email::text) = any($1::text[])
        and ps.is_active = true
        and coalesce(np.workspace_push_enabled, false) = true
      order by ps.updated_at desc, ps.created_at desc
    `,
    [normalizedEmails]
  );

  return result.rows;
}

export async function deactivatePushSubscriptionsByEndpoints(endpoints: string[]) {
  const normalizedEndpoints = Array.from(
    new Set(endpoints.map((endpoint) => endpoint.trim()).filter(Boolean))
  );

  if (!isDatabaseConfigured() || normalizedEndpoints.length === 0) {
    return;
  }

  const impactedUsers = await query<{ userId: string }>(
    `
      select distinct user_id as "userId"
      from app.push_subscriptions
      where endpoint = any($1::text[])
    `,
    [normalizedEndpoints]
  );

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        update app.push_subscriptions
        set
          is_active = false,
          last_seen_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        where endpoint = any($1::text[])
      `,
      [normalizedEndpoints]
    );

    for (const row of impactedUsers.rows) {
      await syncWorkspacePushPreference(queryFn, row.userId);
    }
  });
}
