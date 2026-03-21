import "server-only";

import type { QueryResult, QueryResultRow } from "pg";
import type { AdminOrderInventoryReadiness, AdminOrderInventoryReadinessRow } from "@/lib/db/types";

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

type OrderInventoryReadinessState = {
  variantId: string;
  quantity: number;
  title: string;
  onHand: number | null;
  reserved: number | null;
  reorderThreshold: number | null;
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

export async function getOrderInventoryAcceptanceReadiness(
  queryFn: QueryFn,
  orderId: string
): Promise<AdminOrderInventoryReadiness> {
  const result = await queryFn<OrderInventoryReadinessState>(
    `
      select
        oi.variant_id as "variantId",
        sum(oi.quantity)::int as quantity,
        max(oi.title) as title,
        ii.on_hand as "onHand",
        ii.reserved as "reserved",
        ii.reorder_threshold as "reorderThreshold"
      from app.order_items oi
      left join app.inventory_items ii
        on ii.variant_id = oi.variant_id
      where oi.order_id = $1
        and oi.variant_id is not null
      group by
        oi.variant_id,
        ii.on_hand,
        ii.reserved,
        ii.reorder_threshold
      order by max(oi.created_at) asc, max(oi.title) asc
    `,
    [orderId]
  );

  const rows: AdminOrderInventoryReadinessRow[] = result.rows.map((row) => {
    if (row.onHand === null || row.reserved === null) {
      return {
        variantId: row.variantId,
        title: row.title,
        quantity: row.quantity,
        onHand: row.onHand,
        reserved: row.reserved,
        available: null,
        reorderThreshold: row.reorderThreshold,
        status: "blocked",
        detail: "No stock record.",
      };
    }

    const available = Math.max(row.onHand - row.reserved, 0);
    const remainingAfterAccept = available - row.quantity;
    const lowThreshold = Math.max(row.reorderThreshold ?? 0, 0);

    if (available < row.quantity) {
      return {
        variantId: row.variantId,
        title: row.title,
        quantity: row.quantity,
        onHand: row.onHand,
        reserved: row.reserved,
        available,
        reorderThreshold: row.reorderThreshold,
        status: "blocked",
        detail:
          available <= 0
            ? "Out of stock."
            : `Only ${available} left.`,
      };
    }

    if (remainingAfterAccept <= lowThreshold || remainingAfterAccept === 0) {
      return {
        variantId: row.variantId,
        title: row.title,
        quantity: row.quantity,
        onHand: row.onHand,
        reserved: row.reserved,
        available,
        reorderThreshold: row.reorderThreshold,
        status: "low",
        detail:
          remainingAfterAccept <= 0
            ? "Will use the last units."
            : `${remainingAfterAccept} left after accept.`,
      };
    }

    return {
      variantId: row.variantId,
      title: row.title,
      quantity: row.quantity,
      onHand: row.onHand,
      reserved: row.reserved,
      available,
      reorderThreshold: row.reorderThreshold,
      status: "ready",
      detail: "Ready now.",
    };
  });

  const canAccept = rows.every((row) => row.status !== "blocked");
  const hasLowStock = rows.some((row) => row.status === "low");

  return {
    canAccept,
    hasLowStock,
    summary:
      rows.length === 0
        ? "No stock check needed."
        : !canAccept
          ? "Needs stock."
          : hasLowStock
            ? "Acceptable now. Low after accept."
            : "Ready to accept.",
    rows,
  };
}

async function listReturnInventoryLines(queryFn: QueryFn, returnCaseId: string) {
  const result = await queryFn<OrderInventoryLine>(
    `
      select
        oi.variant_id as "variantId",
        sum(rci.quantity)::int as quantity,
        max(rci.title) as title
      from app.order_return_case_items rci
      inner join app.order_items oi
        on oi.id = rci.order_item_id
      where rci.return_case_id = $1
        and oi.variant_id is not null
      group by oi.variant_id
    `,
    [returnCaseId]
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
  sourceId: string,
  mode: "reserve" | "release" | "deliver" | "restock"
) {
  const lines =
    mode === "restock"
      ? await listReturnInventoryLines(queryFn, sourceId)
      : await listOrderInventoryLines(queryFn, sourceId);

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
      ? "ii.reserved + inventory_source.quantity"
      : mode === "release"
        ? "greatest(0, ii.reserved - inventory_source.quantity)"
        : "greatest(0, ii.reserved - inventory_source.quantity)";
  const onHandExpression =
    mode === "deliver"
      ? "greatest(0, ii.on_hand - inventory_source.quantity)"
      : mode === "restock"
        ? "ii.on_hand + inventory_source.quantity"
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
      ),
      return_inventory as (
        select
          oi.variant_id,
          sum(rci.quantity)::int as quantity
        from app.order_return_case_items rci
        inner join app.order_items oi
          on oi.id = rci.order_item_id
        where rci.return_case_id = $1
          and oi.variant_id is not null
        group by oi.variant_id
      )
      update app.inventory_items ii
      set
        reserved = ${mode === "restock" ? "ii.reserved" : valueExpression},
        on_hand = ${mode === "restock" ? "ii.on_hand + inventory_source.quantity" : onHandExpression}
      from ${mode === "restock" ? "return_inventory" : "order_inventory"} inventory_source
      where ii.variant_id = inventory_source.variant_id
    `,
    [sourceId]
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
  returnCaseId: string
) {
  await applyInventoryDelta(queryFn, returnCaseId, "restock");
}
