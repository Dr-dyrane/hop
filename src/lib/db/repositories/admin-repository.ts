import "server-only";

import {
  isDatabaseConfigured,
  query,
  type DatabaseActorContext,
} from "@/lib/db/client";
import { expireStaleAwaitingTransferOrders } from "@/lib/db/repositories/orders-repository";
import type {
  AdminCustomerAddressRow,
  AdminCustomerDetail,
  AdminCustomerOrderRow,
  AdminCustomerSummary,
  AdminLayoutSection,
  AdminLayoutSummary,
  AdminOverviewMetrics,
  AdminOverviewSnapshot,
  BankAccountRow,
  SiteSettingRow,
} from "@/lib/db/types";

function buildAdminActor(email?: string | null): DatabaseActorContext | undefined {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "admin",
  };
}

export async function getAdminOverviewMetrics() {
  if (!isDatabaseConfigured()) {
    return {
      activeProducts: 0,
      availableProducts: 0,
      featuredProducts: 0,
      enabledHomeSections: 0,
      homeBindingCount: 0,
      homeVersionLabel: null,
    } satisfies AdminOverviewMetrics;
  }

  const result = await query<AdminOverviewMetrics>(
    `
      with published_home as (
        select pv.id, pv.label
        from app.pages p
        inner join app.page_versions pv
          on pv.page_id = p.id
         and pv.status = 'published'
        where p.key = 'home'
        limit 1
      )
      select
        (
          select count(*)::int
          from app.products p
          where p.status = 'active'
        ) as "activeProducts",
        (
          select count(*)::int
          from app.products p
          where p.status = 'active'
            and p.is_available = true
        ) as "availableProducts",
        (
          select count(*)::int
          from app.products p
          where p.status = 'active'
            and p.merchandising_state = 'featured'
        ) as "featuredProducts",
        (
          select count(*)::int
          from published_home ph
          inner join app.page_sections ps
            on ps.page_version_id = ph.id
          where ps.is_enabled = true
        ) as "enabledHomeSections",
        (
          select count(*)::int
          from published_home ph
          inner join app.page_sections ps
            on ps.page_version_id = ph.id
          inner join app.page_section_bindings psb
            on psb.page_section_id = ps.id
        ) as "homeBindingCount",
        (
          select ph.label
          from published_home ph
        ) as "homeVersionLabel"
    `
  );

  return result.rows[0];
}

export async function getAdminOverviewSnapshot() {
  if (!isDatabaseConfigured()) {
    return {
      openOrders: 0,
      requestQueue: 0,
      paymentReviewQueue: 0,
      preparingQueue: 0,
      outForDeliveryQueue: 0,
      awaitingTransferAmountNgn: 0,
      reviewAmountNgn: 0,
      grossLast24hNgn: 0,
      grossLast7dNgn: 0,
      grossMonthNgn: 0,
    } satisfies AdminOverviewSnapshot;
  }

  await expireStaleAwaitingTransferOrders();

  const result = await query<AdminOverviewSnapshot>(
    `
      select
        (
          select count(*)::int
          from app.orders o
          where o.status not in ('delivered', 'cancelled', 'expired')
        ) as "openOrders",
        (
          select count(*)::int
          from app.orders o
          where o.status = 'checkout_draft'
        ) as "requestQueue",
        (
          select count(*)::int
          from app.payments p
          where p.status in ('submitted', 'under_review')
        ) as "paymentReviewQueue",
        (
          select count(*)::int
          from app.orders o
          where (
            o.fulfillment_status in ('preparing', 'ready_for_dispatch')
            or o.status in ('preparing', 'ready_for_dispatch', 'payment_confirmed')
          )
            and o.status not in ('cancelled', 'expired')
        ) as "preparingQueue",
        (
          select count(*)::int
          from app.orders o
          where (
            o.fulfillment_status = 'out_for_delivery'
            or o.status = 'out_for_delivery'
          )
            and o.status not in ('cancelled', 'expired')
        ) as "outForDeliveryQueue",
        (
          select coalesce(sum(p.expected_amount_ngn), 0)::int
          from app.payments p
          where p.status = 'awaiting_transfer'
        ) as "awaitingTransferAmountNgn",
        (
          select coalesce(sum(coalesce(p.submitted_amount_ngn, p.expected_amount_ngn)), 0)::int
          from app.payments p
          where p.status in ('submitted', 'under_review')
        ) as "reviewAmountNgn",
        (
          select coalesce(sum(o.total_ngn), 0)::int
          from app.orders o
          where o.placed_at >= timezone('utc', now()) - interval '24 hours'
            and o.status not in ('cancelled', 'expired')
        ) as "grossLast24hNgn",
        (
          select coalesce(sum(o.total_ngn), 0)::int
          from app.orders o
          where o.placed_at >= timezone('utc', now()) - interval '7 days'
            and o.status not in ('cancelled', 'expired')
        ) as "grossLast7dNgn",
        (
          select coalesce(sum(o.total_ngn), 0)::int
          from app.orders o
          where o.placed_at >= date_trunc('month', timezone('utc', now()))
            and o.status not in ('cancelled', 'expired')
        ) as "grossMonthNgn"
    `
  );

  return result.rows[0];
}

export async function getAdminHomeLayoutSummary() {
  if (!isDatabaseConfigured()) {
    return {
      versionId: null,
      versionLabel: null,
      sectionCount: 0,
      enabledSectionCount: 0,
      bindingCount: 0,
    } satisfies AdminLayoutSummary;
  }

  const result = await query<AdminLayoutSummary>(
    `
      select
        pv.id as "versionId",
        pv.label as "versionLabel",
        count(distinct ps.id)::int as "sectionCount",
        (count(distinct ps.id) filter (where ps.is_enabled = true))::int as "enabledSectionCount",
        count(psb.id)::int as "bindingCount"
      from app.pages p
      inner join app.page_versions pv
        on pv.page_id = p.id
       and pv.status = 'published'
      left join app.page_sections ps
        on ps.page_version_id = pv.id
      left join app.page_section_bindings psb
        on psb.page_section_id = ps.id
      where p.key = 'home'
      group by pv.id, pv.label
      limit 1
    `
  );

  return (
    result.rows[0] ??
    ({
      versionId: null,
      versionLabel: null,
      sectionCount: 0,
      enabledSectionCount: 0,
      bindingCount: 0,
    } satisfies AdminLayoutSummary)
  );
}

export async function listAdminHomeLayoutSections() {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminLayoutSection[];
  }

  const result = await query<AdminLayoutSection>(
    `
      select
        ps.id as "sectionId",
        ps.section_key as "sectionKey",
        ps.section_type as "sectionType",
        ps.sort_order as "sortOrder",
        ps.is_enabled as "isEnabled",
        ps.eyebrow,
        ps.heading,
        count(distinct psp.id)::int as "presentationCount",
        count(distinct psb.id)::int as "bindingCount"
      from app.pages p
      inner join app.page_versions pv
        on pv.page_id = p.id
       and pv.status = 'published'
      inner join app.page_sections ps
        on ps.page_version_id = pv.id
      left join app.page_section_presentations psp
        on psp.page_section_id = ps.id
      left join app.page_section_bindings psb
        on psb.page_section_id = ps.id
      where p.key = 'home'
      group by
        ps.id,
        ps.section_key,
        ps.section_type,
        ps.sort_order,
        ps.is_enabled,
        ps.eyebrow,
        ps.heading,
        ps.created_at
      order by ps.sort_order asc, ps.created_at asc
    `
  );

  return result.rows;
}

export async function listAdminCustomerSummaries(
  limit = 40,
  actorEmail?: string | null
) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminCustomerSummary[];
  }

  await expireStaleAwaitingTransferOrders();

  const result = await query<AdminCustomerSummary>(
    `
      with order_people as (
        select
          coalesce(o.user_id::text, lower(o.customer_email), o.customer_phone_e164) as customer_key,
          o.user_id,
          lower(o.customer_email) as normalized_email,
          o.customer_name,
          o.customer_phone_e164,
          o.status,
          o.public_order_number,
          o.placed_at,
          o.created_at
        from app.orders o
        where coalesce(o.user_id::text, lower(o.customer_email), o.customer_phone_e164) is not null
      ),
      rollup as (
        select
          op.customer_key,
          max(op.user_id::text)::uuid as user_id,
          max(op.normalized_email) as email,
          max(op.customer_name) as customer_name,
          max(op.customer_phone_e164) as phone,
          count(*)::int as total_orders,
          count(*) filter (
            where op.status not in ('delivered', 'cancelled', 'expired')
          )::int as active_orders,
          max(op.placed_at) as latest_order_at
        from order_people op
        group by op.customer_key
      ),
      latest_order as (
        select distinct on (op.customer_key)
          op.customer_key,
          op.public_order_number,
          op.status,
          op.placed_at
        from order_people op
        order by op.customer_key, op.placed_at desc, op.created_at desc
      ),
      address_counts as (
        select
          a.user_id,
          count(*)::int as address_count
        from app.addresses a
        group by a.user_id
      )
      select
        r.customer_key as "customerKey",
        r.user_id as "userId",
        r.email as email,
        coalesce(p.full_name, r.customer_name) as "fullName",
        coalesce(p.preferred_phone_e164, r.phone) as phone,
        coalesce(cr.support_state, 'standard') as "supportState",
        coalesce(cr.tags, '{}'::text[]) as tags,
        nullif(left(trim(coalesce(cr.notes, '')), 120), '') as "notePreview",
        r.total_orders as "totalOrders",
        r.active_orders as "activeOrders",
        coalesce(ac.address_count, 0)::int as "addressCount",
        lo.public_order_number as "latestOrderNumber",
        lo.status as "latestOrderStatus",
        lo.placed_at as "latestOrderAt"
      from rollup r
      left join app.profiles p
        on p.user_id = r.user_id
      left join app.customer_records cr
        on lower(cr.customer_key) = lower(r.customer_key)
      left join address_counts ac
        on ac.user_id = r.user_id
      left join latest_order lo
        on lo.customer_key = r.customer_key
      order by r.latest_order_at desc nulls last
      limit $1
    `,
    [limit],
    { actor: buildAdminActor(actorEmail) }
  );

  return result.rows;
}

export async function getAdminCustomerDetail(
  customerKey: string,
  actorEmail?: string | null
) {
  if (!isDatabaseConfigured() || !customerKey) {
    return null;
  }

  await expireStaleAwaitingTransferOrders();

  const normalizedKey = customerKey.trim().toLowerCase();
  const actor = buildAdminActor(actorEmail);

  const summaryResult = await query<AdminCustomerDetail>(
    `
      with order_people as (
        select
          coalesce(o.user_id::text, lower(o.customer_email), o.customer_phone_e164) as customer_key,
          o.user_id,
          lower(o.customer_email) as normalized_email,
          o.customer_name,
          o.customer_phone_e164,
          o.status,
          o.public_order_number,
          o.placed_at,
          o.created_at
        from app.orders o
        where coalesce(o.user_id::text, lower(o.customer_email), o.customer_phone_e164) is not null
      ),
      rollup as (
        select
          op.customer_key,
          max(op.user_id::text)::uuid as user_id,
          max(op.normalized_email) as email,
          max(op.customer_name) as customer_name,
          max(op.customer_phone_e164) as phone,
          count(*)::int as total_orders,
          count(*) filter (
            where op.status not in ('delivered', 'cancelled', 'expired')
          )::int as active_orders,
          max(op.placed_at) as latest_order_at
        from order_people op
        group by op.customer_key
      ),
      latest_order as (
        select distinct on (op.customer_key)
          op.customer_key,
          op.public_order_number,
          op.status,
          op.placed_at
        from order_people op
        order by op.customer_key, op.placed_at desc, op.created_at desc
      ),
      address_counts as (
        select
          a.user_id,
          count(*)::int as address_count
        from app.addresses a
        group by a.user_id
      )
      select
        r.customer_key as "customerKey",
        r.user_id as "userId",
        r.email as email,
        coalesce(p.full_name, r.customer_name) as "fullName",
        coalesce(p.preferred_phone_e164, r.phone) as phone,
        coalesce(cr.support_state, 'standard') as "supportState",
        coalesce(cr.tags, '{}'::text[]) as tags,
        nullif(left(trim(coalesce(cr.notes, '')), 120), '') as "notePreview",
        cr.notes as notes,
        r.total_orders as "totalOrders",
        r.active_orders as "activeOrders",
        coalesce(ac.address_count, 0)::int as "addressCount",
        lo.public_order_number as "latestOrderNumber",
        lo.status as "latestOrderStatus",
        lo.placed_at as "latestOrderAt"
      from rollup r
      left join app.profiles p
        on p.user_id = r.user_id
      left join app.customer_records cr
        on lower(cr.customer_key) = lower(r.customer_key)
      left join address_counts ac
        on ac.user_id = r.user_id
      left join latest_order lo
        on lo.customer_key = r.customer_key
      where lower(r.customer_key) = $1
      limit 1
    `,
    [normalizedKey],
    { actor }
  );

  const summary = summaryResult.rows[0];

  if (!summary) {
    return null;
  }

  const [ordersResult, savedAddressesResult, recentOrderAddressResult] = await Promise.all([
    query<AdminCustomerOrderRow>(
      `
        select
          o.id as "orderId",
          o.public_order_number as "orderNumber",
          o.status,
          o.payment_status as "paymentStatus",
          o.fulfillment_status as "fulfillmentStatus",
          o.total_ngn as "totalNgn",
          count(oi.id)::int as "itemCount",
          o.placed_at as "placedAt"
        from app.orders o
        left join app.order_items oi
          on oi.order_id = o.id
        where lower(coalesce(o.user_id::text, lower(o.customer_email), o.customer_phone_e164)) = $1
        group by
          o.id,
          o.public_order_number,
          o.status,
          o.payment_status,
          o.fulfillment_status,
          o.total_ngn,
          o.placed_at
        order by o.placed_at desc, o.created_at desc
        limit 12
      `,
      [normalizedKey],
      { actor }
    ),
    summary.userId
      ? query<AdminCustomerAddressRow>(
          `
            select
              a.id as "addressId",
              coalesce(nullif(a.label, ''), 'Saved address') as label,
              a.recipient_name as "recipientName",
              a.phone_e164 as "phoneE164",
              a.line_1 as line1,
              a.line_2 as line2,
              a.landmark,
              a.city,
              a.state,
              a.postal_code as "postalCode",
              a.delivery_notes as "deliveryNotes",
              a.latitude::float8 as latitude,
              a.longitude::float8 as longitude,
              a.is_default as "isDefault",
              'saved'::text as source
            from app.addresses a
            where a.user_id = $1
            order by a.is_default desc, a.created_at desc
          `,
          [summary.userId],
          { actor }
        )
      : Promise.resolve({ rows: [] as AdminCustomerAddressRow[] }),
    query<AdminCustomerAddressRow>(
      `
        select
          null::uuid as "addressId",
          'Recent order'::text as label,
          coalesce(o.customer_name, 'Customer') as "recipientName",
          o.customer_phone_e164 as "phoneE164",
          coalesce(
            nullif(o.delivery_address_snapshot ->> 'line1', ''),
            nullif(o.delivery_address_snapshot ->> 'formatted', ''),
            'Address unavailable'
          ) as line1,
          nullif(o.delivery_address_snapshot ->> 'line2', '') as line2,
          nullif(o.delivery_address_snapshot ->> 'landmark', '') as landmark,
          coalesce(nullif(o.delivery_address_snapshot ->> 'city', ''), '-') as city,
          coalesce(nullif(o.delivery_address_snapshot ->> 'state', ''), '-') as state,
          nullif(o.delivery_address_snapshot ->> 'postalCode', '') as "postalCode",
          nullif(o.delivery_address_snapshot ->> 'deliveryNotes', '') as "deliveryNotes",
          nullif(o.delivery_address_snapshot ->> 'latitude', '')::float8 as latitude,
          nullif(o.delivery_address_snapshot ->> 'longitude', '')::float8 as longitude,
          false as "isDefault",
          'recent_order'::text as source
        from app.orders o
        where lower(coalesce(o.user_id::text, lower(o.customer_email), o.customer_phone_e164)) = $1
        order by o.placed_at desc, o.created_at desc
        limit 1
      `,
      [normalizedKey],
      { actor }
    ),
  ]);

  const addresses = [...savedAddressesResult.rows];
  const recentAddress = recentOrderAddressResult.rows[0];

  if (
    recentAddress &&
    !addresses.some(
      (address) =>
        address.line1 === recentAddress.line1 &&
        address.city === recentAddress.city &&
        address.state === recentAddress.state
    )
  ) {
    addresses.push(recentAddress);
  }

  return {
    ...summary,
    recentOrders: ordersResult.rows,
    addresses,
  } satisfies AdminCustomerDetail;
}

export async function getAdminSettingsSnapshot() {
  if (!isDatabaseConfigured()) {
    return {
      bankAccount: null as BankAccountRow | null,
      siteSettings: [] as SiteSettingRow[],
    };
  }

  const [bankAccountResult, siteSettingsResult] = await Promise.all([
    query<BankAccountRow>(
      `
        select
          id as "bankAccountId",
          bank_name as "bankName",
          account_name as "accountName",
          account_number as "accountNumber",
          instructions,
          is_default as "isDefault"
        from app.bank_accounts
        where is_active = true
        order by is_default desc, created_at desc
        limit 1
      `
    ),
    query<SiteSettingRow>(
      `
        select key, value
        from app.site_settings
        where key = any($1::text[])
        order by key asc
      `,
      [["delivery_defaults", "layout_preview"]]
    ),
  ]);

  return {
    bankAccount: bankAccountResult.rows[0] ?? null,
    siteSettings: siteSettingsResult.rows,
  };
}
