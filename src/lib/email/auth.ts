import "server-only";

import {
  EMAIL_FONT_STACK,
  buildEmailBrandLockup,
  buildEmailThemeStyles,
} from "@/lib/email/brand";
import { sendResendEmail } from "@/lib/email/resend";

function buildEmailOtpHtml(code: string) {
  return `
    ${buildEmailThemeStyles()}
    <div class="hop-email-root">
      <div class="hop-email-shell">
      <div class="hop-email-inner">
        ${buildEmailBrandLockup()}
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6b7280;font-weight:600;font-family:${EMAIL_FONT_STACK};">House of Prax</div>
        <h1 style="margin:14px 0 10px;font-size:32px;line-height:1.08;color:#111827;font-weight:700;font-family:${EMAIL_FONT_STACK};">Your sign-in code</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4b5563;font-family:${EMAIL_FONT_STACK};">Use this code to continue into the House of Prax portal.</p>
        <div style="display:inline-block;border-radius:24px;background:#eef2ef;padding:16px 22px;font-size:32px;letter-spacing:0.28em;font-weight:600;color:#0f3d2e;font-family:${EMAIL_FONT_STACK};">${code}</div>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b7280;font-family:${EMAIL_FONT_STACK};">This code expires soon. If you did not request it, you can ignore this email.</p>
      </div>
      </div>
    </div>
  `;
}

export async function sendEmailOtp(input: { email: string; code: string }) {
  await sendResendEmail({
    to: input.email,
    subject: "Your House of Prax sign-in code",
    text: `Your House of Prax sign-in code is ${input.code}.`,
    html: buildEmailOtpHtml(input.code),
  });
}
