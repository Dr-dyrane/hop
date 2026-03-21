import "server-only";

import webPush from "web-push";
import { hasWebPushConfig, serverEnv } from "@/lib/config/server";
import {
  deactivatePushSubscriptionsByEndpoints,
  listActivePushSubscriptionsForEmails,
} from "@/lib/db/repositories/push-subscription-repository";

type WorkspacePushMessage = {
  title: string;
  body: string;
  href: string;
  tag?: string;
};

let vapidConfigured = false;

function configureWebPush() {
  if (vapidConfigured || !hasWebPushConfig) {
    return;
  }

  webPush.setVapidDetails(
    serverEnv.webPush.subject!,
    serverEnv.webPush.publicKey!,
    serverEnv.webPush.privateKey!
  );
  vapidConfigured = true;
}

function buildNotificationPayload(input: WorkspacePushMessage) {
  const baseUrl = serverEnv.public.appUrl.replace(/\/$/, "");

  return JSON.stringify({
    title: input.title,
    body: input.body,
    href: input.href,
    tag: input.tag ?? null,
    icon: `${baseUrl}/images/prax_brand.png`,
    badge: `${baseUrl}/images/prax_brand.png`,
  });
}

export async function sendWorkspacePushToEmails(
  emails: string[],
  input: WorkspacePushMessage
) {
  if (!hasWebPushConfig) {
    return false;
  }

  const subscriptions = await listActivePushSubscriptionsForEmails(emails);

  if (subscriptions.length === 0) {
    return false;
  }

  configureWebPush();

  const staleEndpoints = new Set<string>();
  const payload = buildNotificationPayload(input);

  await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
          {
            TTL: 60 * 60,
            topic: input.tag,
          }
        );
      } catch (error) {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof (error as { statusCode?: unknown }).statusCode === "number"
            ? (error as { statusCode: number }).statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.add(subscription.endpoint);
          return;
        }

        console.error("Web push delivery failed:", error);
      }
    })
  );

  if (staleEndpoints.size > 0) {
    await deactivatePushSubscriptionsByEndpoints(Array.from(staleEndpoints));
  }

  return true;
}
