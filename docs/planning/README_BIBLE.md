# House of Prax Platform Bible

This document is the implementation source of truth for the next phase of House of Prax.

It defines the backend choice, app architecture, admin console, customer portal, operational workflows, and the Apple Human Interface Guidelines principles that govern all future product work in this repository.

This is a planning document only. It intentionally locks decisions before code is written.

---

## 1. Purpose

The current project is a premium marketing-first storefront. The next phase turns it into a real operating product:

- a managed catalog
- a bank-transfer checkout flow
- a customer account portal
- an internal admin console
- delivery tracking
- reviews and ratings
- layout and homepage management

All of it stays inside this codebase.

---

## 2. Locked Principles

The extension must follow these principles:

1. Keep the current marketing design system and visual language.
2. Build everything in this repository instead of splitting into multiple apps.
3. Follow Apple HIG structure and interaction rules as closely as practical.
4. Prefer constrained systems over freeform builders.
5. Prefer the simplest architecture that still feels polished and complete.
6. Design mobile, tablet, and desktop intentionally instead of relying on heavy responsive tweaking.
7. Make operations smooth for a small team with limited resources.
8. Treat phone number as required business data even if phone OTP is not used.

---

## 3. Backend Decision

### Chosen database

Use `Amazon Aurora PostgreSQL`.

### Why Aurora PostgreSQL

- The platform is relational by nature.
- Orders, products, variants, featured states, layout modules, payments, delivery events, reviews, and customers all join naturally in SQL.
- It is easier to reason about than DynamoDB for admin workflows and reporting.
- It is a safer long-term fit than Aurora DSQL for this project stage.
- It works well with a Vercel-hosted Next.js application.

### Not chosen

#### Aurora DSQL

Do not use it for V1.

Reason:
- It adds distributed-database complexity that this product does not need.
- It is not the simplest path for a Vercel-heavy, product-focused build.

#### DynamoDB

Do not use it for V1.

Reason:
- It is a poor default fit for catalog management, order joins, manual payments, and reporting-heavy admin views.

---

## 4. Recommended Platform Stack

### Core

- `Next.js` app router in this repository
- `Amazon Aurora PostgreSQL` for relational data
- `AWS S3` for media and file uploads
- `AWS Cognito` for auth if we stay AWS-native
- `AWS SES` for email OTP, verification, and notifications

### Optional email alternative

- `Resend` may replace `SES` if smoother email DX is preferred over all-in-AWS consolidation

### Mapping and tracking

- `Mapbox` for rider/admin/customer tracking views
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is already available in `.env`

### Hosting and deployment

- Continue using `Vercel`
- Use Vercel CLI heavily for environment setup and deployment workflows

---

## 5. Auth Position

### Current recommendation

For launch:

- do not use phone OTP
- require phone number on profile and checkout
- use email OTP or password-based auth
- keep guest checkout

### Why

- Phone number is essential for delivery operations.
- Phone OTP is not essential for launch.
- Removing phone OTP reduces cost and complexity.
- The product still remains phone-first in business logic because every real customer record stores a delivery phone number.

### Launch auth modes

- guest checkout
- email OTP sign-in
- optional password account
- guest-order claiming into an account later

---

## 6. Product Surfaces In This Codebase

The application should evolve into three integrated surfaces.

### 1. Marketing

The existing public-facing product and brand experience.

### 2. Customer Portal

The signed-in customer experience for orders, tracking, saved details, and reviews.

### 3. Admin Console

The internal operations layer for catalog, payments, delivery, content, and customer management.

These surfaces must share:

- one design system
- one data model
- one navigation philosophy
- one backend

---

## 7. Information Architecture

### Public routes

- `/`
- `/shop` if product browsing is later separated from the landing page
- `/checkout`
- `/track/[orderNumber]`
- `/auth/*`

### Customer portal routes

- `/account`
- `/account/orders`
- `/account/orders/[orderId]`
- `/account/tracking/[orderId]`
- `/account/addresses`
- `/account/profile`
- `/account/reviews`
- `/account/reorder`

### Admin routes

- `/admin`
- `/admin/orders`
- `/admin/orders/[orderId]`
- `/admin/payments`
- `/admin/delivery`
- `/admin/catalog`
- `/admin/catalog/products`
- `/admin/catalog/products/[productId]`
- `/admin/layout`
- `/admin/customers`
- `/admin/reviews`
- `/admin/automations`
- `/admin/settings`

---

## 8. Apple HIG Implementation Rules

This project should not imitate Apple visually in a shallow way. It should use Apple HIG as a product-structure system.

### Layout rules

- Use clear large titles at page entry.
- Use sidebars on desktop admin.
- Use split-view patterns on tablet where appropriate.
- Use stacked navigation and sheets on mobile.
- Keep toolbars sparse and task-focused.
- Keep forms grouped into clearly named sections.
- Use consistent, quiet status indicators.
- Keep accent color restrained.
- Prefer whitespace over separators.

### Interaction rules

- Minimum comfortable tap target size.
- Predictable back navigation.
- Confirmation on destructive actions.
- Inline validation instead of noisy modal errors.
- Search and filter in toolbars, not scattered across the page.
- Use segmented controls for small mode switches.
- Use sheets, drawers, and popovers purposefully.

### Product rules

- Do not build a chaotic dashboard.
- Do not create freeform drag-and-drop page editing for V1.
- Do not overload pages with metrics that do not support action.
- Do not make the admin feel visually disconnected from the marketing site.

---

## 9. Responsive Strategy

Do not rely on one over-flexible layout for all breakpoints.

We intentionally design three shells:

- mobile
- tablet
- desktop

### Principle

The content model remains shared, but the interface presentation changes intentionally by breakpoint.

### Expected behavior

- Mobile prioritizes stacked flows, bottom sheets, and single-column forms.
- Tablet prioritizes split views, staged editing, and compact dashboards.
- Desktop prioritizes sidebars, inspector panes, denser tables, and simultaneous context.

---

## 10. Layout Management Vision

This is one of the highest-priority systems.

The objective is to manage the product and homepage presentation without editing code for routine merchandising changes.

### V1 philosophy

Use a constrained content composer, not a visual page builder.

### What layout management should control

- section order
- section visibility
- per-section copy
- per-section media
- featured products
- available versus hidden items
- campaign banners
- homepage highlights
- category emphasis
- mobile/tablet/desktop presentation presets

### What layout management should not be

- arbitrary drag-and-drop anywhere on the canvas
- custom CSS editing
- unrestricted component nesting
- a general CMS for everything

### Layout building blocks

The homepage should be assembled from approved modules such as:

- hero
- featured products
- ingredient story
- benefit grid
- social proof
- promotional banner
- delivery reassurance
- review highlight
- FAQ block
- final CTA

Each module should expose constrained fields and toggles.

---

## 11. Customer Portal Features

### Account home

- current active order summary
- latest status
- quick reorder shortcut
- saved profile snapshot

### Orders

- full order history
- order filtering
- order status visibility
- payment status visibility
- order totals and item breakdown

### Order detail

- line items
- order timeline
- transfer instructions
- submitted proof of payment
- admin confirmation state
- support or issue notes

### Tracking

- live map
- courier position
- route line
- ETA
- delivery status events

### Addresses

- saved addresses
- default address
- edit and delete controls

### Profile

- name
- phone number
- email
- notification preferences

### Reorder

- one-tap reorder from previous orders
- saved baskets
- suggested repeats

### Ratings and reviews

- post-delivery rating prompt
- optional review text
- quick star scoring
- review submission history

### Guest claim flow

- a guest can convert into a full account later
- previous guest orders can be attached to the new account

---

## 12. Admin Console Features

### Overview

- orders awaiting payment review
- orders in preparation
- deliveries in progress
- stale unpaid orders
- low stock warnings
- new reviews
- key daily counts

### Orders

- master order board
- filters by status, payment state, delivery state, and date
- detail drawer or detail page
- internal notes
- status mutation controls

### Payments

- bank transfer review queue
- proof-of-payment preview
- amount and reference checks
- approve, reject, mark pending, or request clarification
- stale transfer handling

### Delivery

- dispatch board
- assign rider
- monitor map
- customer address and phone
- ETA visibility
- delivery event logging

### Catalog

- create and edit products
- create and edit variants
- price management
- availability toggles
- featured toggles
- stock visibility
- media management

### Layout

- homepage section management
- visibility toggles
- ordering
- content editing
- featured product selection
- preview modes for mobile, tablet, desktop

### Customers

- profile lookup
- guest versus account state
- addresses
- order history
- support notes

### Reviews

- moderation queue
- publish or hide
- pin featured reviews
- review analytics summary

### Automations

- stale order reminders
- payment reminder schedule
- review request timing
- low stock alerts
- delivery exception nudges

### Settings

- bank account details shown at checkout
- payment instructions
- delivery zones
- admin roles
- notification controls
- audit log visibility

---

## 13. Bank Transfer Checkout Model

Payment is manual.

The system must model that directly instead of pretending payment is instant.

### Checkout flow

1. Customer creates an order.
2. The app shows Prax bank account details and a generated transfer reference.
3. Customer makes transfer outside the app.
4. Customer taps a payment confirmation action.
5. Customer can upload proof of payment.
6. Admin reviews and confirms.
7. Fulfillment only starts after payment confirmation.

### Required system behavior

- unpaid orders can remain pending
- admin can review pending payments
- customer can see payment state clearly
- stale unpaid orders can expire automatically
- order history must preserve failed or expired attempts

### Recommended order states

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

---

## 14. Tracking Model

The live tracking experience should be sophisticated under the surface but minimal on screen.

### V1 tracking goals

- show current rider position
- show customer destination
- show route line
- show estimated arrival
- show delivery milestones

### Rider tracking inputs

- rider app or lightweight courier check-in surface
- periodic location updates
- latest event timestamps

### Admin tracking outputs

- delivery map board
- grouped rider assignments
- exception visibility

### Customer tracking outputs

- delivery map
- ETA
- clear order status timeline

### Realtime stance

Do not assume full WebSockets everywhere.

Start with:

- event logs
- polling or server-sent events for admin and customer views

Only introduce true sockets where live location frequency demands it.

---

## 15. Ratings And Review Strategy

Reviews are both trust-building and operational feedback.

### Customer experience

- ask for rating after delivery
- make the review form short
- allow quick stars-first submission
- allow optional text comment

### Admin experience

- review moderation
- visible flagged reviews
- highlight promotable reviews

### Business use

- homepage featured review modules
- product-specific review evidence later
- internal quality signal

---

## 16. State Management Strategy

Keep state management narrow and intentional.

### Recommended split

- server-first data fetching for normal reads
- route handlers or server actions for writes
- query cache for live portal/admin reads
- local UI store only where necessary

### Practical stack

- `TanStack Query` for portal and admin server state
- `Zustand` for local UI state only

### Do not use

- large global client state by default
- Redux unless a real need emerges
- duplicated server state in local stores

---

## 17. API Client Strategy

Create one typed internal API client for portal and admin use.

### API client responsibilities

- typed request wrappers
- shared auth-aware fetch behavior
- input and output schema validation
- normalized error handling
- optimistic mutation support where appropriate

### API design principles

- keep endpoints resource-oriented
- align payloads to UI use cases
- validate all writes
- prefer predictable status transitions over hidden side effects

---

## 18. Database Domain Model

The initial relational model should cover these entities.

### Identity and customer data

- `users`
- `profiles`
- `addresses`
- `sessions`

### Catalog

- `products`
- `product_variants`
- `product_media`
- `product_status_history`
- `inventory_items`
- `featured_slots`

### Content and layout

- `landing_sections`
- `landing_section_items`
- `page_layout_versions`
- `site_settings`

### Commerce

- `carts`
- `cart_items`
- `orders`
- `order_items`
- `order_status_events`

### Payment

- `payments`
- `payment_proofs`
- `payment_review_events`

### Delivery

- `delivery_assignments`
- `delivery_events`
- `tracking_points`

### Reviews and engagement

- `reviews`
- `review_requests`
- `notifications`

### Platform support

- `admin_roles`
- `audit_logs`

---

## 19. Roles And Permissions

At minimum:

- `customer`
- `admin`
- `operator`
- `dispatcher`
- `catalog_manager`

### Role intent

- `customer`: manages own profile, orders, reviews
- `admin`: full access
- `operator`: orders and payments
- `dispatcher`: delivery and tracking
- `catalog_manager`: products, content, layout

Permissions should be explicit and not inferred loosely.

---

## 20. Dashboard Design Language

The admin should feel calm, not crowded.

### Visual rules

- muted surfaces
- strong spacing rhythm
- restrained use of green accents
- grouped content instead of noisy cards everywhere
- readable tables with generous row height
- subtle badges instead of loud color coding

### Interaction rules

- default to searchable lists
- open detail in dedicated views or focused panels
- show the next action clearly
- reduce hidden system states

---

## 21. Implementation Order

### Phase 1: Data and foundation

- Aurora PostgreSQL integration
- auth setup
- core schema
- file upload pipeline
- internal API client
- route structure

### Phase 2: Commerce operations

- real orders
- bank transfer flow
- payment proof upload
- admin payment review
- order state engine

### Phase 3: Catalog and layout

- product CRUD
- featured and available controls
- homepage layout manager
- responsive preview modes

### Phase 4: Customer portal

- account home
- orders
- tracking
- addresses
- profile
- reorder

### Phase 5: Delivery intelligence

- Mapbox tracking
- dispatcher board
- rider assignment
- status event streaming

### Phase 6: Trust systems

- ratings
- reviews
- review requests
- review merchandising

---

## 22. Non-Goals For V1

These are intentionally excluded from the first implementation unless priorities change.

- phone OTP
- general drag-and-drop page builder
- marketplace-style multi-vendor complexity
- automated bank reconciliation
- overly complex promotion engines
- full socket infrastructure for every feature

---

## 23. Final Product Standard

The finished platform should feel:

- minimal on the surface
- precise in interaction
- structured by Apple HIG logic
- operationally strong for a small team
- quiet but sophisticated underneath

The system must remain easy to run, easy to evolve, and easy to merchandise without breaking the premium experience.
