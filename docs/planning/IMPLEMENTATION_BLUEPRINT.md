# House of Prax Implementation Blueprint

This document translates the platform strategy and schema into a build sequence.

It defines:

- the migration path from the current static app
- the route-by-route screen contracts
- the internal API contract matrix
- the role and permission model
- the engineering constraints that keep the implementation coherent

Read this together with:

- `docs/planning/README_BIBLE.md`
- `docs/planning/SCHEMA_BLUEPRINT.md`

---

## 1. Working Assumptions

These assumptions are now treated as implementation constraints.

1. The codebase remains one Next.js repository.
2. The database of record is Aurora PostgreSQL.
3. Phone number is required business data, but phone OTP is not used at launch.
4. Email OTP or password-based auth is acceptable for launch.
5. Payment is by bank transfer and requires manual confirmation.
6. Guest checkout remains supported.
7. Mapbox will be used for delivery tracking surfaces.
8. The admin console is desktop and tablet first.
9. The customer portal is full cross-device.
10. Vercel remains the deployment surface, but the data model is not allowed to bend around Vercel convenience.

---

## 2. Migration Strategy

We should use a strangler-style migration, not a big-bang rewrite.

### Principle

Keep the current marketing site functioning while we gradually replace static data and local-only flows with real platform services.

### Migration phases

#### Phase 0. Planning lock

Deliverables:

- `docs/planning/README_BIBLE.md`
- `docs/planning/SCHEMA_BLUEPRINT.md`
- `docs/planning/IMPLEMENTATION_BLUEPRINT.md`

Exit criteria:

- architecture, routes, permissions, and status models are not being reinvented in implementation

#### Phase 1. App shell restructure

Deliverables:

- route groups for marketing, portal, admin, and api
- protected admin shell
- protected portal shell
- shared page header, toolbar, sidebar, list, detail, and form primitives

Exit criteria:

- new surfaces can be built without revisiting app structure

#### Phase 2. Data foundation

Deliverables:

- database connection strategy
- schema migrations
- seed scripts for current catalog and layout
- repository or service layer for reads and writes

Exit criteria:

- current hardcoded product and layout content can be represented in the database

#### Phase 3. Read-path cutover

Deliverables:

- marketing product data read from database-backed services
- layout modules read from published page versions
- static fallback only if explicitly needed during migration

Exit criteria:

- marketing renders without direct dependency on hardcoded catalog data

#### Phase 4. Cart and checkout cutover

Deliverables:

- persistent carts
- order creation
- transfer instruction screen
- proof-of-payment upload
- payment review workflow

Exit criteria:

- WhatsApp checkout is no longer the main order path

#### Phase 5. Customer portal

Deliverables:

- account home
- orders
- tracking
- addresses
- profile
- reorder

Exit criteria:

- a customer can manage the lifecycle of their own orders without contacting admin

#### Phase 6. Admin operations

Deliverables:

- order board
- payment queue
- delivery board
- product management
- layout management
- customer lookup

Exit criteria:

- the team can operate the business from the app

#### Phase 7. Trust and refinement

Deliverables:

- review requests
- ratings and reviews
- featured review merchandising
- device-specific refinements
- accessibility and motion passes

Exit criteria:

- the app is polished, not just functional

---

## 3. Migration Notes From The Current Code

The current app has three important temporary patterns:

- hardcoded catalog and content data in `src/lib/data.ts`
- localStorage-only cart state in `CommerceProvider`
- WhatsApp handoff as checkout

### Required migration behavior

#### Catalog

- move products, pricing, and featured state into the database
- keep a seed dataset matching current content
- replace direct imports from static data with a data access layer

#### Layout

- move homepage composition into page versions and sections
- preserve the existing visual rhythm and design system
- treat the current homepage as the first published home seed

#### Checkout

- keep the current cart UX while changing the backing model
- move from local-only cart to persistent cart
- replace WhatsApp order submission with order creation plus bank transfer flow

Senior-engineering rule:
- never mix "old hardcoded path" and "new dynamic path" inside random components
- create a clear service boundary and switch at the boundary

---

## 4. Route Contracts

Each route below defines purpose, data, actions, and HIG-aligned shell behavior.

### Public Routes

#### `/`

Purpose:
- marketing storefront and product discovery

Primary data:
- published home page version
- featured products
- social proof blocks

Primary actions:
- browse sections
- add to cart
- start checkout

Shell:
- marketing shell only

Breakpoint behavior:
- mobile: stacked narrative
- tablet: wider section compositions
- desktop: full premium landing presentation

#### `/checkout`

Purpose:
- collect checkout details and create an order

Primary data:
- active cart
- default bank account
- delivery zones if applicable

Primary actions:
- sign in
- continue as guest
- submit order
- view transfer instructions

Shell:
- focused single-task checkout shell

Breakpoint behavior:
- mobile: stacked grouped sections
- tablet: summary plus form split
- desktop: summary rail plus grouped detail form

#### `/auth/sign-in`

Purpose:
- account entry and guest-to-account entry point

Primary data:
- auth methods enabled

Primary actions:
- email OTP
- password sign-in
- continue guest session if already in checkout

Shell:
- simple centered auth shell

#### `/auth/verify`

Purpose:
- verify one-time code or complete auth handoff

Primary data:
- pending verification session

Primary actions:
- confirm code
- resend

Shell:
- minimal verification shell

#### `/track/[orderNumber]`

Purpose:
- public-safe guest tracking and payment follow-up route

Primary data:
- order snapshot
- current delivery state
- token-scoped access rights

Primary actions:
- view tracking
- submit proof if payment is pending and scope allows
- claim order into account if scope allows

Security:
- requires scoped access token in addition to public order number

Shell:
- public utility shell

### Customer Portal Routes

#### `/account`

Purpose:
- account home

Primary data:
- active orders
- most recent tracking state
- saved profile summary
- review prompts

Primary actions:
- open latest order
- reorder
- manage profile

Shell:
- portal shell

Breakpoint behavior:
- mobile: tab root
- tablet: overview cards with compact lists
- desktop: sidebar plus summary panels

#### `/account/orders`

Purpose:
- order history

Primary data:
- customer orders with filters

Primary actions:
- filter
- open detail
- reorder

Shell:
- portal shell with searchable list

Breakpoint behavior:
- mobile: stacked cards
- tablet: list-detail
- desktop: filter rail plus list

#### `/account/orders/[orderId]`

Purpose:
- full order detail

Primary data:
- order snapshot
- items
- payment state
- status timeline
- delivery info

Primary actions:
- reorder
- upload payment proof if still relevant
- open tracking

Shell:
- portal detail screen

#### `/account/tracking/[orderId]`

Purpose:
- signed-in delivery tracking

Primary data:
- latest assignment
- latest tracking point
- ETA
- timeline

Primary actions:
- refresh
- contact support if support channel is later added

Shell:
- map-first detail shell

#### `/account/addresses`

Purpose:
- saved addresses management

Primary data:
- addresses
- default address

Primary actions:
- create
- edit
- delete
- set default

Shell:
- grouped list plus form sheet pattern

#### `/account/profile`

Purpose:
- manage identity details

Primary data:
- profile
- contact preferences

Primary actions:
- edit name
- edit phone
- edit email

Shell:
- grouped settings form

#### `/account/reviews`

Purpose:
- review history and pending review prompts

Primary data:
- pending review requests
- submitted reviews

Primary actions:
- submit review
- edit draft if allowed

Shell:
- mixed list of pending and completed review items

#### `/account/reorder`

Purpose:
- faster repeat purchase flow

Primary data:
- reorderable past orders
- suggested items

Primary actions:
- add all to cart
- start checkout

Shell:
- portal commerce utility screen

### Admin Routes

#### `/admin`

Purpose:
- operations overview

Primary data:
- today's pending payment reviews
- preparing orders
- active deliveries
- low stock
- new reviews

Primary actions:
- jump into queue screens

Shell:
- admin dashboard shell

Breakpoint behavior:
- desktop: sidebar plus multi-panel board
- tablet: simplified board
- mobile: trimmed triage dashboard

#### `/admin/orders`

Purpose:
- order operations board

Primary data:
- filterable order list
- status counts

Primary actions:
- open order
- change status
- add internal note

Shell:
- searchable list with detail panel on larger screens

#### `/admin/orders/[orderId]`

Purpose:
- order detail and operational control

Primary data:
- order snapshot
- payment state
- status history
- delivery assignment

Primary actions:
- move order through legal states
- attach notes
- inspect payment and delivery context

Shell:
- detail workspace with optional inspector

#### `/admin/payments`

Purpose:
- bank transfer review queue

Primary data:
- pending payments
- proof attachments
- amount and reference data

Primary actions:
- mark under review
- confirm
- reject
- expire

Shell:
- queue-oriented review screen

#### `/admin/delivery`

Purpose:
- dispatch and live delivery monitoring

Primary data:
- active assignments
- rider state
- map overlays

Primary actions:
- assign rider
- update delivery state
- inspect live position

Shell:
- map plus list split view

#### `/admin/catalog/products`

Purpose:
- product list and management

Primary data:
- products
- variants
- availability
- featured state

Primary actions:
- create product
- archive product
- toggle availability
- open detail

Shell:
- admin list-management screen

#### `/admin/catalog/products/[productId]`

Purpose:
- full product editor

Primary data:
- product
- variants
- media
- ingredients
- inventory

Primary actions:
- edit product content
- edit variants
- upload media
- manage featured and available flags

Shell:
- form-heavy detail editor

#### `/admin/layout`

Purpose:
- homepage and selected page layout management

Primary data:
- draft and published versions
- ordered sections
- section bindings
- breakpoint presets

Primary actions:
- reorder sections
- edit section content
- toggle visibility
- preview mobile, tablet, desktop
- publish

Shell:
- editor workspace with preview pane

Senior-engineering rule:
- not available as a full authoring tool on phones

#### `/admin/customers`

Purpose:
- customer support and lookup

Primary data:
- customers
- guest conversion status
- addresses
- order history

Primary actions:
- search
- open profile
- inspect recent orders

Shell:
- searchable support console

#### `/admin/reviews`

Purpose:
- moderation and merchandising of reviews

Primary data:
- pending reviews
- featured reviews

Primary actions:
- approve
- hide
- feature

Shell:
- list-detail moderation view

#### `/admin/settings`

Purpose:
- platform settings

Primary data:
- bank account display data
- delivery config
- notification config
- admin management

Primary actions:
- update controlled settings

Shell:
- grouped settings screens

---

## 5. API Contract Matrix

The API should express business operations, not raw table writes.

### Auth and Session

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/guest/bootstrap` | public | create or resume a guest session and guest cart |
| `POST` | `/api/auth/email/request` | public | request email OTP |
| `POST` | `/api/auth/email/verify` | public | verify email OTP and establish session |
| `POST` | `/api/auth/password/sign-in` | public | password sign-in if enabled |
| `POST` | `/api/auth/order-claim` | token or user | claim a guest order into an authenticated account |
| `POST` | `/api/auth/sign-out` | signed-in | terminate session |

### Profile and Addressing

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/me` | signed-in | bootstrap profile, roles, and portal summary |
| `PATCH` | `/api/me/profile` | signed-in | update profile details |
| `GET` | `/api/me/addresses` | signed-in | list saved addresses |
| `POST` | `/api/me/addresses` | signed-in | create address |
| `PATCH` | `/api/me/addresses/:addressId` | signed-in | update address |
| `POST` | `/api/me/addresses/:addressId/set-default` | signed-in | mark default address |
| `DELETE` | `/api/me/addresses/:addressId` | signed-in | remove address |

### Catalog and Merchandising

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/catalog/home` | public | read published home content and section bindings |
| `GET` | `/api/catalog/products` | public | list saleable products and variants |
| `GET` | `/api/catalog/products/:productSlug` | public | get product detail |
| `GET` | `/api/admin/catalog/products` | catalog manager+ | admin product list |
| `POST` | `/api/admin/catalog/products` | catalog manager+ | create product |
| `PATCH` | `/api/admin/catalog/products/:productId` | catalog manager+ | update product |
| `POST` | `/api/admin/catalog/products/:productId/feature` | catalog manager+ | set featured state |
| `POST` | `/api/admin/catalog/products/:productId/availability` | catalog manager+ | change saleability |

### Layout

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/admin/layout/pages/:pageKey` | catalog manager+ | read current draft and published versions |
| `POST` | `/api/admin/layout/pages/:pageKey/versions` | catalog manager+ | create draft version |
| `PATCH` | `/api/admin/layout/versions/:versionId/sections/:sectionId` | catalog manager+ | update section fields |
| `POST` | `/api/admin/layout/versions/:versionId/sections/reorder` | catalog manager+ | reorder sections |
| `POST` | `/api/admin/layout/versions/:versionId/publish` | catalog manager+ | publish page version |

### Cart and Checkout

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/cart` | guest or signed-in | fetch active cart |
| `POST` | `/api/cart/items` | guest or signed-in | add item |
| `PATCH` | `/api/cart/items/:itemId` | guest or signed-in | change quantity |
| `DELETE` | `/api/cart/items/:itemId` | guest or signed-in | remove item |
| `POST` | `/api/checkout/orders` | guest or signed-in | create order from cart |
| `GET` | `/api/orders/:orderNumber/transfer` | owner or token | read transfer instructions and payment state |

### Payments

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/orders/:orderNumber/proof-upload-url` | owner or token | create signed upload target for proof |
| `POST` | `/api/orders/:orderNumber/payments/submit` | owner or token | submit transfer proof and payer details |
| `GET` | `/api/admin/payments` | operator+ | list payment queue |
| `POST` | `/api/admin/payments/:paymentId/mark-reviewing` | operator+ | move payment into review |
| `POST` | `/api/admin/payments/:paymentId/confirm` | operator+ | confirm payment |
| `POST` | `/api/admin/payments/:paymentId/reject` | operator+ | reject payment |
| `POST` | `/api/admin/payments/:paymentId/expire` | operator+ | expire stale payment |

### Orders and Operations

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/portal/orders` | signed-in | list own orders |
| `GET` | `/api/portal/orders/:orderId` | signed-in owner | get order detail |
| `POST` | `/api/portal/orders/:orderId/reorder` | signed-in owner | create new cart from previous order |
| `GET` | `/api/admin/orders` | operator+ | list all orders with filters |
| `GET` | `/api/admin/orders/:orderId` | operator+ | get admin order detail |
| `POST` | `/api/admin/orders/:orderId/status` | operator+ | perform legal order status transition |
| `POST` | `/api/admin/orders/:orderId/note` | operator+ | append internal note |

### Delivery and Tracking

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/orders/:orderNumber/tracking` | owner or token | get tracking view model |
| `GET` | `/api/admin/delivery/board` | dispatcher+ | dispatch board data |
| `POST` | `/api/admin/delivery/assignments` | dispatcher+ | assign rider to order |
| `POST` | `/api/admin/delivery/assignments/:assignmentId/status` | dispatcher+ | update delivery state |
| `POST` | `/api/rider/assignments/:assignmentId/location` | rider or trusted device | append tracking point |

### Reviews

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/portal/reviews` | signed-in | get pending and submitted reviews |
| `POST` | `/api/portal/reviews` | signed-in | submit review |
| `GET` | `/api/admin/reviews` | operator+ | get moderation queue |
| `POST` | `/api/admin/reviews/:reviewId/approve` | operator+ | approve review |
| `POST` | `/api/admin/reviews/:reviewId/hide` | operator+ | hide review |
| `POST` | `/api/admin/reviews/:reviewId/feature` | operator+ | set featured state |

---

## 6. Role Matrix

| Capability | Guest | Customer | Operator | Dispatcher | Catalog Manager | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Browse marketing site | yes | yes | yes | yes | yes | yes |
| Use cart and checkout | yes | yes | no | no | no | yes |
| Submit bank transfer proof | token-scoped | yes | no | no | no | yes |
| Track own order | token-scoped | yes | yes | yes | yes | yes |
| Claim guest order | token-scoped | yes | no | no | no | yes |
| Manage own profile | no | yes | yes | yes | yes | yes |
| Manage own addresses | no | yes | no | no | no | yes |
| Review delivered order | no | yes | no | no | no | yes |
| View all orders | no | no | yes | yes | no | yes |
| Change order status | no | no | yes | limited | no | yes |
| Review payments | no | no | yes | no | no | yes |
| Manage riders and assignments | no | no | limited | yes | no | yes |
| Manage products and variants | no | no | no | no | yes | yes |
| Manage layout and publish pages | no | no | no | no | yes | yes |
| Manage site settings | no | no | no | no | no | yes |
| Manage roles and admins | no | no | no | no | no | yes |

### Notes

- `limited` means role-specific constrained actions only.
- Dispatcher can update delivery-specific statuses but should not own the full payment lifecycle.
- Operator can move an order through payment and fulfillment preparation stages, but not modify catalog or layout.

---

## 7. Access Control Rules

### Public access

Allowed:

- marketing pages
- auth initiation
- guest cart
- tokenized tracking and payment follow-up

Not allowed:

- raw order lookup by public order number alone
- any admin route
- any user-owned route without identity or token scope

### Portal access

Rules:

- requires authenticated user
- every resource read is ownership-checked
- guests cannot read the portal without conversion or claim

### Admin access

Rules:

- requires authenticated user
- requires role membership
- every mutation is logged in audit trails

### Tokenized guest flows

For:

- tracking
- payment proof submission
- order claim

Rules:

- use hashed access tokens
- support expiration
- scope tokens by purpose
- revoke or consume when appropriate

---

## 8. UI Primitive Contract

Before feature pages are implemented, these shared patterns need to exist.

### Marketing primitives

- section wrapper
- premium hero media frame
- responsive product media slot
- sticky CTA treatment

### Portal primitives

- tab bar
- portal sidebar
- grouped list row
- order timeline
- map card
- settings form section

### Admin primitives

- sidebar
- toolbar
- searchable list
- table
- detail header
- inspector panel
- queue card
- review decision bar

Senior-engineering rule:
- build these once and reuse them
- do not let every route invent its own list, card, filter, or page header pattern

---

## 9. State and Data Loading Contract

### Server-rendered first

Use server rendering for:

- marketing pages
- initial portal page data
- initial admin page data

### Query-cached client updates

Use client query caching for:

- order boards
- payment queues
- delivery board
- tracking refreshes
- review moderation

### Local UI store only

Use local stores for:

- drawers
- sheet state
- selected item IDs
- temporary editor state
- filter chips

### Realtime policy

Start with:

- polling for queues
- polling or server-sent events for tracking and critical boards

Upgrade to sockets only where a measured need appears.

---

## 10. Engineering Sequence

This is the recommended implementation order.

### Step 1. Shared foundation

- route groups
- auth guard strategy
- shell layouts
- shared UI primitives

### Step 2. Data layer

- schema migrations
- database client
- repositories or services
- seed pipeline

### Step 3. Catalog and layout reads

- published page read path
- product read path
- section binding resolution

### Step 4. Cart and checkout

- persistent cart
- order creation
- transfer instructions
- proof upload

### Step 5. Payment operations

- payment queue
- review actions
- legal state transitions

### Step 6. Portal

- order history
- order detail
- address book
- profile
- reorder

### Step 7. Delivery

- dispatch board
- rider assignment
- tracking model
- customer tracking page

### Step 8. Layout authoring

- page version management
- section editor
- breakpoint preview
- publish workflow

### Step 9. Reviews and trust

- review requests
- moderation
- featured review bindings

### Step 10. Hardening

- audit review
- role testing
- accessibility pass
- device adaptation pass

---

## 11. Locked Launch Decisions

The final implementation-shaping decisions are now locked:

1. Auth launch mode:
   - `email OTP only`
2. Upload path:
   - `direct S3 signed uploads`
3. Delivery actor model:
   - `tokenized courier device links`
4. Review policy:
   - `pre-moderated`
5. Layout preview fidelity:
   - `simulated preview in admin only`

With these decisions accepted, the planning layer is complete enough to begin implementation.
