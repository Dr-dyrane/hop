import "server-only";

import { formatNgn } from "@/lib/commerce";
import { serverEnv } from "@/lib/config/server";
import { sendResendEmail } from "@/lib/email/resend";
import {
  getOrderNotificationSnapshot,
  type OrderNotificationSnapshot,
} from "@/lib/db/repositories/order-notification-repository";
import { createGuestOrderAccessToken } from "@/lib/orders/access";

function buildBrandLockup() {
  const baseUrl = serverEnv.public.appUrl.replace(/\/$/, "");
  const markUrl = `${baseUrl}/images/hero/hop-mark.svg`;
  const wordmarkUrl = `${baseUrl}/images/hero/hop-wordmark.svg`;

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;">
      <img
        src="${markUrl}"
        alt="House of Prax"
        width="28"
        height="28"
        style="display:block;width:28px;height:28px;"
      />
      <img
        src="${wordmarkUrl}"
        alt="House of Prax"
        width="110"
        height="30"
        style="display:block;width:110px;height:30px;"
      />
    </div>
  `;
}

function buildShell(input: {
  eyebrow: string;
  title: string;
  intro: string;
  bodyHtml: string;
  footer?: string;
}) {
  return `
    <div style="background:#f7f4ec;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#161616;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:30px;padding:32px;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
        ${buildBrandLockup()}
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6b7280;font-weight:600;">${input.eyebrow}</div>
        <h1 style="margin:16px 0 10px;font-size:32px;line-height:1.05;color:#111827;">${input.title}</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">${input.intro}</p>
        ${input.bodyHtml}
        ${
          input.footer
            ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">${input.footer}</p>`
            : ""
        }
      </div>
    </div>
  `;
}

function buildOrderFacts(order: OrderNotificationSnapshot) {
  return `
    <div style="display:grid;gap:12px;">
      <div style="border-radius:24px;background:#eef2ef;padding:16px 18px;">
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Order</div>
        <div style="margin-top:6px;font-size:26px;font-weight:700;color:#111827;">#${order.orderNumber}</div>
      </div>
      <div style="display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr));">
        <div style="border-radius:22px;background:#f4f2ea;padding:14px 16px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Total</div>
          <div style="margin-top:6px;font-size:18px;font-weight:600;color:#111827;">${formatNgn(order.totalNgn)}</div>
        </div>
        <div style="border-radius:22px;background:#f4f2ea;padding:14px 16px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">Reference</div>
          <div style="margin-top:6px;font-size:18px;font-weight:600;color:#111827;">${order.transferReference}</div>
        </div>
      </div>
    </div>
  `;
}

function buildActionLink(label: string, href: string) {
  return `
    <div style="margin-top:18px;">
      <a href="${href}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border-radius:999px;background:#0f3d2e;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">
        ${label}
      </a>
    </div>
  `;
}

function buildGuestOrderLink(orderId: string) {
  const token = createGuestOrderAccessToken(orderId);

  return `${serverEnv.public.appUrl}/checkout/orders/${orderId}?access=${encodeURIComponent(token)}`;
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

  if (order.customerEmail) {
    await sendSafe({
      to: order.customerEmail,
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

  if ((input.notifyAdmin ?? true) && serverEnv.auth.adminEmails.length > 0) {
    const adminHref = `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`;
    await sendSafe({
      to: serverEnv.auth.adminEmails,
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

  if (order.customerEmail) {
    await sendSafe({
      to: order.customerEmail,
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

  if (serverEnv.auth.adminEmails.length > 0) {
    const adminHref = `${serverEnv.public.appUrl}/admin/payments`;
    await sendSafe({
      to: serverEnv.auth.adminEmails,
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
}

export async function sendTransferReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order?.customerEmail) {
    return false;
  }

  const orderHref = buildGuestOrderLink(order.orderId);

  return sendSafe({
    to: order.customerEmail,
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
}

export async function sendReviewReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order?.customerEmail) {
    return false;
  }

  const orderHref = buildGuestOrderLink(order.orderId);

  return sendSafe({
    to: order.customerEmail,
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
}

export async function sendPaymentQueueReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order || serverEnv.auth.adminEmails.length === 0) {
    return false;
  }

  return sendSafe({
    to: serverEnv.auth.adminEmails,
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
}

export async function sendReturnQueueReminderNotification(input: {
  orderId: string;
  status: "requested" | "approved" | "received";
}) {
  const order = await loadOrder(input.orderId);

  if (!order || serverEnv.auth.adminEmails.length === 0) {
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

  return sendSafe({
    to: serverEnv.auth.adminEmails,
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
}

export async function sendPaymentDecisionNotification(input: {
  orderId: string;
  action: "under_review" | "confirmed" | "rejected";
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order?.customerEmail) {
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
    to: order.customerEmail,
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
}

export async function sendDeliveryStatusNotification(input: {
  orderId: string;
  status: "out_for_delivery" | "delivered";
}) {
  const order = await loadOrder(input.orderId);

  if (!order?.customerEmail) {
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
    to: order.customerEmail,
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
}

export async function sendOrderCancelledNotification(input: {
  orderId: string;
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order?.customerEmail) {
    return;
  }

  await sendSafe({
    to: order.customerEmail,
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
}

export async function sendOrderReturnRequestedNotifications(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  if (order.customerEmail) {
    await sendSafe({
      to: order.customerEmail,
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

  if (serverEnv.auth.adminEmails.length > 0) {
    await sendSafe({
      to: serverEnv.auth.adminEmails,
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
}

export async function sendOrderReturnProofSubmittedNotifications(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  if (order.customerEmail) {
    await sendSafe({
      to: order.customerEmail,
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

  if (serverEnv.auth.adminEmails.length > 0) {
    await sendSafe({
      to: serverEnv.auth.adminEmails,
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
}

export async function sendOrderReturnDecisionNotification(input: {
  orderId: string;
  action: "approved" | "rejected" | "received";
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order?.customerEmail) {
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
    to: order.customerEmail,
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
}

export async function sendOrderRefundedNotification(input: {
  orderId: string;
  refundAmountNgn?: number | null;
  refundReference?: string | null;
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order?.customerEmail) {
    return;
  }

  await sendSafe({
    to: order.customerEmail,
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
}
