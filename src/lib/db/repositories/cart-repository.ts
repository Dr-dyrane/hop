import "server-only";

import { randomBytes } from "node:crypto";
import { getShotBundlePricing } from "@/lib/commerce";
import { isDatabaseConfigured, query, withTransaction } from "@/lib/db/client";
import type { CartSnapshot } from "@/lib/db/types";

type CartContext = {
  cartId: string;
  userId: string | null;
};

type ProductVariantLookup = {
  variantId: string;
  productId: string;
};

type CheckoutCartLine = {
  variantId: string;
  productId: string;
  sku: string;
  title: string;
  flavor: string | null;
  categoryId: string | null;
  quantity: number;
  unitPriceNgn: number;
};

type CheckoutInput = {
  cartId: string;
  userId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhoneE164: string;
  deliveryLocation: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
};

type CreatedOrder = {
  orderId: string;
  orderNumber: string;
};

type LockedCart = {
  status: string;
  expiresAt: string | null;
  convertedOrderId: string | null;
};

const CART_IDLE_TTL_DAYS = 14;

function generateOrderNumber() {
  return `HOP-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function generateTransferReference(orderNumber: string) {
  return `PRAX-${orderNumber.replace(/^HOP-/, "")}`;
}

function buildDeliverySnapshot(input: {
  deliveryLocation: string;
  latitude: number | null;
  longitude: number | null;
}) {
  return {
    label: input.deliveryLocation,
    formatted: input.deliveryLocation,
    line1: input.deliveryLocation,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

function normalizeOptionalText(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function buildCartExpiryDate() {
  return new Date(
    Date.now() + CART_IDLE_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}

async function expireCartIfNeeded(cartId: string) {
  await query(
    `
      update app.carts
      set
        status = 'expired',
        last_interacted_at = timezone('utc', now())
      where id = $1
        and status = 'active'
        and expires_at is not null
        and expires_at <= timezone('utc', now())
    `,
    [cartId]
  );
}

async function findOrderSummaryById(
  queryFn: typeof query,
  orderId: string
) {
  const result = await queryFn<CreatedOrder>(
    `
      select
        id as "orderId",
        public_order_number as "orderNumber"
      from app.orders
      where id = $1
      limit 1
    `,
    [orderId]
  );

  return result.rows[0] ?? null;
}

async function resolveProductVariant(productId: string) {
  const result = await query<ProductVariantLookup>(
    `
      select
        v.id as "variantId",
        p.slug as "productId"
      from app.products p
      inner join app.product_variants v
        on v.product_id = p.id
       and v.status = 'active'
       and v.is_default = true
      where p.slug = $1
        and p.status = 'active'
        and p.is_available = true
        and p.merchandising_state <> 'hidden'
      limit 1
    `,
    [productId]
  );

  return result.rows[0] ?? null;
}

async function findActiveUserCart(userId: string, excludeCartId?: string | null) {
  const result = await query<CartContext>(
    `
      select id as "cartId", user_id as "userId"
      from app.carts
      where user_id = $1
        and status = 'active'
        and (expires_at is null or expires_at > timezone('utc', now()))
        and ($2::uuid is null or id <> $2::uuid)
      order by updated_at desc
      limit 1
    `,
    [userId, excludeCartId ?? null]
  );

  return result.rows[0] ?? null;
}

async function assignCartToUser(cartId: string, userId: string) {
  await query(
    `
      update app.carts
      set
        user_id = $1,
        last_interacted_at = timezone('utc', now()),
        expires_at = $3
      where id = $2
    `,
    [userId, cartId, buildCartExpiryDate()]
  );

  return {
    cartId,
    userId,
  } satisfies CartContext;
}

async function mergeCartIntoTarget(
  sourceCartId: string,
  targetCartId: string,
  userId: string
) {
  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        insert into app.cart_items (cart_id, variant_id, quantity)
        select $2, variant_id, quantity
        from app.cart_items
        where cart_id = $1
        on conflict (cart_id, variant_id)
        do update set
          quantity = app.cart_items.quantity + excluded.quantity,
          updated_at = timezone('utc', now())
      `,
      [sourceCartId, targetCartId]
    );

    await queryFn(
      `
        update app.carts
        set
          status = 'abandoned',
          user_id = null,
          last_interacted_at = timezone('utc', now())
        where id = $1
      `,
      [sourceCartId]
    );

    await queryFn(
      `
        update app.carts
        set
          user_id = $1,
          last_interacted_at = timezone('utc', now()),
          expires_at = $3
        where id = $2
      `,
      [userId, targetCartId, buildCartExpiryDate()]
    );
  });

  return {
    cartId: targetCartId,
    userId,
  } satisfies CartContext;
}

async function resolveCartContext(
  cartId: string | null,
  userId: string | null
): Promise<CartContext | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  if (cartId) {
    const existingResult = await query<CartContext>(
      `
        select id as "cartId", user_id as "userId"
        from app.carts
        where id = $1
          and status = 'active'
        limit 1
      `,
      [cartId]
    );

    const existing = existingResult.rows[0] ?? null;

    if (existing) {
      await expireCartIfNeeded(existing.cartId);

      const activeExistingResult = await query<CartContext>(
        `
          select id as "cartId", user_id as "userId"
          from app.carts
          where id = $1
            and status = 'active'
            and (expires_at is null or expires_at > timezone('utc', now()))
          limit 1
        `,
        [existing.cartId]
      );

      const activeExisting = activeExistingResult.rows[0] ?? null;

      if (!activeExisting) {
        return resolveCartContext(null, userId);
      }

      if (userId) {
        if (activeExisting.userId === userId) {
          return activeExisting;
        }

        if (!activeExisting.userId) {
          const userCart = await findActiveUserCart(
            userId,
            activeExisting.cartId
          );

          if (userCart) {
            return mergeCartIntoTarget(
              activeExisting.cartId,
              userCart.cartId,
              userId
            );
          }

          return assignCartToUser(activeExisting.cartId, userId);
        }

        const userCart = await findActiveUserCart(userId);

        if (userCart) {
          return userCart;
        }

        const createdResult = await query<CartContext>(
          `
            insert into app.carts (user_id, status, last_interacted_at, expires_at)
            values ($1, 'active', timezone('utc', now()), $2)
            returning id as "cartId", user_id as "userId"
          `,
          [userId, buildCartExpiryDate()]
        );

        return createdResult.rows[0] ?? null;
      }

      return activeExisting;
    }
  }

  if (userId) {
    const existingUserCart = await findActiveUserCart(userId);

    if (existingUserCart) {
      return existingUserCart;
    }
  }

  const createdResult = await query<CartContext>(
    `
      insert into app.carts (user_id, status, last_interacted_at, expires_at)
      values ($1, 'active', timezone('utc', now()), $2)
      returning id as "cartId", user_id as "userId"
    `,
    [userId, buildCartExpiryDate()]
  );

  return createdResult.rows[0] ?? null;
}

async function touchCart(cartId: string, queryFn = query) {
  await queryFn(
    `
      update app.carts
      set
        last_interacted_at = timezone('utc', now()),
        expires_at = $2
      where id = $1
    `,
    [cartId, buildCartExpiryDate()]
  );
}

export async function getOrCreateCartContext(
  cartId: string | null,
  userId: string | null
) {
  return resolveCartContext(cartId, userId);
}

export async function getCartSnapshot(cartId: string | null) {
  if (!cartId || !isDatabaseConfigured()) {
    return null;
  }

  await expireCartIfNeeded(cartId);

  const cartResult = await query<{ cartId: string }>(
    `
      select id as "cartId"
      from app.carts
      where id = $1
        and status = 'active'
        and (expires_at is null or expires_at > timezone('utc', now()))
      limit 1
    `,
    [cartId]
  );

  const activeCart = cartResult.rows[0];

  if (!activeCart) {
    return null;
  }

  const itemsResult = await query<{
    productId: string;
    quantity: number;
  }>(
    `
      select
        p.slug as "productId",
        ci.quantity
      from app.cart_items ci
      inner join app.product_variants v
        on v.id = ci.variant_id
      inner join app.products p
        on p.id = v.product_id
      where ci.cart_id = $1
      order by ci.created_at asc
    `,
    [cartId]
  );

  return {
    cartId,
    itemCount: itemsResult.rows.reduce((total, item) => total + item.quantity, 0),
    items: itemsResult.rows,
  } satisfies CartSnapshot;
}

export async function replaceCartItems(
  cartId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const normalizedItems = items
    .map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }))
    .filter((item) => item.productId);

  await withTransaction(async (queryFn) => {
    await queryFn("delete from app.cart_items where cart_id = $1", [cartId]);

    for (const item of normalizedItems) {
      const variant = await resolveProductVariant(item.productId);

      if (!variant) {
        continue;
      }

      await queryFn(
        `
          insert into app.cart_items (cart_id, variant_id, quantity)
          values ($1, $2, $3)
        `,
        [cartId, variant.variantId, item.quantity]
      );
    }

    await touchCart(cartId, queryFn);
  });
}

export async function addCartItem(
  cartId: string,
  productId: string,
  quantity: number
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const normalizedQuantity = Math.max(1, Math.floor(quantity));
  const variant = await resolveProductVariant(productId);

  if (!variant) {
    throw new Error("Product is not available.");
  }

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        insert into app.cart_items (cart_id, variant_id, quantity)
        values ($1, $2, $3)
        on conflict (cart_id, variant_id)
        do update set
          quantity = app.cart_items.quantity + excluded.quantity,
          updated_at = timezone('utc', now())
      `,
      [cartId, variant.variantId, normalizedQuantity]
    );

    await touchCart(cartId, queryFn);
  });
}

export async function setCartItemQuantity(
  cartId: string,
  productId: string,
  quantity: number
) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const variant = await resolveProductVariant(productId);

  if (!variant) {
    throw new Error("Product is not available.");
  }

  const normalizedQuantity = Math.floor(quantity);

  await withTransaction(async (queryFn) => {
    if (normalizedQuantity <= 0) {
      await queryFn(
        `
          delete from app.cart_items
          where cart_id = $1
            and variant_id = $2
        `,
        [cartId, variant.variantId]
      );
    } else {
      await queryFn(
        `
          insert into app.cart_items (cart_id, variant_id, quantity)
          values ($1, $2, $3)
          on conflict (cart_id, variant_id)
          do update set
            quantity = excluded.quantity,
            updated_at = timezone('utc', now())
        `,
        [cartId, variant.variantId, normalizedQuantity]
      );
    }

    await touchCart(cartId, queryFn);
  });
}

export async function removeCartItem(cartId: string, productId: string) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const variant = await resolveProductVariant(productId);

  if (!variant) {
    return;
  }

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        delete from app.cart_items
        where cart_id = $1
          and variant_id = $2
      `,
      [cartId, variant.variantId]
    );

    await touchCart(cartId, queryFn);
  });
}

export async function clearCart(cartId: string) {
  if (!isDatabaseConfigured()) {
    return;
  }

  await withTransaction(async (queryFn) => {
    await queryFn("delete from app.cart_items where cart_id = $1", [cartId]);
    await touchCart(cartId, queryFn);
  });
}

function calculateCartTotals(lines: CheckoutCartLine[]) {
  const subtotalNgn = lines.reduce(
    (total, line) => total + line.unitPriceNgn * line.quantity,
    0
  );
  const shotLines = lines.filter((line) => line.categoryId === "shots");
  const shotQuantity = shotLines.reduce((total, line) => total + line.quantity, 0);
  const shotUnitPriceNgn = shotLines[0]?.unitPriceNgn ?? 0;
  const bundlePricing = getShotBundlePricing(shotQuantity, shotUnitPriceNgn);
  const discountNgn = bundlePricing.discountNgn;
  const deliveryFeeNgn = 0;
  const totalNgn = Math.max(0, subtotalNgn - discountNgn + deliveryFeeNgn);

  return {
    subtotalNgn,
    discountNgn,
    deliveryFeeNgn,
    totalNgn,
  };
}

export async function createOrderFromCart(input: CheckoutInput) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }
  const normalizedNotes = normalizeOptionalText(input.notes);
  const normalizedEmail = normalizeOptionalText(input.customerEmail)?.toLowerCase() ?? null;

  return withTransaction(async (queryFn) => {
    const cartResult = await queryFn<LockedCart>(
      `
        select
          status,
          expires_at as "expiresAt",
          converted_order_id as "convertedOrderId"
        from app.carts
        where id = $1
        for update
      `,
      [input.cartId]
    );

    const cart = cartResult.rows[0];

    if (!cart) {
      throw new Error("Cart is unavailable.");
    }

    if (cart.status === "converted" && cart.convertedOrderId) {
      const existingOrder = await findOrderSummaryById(
        queryFn,
        cart.convertedOrderId
      );

      if (existingOrder) {
        return existingOrder;
      }
    }

    if (cart.status !== "active") {
      throw new Error("Cart is no longer active.");
    }

    if (cart.expiresAt && new Date(cart.expiresAt).getTime() <= Date.now()) {
      await queryFn(
        `
          update app.carts
          set
            status = 'expired',
            last_interacted_at = timezone('utc', now())
          where id = $1
        `,
        [input.cartId]
      );

      throw new Error("Cart expired.");
    }

    const linesResult = await queryFn<CheckoutCartLine>(
      `
        select
          v.id as "variantId",
          p.slug as "productId",
          v.sku,
          p.name as title,
          nullif(v.attributes ->> 'flavor', '') as flavor,
          pc.slug as "categoryId",
          ci.quantity,
          v.price_ngn as "unitPriceNgn"
        from app.cart_items ci
        inner join app.product_variants v
          on v.id = ci.variant_id
        inner join app.products p
          on p.id = v.product_id
        left join app.product_categories pc
          on pc.id = p.category_id
        where ci.cart_id = $1
        order by ci.created_at asc
      `,
      [input.cartId]
    );
    const lines = linesResult.rows;

    if (lines.length === 0) {
      throw new Error("Cart is empty.");
    }

    const totals = calculateCartTotals(lines);
    let createdOrder: CreatedOrder | null = null;

    while (!createdOrder) {
      try {
        const orderNumber = generateOrderNumber();
        const transferReference = generateTransferReference(orderNumber);
        const orderResult = await queryFn<CreatedOrder>(
          `
            insert into app.orders (
              public_order_number,
              user_id,
              source_channel,
              status,
              payment_status,
              fulfillment_status,
              customer_name,
              customer_email,
              customer_phone_e164,
              delivery_address_snapshot,
              notes,
              subtotal_ngn,
              discount_ngn,
              delivery_fee_ngn,
              total_ngn,
              transfer_reference,
              transfer_deadline_at
            )
            values (
              $1,
              $2,
              'web',
              'checkout_draft',
              'awaiting_transfer',
              'pending',
              $3,
              $4,
              $5,
              $6::jsonb,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              null
            )
            returning id as "orderId", public_order_number as "orderNumber"
          `,
          [
            orderNumber,
            input.userId,
            input.customerName,
            normalizedEmail,
            input.customerPhoneE164,
            JSON.stringify(
              buildDeliverySnapshot({
                deliveryLocation: input.deliveryLocation,
                latitude: input.latitude,
                longitude: input.longitude,
              })
            ),
            normalizedNotes,
            totals.subtotalNgn,
            totals.discountNgn,
            totals.deliveryFeeNgn,
            totals.totalNgn,
            transferReference,
          ]
        );

        createdOrder = orderResult.rows[0] ?? null;
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "23505"
        ) {
          continue;
        }

        throw error;
      }
    }

    if (!createdOrder) {
      throw new Error("Unable to create order.");
    }

    for (const line of lines) {
      const title = line.flavor ? `${line.title} (${line.flavor})` : line.title;

      await queryFn(
        `
          insert into app.order_items (
            order_id,
            variant_id,
            sku,
            title,
            flavor,
            quantity,
            unit_price_ngn,
            line_total_ngn,
            snapshot
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        `,
        [
          createdOrder.orderId,
          line.variantId,
          line.sku,
          title,
          line.flavor,
          line.quantity,
          line.unitPriceNgn,
          line.unitPriceNgn * line.quantity,
          JSON.stringify({
            productId: line.productId,
            categoryId: line.categoryId,
          }),
        ]
      );
    }

    await queryFn(
      `
        insert into app.order_status_events (
          order_id,
          from_status,
          to_status,
          actor_type,
          actor_email,
          note
        )
        values ($1, null, 'checkout_draft', 'customer', $2, null)
      `,
      [createdOrder.orderId, normalizedEmail]
    );

    await queryFn(
      `
        update app.carts
        set
          status = 'converted',
          converted_order_id = $1,
          last_interacted_at = timezone('utc', now())
        where id = $2
      `,
      [createdOrder.orderId, input.cartId]
    );

    return createdOrder;
  }, {
    actor: {
      userId: input.userId,
      email: normalizedEmail,
      role: "customer",
    },
  });
}
