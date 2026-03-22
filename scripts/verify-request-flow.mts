import { createHmac, randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

function ensureServerOnlyStub(root: string) {
  const stubDir = join(root, "node_modules", "server-only");
  const stubFile = join(stubDir, "index.js");

  if (!existsSync(stubDir)) {
    mkdirSync(stubDir, { recursive: true });
  }

  if (!existsSync(stubFile)) {
    writeFileSync(stubFile, "module.exports = {};\n", "utf8");
  }

  return {
    dir: stubDir,
    file: stubFile,
  };
}

function removeServerOnlyStub(stub: { dir: string; file: string }) {
  if (existsSync(stub.file)) {
    unlinkSync(stub.file);
  }

  if (existsSync(stub.dir)) {
    rmSync(stub.dir, { recursive: true, force: true });
  }
}

function loadEnv(filePath: string) {
  const raw = readFileSync(filePath, "utf8");

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getVerifyEnv() {
  const requested = (process.env.FLOW_VERIFY_ENV || "development")
    .trim()
    .toLowerCase();

  if (
    requested === "production" ||
    requested === "preview" ||
    requested === "development"
  ) {
    return requested;
  }

  return "development";
}

function loadVerifyEnvFiles(root: string) {
  const env = getVerifyEnv();
  const preferredPath = resolve(root, `.vercel/.env.${env}.local`);
  const developmentPath = resolve(root, ".vercel/.env.development.local");
  const dotEnvLocalPath = resolve(root, ".env.local");
  const dotEnvPath = resolve(root, ".env");

  loadEnv(preferredPath);
  if (env !== "development") {
    loadEnv(developmentPath);
  }
  loadEnv(dotEnvLocalPath);
  loadEnv(dotEnvPath);

  return env;
}

function encodePayload(payload: unknown) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function createSessionCookieValue(
  email: string,
  role: "customer" | "admin"
) {
  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000
  );
  const payload = {
    email,
    role,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const encodedPayload = encodePayload(payload);
  const signature = createHmac(
    "sha256",
    process.env.APP_SESSION_SECRET || "hop-development-session-secret-change-me"
  )
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function expectIncludes(haystack: string, needle: string, message: string) {
  expect(haystack.includes(needle), `${message} Missing: ${needle}`);
}

class CookieJar {
  private readonly values = new Map<string, string>();

  constructor(initial?: Record<string, string>) {
    for (const [key, value] of Object.entries(initial ?? {})) {
      this.values.set(key, value);
    }
  }

  apply(response: Response) {
    const setCookieValues =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie") as string]
          : [];

    for (const cookie of setCookieValues) {
      const [pair] = cookie.split(";", 1);
      const separatorIndex = pair.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1);

      if (!value) {
        this.values.delete(key);
        continue;
      }

      this.values.set(key, value);
    }
  }

  set(name: string, value: string) {
    this.values.set(name, value);
  }

  header() {
    return Array.from(this.values.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("; ");
  }
}

async function fetchText(url: string, jar?: CookieJar) {
  const response = await fetch(url, {
    headers: jar?.header() ? { cookie: jar.header() } : undefined,
    redirect: "manual",
  });
  const text = await response.text();
  jar?.apply(response);

  return { response, text };
}

function getVerifyBaseUrl() {
  return (process.env.FLOW_VERIFY_BASE_URL || "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
}

function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function shouldAssertMarketingContent(baseUrl: string) {
  const strict = process.env.FLOW_VERIFY_STRICT_MARKETING?.trim();
  if (strict === "1") {
    return true;
  }
  if (strict === "0") {
    return false;
  }

  return baseUrl.includes("localhost");
}

async function main() {
  const root = process.cwd();
  const stub = ensureServerOnlyStub(root);
  const envName = loadVerifyEnvFiles(root);
  const baseUrl = getVerifyBaseUrl();
  const strictMarketing = shouldAssertMarketingContent(baseUrl);

  const [
    dbClient,
    catalogAdmin,
    cartRepo,
    deliveryRepo,
    orderReturnsRepo,
    orderAccess,
    ordersRepo,
    reviewRepo,
    userRepo,
  ] = await Promise.all([
    import("@/lib/db/client"),
    import("@/lib/db/repositories/catalog-admin-repository"),
    import("@/lib/db/repositories/cart-repository"),
    import("@/lib/db/repositories/delivery-repository"),
    import("@/lib/db/repositories/order-returns-repository"),
    import("@/lib/orders/access"),
    import("@/lib/db/repositories/orders-repository"),
    import("@/lib/db/repositories/review-repository"),
    import("@/lib/db/repositories/user-repository"),
  ]);

  const { query } = dbClient;
  const adminEmail = (process.env.ADMIN_EMAILS || "")
    .split(",")[0]
    ?.trim()
    .toLowerCase();

  expect(adminEmail, "Missing admin email.");

  const adminIdentity = await userRepo.ensureUserByEmail(adminEmail, {
    markSignedIn: true,
  });

  expect(adminIdentity?.userId, "Unable to resolve admin identity.");

  const actorUserId = adminIdentity.userId;
  const runId = `${Date.now().toString().slice(-6)}${randomUUID().slice(0, 6)}`;
  const tempCustomerEmail = `request.flow.${runId}@example.com`;
  const guestEmail = `guest.flow.${runId}@example.com`;
  const riderPhone = `+2348099${runId.slice(0, 6)}`;
  const baseName = `Flow ${runId}`;
  const adminJar = new CookieJar({
    "hop-auth-session": createSessionCookieValue(adminEmail, "admin"),
  });
  const customerJar = new CookieJar({
    "hop-auth-session": createSessionCookieValue(tempCustomerEmail, "customer"),
  });

  let categoryId: string | null = null;
  let productId: string | null = null;
  let productSlug: string | null = null;
  let customerUserId: string | null = null;
  let riderId: string | null = null;
  const orderIds: string[] = [];
  const cartIds: string[] = [];

  try {
    categoryId = await catalogAdmin.createAdminCatalogCategory({
      categoryName: `${baseName} Category`,
      sortOrder: 41,
      actorUserId,
      actorEmail: adminEmail,
    });
    expect(categoryId, "Unable to create temp category.");

    productId = await catalogAdmin.createAdminCatalogProduct({
      categoryId,
      productName: `${baseName} Product`,
      marketingName: `${baseName} Marketing`,
      variantName: `${baseName} Default`,
      priceNgn: 17999,
      actorUserId,
      actorEmail: adminEmail,
    });
    expect(productId, "Unable to create temp product.");

    await catalogAdmin.updateAdminCatalogProduct({
      productId,
      categoryId,
      productName: `${baseName} Product`,
      marketingName: `${baseName} Marketing`,
      tagline: "Flow test",
      shortDescription: "Request flow verification product.",
      longDescription: "Temporary product for request flow verification.",
      status: "active",
      merchandisingState: "featured",
      isAvailable: true,
      sortOrder: 3,
      variantName: `${baseName} Default`,
      sizeLabel: "500g",
      unitLabel: "jar",
      priceNgn: 17999,
      compareAtPriceNgn: 19999,
      variantStatus: "active",
      ingredientIds: [],
      inventoryOnHand: 12,
      reorderThreshold: 2,
      actorUserId,
      actorEmail: adminEmail,
    });

    const productDetail = await catalogAdmin.getAdminCatalogProductDetail(productId);
    expect(productDetail, "Temp product detail unavailable.");
    productSlug = productDetail.productSlug;

    const homePage = await fetchText(buildUrl(baseUrl, "/"));
    expect(homePage.response.status === 200, "Marketing home did not load.");
    if (strictMarketing) {
      expectIncludes(
        homePage.text,
        `${baseName} Marketing`,
        "Marketing home did not render the temp product."
      );
    }

    const tempCustomer = await userRepo.ensureUserByEmail(tempCustomerEmail, {
      markSignedIn: true,
    });
    expect(tempCustomer?.userId, "Unable to create temp customer.");
    customerUserId = tempCustomer.userId;

    const guestCart = await cartRepo.getOrCreateCartContext(null, null);
    expect(guestCart?.cartId, "Unable to create guest cart.");
    cartIds.push(guestCart.cartId);

    await cartRepo.replaceCartItems(guestCart.cartId, [
      { productId: productSlug, quantity: 1 },
    ]);

    const guestOrder = await cartRepo.createOrderFromCart({
      cartId: guestCart.cartId,
      userId: null,
      customerName: "Guest Flow",
      customerEmail: guestEmail,
      customerPhoneE164: "+2348012345678",
      deliveryLocation: "12 Flow Street, Lagos",
      notes: "Guest request flow verification",
      latitude: 6.5244,
      longitude: 3.3792,
    });
    orderIds.push(guestOrder.orderId);

    const guestAccess = orderAccess.createGuestOrderAccessToken(guestOrder.orderId);
    const guestPage = await fetchText(
      buildUrl(
        baseUrl,
        `/checkout/orders/${guestOrder.orderId}?access=${encodeURIComponent(guestAccess)}`
      )
    );
    expect(guestPage.response.status === 200, "Guest order page did not load.");
    expectIncludes(
      guestPage.text,
      `#${guestOrder.orderNumber}`,
      "Guest order page did not render the order number."
    );

    const customerCart = await cartRepo.getOrCreateCartContext(null, customerUserId);
    expect(customerCart?.cartId, "Unable to create signed-in cart.");
    cartIds.push(customerCart.cartId);

    await cartRepo.replaceCartItems(customerCart.cartId, [
      { productId: productSlug, quantity: 2 },
    ]);

    const signedInOrder = await cartRepo.createOrderFromCart({
      cartId: customerCart.cartId,
      userId: customerUserId,
      customerName: "Signed Flow",
      customerEmail: tempCustomerEmail,
      customerPhoneE164: "+2348098765432",
      deliveryLocation: "24 Portal Avenue, Lagos",
      notes: "Signed-in request flow verification",
      latitude: 6.4698,
      longitude: 3.5852,
    });
    orderIds.push(signedInOrder.orderId);

    const signedInPage = await fetchText(
      buildUrl(baseUrl, `/account/orders/${signedInOrder.orderId}`),
      customerJar
    );
    expect(
      signedInPage.response.status === 200,
      "Signed-in order page did not load."
    );
    expectIncludes(
      signedInPage.text,
      `#${signedInOrder.orderNumber}`,
      "Signed-in order page did not render the order number."
    );

    const adminGuestPage = await fetchText(
      buildUrl(baseUrl, `/admin/orders/${guestOrder.orderId}`),
      adminJar
    );
    expect(
      adminGuestPage.response.status === 200,
      "Admin guest-order detail page did not load."
    );
    expectIncludes(
      adminGuestPage.text,
      `#${guestOrder.orderNumber}`,
      "Admin guest-order detail page did not render the order number."
    );

    const adminSignedPage = await fetchText(
      buildUrl(baseUrl, `/admin/orders/${signedInOrder.orderId}`),
      adminJar
    );
    expect(
      adminSignedPage.response.status === 200,
      "Admin signed-order detail page did not load."
    );
    expectIncludes(
      adminSignedPage.text,
      `#${signedInOrder.orderNumber}`,
      "Admin signed-order detail page did not render the order number."
    );

    await ordersRepo.acceptOrderRequestByAdmin(
      guestOrder.orderId,
      adminEmail,
      actorUserId,
      null
    );
    await ordersRepo.acceptOrderRequestByAdmin(
      signedInOrder.orderId,
      adminEmail,
      actorUserId,
      null
    );

    const acceptedGuest = await ordersRepo.getGuestOrderDetail(guestOrder.orderId);
    const acceptedSigned = await ordersRepo.getPortalOrderDetail(
      tempCustomerEmail,
      signedInOrder.orderId
    );
    expect(
      acceptedGuest?.status === "awaiting_transfer" &&
        acceptedGuest.payment?.status === "awaiting_transfer" &&
        acceptedGuest.paymentId,
      "Guest request did not transition to awaiting transfer."
    );
    expect(
      acceptedSigned?.status === "awaiting_transfer" &&
        acceptedSigned.payment?.status === "awaiting_transfer" &&
        acceptedSigned.paymentId,
      "Signed-in request did not transition to awaiting transfer."
    );

    await ordersRepo.submitPaymentForReview(
      acceptedGuest.paymentId,
      guestEmail,
      { guestOrderId: guestOrder.orderId }
    );
    await ordersRepo.submitPaymentForReview(
      acceptedSigned.paymentId,
      tempCustomerEmail
    );

    const paymentsBoard = await fetchText(
      buildUrl(baseUrl, "/admin/payments"),
      adminJar
    );
    expect(paymentsBoard.response.status === 200, "Admin payments page did not load.");
    expectIncludes(
      paymentsBoard.text,
      guestOrder.orderNumber,
      "Admin payments page did not include the guest order."
    );
    expectIncludes(
      paymentsBoard.text,
      signedInOrder.orderNumber,
      "Admin payments page did not include the signed-in order."
    );

    await ordersRepo.reviewPayment(
      acceptedGuest.paymentId,
      "confirmed",
      adminEmail,
      actorUserId,
      null
    );
    await ordersRepo.reviewPayment(
      acceptedSigned.paymentId,
      "confirmed",
      adminEmail,
      actorUserId,
      null
    );

    const rider = await deliveryRepo.createOrUpdateRider({
      name: `${baseName} Rider`,
      phoneNumber: riderPhone,
      vehicleType: "bike",
      actorUserId,
      actorEmail: adminEmail,
    });
    expect(rider?.riderId, "Unable to create temp rider.");
    riderId = rider.riderId;

    for (const orderId of [guestOrder.orderId, signedInOrder.orderId]) {
      await deliveryRepo.markOrderReadyForDispatch({
        orderId,
        actorUserId,
        actorEmail: adminEmail,
        note: null,
      });

      const assignment = await deliveryRepo.assignRiderToOrder({
        orderId,
        riderId,
        actorUserId,
        actorEmail: adminEmail,
        note: null,
      });
      expect(assignment.assignmentId, "Unable to create delivery assignment.");

      await deliveryRepo.updateDeliveryAssignmentStatus({
        assignmentId: assignment.assignmentId,
        nextStatus: "picked_up",
        actorUserId,
        actorEmail: adminEmail,
        note: null,
      });
      await deliveryRepo.updateDeliveryAssignmentStatus({
        assignmentId: assignment.assignmentId,
        nextStatus: "out_for_delivery",
        actorUserId,
        actorEmail: adminEmail,
        note: null,
      });
      await deliveryRepo.updateDeliveryAssignmentStatus({
        assignmentId: assignment.assignmentId,
        nextStatus: "delivered",
        actorUserId,
        actorEmail: adminEmail,
        note: null,
      });
    }

    const deliveryBoard = await fetchText(
      buildUrl(baseUrl, "/admin/delivery"),
      adminJar
    );
    expect(deliveryBoard.response.status === 200, "Admin delivery page did not load.");

    const deliveredGuest = await ordersRepo.getGuestOrderDetail(guestOrder.orderId);
    const deliveredSigned = await ordersRepo.getPortalOrderDetail(
      tempCustomerEmail,
      signedInOrder.orderId
    );
    expect(
      deliveredGuest?.status === "delivered" &&
        deliveredGuest.fulfillmentStatus === "delivered",
      "Guest order did not complete delivery."
    );
    expect(
      deliveredSigned?.status === "delivered" &&
        deliveredSigned.fulfillmentStatus === "delivered",
      "Signed-in order did not complete delivery."
    );

    const guestDeliveredPage = await fetchText(
      buildUrl(
        baseUrl,
        `/checkout/orders/${guestOrder.orderId}?access=${encodeURIComponent(guestAccess)}`
      )
    );
    expect(
      guestDeliveredPage.response.status === 200,
      "Delivered guest order page did not load."
    );
    expectIncludes(
      guestDeliveredPage.text,
      "Delivered",
      "Delivered guest order page did not render the delivered state."
    );

    const signedDeliveredPage = await fetchText(
      buildUrl(baseUrl, `/account/orders/${signedInOrder.orderId}`),
      customerJar
    );
    expect(
      signedDeliveredPage.response.status === 200,
      "Delivered signed-in order page did not load."
    );
    expectIncludes(
      signedDeliveredPage.text,
      "Delivered",
      "Delivered signed-in order page did not render the delivered state."
    );

    const portalOrdersPage = await fetchText(
      buildUrl(baseUrl, "/account/orders"),
      customerJar
    );
    expect(
      portalOrdersPage.response.status === 200,
      "Portal order list page did not load."
    );
    expectIncludes(
      portalOrdersPage.text,
      signedInOrder.orderNumber,
      "Portal order list page did not include the signed-in order."
    );

    await reviewRepo.submitOrderReview({
      orderId: guestOrder.orderId,
      rating: 5,
      title: "Guest flow review",
      body: "Guest delivery completed cleanly.",
      actorEmail: guestEmail,
      guestOrderId: guestOrder.orderId,
    });
    await reviewRepo.submitOrderReview({
      orderId: signedInOrder.orderId,
      rating: 4,
      title: "Signed flow review",
      body: "Signed-in delivery completed cleanly.",
      actorEmail: tempCustomerEmail,
      actorUserId: customerUserId,
    });

    const [guestReview, signedReview] = await Promise.all([
      reviewRepo.getOrderReview(guestOrder.orderId, {
        role: "customer",
        guestOrderId: guestOrder.orderId,
      }),
      reviewRepo.getOrderReview(signedInOrder.orderId, {
        email: tempCustomerEmail,
        role: "customer",
        userId: customerUserId,
      }),
    ]);
    expect(guestReview?.rating === 5, "Guest review was not stored.");
    expect(signedReview?.rating === 4, "Signed-in review was not stored.");

    const signedReturnableItem = deliveredSigned?.items.find(
      (item) => item.returnableQuantity > 0
    );
    expect(signedReturnableItem, "Signed-in order has no returnable item.");

    const returnCaseId = await orderReturnsRepo.requestOrderReturn({
      orderId: signedInOrder.orderId,
      reason: "Verification return",
      details: "Created by the automated request flow verifier.",
      items: [
        {
          orderItemId: signedReturnableItem.orderItemId,
          quantity: 1,
        },
      ],
      refundBankName: "PalmPay",
      refundAccountName: "Flow Verifier",
      refundAccountNumber: "8060785487",
      actorEmail: tempCustomerEmail,
      actorUserId: customerUserId,
    });
    expect(returnCaseId, "Unable to create signed-in return case.");

    await orderReturnsRepo.createOrderReturnProof({
      returnCaseId,
      storageKey: `test/returns/${runId}.jpg`,
      publicUrl: `https://example.com/test/returns/${runId}.jpg`,
      mimeType: "image/jpeg",
      submittedByEmail: tempCustomerEmail,
      actorUserId: customerUserId,
    });

    await orderReturnsRepo.advanceOrderReturnCase({
      returnCaseId,
      action: "approved",
      actorEmail: adminEmail,
      actorUserId,
      note: "Approved by automated flow verifier.",
    });
    await orderReturnsRepo.advanceOrderReturnCase({
      returnCaseId,
      action: "received",
      actorEmail: adminEmail,
      actorUserId,
      note: "Received by automated flow verifier.",
    });
    await orderReturnsRepo.advanceOrderReturnCase({
      returnCaseId,
      action: "refunded",
      actorEmail: adminEmail,
      actorUserId,
      note: "Refunded by automated flow verifier.",
      refundReference: `FLOW-${runId.toUpperCase()}`,
    });

    const [finalReturnCase, finalReturnProofs] = await Promise.all([
      orderReturnsRepo.getLatestOrderReturnCase(signedInOrder.orderId, {
        email: adminEmail,
        role: "admin",
      }),
      orderReturnsRepo.listOrderReturnProofs(signedInOrder.orderId, {
        email: adminEmail,
        role: "admin",
      }),
    ]);
    expect(
      finalReturnCase?.status === "refunded" &&
        finalReturnCase.refundReference === `FLOW-${runId.toUpperCase()}`,
      "Signed-in return case did not reach refunded state."
    );
    expect(finalReturnProofs.length > 0, "Return proof was not stored.");

    const refundedOrderPage = await fetchText(
      buildUrl(baseUrl, `/account/orders/${signedInOrder.orderId}`),
      customerJar
    );
    expect(
      refundedOrderPage.response.status === 200,
      "Refunded signed-in order page did not load."
    );
    expectIncludes(
      refundedOrderPage.text,
      "Reference",
      "Refunded signed-in order page did not render the return state."
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          runId,
          envName,
          baseUrl,
          strictMarketing,
          guestOrder: guestOrder.orderNumber,
          signedInOrder: signedInOrder.orderNumber,
          productSlug,
          checks: {
            marketingRender: true,
            guestRequestFlow: true,
            signedInRequestFlow: true,
            adminBoards: true,
            deliveredState: true,
            ratingFlow: true,
            returnRefundFlow: true,
          },
        },
        null,
        2
      )
    );
  } finally {
    try {
      if (cartIds.length > 0) {
        await query(
          `
            delete from app.carts
            where id = any($1::uuid[])
          `,
          [cartIds]
        );
      }

      if (orderIds.length > 0) {
        await query(
          `
            delete from app.orders
            where id = any($1::uuid[])
          `,
          [orderIds]
        );
      }

      if (riderId) {
        await query(
          `
            delete from app.riders
            where id = $1
          `,
          [riderId]
        );
      }

      if (customerUserId) {
        await query(
          `
            delete from app.users
            where id = $1
          `,
          [customerUserId]
        );
      }

      if (productId && categoryId) {
        await catalogAdmin.updateAdminCatalogProduct({
          productId,
          categoryId,
          productName: `${baseName} Product`,
          marketingName: `${baseName} Marketing`,
          tagline: "Flow test",
          shortDescription: "Request flow verification product.",
          longDescription: "Temporary product for request flow verification.",
          status: "archived",
          merchandisingState: "standard",
          isAvailable: false,
          sortOrder: 3,
          variantName: `${baseName} Default`,
          sizeLabel: "500g",
          unitLabel: "jar",
          priceNgn: 17999,
          compareAtPriceNgn: 19999,
          variantStatus: "archived",
          ingredientIds: [],
          inventoryOnHand: 12,
          reorderThreshold: 2,
          actorUserId,
          actorEmail: adminEmail,
        });
        await catalogAdmin.deleteAdminCatalogProduct(productId, {
          userId: actorUserId,
          email: adminEmail,
        });
      }

      if (categoryId) {
        await catalogAdmin.deleteAdminCatalogCategory(categoryId, {
          userId: actorUserId,
          email: adminEmail,
        });
      }
    } finally {
      removeServerOnlyStub(stub);
    }
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
