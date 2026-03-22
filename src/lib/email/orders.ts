import "server-only";

import { formatNgn } from "@/lib/commerce";
import { serverEnv } from "@/lib/config/server";
import {
  EMAIL_FONT_STACK,
  buildEmailBrandLockup,
  buildEmailThemeStyles,
} from "@/lib/email/brand";
import { sendResendEmail } from "@/lib/email/resend";
import { sendWorkspacePushToEmails } from "@/lib/push/web-push";
import {
  getOrderNotificationSnapshot,
  type OrderNotificationSnapshot,
} from "@/lib/db/repositories/order-notification-repository";
import { getWorkspaceNotificationPreference } from "@/lib/db/repositories/notification-preferences-repository";
import { createGuestOrderAccessToken } from "@/lib/orders/access";

function buildShell(input: {
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  footer?: string;
}) {
  return `
    ${buildEmailThemeStyles()}
    <div class="hop-email-root">
      <div class="hop-email-shell">
      <div class="hop-email-inner">
        ${buildEmailBrandLockup()}
        <div style="font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#6b7280;font-weight:600;margin-bottom:10px;font-family:${EMAIL_FONT_STACK};">${input.eyebrow}</div>
        <h1 style="margin:0 0 10px;font-size:34px;line-height:1.08;color:#111827;font-weight:700;letter-spacing:-0.024em;font-family:${EMAIL_FONT_STACK};">${input.title}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#4b5563;font-family:${EMAIL_FONT_STACK};">${input.intro}</p>
        ${input.bodyHtml}
        ${
          input.footer
            ? `<div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(0,0,0,0.06);font-size:13px;line-height:1.6;color:#8b93a0;font-family:${EMAIL_FONT_STACK};">${input.footer}</div>`
            : ""
        }
      </div>
      </div>
      <div class="hop-email-legal">
        &copy; ${new Date().getFullYear()} House of Prax. All rights reserved.
      </div>
    </div>
  `;
}

function formatEmailTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Now";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getEmailImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${serverEnv.public.appUrl.replace(/\/$/, "")}${imageUrl}`;
  }

  return null;
}

function buildProductSpotlight(order: OrderNotificationSnapshot) {
  const firstItem = order.items[0];
  const imageUrl = getEmailImageUrl(firstItem?.imageUrl);

  if (!firstItem || !imageUrl) {
    return "";
  }

  return `
    <div style="margin-top:18px;border-radius:26px;background:#f4f2ea;padding:16px;">
      <img
        src="${imageUrl}"
        alt="${firstItem.title}"
        width="528"
        height="240"
        style="display:block;width:100%;height:240px;object-fit:contain;border-radius:20px;background:radial-gradient(circle at top,rgba(255,255,255,0.92),rgba(243,239,229,0.92) 62%,rgba(230,223,210,0.8) 100%);"
      />
      <div style="margin-top:14px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Featured in this order</div>
      <div style="margin-top:6px;font-size:20px;font-weight:600;color:#111827;font-family:${EMAIL_FONT_STACK};">${firstItem.title}</div>
    </div>
  `;
}

function buildOrderItems(order: OrderNotificationSnapshot) {
  if (order.items.length === 0) {
    return "";
  }

  const visibleItems = order.items.slice(0, 3);

  return `
    <div style="margin-top:18px;border-radius:26px;background:#f4f2ea;padding:8px 14px;">
      ${visibleItems
        .map((item) => {
          const imageUrl = getEmailImageUrl(item.imageUrl);

          return `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:8px 0;">
              <tr>
                <td style="width:${imageUrl ? "70px" : "0"};padding:0;vertical-align:middle;">
                  ${
                    imageUrl
                      ? `<img src="${imageUrl}" alt="${item.title}" width="54" height="54" style="display:block;width:54px;height:54px;object-fit:cover;border-radius:16px;background:#ffffff;" />`
                      : ""
                  }
                </td>
                <td style="padding:0 ${imageUrl ? "14px" : "0"} 0 0;vertical-align:middle;">
                  <div style="font-size:15px;font-weight:600;color:#111827;font-family:${EMAIL_FONT_STACK};">${item.title}</div>
                  <div style="margin-top:4px;font-size:12px;color:#6b7280;font-family:${EMAIL_FONT_STACK};">${item.quantity} &times; ${formatNgn(item.unitPriceNgn)}</div>
                </td>
                <td style="padding:0;vertical-align:middle;text-align:right;">
                  <div style="font-size:15px;font-weight:600;color:#111827;font-family:${EMAIL_FONT_STACK};">${formatNgn(item.lineTotalNgn)}</div>
                </td>
              </tr>
            </table>
          `;
        })
        .join("")}
      ${
        order.items.length > visibleItems.length
          ? `<div style="padding:10px 0 6px;font-size:12px;color:#6b7280;">+${order.items.length - visibleItems.length} more item${order.items.length - visibleItems.length === 1 ? "" : "s"}</div>`
          : ""
      }
    </div>
  `;
}

function buildOrderFacts(order: OrderNotificationSnapshot) {
  return `
    <div style="display:grid;gap:12px;">
      <div style="border-radius:24px;background:#f3f1e9;padding:20px;border:1px solid rgba(0,0,0,0.02);">
        <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6b7280;font-weight:700;margin-bottom:6px;">Order</div>
        <div style="font-size:28px;font-weight:700;color:#111827;letter-spacing:-0.03em;font-family:${EMAIL_FONT_STACK};">#${order.orderNumber}</div>
      </div>
      
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:12px 0;margin:0 -12px;">
        <tr>
          <td width="50%" style="padding:0 12px;vertical-align:top;">
            <div style="border-radius:20px;background:#f8f7f2;padding:14px 16px;border:1px solid rgba(0,0,0,0.01);">
              <div style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#9ca3af;font-weight:700;margin-bottom:4px;">Total</div>
              <div style="font-size:17px;font-weight:600;color:#111827;font-family:${EMAIL_FONT_STACK};">${formatNgn(order.totalNgn)}</div>
            </div>
          </td>
          <td width="50%" style="padding:0 12px;vertical-align:top;">
            <div style="border-radius:20px;background:#f8f7f2;padding:14px 16px;border:1px solid rgba(0,0,0,0.01);">
              <div style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#9ca3af;font-weight:700;margin-bottom:4px;">Items</div>
              <div style="font-size:17px;font-weight:600;color:#111827;font-family:${EMAIL_FONT_STACK};">${order.itemCount}</div>
            </div>
          </td>
        </tr>
      </table>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:12px 0;margin:8px -12px 0;">
        <tr>
          <td width="50%" style="padding:0 12px;vertical-align:top;">
            <div style="border-radius:20px;background:#f8f7f2;padding:14px 16px;border:1px solid rgba(0,0,0,0.01);">
              <div style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#9ca3af;font-weight:700;margin-bottom:4px;">Reference</div>
              <div style="font-size:15px;font-weight:600;color:#111827;word-break:break-all;font-family:${EMAIL_FONT_STACK};">${order.transferReference}</div>
            </div>
          </td>
          <td width="50%" style="padding:0 12px;vertical-align:top;">
            <div style="border-radius:20px;background:#f8f7f2;padding:14px 16px;border:1px solid rgba(0,0,0,0.01);">
              <div style="font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:#9ca3af;font-weight:700;margin-bottom:4px;">Placed</div>
              <div style="font-size:14px;font-weight:600;color:#111827;font-family:${EMAIL_FONT_STACK};">${formatEmailTimestamp(order.placedAt)}</div>
            </div>
          </td>
        </tr>
      </table>

      ${buildProductSpotlight(order)}
      ${buildOrderItems(order)}
    </div>
  `;
}

function buildActionLink(label: string, href: string) {
  return `
    <div style="margin-top:18px;">
      <a href="${href}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border-radius:999px;background:#0f3d2e;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;font-family:${EMAIL_FONT_STACK};">
        ${label}
      </a>
    </div>
  `;
}

function buildGuestOrderLink(orderId: string) {
  const token = createGuestOrderAccessToken(orderId);

  return `${serverEnv.public.appUrl}/checkout/orders/${orderId}?access=${encodeURIComponent(token)}`;
}

function buildAccountOrderLink(orderId: string) {
  return `${serverEnv.public.appUrl}/account/orders/${orderId}`;
}

function buildAccountTrackingLink(orderId: string) {
  return `${serverEnv.public.appUrl}/account/tracking/${orderId}`;
}

function buildAdminOrderLink(orderId: string) {
  return `${serverEnv.public.appUrl}/admin/orders/${orderId}`;
}

function buildAdminPaymentsLink() {
  return `${serverEnv.public.appUrl}/admin/payments`;
}

async function sendSafe(input: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}) {
  if (!serverEnv.email.resendApiKey || !serverEnv.email.resendFromEmail) {
    return false;
  }

  try {
    await sendResendEmail(input);
    return true;
  } catch (error) {
    console.error("Email delivery failed:", error);
    return false;
  }
}

async function loadOrder(orderId: string) {
  return getOrderNotificationSnapshot(orderId);
}

async function canSendWorkspaceCustomerEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const preference = await getWorkspaceNotificationPreference(email);
  return preference.workspaceEmailEnabled;
}

async function getSendableCustomerEmail(
  order: OrderNotificationSnapshot | null | undefined
) {
  const customerEmail = order?.customerEmail;

  if (!customerEmail) {
    return null;
  }

  if (!(await canSendWorkspaceCustomerEmail(customerEmail))) {
    return null;
  }

  return customerEmail;
}

async function getAdminWorkspaceRecipients() {
  const recipients: string[] = [];

  for (const email of serverEnv.auth.adminEmails) {
    const preference = await getWorkspaceNotificationPreference(email);

    if (preference.workspaceEmailEnabled) {
      recipients.push(email);
    }
  }

  return recipients;
}

async function sendCustomerWorkspacePush(
  order: OrderNotificationSnapshot | null | undefined,
  input: {
    title: string;
    body: string;
    href?: string;
    tag?: string;
  }
) {
  const customerEmail = order?.customerEmail?.trim().toLowerCase();

  if (!customerEmail || !order?.orderId) {
    return false;
  }

  return sendWorkspacePushToEmails([customerEmail], {
    title: input.title,
    body: input.body,
    href: input.href ?? buildAccountOrderLink(order.orderId),
    tag: input.tag ?? `order-${order.orderId}`,
  });
}

async function sendAdminWorkspacePush(
  input: {
    title: string;
    body: string;
    href: string;
    tag?: string;
  }
) {
  return sendWorkspacePushToEmails(serverEnv.auth.adminEmails, {
    title: input.title,
    body: input.body,
    href: input.href,
    tag: input.tag,
  });
}

export async function sendOrderPlacedNotifications(input: {
  orderId: string;
  customerLink?: string | null;
  notifyAdmin?: boolean;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const isRequest = order.status === "checkout_draft";
  const deadlineText = order.transferDeadlineAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(order.transferDeadlineAt))
    : "soon";
  const bankBlock =
    order.bankName && order.accountName && order.accountNumber
      ? `
        <div style="margin-top:18px;border-radius:24px;background:#f4f2ea;padding:18px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Transfer details</div>
          <div style="margin-top:8px;font-size:18px;font-weight:600;color:#111827;">${order.bankName}</div>
          <div style="margin-top:4px;font-size:15px;color:#374151;">${order.accountName}</div>
          <div style="margin-top:4px;font-size:24px;font-weight:700;color:#111827;">${order.accountNumber}</div>
          ${
            order.instructions
              ? `<div style="margin-top:10px;font-size:13px;line-height:1.6;color:#6b7280;">${order.instructions}</div>`
              : ""
          }
        </div>
      `
      : "";

  const customerEmail = await getSendableCustomerEmail(order);

  if (customerEmail) {
    await sendSafe({
      to: customerEmail,
      subject: isRequest
        ? `House of Prax request ${order.orderNumber}`
        : `House of Prax order ${order.orderNumber}`,
      text: isRequest
        ? `Your House of Prax request ${order.orderNumber} has been received. Transfer details will appear after approval.`
        : `Your House of Prax order ${order.orderNumber} is waiting for transfer. Use reference ${order.transferReference}. Total: ${formatNgn(order.totalNgn)}.`,
      html: buildShell({
        eyebrow: "House of Prax",
        title: isRequest ? "Request received" : "Order received",
        intro: isRequest
          ? "Praxy received your request. Transfer details will appear once it is accepted."
          : `Your order is ready for transfer. Use the reference ${order.transferReference} and complete payment before ${deadlineText}.`,
        bodyHtml: `${buildOrderFacts(order)}${isRequest ? "" : bankBlock}${input.customerLink ? buildActionLink("Open order", input.customerLink) : ""}`,
        footer: isRequest
          ? "You can follow the request from your order page."
          : "Once payment proof is added, Praxy will review it from the console.",
      }),
    });
  }

  await sendCustomerWorkspacePush(order, {
    title: isRequest ? "Request received" : "Order received",
    body: isRequest
      ? `Order #${order.orderNumber} is with Praxy now.`
      : `Use ${order.transferReference} to complete payment.`,
    href: buildAccountOrderLink(order.orderId),
  });

  const adminRecipients =
    input.notifyAdmin ?? true ? await getAdminWorkspaceRecipients() : [];

  if (adminRecipients.length > 0) {
    const adminHref = `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`;
    await sendSafe({
      to: adminRecipients,
      subject: isRequest
        ? `New request ${order.orderNumber}`
        : `New order ${order.orderNumber}`,
      text: isRequest
        ? `New request ${order.orderNumber} from ${order.customerName}.`
        : `New order ${order.orderNumber} from ${order.customerName}. Total: ${formatNgn(order.totalNgn)}.`,
      html: buildShell({
        eyebrow: "Operations console",
        title: isRequest ? "New request" : "New order",
        intro: isRequest
          ? `${order.customerName} submitted a new order request.`
          : `${order.customerName} just placed an order and is waiting for transfer instructions.`,
        bodyHtml: `${buildOrderFacts(order)}
          <div style="margin-top:18px;border-radius:24px;background:#f4f2ea;padding:18px;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Customer</div>
            <div style="margin-top:8px;font-size:18px;font-weight:600;color:#111827;">${order.customerName}</div>
            <div style="margin-top:4px;font-size:15px;color:#374151;">${order.customerPhone}</div>
          </div>
          ${buildActionLink("Open order", adminHref)}`,
      }),
    });
  }

  if ((input.notifyAdmin ?? true) !== false) {
    await sendAdminWorkspacePush({
      title: isRequest ? "New request" : "New order",
      body: `${order.customerName} opened ${order.orderNumber}.`,
      href: buildAdminOrderLink(order.orderId),
      tag: `admin-order-${order.orderId}`,
    });
  }
}

export async function sendPaymentProofSubmittedNotifications(input: {
  orderId: string;
  customerLink?: string | null;
  proofIncluded?: boolean;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const proofIncluded = input.proofIncluded ?? true;
  const customerEmail = await getSendableCustomerEmail(order);

  if (customerEmail) {
    await sendSafe({
      to: customerEmail,
      subject: proofIncluded
        ? `Proof received for ${order.orderNumber}`
        : `Payment submitted for ${order.orderNumber}`,
      text: proofIncluded
        ? `Payment proof for order ${order.orderNumber} has been received and is waiting for review.`
        : `Payment for order ${order.orderNumber} has been marked as sent and is waiting for review.`,
      html: buildShell({
        eyebrow: "House of Prax",
        title: proofIncluded ? "Proof received" : "Payment submitted",
        intro: proofIncluded
          ? "Your payment proof is in. Praxy will review it shortly."
          : "Your payment is marked as sent. Praxy will review it shortly.",
        bodyHtml: `${buildOrderFacts(order)}${input.customerLink ? buildActionLink("Open order", input.customerLink) : ""}`,
      }),
    });
  }

  await sendCustomerWorkspacePush(order, {
    title: proofIncluded ? "Proof received" : "Payment submitted",
    body: proofIncluded
      ? `Order #${order.orderNumber} is waiting for review.`
      : `Praxy will review order #${order.orderNumber} shortly.`,
  });

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (adminRecipients.length > 0) {
    const adminHref = `${serverEnv.public.appUrl}/admin/payments`;
    await sendSafe({
      to: adminRecipients,
      subject: proofIncluded
        ? `Payment proof waiting for ${order.orderNumber}`
        : `Payment waiting for ${order.orderNumber}`,
      text: proofIncluded
        ? `Payment proof for order ${order.orderNumber} is ready for review.`
        : `Payment for order ${order.orderNumber} is ready for review.`,
      html: buildShell({
        eyebrow: "Operations console",
        title: proofIncluded ? "Proof waiting" : "Payment waiting",
        intro: proofIncluded
          ? `${order.customerName} added payment proof for order ${order.orderNumber}.`
          : `${order.customerName} marked payment as sent for order ${order.orderNumber}.`,
        bodyHtml: `${buildOrderFacts(order)}${buildActionLink("Open payments", adminHref)}`,
      }),
    });
  }

  await sendAdminWorkspacePush({
    title: proofIncluded ? "Proof waiting" : "Payment waiting",
    body: `${order.customerName} updated ${order.orderNumber}.`,
    href: buildAdminPaymentsLink(),
    tag: `admin-payment-${order.orderId}`,
  });
}

export async function sendTransferReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return false;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return false;
  }

  const orderHref = buildGuestOrderLink(order.orderId);

  const sent = await sendSafe({
    to: customerEmail,
    subject: `Transfer reminder for ${order.orderNumber}`,
    text: `Complete payment for order ${order.orderNumber} before the transfer window closes.`,
    html: buildShell({
      eyebrow: "House of Prax",
      title: "Transfer reminder",
      intro: "Your order is still open. Complete the transfer before the window closes.",
      bodyHtml: `${buildOrderFacts(order)}
        <div style="margin-top:18px;border-radius:24px;background:#f4f2ea;padding:18px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Transfer details</div>
          <div style="margin-top:8px;font-size:18px;font-weight:600;color:#111827;">${order.bankName ?? "Pending"}</div>
          <div style="margin-top:4px;font-size:15px;color:#374151;">${order.accountName ?? "Pending"}</div>
          <div style="margin-top:4px;font-size:24px;font-weight:700;color:#111827;">${order.accountNumber ?? "Pending"}</div>
        </div>
        ${buildActionLink("Open order", orderHref)}`,
      footer: "Once the transfer is sent, tap the confirmation button from the order page.",
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: "Transfer reminder",
    body: `Complete payment for #${order.orderNumber}.`,
  });

  return sent;
}

export async function sendReviewReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return false;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return false;
  }

  const orderHref = buildGuestOrderLink(order.orderId);

  const sent = await sendSafe({
    to: customerEmail,
    subject: `Rate ${order.orderNumber}`,
    text: `Leave a quick rating for order ${order.orderNumber}.`,
    html: buildShell({
      eyebrow: "House of Prax",
      title: "One quick rating",
      intro: "Your order is already delivered. A quick rating helps Praxy close the loop.",
      bodyHtml: `${buildOrderFacts(order)}${buildActionLink("Rate order", orderHref)}`,
      footer: "You can also rate it directly from your account order history.",
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: "Rate your order",
    body: `Order #${order.orderNumber} is ready for rating.`,
  });

  return sent;
}

export async function sendPaymentQueueReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (!order || adminRecipients.length === 0) {
    return false;
  }

  const sent = await sendSafe({
    to: adminRecipients,
    subject: `Payment still waiting for ${order.orderNumber}`,
    text: `Order ${order.orderNumber} still needs payment review.`,
    html: buildShell({
      eyebrow: "Operations console",
      title: "Payment still waiting",
      intro: `${order.customerName} is still waiting for payment review on order ${order.orderNumber}.`,
      bodyHtml: `${buildOrderFacts(order)}${buildActionLink("Open payments", `${serverEnv.public.appUrl}/admin/payments`)}`,
      footer: "Use the payments queue to confirm, reject, or keep it under review.",
    }),
  });

  await sendAdminWorkspacePush({
    title: "Payment still waiting",
    body: `${order.orderNumber} still needs review.`,
    href: buildAdminPaymentsLink(),
    tag: `admin-payment-${order.orderId}`,
  });

  return sent;
}

export async function sendReturnQueueReminderNotification(input: {
  orderId: string;
  status: "requested" | "approved" | "received";
}) {
  const order = await loadOrder(input.orderId);

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (!order || adminRecipients.length === 0) {
    return false;
  }

  const copy =
    input.status === "requested"
      ? {
          subject: `Return still waiting for ${order.orderNumber}`,
          title: "Return still waiting",
          intro: `${order.customerName}'s return request is still waiting for review.`,
          footer: "Approve or reject it from the order detail.",
        }
      : input.status === "approved"
        ? {
            subject: `Return still inbound for ${order.orderNumber}`,
            title: "Return still inbound",
            intro: `${order.customerName}'s approved return is still waiting to be marked received.`,
            footer: "Mark it received once the product is back with House of Prax.",
          }
        : {
            subject: `Refund still open for ${order.orderNumber}`,
            title: "Refund still open",
            intro: `${order.customerName}'s return is received, but the refund step is still open.`,
            footer: "Complete the refund from the order detail once it has been sent.",
          };

  const sent = await sendSafe({
    to: adminRecipients,
    subject: copy.subject,
    text: `${copy.title}. Order ${order.orderNumber}.`,
    html: buildShell({
      eyebrow: "Operations console",
      title: copy.title,
      intro: copy.intro,
      bodyHtml: `${buildOrderFacts(order)}${buildActionLink("Open order", `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`)}`,
      footer: copy.footer,
    }),
  });

  await sendAdminWorkspacePush({
    title: copy.title,
    body: `${order.orderNumber} still needs action.`,
    href: buildAdminOrderLink(order.orderId),
    tag: `admin-return-${order.orderId}`,
  });

  return sent;
}

export async function sendPaymentDecisionNotification(input: {
  orderId: string;
  action: "under_review" | "confirmed" | "rejected";
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  const copy =
    input.action === "confirmed"
      ? {
          subject: `Payment confirmed for ${order.orderNumber}`,
          title: "Payment confirmed",
          intro: "Your payment is confirmed. House of Prax is preparing your order.",
        }
      : input.action === "rejected"
        ? {
            subject: `Payment update for ${order.orderNumber}`,
            title: "Payment needs attention",
            intro: "Your payment could not be confirmed yet. Please review the note from Praxy.",
          }
        : {
            subject: `Payment under review for ${order.orderNumber}`,
            title: "Under review",
            intro: "Your payment is under review. You will get another update once it is cleared.",
          };

  await sendSafe({
    to: customerEmail,
    subject: copy.subject,
    text: `${copy.title}. Order ${order.orderNumber}.`,
    html: buildShell({
      eyebrow: "House of Prax",
      title: copy.title,
      intro: copy.intro,
      bodyHtml: `${buildOrderFacts(order)}${
        input.note
          ? `<div style="margin-top:18px;border-radius:24px;background:#f4f2ea;padding:18px;font-size:14px;line-height:1.6;color:#374151;">${input.note}</div>`
          : ""
      }`,
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: copy.title,
    body:
      input.action === "confirmed"
        ? `Order #${order.orderNumber} is being prepared.`
        : input.action === "rejected"
          ? `Order #${order.orderNumber} needs another payment step.`
          : `Order #${order.orderNumber} is under review.`,
  });
}

export async function sendDeliveryStatusNotification(input: {
  orderId: string;
  status: "out_for_delivery" | "delivered";
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  const copy =
    input.status === "delivered"
      ? {
          subject: `Delivered: ${order.orderNumber}`,
          title: "Delivered",
          intro: "Your House of Prax order has been delivered. Open it once more to rate it.",
        }
      : {
          subject: `Out for delivery: ${order.orderNumber}`,
          title: "On the way",
          intro: "Your House of Prax order is now on the road.",
        };
  const orderHref = buildGuestOrderLink(order.orderId);

  await sendSafe({
    to: customerEmail,
    subject: copy.subject,
    text: `${copy.title}. Order ${order.orderNumber}.`,
    html: buildShell({
      eyebrow: "House of Prax",
      title: copy.title,
      intro: copy.intro,
      bodyHtml: `${buildOrderFacts(order)}
        <div style="margin-top:18px;border-radius:24px;background:#f4f2ea;padding:18px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Drop</div>
          <div style="margin-top:8px;font-size:15px;color:#111827;">${order.deliveryAddress}</div>
        </div>
        ${buildActionLink(input.status === "delivered" ? "Rate order" : "Open order", orderHref)}`,
      footer:
        input.status === "delivered"
          ? "A quick rating helps Praxy close the loop."
          : undefined,
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: copy.title,
    body:
      input.status === "delivered"
        ? `Order #${order.orderNumber} has been delivered.`
        : `Order #${order.orderNumber} is on the road.`,
    href:
      input.status === "delivered"
        ? buildAccountOrderLink(order.orderId)
        : buildAccountTrackingLink(order.orderId),
  });
}

export async function sendOrderCancelledNotification(input: {
  orderId: string;
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  await sendSafe({
    to: customerEmail,
    subject: `Order cancelled: ${order.orderNumber}`,
    text: `Order ${order.orderNumber} has been cancelled.`,
    html: buildShell({
      eyebrow: "House of Prax",
      title: "Order cancelled",
      intro: "This order has been closed from the operations console.",
      bodyHtml: `${buildOrderFacts(order)}${
        input.note
          ? `<div style="margin-top:18px;border-radius:24px;background:#f4f2ea;padding:18px;font-size:14px;line-height:1.6;color:#374151;">${input.note}</div>`
          : ""
      }`,
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: "Order cancelled",
    body: `Order #${order.orderNumber} has been closed.`,
  });
}

export async function sendOrderReturnRequestedNotifications(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (customerEmail) {
    await sendSafe({
      to: customerEmail,
      subject: `Return request received for ${order.orderNumber}`,
      text: `Your return request for order ${order.orderNumber} is with Praxy now.`,
      html: buildShell({
        eyebrow: "House of Prax",
        title: "Return received",
        intro: "Your return request is now in the operations queue.",
        bodyHtml: buildOrderFacts(order),
        footer: "You will get another update once Praxy reviews it.",
      }),
    });
  }

  await sendCustomerWorkspacePush(order, {
    title: "Return received",
    body: `Praxy is reviewing the return for #${order.orderNumber}.`,
  });

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (adminRecipients.length > 0) {
    await sendSafe({
      to: adminRecipients,
      subject: `Return requested for ${order.orderNumber}`,
      text: `Order ${order.orderNumber} has a new return request.`,
      html: buildShell({
        eyebrow: "Operations console",
        title: "Return requested",
        intro: `${order.customerName} requested a return for order ${order.orderNumber}.`,
        bodyHtml: `${buildOrderFacts(order)}${buildActionLink("Open order", `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`)}`,
      }),
    });
  }

  await sendAdminWorkspacePush({
    title: "Return requested",
    body: `${order.customerName} requested a return for ${order.orderNumber}.`,
    href: buildAdminOrderLink(order.orderId),
    tag: `admin-return-${order.orderId}`,
  });
}

export async function sendOrderReturnProofSubmittedNotifications(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (customerEmail) {
    await sendSafe({
      to: customerEmail,
      subject: `Return proof received for ${order.orderNumber}`,
      text: `Return proof for order ${order.orderNumber} has been received.`,
      html: buildShell({
        eyebrow: "House of Prax",
        title: "Return proof received",
        intro: "Your return proof is in. Praxy can now keep the return moving.",
        bodyHtml: `${buildOrderFacts(order)}${buildActionLink("Open order", buildGuestOrderLink(order.orderId))}`,
        footer: "You will get another update if Praxy leaves the return queue or completes the refund.",
      }),
    });
  }

  await sendCustomerWorkspacePush(order, {
    title: "Return proof received",
    body: `Order #${order.orderNumber} is back in motion.`,
  });

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (adminRecipients.length > 0) {
    await sendSafe({
      to: adminRecipients,
      subject: `Return proof waiting for ${order.orderNumber}`,
      text: `Order ${order.orderNumber} now has return proof waiting in the order detail.`,
      html: buildShell({
        eyebrow: "Operations console",
        title: "Return proof waiting",
        intro: `${order.customerName} added return proof for order ${order.orderNumber}.`,
        bodyHtml: `${buildOrderFacts(order)}${buildActionLink("Open order", `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`)}`,
        footer: "Use the return section in the order detail to review the proof and continue the case.",
      }),
    });
  }

  await sendAdminWorkspacePush({
    title: "Return proof waiting",
    body: `${order.customerName} added return proof for ${order.orderNumber}.`,
    href: buildAdminOrderLink(order.orderId),
    tag: `admin-return-${order.orderId}`,
  });
}

export async function sendOrderReturnDecisionNotification(input: {
  orderId: string;
  action: "approved" | "rejected" | "received";
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  const copy =
    input.action === "approved"
      ? {
          subject: `Return approved for ${order.orderNumber}`,
          title: "Return approved",
          intro: "Praxy approved your return request.",
          footer: "Once the return is received, the refund step can be completed.",
        }
      : input.action === "received"
        ? {
            subject: `Return received for ${order.orderNumber}`,
            title: "Return received",
            intro: "Your returned order is back with House of Prax.",
            footer: "Praxy can now complete the refund step.",
          }
        : {
            subject: `Return update for ${order.orderNumber}`,
            title: "Return not approved",
            intro: "Praxy could not approve this return request.",
            footer: undefined,
          };

  await sendSafe({
    to: customerEmail,
    subject: copy.subject,
    text: `${copy.title}. Order ${order.orderNumber}.`,
    html: buildShell({
      eyebrow: "House of Prax",
      title: copy.title,
      intro: copy.intro,
      bodyHtml: `${buildOrderFacts(order)}${
        input.note
          ? `<div style="margin-top:18px;border-radius:24px;background:#f4f2ea;padding:18px;font-size:14px;line-height:1.6;color:#374151;">${input.note}</div>`
          : ""
      }`,
      footer: copy.footer,
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: copy.title,
    body:
      input.action === "approved"
        ? `Return for #${order.orderNumber} is approved.`
        : input.action === "received"
          ? `Return for #${order.orderNumber} has been received.`
          : `Return for #${order.orderNumber} was not approved.`,
  });
}

export async function sendOrderRefundedNotification(input: {
  orderId: string;
  refundAmountNgn?: number | null;
  refundReference?: string | null;
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  await sendSafe({
    to: customerEmail,
    subject: `Refund sent for ${order.orderNumber}`,
    text: `Refund for order ${order.orderNumber} has been sent.`,
    html: buildShell({
      eyebrow: "House of Prax",
      title: "Refund sent",
      intro: "Praxy marked this refund as sent from the operations console.",
      bodyHtml: `${buildOrderFacts(order)}
        <div style="margin-top:18px;display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));">
          <div style="border-radius:22px;background:#f4f2ea;padding:14px 16px;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Refund</div>
            <div style="margin-top:6px;font-size:18px;font-weight:600;color:#111827;">${formatNgn(input.refundAmountNgn ?? order.totalNgn)}</div>
          </div>
          <div style="border-radius:22px;background:#f4f2ea;padding:14px 16px;">
            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Reference</div>
            <div style="margin-top:6px;font-size:18px;font-weight:600;color:#111827;">${input.refundReference ?? "Pending"}</div>
          </div>
        </div>
        ${
          input.note
            ? `<div style="margin-top:18px;border-radius:24px;background:#f4f2ea;padding:18px;font-size:14px;line-height:1.6;color:#374151;">${input.note}</div>`
            : ""
      }`,
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: "Refund sent",
    body: `Refund for #${order.orderNumber} is on the way.`,
  });
}
