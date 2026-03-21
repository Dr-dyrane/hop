"use client";

import { useEffect, useState } from "react";
import { PreferenceToggleRow } from "@/components/forms/PreferenceToggleRow";
import { publicEnv } from "@/lib/config/public";

type WorkspacePushPreferenceRowProps = {
  label: string;
  detail: string;
  value: boolean;
  onChange: (nextValue: boolean) => void;
};

type PushCapability = {
  supported: boolean;
  detail: string;
};

function getPushCapability(): PushCapability {
  if (typeof window === "undefined") {
    return {
      supported: false,
      detail: "Checking device",
    };
  }

  if (!publicEnv.webPushPublicKey) {
    return {
      supported: false,
      detail: "Not configured",
    };
  }

  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return {
      supported: false,
      detail: "Not supported here",
    };
  }

  if (
    !window.isSecureContext &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return {
      supported: false,
      detail: "Secure context required",
    };
  }

  return {
    supported: true,
    detail:
      Notification.permission === "denied"
        ? "Browser blocked"
        : "This device",
  };
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(normalized);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

function isRuntimeServiceWorkerRegistration(registration: ServiceWorkerRegistration) {
  const urls = [
    registration.active?.scriptURL,
    registration.waiting?.scriptURL,
    registration.installing?.scriptURL,
  ].filter((value): value is string => Boolean(value));

  return urls.some((url) => {
    try {
      return new URL(url).pathname === "/hop-runtime-sw.js";
    } catch {
      return false;
    }
  });
}

async function ensureRuntimeRegistration() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const existing = registrations.find((registration) =>
    isRuntimeServiceWorkerRegistration(registration)
  );

  if (existing) {
    return existing;
  }

  return navigator.serviceWorker.register("/hop-runtime-sw.js", { scope: "/" });
}

async function readResponsePayload(response: Response) {
  return (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string }
    | null;
}

export function WorkspacePushPreferenceRow({
  label,
  detail,
  value,
  onChange,
}: WorkspacePushPreferenceRowProps) {
  const [capability, setCapability] = useState<PushCapability>({
    supported: false,
    detail: "Checking device",
  });
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCapability(getPushCapability());
  }, []);

  async function handleToggle(nextValue: boolean) {
    if (!capability.supported || isPending) {
      return;
    }

    setIsPending(true);
    setFeedback(null);

    try {
      if (nextValue) {
        const permission =
          Notification.permission === "granted"
            ? "granted"
            : await Notification.requestPermission();

        if (permission !== "granted") {
          setCapability(getPushCapability());
          setFeedback(
            permission === "denied" ? "Browser blocked" : "Permission dismissed"
          );
          onChange(false);
          return;
        }

        const registration = await ensureRuntimeRegistration();
        const existingSubscription =
          await registration.pushManager.getSubscription();
        const subscription =
          existingSubscription ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              publicEnv.webPushPublicKey
            ),
          }));

        const response = await fetch("/api/push/subscription", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
          }),
        });
        const payload = await readResponsePayload(response);

        if (!response.ok || payload?.ok === false) {
          throw new Error(payload?.error || "Unable to enable push.");
        }

        onChange(true);
        setFeedback("Live on this device");
        return;
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      const registration =
        registrations.find((candidate) =>
          isRuntimeServiceWorkerRegistration(candidate)
        ) ?? null;
      const subscription = registration
        ? await registration.pushManager.getSubscription()
        : null;

      const response = await fetch("/api/push/subscription", {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription?.endpoint ?? null,
        }),
      });
      const payload = await readResponsePayload(response);

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || "Unable to disable push.");
      }

      if (subscription) {
        await subscription.unsubscribe().catch(() => undefined);
      }

      onChange(false);
      setFeedback("Off on this device");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Push preference unavailable."
      );
    } finally {
      setCapability(getPushCapability());
      setIsPending(false);
    }
  }

  const rowDetail = isPending
    ? "Updating"
    : feedback ?? (capability.supported ? detail : capability.detail);

  return (
    <PreferenceToggleRow
      label={label}
      detail={rowDetail}
      value={value}
      onChange={handleToggle}
      disabled={isPending || !capability.supported}
    />
  );
}
