import "server-only";

import { serverEnv } from "../config/server";

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
        box-shadow: 0 18px 54px rgba(15, 23, 42, 0.08);
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
 * Builds a refined email header using PNG assets for broad client support.
 */
export function buildEmailBrandLockup() {
  const appUrl = serverEnv.public.appUrl.replace(/\/$/, "");
  const markUrl = `${appUrl}/images/icon.png`;
  const brandUrl = `${appUrl}/images/prax_brand.png`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;border-collapse:collapse;">
      <tr>
        <td style="padding:0 12px 0 0;vertical-align:middle;width:34px;">
          <img 
            src="${markUrl}" 
            alt="H" 
            width="30" 
            height="30" 
            style="display:block;width:30px;height:30px;border-radius:9px;" 
          />
        </td>
        <td style="vertical-align:middle;">
          <img
            src="${brandUrl}"
            alt="House of Prax"
            width="148"
            style="display:block;width:148px;height:auto;max-width:100%;"
          />
        </td>
      </tr>
    </table>
  `;
}
