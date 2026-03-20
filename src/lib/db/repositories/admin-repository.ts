import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import type {
  AdminCatalogProduct,
  AdminCustomerSummary,
  AdminLayoutSection,
  AdminLayoutSummary,
  AdminOverviewMetrics,
  BankAccountRow,
  SiteSettingRow,
} from "@/lib/db/types";

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

export async function listAdminCatalogProducts() {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminCatalogProduct[];
  }

  const result = await query<AdminCatalogProduct>(
    `
      select
        p.id as "productId",
        p.slug as "productSlug",
        p.name as "productName",
        p.marketing_name as "productMarketingName",
        pc.name as "categoryName",
        p.merchandising_state as "merchandisingState",
        p.is_available as "isAvailable",
        v.name as "variantName",
        v.price_ngn as "priceNgn",
        count(vi.ingredient_id)::int as "ingredientCount"
      from app.products p
      left join app.product_categories pc
        on pc.id = p.category_id
      inner join app.product_variants v
        on v.product_id = p.id
       and v.is_default = true
      left join app.variant_ingredients vi
        on vi.variant_id = v.id
      where p.status = 'active'
      group by
        p.id,
        p.slug,
        p.name,
        p.marketing_name,
        pc.name,
        p.merchandising_state,
        p.is_available,
        v.name,
        v.price_ngn,
        p.sort_order,
        p.created_at,
        pc.sort_order
      order by
        pc.sort_order asc nulls last,
        p.sort_order asc,
        p.created_at asc
    `
  );

  return result.rows;
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

export async function listAdminCustomerSummaries(limit = 40) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminCustomerSummary[];
  }

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
          max(op.user_id) as user_id,
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
        r.total_orders as "totalOrders",
        r.active_orders as "activeOrders",
        coalesce(ac.address_count, 0)::int as "addressCount",
        lo.public_order_number as "latestOrderNumber",
        lo.status as "latestOrderStatus",
        lo.placed_at as "latestOrderAt"
      from rollup r
      left join app.profiles p
        on p.user_id = r.user_id
      left join address_counts ac
        on ac.user_id = r.user_id
      left join latest_order lo
        on lo.customer_key = r.customer_key
      order by r.latest_order_at desc nulls last
      limit $1
    `,
    [limit]
  );

  return result.rows;
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
      [["bank_transfer_details", "delivery_defaults", "layout_preview"]]
    ),
  ]);

  return {
    bankAccount: bankAccountResult.rows[0] ?? null,
    siteSettings: siteSettingsResult.rows,
  };
}
