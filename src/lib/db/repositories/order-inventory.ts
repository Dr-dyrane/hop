import "server-only";

import type { QueryResult, QueryResultRow } from "pg";

type QueryFn = <TRow extends QueryResultRow>(
  text: string,
  values?: unknown[]
) => Promise<QueryResult<TRow>>;

type OrderInventoryLine = {
  variantId: string;
  quantity: number;
  title: string;
};

type InventoryState = {
  variantId: string;
  onHand: number;
  reserved: number;
};

async function listOrderInventoryLines(queryFn: QueryFn, orderId: string) {
  const result = await queryFn<OrderInventoryLine>(
    `
      select
        oi.variant_id as "variantId",
        sum(oi.quantity)::int as quantity,
        max(oi.title) as title
      from app.order_items oi
      where oi.order_id = $1
        and oi.variant_id is not null
      group by oi.variant_id
    `,
    [orderId]
  );

  return result.rows;
}

async function lockInventoryState(
  queryFn: QueryFn,
  variantIds: string[]
) {
  if (variantIds.length === 0) {
    return [] satisfies InventoryState[];
  }

  const result = await queryFn<InventoryState>(
    `
      select
        variant_id as "variantId",
        on_hand as "onHand",
        reserved
      from app.inventory_items
      where variant_id = any($1::uuid[])
      for update
    `,
    [variantIds]
  );

  return result.rows;
}

async function applyInventoryDelta(
  queryFn: QueryFn,
  orderId: string,
  mode: "reserve" | "release" | "deliver" | "restock"
) {
  const lines = await listOrderInventoryLines(queryFn, orderId);

  if (lines.length === 0) {
    return;
  }

  const inventoryRows = await lockInventoryState(
    queryFn,
    lines.map((line) => line.variantId)
  );
  const inventoryByVariant = new Map(
    inventoryRows.map((row) => [row.variantId, row])
  );

  if (mode === "reserve") {
    for (const line of lines) {
      const inventory = inventoryByVariant.get(line.variantId);

      if (!inventory) {
        throw new Error(`${line.title} cannot be accepted yet. No stock record is available.`);
      }

      const available = inventory.onHand - inventory.reserved;

      if (available < line.quantity) {
        throw new Error(
          available <= 0
            ? `${line.title} cannot be accepted yet. It is out of stock.`
            : `${line.title} cannot be accepted yet. Only ${available} left.`
        );
      }
    }
  }

  if (mode === "deliver") {
    for (const line of lines) {
      const inventory = inventoryByVariant.get(line.variantId);

      if (!inventory) {
        continue;
      }

      if (inventory.onHand < line.quantity) {
        throw new Error(`${line.title} stock is inconsistent.`);
      }
    }
  }

  const valueExpression =
    mode === "reserve"
      ? "ii.reserved + order_inventory.quantity"
      : mode === "release"
        ? "greatest(0, ii.reserved - order_inventory.quantity)"
        : "greatest(0, ii.reserved - order_inventory.quantity)";
  const onHandExpression =
    mode === "deliver"
      ? "greatest(0, ii.on_hand - order_inventory.quantity)"
      : mode === "restock"
        ? "ii.on_hand + order_inventory.quantity"
        : "ii.on_hand";

  await queryFn(
    `
      with order_inventory as (
        select
          oi.variant_id,
          sum(oi.quantity)::int as quantity
        from app.order_items oi
        where oi.order_id = $1
          and oi.variant_id is not null
        group by oi.variant_id
      )
      update app.inventory_items ii
      set
        reserved = ${valueExpression},
        on_hand = ${onHandExpression}
      from order_inventory
      where ii.variant_id = order_inventory.variant_id
    `,
    [orderId]
  );
}

export async function reserveInventoryForOrder(queryFn: QueryFn, orderId: string) {
  await applyInventoryDelta(queryFn, orderId, "reserve");
}

export async function releaseInventoryReservationForOrder(
  queryFn: QueryFn,
  orderId: string
) {
  await applyInventoryDelta(queryFn, orderId, "release");
}

export async function finalizeInventoryForDeliveredOrder(
  queryFn: QueryFn,
  orderId: string
) {
  await applyInventoryDelta(queryFn, orderId, "deliver");
}

export async function restockInventoryForReturnedOrder(
  queryFn: QueryFn,
  orderId: string
) {
  await applyInventoryDelta(queryFn, orderId, "restock");
}
