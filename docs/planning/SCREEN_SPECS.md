# House of Prax Screen Specifications

This document defines the UI contract for the major routes before implementation starts.

The goal is to make each screen intentional:

- clear purpose
- clear sections
- clear actions
- clear data needs
- clear breakpoint behavior

Read with:

- [Implementation Blueprint](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/IMPLEMENTATION_BLUEPRINT.md)
- [End-To-End Flows](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/END_TO_END_FLOWS.md)
- [State Machines](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/STATE_MACHINES.md)

---

## 1. Screen Design Rules

1. Each screen gets one primary purpose.
2. Each screen has a dominant action.
3. Each screen should expose only the data needed for that purpose.
4. Breakpoint differences should be intentional, not accidental.
5. Shared patterns should repeat across screens.

---

## 2. Marketing Screens

### `/`

Purpose:
- premium product discovery and entry into commerce flow

Primary action:
- add to cart or start checkout

Primary sections:
- hero
- proof/problem/solution blocks
- featured product block
- ingredient story
- social proof
- final CTA

Shared primitives:
- section wrapper
- hero media frame
- product selector
- CTA surface

Breakpoint behavior:
- mobile: stacked story flow
- tablet: wider modular sections
- desktop: full narrative composition with larger media stage

### `/checkout`

Purpose:
- finalize order details and move customer into transfer flow

Primary action:
- create order

Sections:
- account choice section
- contact information section
- delivery address section
- notes section
- order summary section
- bank transfer instructions state after order creation

Shared primitives:
- grouped form section
- order summary card
- status callout
- file upload sheet

Breakpoint behavior:
- mobile: single-column grouped form
- tablet: form left, summary right when space allows
- desktop: sticky summary rail

---

## 3. Auth Screens

### `/auth/sign-in`

Purpose:
- sign in or initiate account creation

Primary action:
- request OTP or submit password

Sections:
- header
- auth method selector if multiple methods exist
- email field
- password field if enabled
- guest continuation explanation when launched from checkout

### `/auth/verify`

Purpose:
- complete authentication

Primary action:
- verify code

Sections:
- verification state
- code input
- resend action
- fallback instructions

---

## 4. Portal Screens

### `/account`

Purpose:
- customer home and current-order summary

Primary action:
- open latest order or reorder

Sections:
- large title header
- active order card
- recent orders preview
- quick actions
- pending review prompt

Shared primitives:
- portal header
- summary card
- grouped list
- quick action tile

Breakpoint behavior:
- mobile: tab-root dashboard
- tablet: two-column summary
- desktop: sidebar with central dashboard content

### `/account/orders`

Purpose:
- browse full order history

Primary action:
- open order detail

Sections:
- page header
- filters or segmented status controls
- order list

Shared primitives:
- search or filter bar
- order row
- empty state

Breakpoint behavior:
- mobile: stacked cards
- tablet: split list-detail
- desktop: list with persistent filter controls

### `/account/orders/[orderId]`

Purpose:
- understand one order fully

Primary action:
- track, reorder, or submit missing payment proof

Sections:
- detail header with status
- order timeline
- line items
- payment section
- delivery section
- notes section

Shared primitives:
- status badge cluster
- timeline
- line-item list
- utility actions bar

### `/account/tracking/[orderId]`

Purpose:
- track active delivery

Primary action:
- monitor progress

Sections:
- compact order header
- map
- ETA/status card
- milestone timeline

Shared primitives:
- map surface
- status card
- timeline

Breakpoint behavior:
- mobile: map first, details below
- tablet: map plus compact side details
- desktop: larger map with supporting side panel

### `/account/addresses`

Purpose:
- manage saved addresses

Primary action:
- add or edit address

Sections:
- address list
- add action
- default indicator

Shared primitives:
- grouped list rows
- sheet form

### `/account/profile`

Purpose:
- manage personal details

Primary action:
- save profile changes

Sections:
- identity group
- contact group
- preferences group

Shared primitives:
- grouped settings form

### `/account/reviews`

Purpose:
- complete pending reviews and inspect submitted ones

Primary action:
- submit rating

Sections:
- pending review requests
- previous reviews

Shared primitives:
- review request card
- star input
- text field sheet

### `/account/reorder`

Purpose:
- fast repeat purchase

Primary action:
- add previous basket to cart

Sections:
- reorder suggestions
- previous order cards
- change summary notices if items differ

---

## 5. Admin Screens

### `/admin`

Purpose:
- daily operational overview

Primary action:
- enter the highest-priority queue

Sections:
- urgent queue cards
- today's counts
- low stock alerts
- new review alerts
- delivery exceptions

Shared primitives:
- admin header
- queue card
- compact stat panel

Breakpoint behavior:
- desktop: multi-panel overview
- tablet: reduced panel count
- mobile: triage-first stacked view

### `/admin/orders`

Purpose:
- operate the order queue

Primary action:
- open and act on an order

Sections:
- toolbar with search and filters
- order list or table
- optional quick detail preview

Shared primitives:
- admin toolbar
- searchable list
- table
- filter chips

Breakpoint behavior:
- mobile: compact list only
- tablet: list-detail
- desktop: list with preview or detail pane

### `/admin/orders/[orderId]`

Purpose:
- work one order in depth

Primary action:
- perform legal next step

Sections:
- detail header
- status timeline
- customer snapshot
- payment panel
- fulfillment panel
- delivery panel
- internal notes
- audit/event log

Shared primitives:
- detail header
- inspector cards
- notes composer
- status action bar

### `/admin/payments`

Purpose:
- review bank transfer payments

Primary action:
- confirm or reject payment

Sections:
- payment queue
- payment detail
- proof preview
- expected vs submitted amount comparison
- action bar

Shared primitives:
- queue list
- media preview
- decision bar

Breakpoint behavior:
- mobile: compact proof-review flow
- tablet: list-detail
- desktop: queue + proof + decision pane

### `/admin/delivery`

Purpose:
- dispatch and monitor deliveries

Primary action:
- assign rider or resolve delivery issue

Sections:
- active dispatch list
- map surface
- rider status list
- issue queue

Shared primitives:
- dispatch row
- map panel
- assignment sheet

Breakpoint behavior:
- mobile: triage list with map on demand
- tablet: split map/list
- desktop: persistent map with side queues

### `/admin/catalog/products`

Purpose:
- manage product inventory of the site

Primary action:
- open or create product

Sections:
- product table/list
- featured and availability filters
- create action

Shared primitives:
- toolbar
- data table
- empty state

### `/admin/catalog/products/[productId]`

Purpose:
- edit one product comprehensively

Primary action:
- save product changes

Sections:
- product identity
- variants
- media
- ingredients
- merchandising
- inventory

Shared primitives:
- tab or segmented subsections
- grouped form blocks
- media manager
- variant list editor

### `/admin/layout`

Purpose:
- edit and publish structured page layouts

Primary action:
- publish valid draft

Sections:
- page selector
- version selector
- section outline
- section form/editor
- preview
- publish bar

Shared primitives:
- section list
- preview frame
- publish confirmation dialog

Breakpoint behavior:
- desktop: editor + preview workspace
- tablet: alternating editor and preview emphasis
- mobile: view-only or minimal status access in V1

### `/admin/customers`

Purpose:
- customer lookup and support context

Primary action:
- open customer detail

Sections:
- search
- result list
- customer snapshot
- order history preview

### `/admin/reviews`

Purpose:
- moderate and feature reviews

Primary action:
- approve, hide, or feature

Sections:
- moderation queue
- review detail
- source order summary

### `/admin/settings`

Purpose:
- maintain platform settings safely

Primary action:
- update controlled configuration

Sections:
- bank transfer settings
- delivery settings
- notification settings
- role/admin settings

---

## 6. Shared Component Inventory

These should be built as reusable primitives rather than page-specific one-offs.

### Structural

- `PageShell`
- `SidebarNav`
- `TopToolbar`
- `PageHeader`
- `InspectorPanel`

### Data display

- `StatusBadge`
- `Timeline`
- `DataTable`
- `GroupedList`
- `SummaryCard`
- `EmptyState`

### Forms and actions

- `FormSection`
- `SegmentedControl`
- `DecisionBar`
- `FileUploadField`
- `SearchField`
- `FilterChips`

### Commerce-specific

- `OrderSummary`
- `OrderItemsList`
- `PaymentProofPreview`
- `TransferInstructionsCard`
- `AddressCard`

### Delivery-specific

- `TrackingMap`
- `EtaCard`
- `AssignmentCard`
- `LocationFreshnessBadge`

### Content-specific

- `SectionOutline`
- `SectionEditor`
- `PreviewFrame`
- `PublishBar`

---

## 7. Screen-Level Guardrails

1. If a screen needs more than one primary purpose, split it.
2. If a route needs radically different data by breakpoint, reconsider the route design.
3. If two admin screens duplicate the same queue behavior, extract a primitive.
4. If a mobile flow requires excessive scrolling to complete a core task, redesign the sequence.
5. If a desktop flow hides critical actions in menus, simplify the action model.

