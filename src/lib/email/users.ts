import "server-only";

import { serverEnv } from "@/lib/config/server";
import {
  EMAIL_FONT_STACK,
  buildEmailBrandLockup,
  buildEmailThemeStyles,
} from "@/lib/email/brand";
import { sendResendEmail } from "@/lib/email/resend";

function buildInviteLink(isAdmin: boolean) {
  const returnTo = isAdmin ? "/admin" : "/account";
  return `${serverEnv.public.appUrl}/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
}

function buildInviteHtml(input: {
  fullName: string | null;
  isAdmin: boolean;
  href: string;
}) {
  const name = input.fullName?.trim() || "there";

  return `
    ${buildEmailThemeStyles()}
    <div class="hop-email-root">
      <div class="hop-email-shell">
      <div class="hop-email-inner">
        ${buildEmailBrandLockup()}
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6b7280;font-weight:600;font-family:${EMAIL_FONT_STACK};">House of Prax</div>
        <h1 style="margin:14px 0 10px;font-size:32px;line-height:1.08;color:#111827;font-weight:700;font-family:${EMAIL_FONT_STACK};">Your workspace is ready</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4b5563;font-family:${EMAIL_FONT_STACK};">Hi ${name}. Use your email to enter the House of Prax ${input.isAdmin ? "operations console" : "customer portal"}.</p>
        <div style="border-radius:24px;background:#eef2ef;padding:18px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;font-family:${EMAIL_FONT_STACK};">How it works</div>
          <div style="margin-top:8px;font-size:15px;line-height:1.7;color:#374151;font-family:${EMAIL_FONT_STACK};">Tap below, enter this email address, and House of Prax will send you a six-digit sign-in code.</div>
        </div>
        <div style="margin-top:20px;">
          <a href="${input.href}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border-radius:999px;background:#0f3d2e;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;font-family:${EMAIL_FONT_STACK};">
            Open House of Prax
          </a>
        </div>
      </div>
      </div>
    </div>
  `;
}

export async function sendWorkspaceInviteEmail(input: {
  email: string;
  fullName: string | null;
  isAdmin: boolean;
}) {
  const href = buildInviteLink(input.isAdmin);

  await sendResendEmail({
    to: input.email,
    subject: input.isAdmin
      ? "You have House of Prax admin access"
      : "Your House of Prax account is ready",
    text: `Use your email to sign in to House of Prax: ${href}`,
    html: buildInviteHtml({
      fullName: input.fullName,
      isAdmin: input.isAdmin,
      href,
    }),
  });
}
