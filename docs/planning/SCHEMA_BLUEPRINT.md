# House of Prax Schema Blueprint

This document defines the relational schema, route-shell strategy, and implementation order for the House of Prax platform.

It is the next-level companion to [README_BIBLE.md](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/README_BIBLE.md).

The goal is to make architecture decisions the way a senior engineer would:

- define the data model first
- constrain the UI structure to proven patterns
- map the schema to product workflows
- avoid improvising the system mid-build

---

## 1. Locked Schema Decisions

### Database

Use `Amazon Aurora PostgreSQL`.

### Why

- The problem is relational.
- The admin experience needs joins, filters, reporting, and history.
- Bank-transfer payments and delivery operations depend on auditable status transitions.
- Layout management needs structured content with predictable relationships.

### Data discipline

- Use `uuid` as the internal primary key on all main tables.
- Use human-readable public IDs where customers or admins need to reference records.
- Store money as integer minor units in naira, for example `amount_ngn`.
- Store phone numbers in normalized `E.164` format.
- Use `created_at` and `updated_at` everywhere.
- Use `deleted_at` only where soft deletion is genuinely useful.
- Use `jsonb` only for bounded configuration and snapshots, not as a substitute for schema.

---

## 2. Apple HIG Structural Mapping

We are not just copying Apple visuals. We are copying the discipline of how Apple structures interfaces.

### Portal shell

- Mobile: tab-bar-led account experience
- Tablet: split experience with list and detail where useful
- Desktop: sidebar plus content column

### Admin shell

- Desktop: sidebar, toolbar, content area, optional inspector
- Tablet: navigation split view pattern
- Mobile: reduced triage mode only

### Senior-engineering decision

Do not force the full admin console onto phones.

For V1:

- mobile admin supports order triage, payment confirmation, and delivery checks
- catalog editing and layout management are desktop and tablet first

This reduces complexity and matches real operational needs.

---

## 3. Route Group Strategy

The codebase should eventually be organized into route groups like this:

```text
src/app
  /(marketing)
  /(portal)
  /(admin)
  /api
```

### Marketing

- public landing and shopping flow

### Portal

- authenticated and guest-claim customer experience

### Admin

- protected operations interface

### API

- internal application API for portal, admin, checkout, uploads, and tracking

---

## 4. Schema Conventions

### Naming

- table names are plural and snake_case
- foreign keys use singular `_id`
- enum-like fields are lowercase snake_case text
- timestamps end in `_at`

### Snapshot policy

Orders must preserve what the customer actually saw at checkout time.

That means:

- order items store price snapshots
- order items store title snapshots
- orders store address and contact snapshots

Even if product data changes later, historical orders remain accurate.

### Audit policy

The following domains need event tables:

- orders
- payments
- delivery
- layout publishing
- admin actions

---

## 5. Identity Tables

### `users`

Purpose:
- canonical app identity

Columns:
- `id uuid primary key`
- `auth_provider text not null`
- `auth_subject text not null unique`
- `email text null`
- `phone_e164 text null`
- `is_guest boolean not null default false`
- `status text not null default 'active'`
- `last_seen_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- unique on `auth_provider, auth_subject`
- index on `email`
- index on `phone_e164`

Notes:
- `auth_subject` maps to Cognito subject if Cognito is used.
- A guest may exist as a real row before full account conversion.

### `profiles`

Purpose:
- customer-facing identity details

Columns:
- `user_id uuid primary key references users(id)`
- `full_name text not null`
- `first_name text null`
- `last_name text null`
- `marketing_opt_in boolean not null default false`
- `default_address_id uuid null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `addresses`

Purpose:
- saved delivery locations

Columns:
- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `label text not null`
- `recipient_name text not null`
- `recipient_phone_e164 text not null`
- `line_1 text not null`
- `line_2 text null`
- `area text null`
- `city text not null`
- `state text null`
- `landmark text null`
- `delivery_notes text null`
- `latitude numeric(9,6) null`
- `longitude numeric(9,6) null`
- `is_default boolean not null default false`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `user_id`
- index on `city`

---

## 6. Role and Access Tables

### `roles`

Seed values:
- `admin`
- `operator`
- `dispatcher`
- `catalog_manager`
- `customer`

Columns:
- `id uuid primary key`
- `key text not null unique`
- `label text not null`
- `created_at timestamptz not null`

### `user_roles`

Columns:
- `user_id uuid not null references users(id)`
- `role_id uuid not null references roles(id)`
- `granted_by_user_id uuid null references users(id)`
- `created_at timestamptz not null`

Primary key:
- `user_id, role_id`

---

## 7. Catalog Tables

### `product_categories`

Columns:
- `id uuid primary key`
- `slug text not null unique`
- `name text not null`
- `sort_order integer not null default 0`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `products`

Purpose:
- logical product family, for example Prax Protein or a health shot line

Columns:
- `id uuid primary key`
- `category_id uuid not null references product_categories(id)`
- `slug text not null unique`
- `name text not null`
- `short_name text null`
- `description text not null`
- `status text not null default 'draft'`
- `is_featured boolean not null default false`
- `feature_rank integer null`
- `available_for_sale boolean not null default false`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `category_id`
- index on `status`
- index on `is_featured, feature_rank`

### `product_variants`

Purpose:
- purchasable SKU

Columns:
- `id uuid primary key`
- `product_id uuid not null references products(id)`
- `sku text not null unique`
- `slug text not null unique`
- `name text not null`
- `flavor text null`
- `size_label text null`
- `unit_label text null`
- `description text null`
- `price_ngn integer not null`
- `compare_at_ngn integer null`
- `cost_ngn integer null`
- `track_inventory boolean not null default false`
- `available_for_sale boolean not null default false`
- `is_default boolean not null default false`
- `sort_order integer not null default 0`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `product_id`
- index on `available_for_sale`

### `product_media`

Purpose:
- images, 3D models, and other asset references

Columns:
- `id uuid primary key`
- `product_id uuid null references products(id)`
- `variant_id uuid null references product_variants(id)`
- `media_type text not null`
- `storage_key text not null`
- `public_url text not null`
- `alt_text text null`
- `sort_order integer not null default 0`
- `breakpoint text null`
- `created_at timestamptz not null`

Constraint:
- exactly one of `product_id` or `variant_id` must be present

### `ingredients`

Columns:
- `id uuid primary key`
- `slug text not null unique`
- `name text not null`
- `detail text not null`
- `image_url text null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `variant_ingredients`

Columns:
- `variant_id uuid not null references product_variants(id)`
- `ingredient_id uuid not null references ingredients(id)`
- `sort_order integer not null default 0`

Primary key:
- `variant_id, ingredient_id`

### `inventory_items`

Columns:
- `variant_id uuid primary key references product_variants(id)`
- `on_hand integer not null default 0`
- `reserved integer not null default 0`
- `reorder_threshold integer null`
- `last_counted_at timestamptz null`
- `updated_at timestamptz not null`

---

## 8. Layout and Content Tables

This area is critical. We are deliberately creating a constrained merchandising system, not a general CMS.

### `pages`

Seed values:
- `home`
- `checkout`
- `tracking`

Columns:
- `id uuid primary key`
- `key text not null unique`
- `label text not null`
- `created_at timestamptz not null`

### `page_versions`

Purpose:
- publishable page configurations

Columns:
- `id uuid primary key`
- `page_id uuid not null references pages(id)`
- `version_name text not null`
- `status text not null default 'draft'`
- `created_by_user_id uuid null references users(id)`
- `published_by_user_id uuid null references users(id)`
- `published_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `page_id, status`

### `page_sections`

Purpose:
- ordered section instances within a page version

Columns:
- `id uuid primary key`
- `page_version_id uuid not null references page_versions(id)`
- `section_key text not null`
- `section_type text not null`
- `is_enabled boolean not null default true`
- `sort_order integer not null`
- `content jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Notes:
- `section_type` is restricted to approved module types.
- `content` stores bounded fields only.

### `page_section_presentations`

Purpose:
- breakpoint-specific presentation rules

Columns:
- `id uuid primary key`
- `page_section_id uuid not null references page_sections(id)`
- `breakpoint text not null`
- `variant_key text not null`
- `config jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Unique key:
- `page_section_id, breakpoint`

### `page_section_bindings`

Purpose:
- attach products, reviews, or other entities to sections

Columns:
- `id uuid primary key`
- `page_section_id uuid not null references page_sections(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `sort_order integer not null default 0`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`

### Approved section types

Initial allowed section types:

- `hero`
- `featured_products`
- `ingredient_story`
- `benefit_grid`
- `social_proof`
- `promo_banner`
- `delivery_reassurance`
- `review_highlight`
- `faq`
- `final_cta`

Senior-engineering rule:
- we only add a new section type by code review and design review

---

## 9. Cart Tables

### `carts`

Columns:
- `id uuid primary key`
- `user_id uuid null references users(id)`
- `guest_token text null unique`
- `status text not null default 'active'`
- `currency_code text not null default 'NGN'`
- `expires_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `user_id`
- index on `status`

### `cart_items`

Columns:
- `id uuid primary key`
- `cart_id uuid not null references carts(id)`
- `variant_id uuid not null references product_variants(id)`
- `quantity integer not null`
- `unit_price_ngn integer not null`
- `snapshot jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `cart_id`
- unique on `cart_id, variant_id`

---

## 10. Order Tables

### `orders`

Purpose:
- canonical commerce record

Columns:
- `id uuid primary key`
- `public_order_number text not null unique`
- `user_id uuid null references users(id)`
- `cart_id uuid null references carts(id)`
- `source_channel text not null default 'web'`
- `status text not null`
- `payment_status text not null`
- `fulfillment_status text not null`
- `customer_name text not null`
- `customer_email text null`
- `customer_phone_e164 text not null`
- `delivery_address_snapshot jsonb not null`
- `notes text null`
- `subtotal_ngn integer not null`
- `discount_ngn integer not null default 0`
- `delivery_fee_ngn integer not null default 0`
- `total_ngn integer not null`
- `transfer_reference text not null`
- `transfer_deadline_at timestamptz null`
- `placed_at timestamptz not null`
- `confirmed_at timestamptz null`
- `delivered_at timestamptz null`
- `cancelled_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `user_id`
- index on `status`
- index on `payment_status`
- index on `fulfillment_status`
- index on `placed_at desc`
- index on `customer_phone_e164`

### `order_items`

Columns:
- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `variant_id uuid null references product_variants(id)`
- `sku text not null`
- `title text not null`
- `flavor text null`
- `quantity integer not null`
- `unit_price_ngn integer not null`
- `line_total_ngn integer not null`
- `snapshot jsonb not null`
- `created_at timestamptz not null`

Indexes:
- index on `order_id`

### `order_status_events`

Columns:
- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `from_status text null`
- `to_status text not null`
- `actor_type text not null`
- `actor_user_id uuid null references users(id)`
- `note text null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`

Indexes:
- index on `order_id, created_at desc`

### `order_access_tokens`

Purpose:
- scoped guest-safe access for tracking, payment proof submission, and order claim flows

Columns:
- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `scope text not null`
- `token_hash text not null unique`
- `expires_at timestamptz null`
- `consumed_at timestamptz null`
- `created_at timestamptz not null`

Indexes:
- index on `order_id`
- index on `scope`

Notes:
- raw access tokens are only shown at creation time
- only token hashes are stored
- `public_order_number` is never sufficient by itself for unauthenticated access

### Order state model

Locked order states:

- `checkout_draft`
- `awaiting_transfer`
- `payment_submitted`
- `payment_under_review`
- `payment_confirmed`
- `preparing`
- `ready_for_dispatch`
- `out_for_delivery`
- `delivered`
- `cancelled`
- `expired`

Senior-engineering rule:
- all status transitions pass through a centralized domain function
- no view mutates status ad hoc

---

## 11. Payment Tables

### `bank_accounts`

Purpose:
- account details shown to customers

Columns:
- `id uuid primary key`
- `bank_name text not null`
- `account_name text not null`
- `account_number text not null`
- `instructions text null`
- `is_active boolean not null default true`
- `is_default boolean not null default false`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `payments`

Purpose:
- payment attempts or pending payment records

Columns:
- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `bank_account_id uuid null references bank_accounts(id)`
- `payment_method text not null default 'bank_transfer'`
- `status text not null`
- `expected_amount_ngn integer not null`
- `submitted_amount_ngn integer null`
- `payer_name text null`
- `payer_bank text null`
- `external_reference text null`
- `reviewed_by_user_id uuid null references users(id)`
- `reviewed_at timestamptz null`
- `rejection_reason text null`
- `expires_at timestamptz null`
- `submitted_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `order_id`
- index on `status`
- index on `submitted_at desc`

### `payment_proofs`

Columns:
- `id uuid primary key`
- `payment_id uuid not null references payments(id)`
- `storage_key text not null`
- `public_url text not null`
- `mime_type text not null`
- `created_at timestamptz not null`

Indexes:
- index on `payment_id`

### `payment_review_events`

Columns:
- `id uuid primary key`
- `payment_id uuid not null references payments(id)`
- `actor_user_id uuid null references users(id)`
- `action text not null`
- `note text null`
- `created_at timestamptz not null`

### Payment state model

- `awaiting_transfer`
- `submitted`
- `under_review`
- `confirmed`
- `rejected`
- `expired`

---

## 12. Delivery Tables

### `riders`

Columns:
- `id uuid primary key`
- `name text not null`
- `phone_e164 text not null`
- `vehicle_type text null`
- `is_active boolean not null default true`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

### `delivery_assignments`

Columns:
- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `rider_id uuid null references riders(id)`
- `status text not null`
- `assigned_by_user_id uuid null references users(id)`
- `assigned_at timestamptz null`
- `picked_up_at timestamptz null`
- `delivered_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `order_id`
- index on `rider_id`
- index on `status`

### `delivery_events`

Columns:
- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `assignment_id uuid null references delivery_assignments(id)`
- `event_type text not null`
- `actor_type text not null`
- `actor_user_id uuid null references users(id)`
- `note text null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`

Indexes:
- index on `order_id, created_at desc`

### `tracking_points`

Columns:
- `id uuid primary key`
- `assignment_id uuid not null references delivery_assignments(id)`
- `latitude numeric(9,6) not null`
- `longitude numeric(9,6) not null`
- `heading numeric(6,2) null`
- `accuracy_meters numeric(8,2) null`
- `recorded_at timestamptz not null`
- `created_at timestamptz not null`

Indexes:
- index on `assignment_id, recorded_at desc`

### Delivery state model

- `unassigned`
- `assigned`
- `picked_up`
- `out_for_delivery`
- `delivered`
- `failed`
- `returned`

---

## 13. Review and Notification Tables

### `review_requests`

Columns:
- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `user_id uuid null references users(id)`
- `status text not null`
- `sent_at timestamptz null`
- `completed_at timestamptz null`
- `expires_at timestamptz null`
- `created_at timestamptz not null`

Indexes:
- index on `order_id`
- index on `status`

### `reviews`

Columns:
- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `user_id uuid null references users(id)`
- `rating smallint not null`
- `title text null`
- `body text null`
- `status text not null default 'pending'`
- `is_featured boolean not null default false`
- `moderated_by_user_id uuid null references users(id)`
- `moderated_at timestamptz null`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`

Indexes:
- index on `order_id`
- index on `status`
- index on `is_featured`

### `notifications`

Columns:
- `id uuid primary key`
- `user_id uuid null references users(id)`
- `channel text not null`
- `template_key text not null`
- `status text not null`
- `payload jsonb not null default '{}'::jsonb`
- `scheduled_at timestamptz null`
- `sent_at timestamptz null`
- `created_at timestamptz not null`

Indexes:
- index on `user_id`
- index on `status`

---

## 14. Audit and Settings Tables

### `site_settings`

Purpose:
- small global config registry

Columns:
- `key text primary key`
- `value jsonb not null`
- `updated_by_user_id uuid null references users(id)`
- `updated_at timestamptz not null`

### `audit_logs`

Columns:
- `id uuid primary key`
- `actor_user_id uuid null references users(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `action text not null`
- `payload jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null`

Indexes:
- index on `entity_type, entity_id`
- index on `actor_user_id`
- index on `created_at desc`

---

## 15. Device-Specific Screen Decisions

This is where we stop responsive drift before it starts.

### Customer portal on mobile

Top-level destinations:

- `Home`
- `Orders`
- `Track`
- `Account`

Nested screens:

- address book
- review history
- order detail
- reorder

### Customer portal on tablet

Preferred patterns:

- list-detail for orders
- persistent contextual filters
- larger map surfaces for tracking

### Customer portal on desktop

Preferred patterns:

- sidebar
- large-title page entry
- persistent order filters
- wider tables and split detail layouts

### Admin on mobile

Allowed V1 tasks:

- review pending transfer proofs
- change core order states
- check delivery status

Not allowed as a primary mobile workflow:

- full layout editing
- dense catalog management
- advanced reporting

### Admin on desktop

Primary shell:

- sidebar
- toolbar
- content pane
- optional right inspector for detail editing

This is the closest web equivalent to Apple split and inspector patterns.

---

## 16. API Domains

The internal API should be divided by domain.

### Auth and session

- session bootstrap
- guest claim
- profile sync

### Catalog

- products
- variants
- media
- inventory
- featured state

### Layout

- draft page version reads
- publish version
- section reorder
- section update
- section bindings

### Checkout

- cart sync
- order create
- bank transfer instructions
- payment proof upload

### Operations

- order state transitions
- payment review actions
- dispatch assignment
- delivery event logging

### Engagement

- review request send
- review submit
- review moderation

Senior-engineering rule:
- every mutation endpoint should map to a business verb, not a leaky raw table update

---

## 17. State Management Boundaries

### Server state

Use server rendering and query caching for:

- products
- sections
- orders
- payments
- delivery state
- reviews

### Local UI state

Use a local store only for:

- drawers
- sheets
- filters
- optimistic selection state
- transient map UI state

### Never store globally without reason

- source-of-truth orders
- source-of-truth customer data
- source-of-truth catalog data

---

## 18. Central Domain Engines

These are not optional. They are how we keep the system coherent.

### Order engine

Responsible for:

- validating legal status transitions
- creating status events
- syncing payment and fulfillment states

### Payment engine

Responsible for:

- payment submission
- proof association
- review decisions
- expiry logic

### Layout publishing engine

Responsible for:

- ensuring only one published version per page
- validating required sections
- preserving draft history

### Delivery engine

Responsible for:

- rider assignment
- tracking point acceptance
- delivery event normalization

---

## 19. Implementation Order

Follow this sequence strictly.

### Step 1. Schema and migrations

- lock tables
- lock status models
- lock indexes
- lock naming conventions

### Step 2. App shells

- marketing shell
- portal shell
- admin shell

### Step 3. Shared primitives

- page headers
- grouped forms
- search bars
- segmented controls
- lists
- tables
- detail panels
- status badges

These must align with the Apple HIG approach before feature pages are built.

### Step 4. Auth and identity

- account session
- guest identity
- profile records
- role gating

### Step 5. Catalog and layout foundation

- products
- variants
- media
- inventory
- page versions
- page sections

### Step 6. Checkout and payments

- real cart persistence
- order creation
- bank transfer instructions
- payment proof upload
- admin payment review

### Step 7. Delivery operations

- rider records
- assignment flows
- event logs
- tracking points

### Step 8. Customer portal

- order history
- order detail
- tracking
- profile
- addresses
- reorder

### Step 9. Review and trust systems

- review requests
- ratings
- moderation
- homepage review bindings

### Step 10. Refinement

- tablet-specific adaptations
- desktop inspector improvements
- accessibility review
- motion restraint review

---

## 20. Engineering Guardrails

These rules are mandatory.

1. Do not model the schema around today's hardcoded marketing data.
2. Do not use `jsonb` to avoid proper relational modeling.
3. Do not let UI directly invent business state changes.
4. Do not build a freeform CMS instead of a constrained merchandising system.
5. Do not make the mobile admin equal to desktop admin.
6. Do not couple tracking frequency to UI refresh assumptions.
7. Do not introduce sockets everywhere just because live data exists.
8. Do not lose historical truth on orders when products or prices change.
9. Do not design screens before their data contract is understood.
10. Do not break the current design system to chase enterprise-dashboard aesthetics.

---

## 21. Decision Summary

The platform should be built as:

- one Next.js codebase
- one Aurora PostgreSQL relational model
- one shared design system
- one marketing surface
- one customer portal
- one admin console

The portal is full cross-device.

The admin is desktop and tablet first, with limited mobile triage.

The schema is event-aware, audit-friendly, and optimized for manual payment operations, controlled merchandising, and delivery tracking.

This is the simplest architecture that still supports a sophisticated business operation.

---

## 22. Reference Material

- Apple HIG overview: https://developer.apple.com/design/human-interface-guidelines/
- Apple layout guidance: https://developer.apple.com/design/human-interface-guidelines/layout
- Apple navigation guidance: https://developer.apple.com/design/human-interface-guidelines/navigation
- Aurora PostgreSQL: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html
- DynamoDB: https://aws.amazon.com/dynamodb/
- Aurora DSQL: https://docs.aws.amazon.com/aurora-dsql/latest/userguide/working-with.html
