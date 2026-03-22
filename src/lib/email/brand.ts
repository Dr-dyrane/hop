import "server-only";

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
        padding: 36px 16px;
        background: #f4f2ea;
        color: #161616;
        font-family: ${EMAIL_FONT_STACK};
      }
      .hop-email-shell {
        width: 100%;
        max-width: 640px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 30px;
        box-shadow: 0 14px 38px rgba(15, 23, 42, 0.08);
      }
      .hop-email-inner {
        padding: 34px;
      }
      .hop-email-legal {
        margin: 16px auto 0;
        text-align: center;
        font-size: 12px;
        line-height: 1.4;
        color: #88909c;
        font-family: ${EMAIL_FONT_STACK};
      }
      @media (max-width: 640px) {
        .hop-email-root { padding: 24px 10px; }
        .hop-email-inner { padding: 24px; }
      }
      @media (prefers-color-scheme: dark) {
        .hop-email-root {
          background: #0f1210 !important;
          color: #e9e4d9 !important;
        }
        .hop-email-shell {
          background: #181d18 !important;
          box-shadow: 0 18px 54px rgba(0, 0, 0, 0.42) !important;
        }
        .hop-email-legal {
          color: rgba(233, 228, 217, 0.6) !important;
        }
      }
    </style>
  `;
}

/**
 * Builds a typography-first lockup for stable rendering in restrictive email clients.
 */
export function buildEmailBrandLockup() {
  return `
    <div style="margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid rgba(15,23,42,0.08);font-family:${EMAIL_FONT_STACK};">
      <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;font-weight:500;">
        House of Prax
      </div>
      <div style="margin-top:7px;font-size:20px;line-height:1.2;letter-spacing:-0.01em;color:#111827;font-weight:500;">
        Official updates
      </div>
    </div>
  `;
}
