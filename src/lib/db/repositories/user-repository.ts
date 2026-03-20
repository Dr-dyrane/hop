import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";

type UserIdentityRow = {
  userId: string;
  email: string;
};

export async function ensureUserByEmail(
  email: string,
  options: { markSignedIn?: boolean } = {}
) {
  const normalizedEmail = email.trim().toLowerCase();
  const markSignedIn = options.markSignedIn ?? false;

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<UserIdentityRow>(
    `
      insert into app.users (email, status, last_signed_in_at)
      values ($1, 'active', ${markSignedIn ? "timezone('utc', now())" : "null"})
      on conflict (email)
      do update set
        status = 'active',
        last_signed_in_at = case
          when $2::boolean then timezone('utc', now())
          else app.users.last_signed_in_at
        end,
        updated_at = timezone('utc', now())
      returning id as "userId", email
    `,
    [normalizedEmail, markSignedIn]
  );

  return result.rows[0] ?? null;
}
