"use server";

import { redirect } from "next/navigation";
import { clearCurrentSession, clearPendingAuthChallenge, getPendingAuthChallenge, setCurrentSession, setPendingAuthChallenge } from "@/lib/auth/session";
import { resolvePostSignInRedirect, sanitizeReturnTo } from "@/lib/auth/navigation";
import type { AuthActionState } from "@/lib/auth/types";
import { hasEmailDeliveryConfig, serverEnv } from "@/lib/config/server";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;

function normalizeEmail(rawValue: FormDataEntryValue | null) {
  return rawValue?.toString().trim().toLowerCase() || "";
}

function normalizeOtp(rawValue: FormDataEntryValue | null) {
  return rawValue?.toString().replace(/\D/g, "").slice(0, 6) || "";
}

export async function requestEmailOtpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = normalizeEmail(formData.get("email"));
  const returnTo = sanitizeReturnTo(formData.get("returnTo")?.toString());

  if (!EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      message: "Enter a valid email address to continue.",
    };
  }

  if (serverEnv.isProduction && !hasEmailDeliveryConfig) {
    return {
      status: "error",
      message:
        "Email delivery is not configured yet. Add SES or Resend before using production sign-in.",
    };
  }

  const code = serverEnv.isDevelopment
    ? serverEnv.auth.developmentOtpCode
    : Math.floor(100000 + Math.random() * 900000).toString();

  await setPendingAuthChallenge({
    email,
    code,
    returnTo,
  });

  return {
    status: "success",
    message: serverEnv.isDevelopment
      ? "Development OTP generated. Continue to verification."
      : "A sign-in code has been sent to your email address.",
    redirectTo: "/auth/verify",
    developmentOtpCode: serverEnv.isDevelopment ? code : undefined,
  };
}

export async function verifyEmailOtpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const challenge = await getPendingAuthChallenge();
  const code = normalizeOtp(formData.get("code"));

  if (!challenge) {
    return {
      status: "error",
      message: "Your sign-in code has expired. Request a new one.",
    };
  }

  if (!OTP_PATTERN.test(code)) {
    return {
      status: "error",
      message: "Enter the six-digit code from your email.",
    };
  }

  if (code !== challenge.code) {
    return {
      status: "error",
      message: "That code is not correct. Check the latest code and try again.",
    };
  }

  await ensureUserByEmail(challenge.email, { markSignedIn: true });
  const session = await setCurrentSession(challenge.email);

  await clearPendingAuthChallenge();

  return {
    status: "success",
    message: "Signed in.",
    redirectTo: resolvePostSignInRedirect(session, challenge.returnTo),
  };
}

export async function signOutAction() {
  await clearPendingAuthChallenge();
  await clearCurrentSession();
  redirect("/");
}
