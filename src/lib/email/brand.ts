import "server-only";

import { serverEnv } from "@/lib/config/server";

/**
 * Email-safe typography stack aligned with app usage and Apple system fonts.
 */
export const EMAIL_FONT_STACK =
  "'SF Pro Text','SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * Theme-aware CSS for clients that support color scheme media queries.
 */
export function buildEmailThemeStyles() {
  return `
    <style>
      .hop-email-root {
        margin: 0;
        padding: 24px 16px;
        background: #ffffff;
        color: #111111;
        font-family: ${EMAIL_FONT_STACK};
        font-size: 16px;
        line-height: 1.6;
      }
      .hop-email-shell {
        width: 100%;
        max-width: 680px;
        margin: 0 auto;
        background: transparent;
        border-radius: 0;
        box-shadow: none;
      }
      .hop-email-inner {
        padding: 0;
      }
      .hop-email-legal {
        margin: 24px auto 0;
        font-size: 10px;
        line-height: 1.2;
        color: #6b7280;
        font-family: ${EMAIL_FONT_STACK};
      }
      .hop-email-root h1 {
        margin: 0 0 10px;
        font-size: 34px;
        line-height: 1.15;
        letter-spacing: -0.02em;
        font-weight: 650;
        color: #111111;
      }
      .hop-email-root h2 {
        margin: 22px 0 8px;
        font-size: 20px;
        line-height: 1.25;
        letter-spacing: -0.01em;
        font-weight: 600;
        color: #111111;
      }
      .hop-email-root p {
        margin: 0 0 12px;
        font-size: 15px;
        line-height: 1.65;
        color: #374151;
      }
      .hop-email-root a {
        color: #0f3d2e;
        text-decoration: underline;
        text-underline-offset: 2px;
        font-weight: 600;
      }
      .hop-email-root ul {
        margin: 0 0 14px 18px;
        padding: 0;
      }
      .hop-email-root li {
        margin: 0 0 6px;
        color: #374151;
      }
      .hop-email-root div,
      .hop-email-root table,
      .hop-email-root tbody,
      .hop-email-root tr,
      .hop-email-root td {
        background: transparent !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      @media (max-width: 640px) {
        .hop-email-root { padding: 18px 12px; }
      }
    </style>
  `;
}
/**
 * Builds a typography-first lockup for stable rendering in restrictive email clients.
 */
export function buildEmailBrandLockup() {
  return `
    <div style="margin-bottom:18px;font-family:${EMAIL_FONT_STACK};">
      <p style="margin:0;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;font-weight:600;">
        House of Prax
      </p>
    </div>
  `;
}
export function buildEditorialEmail(input: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  highlight?: string;
  reference?: string;
  facts?: string[];
  action?: string;
  block?: string;
  cta?: { label: string; url: string };
  footnote?: string;
}) {
  const facts = (input.facts ?? []).slice(0, 3);
  const supportUrl = `${serverEnv.public.appUrl}/support`;
  const helpUrl = `${serverEnv.public.appUrl}/help`;
  const termsUrl = `${serverEnv.public.appUrl}/terms`;
  const privacyUrl = `${serverEnv.public.appUrl}/privacy`;

  return `
    ${buildEmailThemeStyles()}
    <div class="hop-email-root">
      <div class="hop-email-shell">
        <div class="hop-email-inner">
          ${buildEmailBrandLockup()}
          <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;font-family:${EMAIL_FONT_STACK};">
            ${input.eyebrow}
          </p>
          <h1 style="font-size:28px;font-weight:600;letter-spacing:-0.02em;margin:0 0 12px;font-family:${EMAIL_FONT_STACK};">
            ${input.title}
          </h1>
          ${
            input.subtitle
              ? `<p style="font-size:15px;color:#374151;margin:0 0 20px;font-family:${EMAIL_FONT_STACK};">${input.subtitle}</p>`
              : ""
          }
          ${
            input.highlight
              ? `<p style="font-size:22px;font-weight:600;letter-spacing:-0.01em;margin:24px 0 8px;color:#111111;font-family:${EMAIL_FONT_STACK};">${input.highlight}</p>`
              : ""
          }
          ${
            input.reference
              ? `<p style="font-size:12px;letter-spacing:0.08em;color:#6b7280;margin:0 0 20px;font-family:${EMAIL_FONT_STACK};">${input.reference}</p>`
              : ""
          }
          ${facts
            .map(
              (fact) =>
                `<p style="font-size:14px;color:#374151;margin:6px 0;font-family:${EMAIL_FONT_STACK};">${fact}</p>`
            )
            .join("")}
          ${
            input.action
              ? `<p style="font-size:14px;margin:20px 0;font-family:${EMAIL_FONT_STACK};">${input.action}</p>`
              : ""
          }
          ${
            input.block
              ? `<div style="margin:28px 0;font-family:${EMAIL_FONT_STACK};">${input.block}</div>`
              : ""
          }
          ${
            input.cta
              ? `<p style="margin:24px 0 0;font-family:${EMAIL_FONT_STACK};"><a href="${input.cta.url}" style="font-size:14px;font-weight:500;color:#0f172a;text-decoration:underline;">${input.cta.label}</a></p>`
              : ""
          }
          ${
            input.footnote
              ? `<p style="font-size:12px;color:#9ca3af;margin:20px 0 0;font-family:${EMAIL_FONT_STACK};">${input.footnote}</p>`
              : ""
          }
          <p class="hop-email-legal" style="margin-top:24px;">
            Need help? <a href="${supportUrl}">Contact support</a> or visit <a href="${helpUrl}">Help Center</a>.
          </p>
          <p style="font-size:11px;color:#9ca3af;margin:40px 0 0;font-family:${EMAIL_FONT_STACK};">
            &copy; ${new Date().getFullYear()} House of Prax
          </p>
        </div>
      </div>
    </div>
  `;
}