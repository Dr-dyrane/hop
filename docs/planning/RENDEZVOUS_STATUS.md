# House of Prax Rendezvous Pass Tracker

This document is the live execution ledger for the platform build.

Use it to track:

- backend integration
- admin console
- user portal
- cross-cutting quality and hardening

Read this with:

- `docs/planning/README_BIBLE.md`
- `docs/planning/SCHEMA_BLUEPRINT.md`
- `docs/planning/IMPLEMENTATION_BLUEPRINT.md`

---

## 1. How To Use This Document

Rules:

- update this file in the same change as the implementation it describes
- do not remove completed tasks unless the underlying feature is removed
- keep status language simple: `not started`, `in progress`, `blocked`, `complete`
- keep business and engineering explanation here, not in the UI

---

## 2. Current Position

The project is in real implementation, not planning.

Current state:

- planning is locked
- Aurora PostgreSQL is connected through the repo-managed migration and seed pipeline
- marketing reads from the database-backed content path
- auth, admin, and portal route-group shells exist
- order and payment tables are live
- persistent carts are live
- admin order and payment surfaces read from Aurora
- admin customer and settings surfaces read from Aurora
- portal order list and order detail read from Aurora
- checkout creates real orders from the cart
- guest checkout resolves to a tokenized confirmation route
- payment proof upload uses browser-direct signed S3 uploads
- guest carts now merge safely into signed-in carts

This means the system has crossed into operational platform work.

---

## 3. Pass Map

### Pass 0. Planning lock

Status:

- `complete`

Deliverables:

- platform direction
- schema direction
- implementation blueprint
- operational governance docs

### Pass 1. App shell and structure

Status:

- `complete`

Deliverables:

- marketing shell
- auth shell
- portal shell
- admin shell
- shared workspace primitives

### Pass 2. Data foundation and read-path cutover

Status:

- `complete`

Deliverables:

- Aurora IAM-backed connection strategy
- migration and seed runners
- marketing catalog and layout cutover
- admin overview, catalog, and layout reads
- portal account summary reads

### Pass 3. Orders and payments baseline

Status:

- `complete`

Deliverables:

- `orders`, `order_items`, `order_status_events`
- `payments`, `payment_proofs`, `payment_review_events`
- admin order queue
- admin payment queue
- admin order detail with review actions
- portal order list
- portal order detail

### Pass 4. Checkout cutover

Status:

- `in progress`

Deliverables:

- persistent cart
- real checkout-to-order creation
- bank-transfer instruction flow
- payment proof upload on the final checkout path
- removal of WhatsApp as the main order path

### Pass 5. Admin console expansion

Status:

- `not started`

Deliverables:

- customers
- settings
- delivery board
- review moderation
- richer catalog mutations
- richer layout authoring and publishing

### Pass 6. Portal expansion

Status:

- `not started`

Deliverables:

- addresses
- profile
- reorder
- review history
- signed-in tracking route

### Pass 7. Delivery and realtime

Status:

- `not started`

Deliverables:

- delivery assignments
- tokenized courier flows
- tracking ingestion
- SSE or socket-ready delivery stream
- admin dispatch map

### Pass 8. Hardening and polish

Status:

- `not started`

Deliverables:

- RLS
- direct S3 signed uploads
- Apple-HIG copy cleanup
- reduced UI noise across admin and portal
- testing and operational hardening

---

## 4. Backend Integration Tracker

Status:

- `in progress`

Completed:

- [x] Aurora IAM-backed database runtime
- [x] Vercel-compatible DB scripts
- [x] migrations through `0007__carts.sql`
- [x] marketing seed path
- [x] bank-account seed path
- [x] repository layer for marketing, admin, account, orders, and payments
- [x] order status event writes
- [x] payment review event writes
- [x] S3-backed proof upload path
- [x] persistent cart schema and repository path
- [x] checkout order creation from the live cart
- [x] guest-safe checkout order access token path
- [x] browser-direct signed upload flow for payment proofs

Open:

- [ ] delivery assignment schema and repository path
- [ ] rider tracking ingestion path
- [ ] RLS policies for ownership and admin scopes
- [ ] audit coverage review for write-heavy flows

---

## 5. Admin Console Tracker

Status:

- `in progress`

Completed:

- [x] admin shell and protected layout
- [x] overview screen
- [x] catalog read surface
- [x] layout summary surface
- [x] order queue
- [x] payment queue
- [x] order detail
- [x] payment review actions

Open:

- [x] customer directory
- [x] settings surface
- [ ] delivery board
- [ ] review moderation
- [ ] catalog creation and editing flows
- [ ] availability and featured management actions
- [ ] layout authoring flow
- [ ] layout publishing flow
- [ ] tighter Apple-style visual and copy pass across all admin pages

---

## 6. User Portal Tracker

Status:

- `in progress`

Completed:

- [x] portal shell and protected layout
- [x] account home summary
- [x] orders list
- [x] order detail
- [x] payment proof submission from order detail
- [x] live checkout-to-account handoff for signed-in checkout
- [x] guest confirmation route for checkout-created orders

Open:

- [ ] addresses
- [ ] profile
- [ ] reorder
- [ ] review history
- [ ] signed-in tracking route
- [ ] quieter Apple-style copy pass across portal screens

---

## 7. Quality And Design Tracker

Status:

- `in progress`

Completed:

- [x] planning docs
- [x] environment and Vercel docs
- [x] database operations docs
- [x] DB registries for functions, triggers, and RLS

Open:

- [ ] reduce explanatory copy in admin and portal UI
- [ ] align page chrome more closely with the marketing visual language
- [ ] ensure selected navigation states remain legible in every shell
- [ ] finish no-border, Apple-HIG-consistent surface treatment review
- [ ] resolve legacy lint failures in older 3D and marketing files
- [ ] tighten the checkout drawer and confirmation route further toward the marketing-page visual bar

---

## 8. Known Gaps And Deviations

These are the important truths to keep visible.

### Checkout shell deviation

Locked plan:

- dedicated checkout route

Current implementation:

- the cart drawer is now backed by a persistent cart and real order creation
- guest confirmation resolves on `/checkout/orders/[orderId]`

This is acceptable for the current pass, but a fuller focused checkout shell may still be introduced later if the flow needs more space.

### Delivery is still snapshot-only

Current tracking behavior:

- portal order detail can render a Mapbox snapshot when coordinates exist in the order snapshot

Missing:

- live assignments
- ingestion
- streaming updates

### RLS is not active yet

Current protection model:

- route guards
- repository scoping

Missing:

- database-level row-level security policies

### Legacy lint failures remain

Current repo-wide lint failures are still concentrated in older files such as:

- `src/components/3d/Product3DCarousel.tsx`
- `src/components/3d/Product3DViewer.tsx`
- `src/components/sections/HeroSection.tsx`
- `src/components/sections/ProblemSection.tsx`
- `src/components/ui/ScrollNav.tsx`

These are pre-existing issues outside the new platform work.

---

## 9. Verification Snapshot

Current checkpoint verification:

- `npm run db:migrate` passes
- `npx tsc --noEmit` passes
- `npm run build` passes
- `npm run db:seed` passes, but bank-account seed safely skips if bank env vars are missing
- `npm run lint` does not pass repo-wide because of the legacy issues listed above

---

## 10. Environment Notes

Current execution depends on:

- Aurora connection env vars being present
- `APP_SESSION_SECRET` being set
- S3 env vars being present before proof uploads can work in real environments
- bank transfer env vars being present before the bank-account seed can populate `app.bank_accounts`

Important operational note:

- local `.env` formatting must not wrap host or user values in stray quotes if those quotes end up being consumed literally by the runtime

---

## 11. Active Next Pass

The active build block is Pass 4: checkout cutover.

Implement in this order:

1. Tighten the checkout UI and confirmation surfaces toward the marketing visual standard.
2. Finish any remaining checkout-specific edge cases around empty, expired, and converted carts.

After that:

1. expand admin operations
2. expand the user portal
3. build delivery and realtime
4. harden uploads, RLS, and quality

---

## 12. Integrity Check

The important architectural decisions still hold.

Still correct:

- one Next.js codebase
- Aurora PostgreSQL as the database of record
- email OTP at launch
- guest-first commerce
- manual bank-transfer confirmation
- admin and portal in the same repo
- Apple-HIG-inspired structural discipline

The remaining work is execution, not architectural rethinking.
