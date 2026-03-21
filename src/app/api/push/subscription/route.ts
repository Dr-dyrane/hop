import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import {
  deactivateAllPushSubscriptionsForEmail,
  deactivatePushSubscriptionForEmail,
  savePushSubscriptionForEmail,
} from "@/lib/db/repositories/push-subscription-repository";

type PushSubscriptionBody = {
  subscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  endpoint?: string;
};

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PushSubscriptionBody | null;
  const subscription = body?.subscription;

  if (
    !subscription?.endpoint?.trim() ||
    !subscription.keys?.p256dh?.trim() ||
    !subscription.keys?.auth?.trim()
  ) {
    return NextResponse.json({ ok: false, error: "Push subscription required." }, { status: 400 });
  }

  await savePushSubscriptionForEmail(
    session.email,
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userAgent: request.headers.get("user-agent"),
    },
    session.role
  );

  return NextResponse.json({ ok: true, workspacePushEnabled: true });
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PushSubscriptionBody | null;
  const endpoint = body?.endpoint?.trim();

  if (endpoint) {
    await deactivatePushSubscriptionForEmail(session.email, endpoint, session.role);
  } else {
    await deactivateAllPushSubscriptionsForEmail(session.email, session.role);
  }

  return NextResponse.json({ ok: true, workspacePushEnabled: false });
}
