# House of Prax End-to-End Flows

This document plans the product from beginning to end before implementation starts.

It exists to answer four questions clearly:

1. Who interacts with the system?
2. What happens from discovery to reorder?
3. How do admin operations and customer flows connect?
4. What happens when things go wrong?

Read this together with:

- [Platform Bible](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/README_BIBLE.md)
- [Schema Blueprint](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/SCHEMA_BLUEPRINT.md)
- [Implementation Blueprint](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/IMPLEMENTATION_BLUEPRINT.md)

---

## 1. System Actors

### Customer-side actors

- `guest`
- `authenticated customer`
- `returning customer`

### Operations-side actors

- `admin`
- `operator`
- `dispatcher`
- `catalog_manager`
- `rider`

### System actors

- `application backend`
- `scheduled jobs`
- `email provider`
- `Mapbox`

---

## 2. End-To-End Lifecycle

The full product lifecycle is:

1. discover product
2. browse and add to cart
3. choose guest or account path
4. create order
5. receive bank transfer instructions
6. submit payment proof
7. admin reviews payment
8. order moves into preparation
9. dispatcher assigns rider
10. customer tracks delivery
11. order is delivered
12. customer is prompted to rate
13. customer may reorder

This should feel simple on the surface even though several operational states exist underneath.

---

## 3. Relationship Map

### Identity relationships

- one `user` has one `profile`
- one `user` has many `addresses`
- one `user` can have many `orders`
- one `user` can have many `reviews`

### Commerce relationships

- one `cart` has many `cart_items`
- one `order` has many `order_items`
- one `order` has one current payment record but may have multiple payment review events
- one `order` may have one active delivery assignment
- one `order` has many order status events

### Catalog relationships

- one `product_category` has many `products`
- one `product` has many `product_variants`
- one `product` or `variant` has many `media`
- one `variant` has many `ingredients` through `variant_ingredients`

### Content relationships

- one `page` has many `page_versions`
- one `page_version` has many `page_sections`
- one `page_section` has many `bindings`
- one `page_version` can be published, but only one version per page can be published at a time

### Operations relationships

- one `payment` has many `payment_review_events`
- one `delivery_assignment` has many `tracking_points`
- one `delivery_assignment` has many `delivery_events`
- one `review_request` belongs to one delivered order

---

## 4. Lifecycle Ownership

Each lifecycle phase has a clear owner.

| Phase | Primary owner | Supporting owner |
| --- | --- | --- |
| Product discovery | marketing system | catalog manager |
| Cart and checkout | customer | application backend |
| Payment submission | customer | operator |
| Payment review | operator | admin |
| Preparation | operator | admin |
| Dispatch | dispatcher | rider |
| Delivery tracking | dispatcher | rider |
| Delivery completion | rider | dispatcher |
| Reviews | customer | operator |
| Layout and merchandising | catalog manager | admin |

Senior-engineering rule:

- if ownership is unclear, the flow is not ready for implementation

---

## 5. Customer Flows

### Flow A: New guest order

1. Guest lands on marketing site.
2. Guest browses sections and products.
3. Guest adds items to cart.
4. Guest enters checkout.
5. System offers:
   - create account
   - continue as guest
6. Guest continues as guest.
7. Guest enters:
   - full name
   - phone number
   - email if required for OTP or notifications
   - delivery address
8. System validates cart and current pricing.
9. System creates order and generates:
   - public order number
   - transfer reference
   - tokenized guest access link
10. Guest sees bank account details and transfer instructions.
11. Guest transfers payment externally.
12. Guest taps `I have paid`.
13. Guest uploads proof and payer details.
14. Payment enters review queue.
15. Guest can revisit tracking/payment page using tokenized link.
16. Operator confirms payment.
17. Order moves into preparation, then delivery.
18. Guest receives delivery.
19. Guest is invited to create account or claim order history.

### Flow B: Authenticated customer order

1. Customer signs in.
2. Customer adds products to cart.
3. Checkout preloads:
   - profile
   - phone
   - default address
4. Customer confirms or edits details.
5. System creates order.
6. Transfer flow proceeds exactly as in guest checkout.
7. Order appears immediately in portal history.
8. Customer tracks status through portal.
9. Customer rates order after delivery.

### Flow C: Guest claim after purchase

1. Guest opens tokenized order page.
2. Guest selects `Create account` or `Claim this order`.
3. Guest verifies email or sets password depending on launch auth mode.
4. System confirms token scope.
5. System links order to created user.
6. System converts guest session into customer identity.
7. Order history and any eligible address snapshots become available in portal.

### Flow D: Reorder

1. Returning customer opens order history.
2. Customer taps reorder.
3. System clones reorderable line items into active cart.
4. System checks:
   - availability
   - current price
   - discontinued items
5. Customer receives clear feedback on any changed items.
6. Customer proceeds to checkout.

### Flow E: Address management

1. Customer opens addresses.
2. Customer adds or edits an address.
3. System validates essential delivery fields.
4. Customer can set default.
5. Future checkout preloads the current default address.

### Flow F: Tracking

1. Customer opens order tracking.
2. System shows:
   - payment status
   - fulfillment status
   - delivery assignment if available
   - current map state
   - ETA if available
3. When rider updates location, customer sees fresh state through polling or SSE.
4. Customer sees status milestones instead of raw operational noise.

### Flow G: Rating and review

1. Order reaches delivered state.
2. System creates review request.
3. Customer receives prompt.
4. Customer submits stars and optional text.
5. Review enters moderation or publish flow depending on locked policy.

---

## 6. Admin Flows

### Flow H: Catalog management

1. Catalog manager opens products list.
2. Catalog manager creates or edits product.
3. Variants, media, pricing, and availability are managed.
4. Featured state is updated when needed.
5. Product becomes saleable only when:
   - required fields are complete
   - at least one sellable variant exists
   - visibility rules allow it

### Flow I: Layout management

1. Catalog manager opens layout editor.
2. Draft version loads for page.
3. Manager edits section order, content, and bindings.
4. Manager previews:
   - mobile
   - tablet
   - desktop
5. Publish action validates required content.
6. System publishes new page version and archives prior published version as historical record.

### Flow J: Payment review

1. Operator opens payment queue.
2. Operator filters to `submitted` or `under_review`.
3. Operator opens payment detail.
4. Operator inspects:
   - expected amount
   - submitted amount
   - proof image
   - payer details
   - transfer reference
5. Operator chooses:
   - mark under review
   - confirm
   - reject
   - expire
6. Confirmation updates payment and order states together.

### Flow K: Order preparation

1. Operator opens confirmed orders awaiting preparation.
2. Operator moves order into `preparing`.
3. Internal notes can be added for fulfillment.
4. Once ready, operator changes order to `ready_for_dispatch`.

### Flow L: Dispatch

1. Dispatcher opens delivery board.
2. Dispatcher sees orders ready for dispatch.
3. Dispatcher assigns rider.
4. Delivery assignment becomes active.
5. Rider begins updates.
6. Dispatcher monitors progress and handles delivery exceptions.

### Flow M: Delivery monitoring

1. Dispatcher watches map and assignment list.
2. Dispatcher notices delays, stale location, or route anomalies.
3. Dispatcher updates notes or reassigns rider if needed.
4. Delivery is marked completed when confirmed.

### Flow N: Customer support lookup

1. Admin or operator searches customer.
2. System shows profile, orders, payment states, and notes.
3. Support actor can understand the whole customer context without visiting external systems.

### Flow O: Review moderation

1. Operator opens review queue.
2. Review is read in context of delivered order.
3. Operator approves, hides, or features the review.
4. Featured reviews become eligible for homepage bindings.

---

## 7. Rider Flow

### Flow P: Rider assignment and updates

1. Rider receives assignment access.
2. Rider opens lightweight rider surface.
3. Rider confirms pickup.
4. Rider location updates begin.
5. Rider marks key milestones:
   - picked up
   - arrived nearby
   - delivered
   - failed delivery
6. Dispatcher and customer views update accordingly.

Senior-engineering recommendation:

- V1 should use tokenized assignment links or a minimal rider access path
- do not overbuild a separate rider app until volume requires it

---

## 8. Notification Plan

Notifications should exist to support flow continuity, not to create noise.

### Customer notifications

- order created
- payment instructions issued
- payment received and under review
- payment confirmed
- order preparing
- rider assigned
- order delivered
- review request

### Admin notifications

- new payment proof
- stale unpaid orders
- ready-for-dispatch backlog
- delivery exceptions
- low stock

### Delivery notifications

- rider assigned to order
- route updated if later needed

### Channel priority

- email first at launch
- in-app status second
- SMS not required at launch

---

## 9. Edge Cases

The system should be planned around these before implementation.

### Auth and identity edge cases

#### Guest starts checkout, then signs in mid-flow

Expected behavior:

- merge or transfer guest cart
- preserve checkout progress
- attach resulting order to authenticated user

#### Guest creates account after order already exists

Expected behavior:

- claim flow attaches historical order
- prevent duplicate claims

#### Email OTP expires

Expected behavior:

- clear resend path
- pending checkout state preserved

### Cart and catalog edge cases

#### Variant becomes unavailable while item is in cart

Expected behavior:

- cart flags item
- checkout blocks until resolved

#### Price changes after cart was built

Expected behavior:

- checkout re-prices transparently
- user sees updated total before order creation

#### Product is removed from featured sections

Expected behavior:

- layout binding validation prevents broken published sections

### Checkout and payment edge cases

#### Customer submits proof after payment deadline

Expected behavior:

- payment marked expired unless admin reopens it

#### Customer transfers wrong amount

Expected behavior:

- operator can reject or place under review
- order does not advance automatically

#### Duplicate payment proof submissions

Expected behavior:

- multiple proofs can exist
- payment remains one logical payment record with review history

#### Customer abandons after order creation but before transfer

Expected behavior:

- order stays in awaiting transfer until deadline
- scheduled job expires order later

#### Bank details change after order creation

Expected behavior:

- existing order must preserve bank details snapshot shown at creation time
- future orders use latest active bank account

### Order operation edge cases

#### Operator confirms payment but stock issue appears

Expected behavior:

- order moves into exception handling, not silent cancellation

#### Order cancelled after payment

Expected behavior:

- cancellation requires explicit note and refund workflow placeholder

#### Duplicate order creation due to retry

Expected behavior:

- checkout create-order endpoint must be idempotent per checkout submission token

### Delivery edge cases

#### Rider location goes stale

Expected behavior:

- customer sees last updated timestamp
- dispatcher sees stale-location warning

#### Failed delivery

Expected behavior:

- assignment moves to failed or returned
- order state reflects exception
- support can intervene

#### Customer address is incomplete

Expected behavior:

- checkout validation blocks creation
- admin can still append clarification notes after order creation if needed

### Review edge cases

#### Review attempted before delivery

Expected behavior:

- rejected by domain logic

#### Duplicate review for same order

Expected behavior:

- allow only one canonical review per order unless explicit edit flow exists

### Layout and publishing edge cases

#### Draft is incomplete but author tries to publish

Expected behavior:

- publish blocked with precise validation errors

#### Published layout references unavailable product

Expected behavior:

- publishing validation blocks it

### Security edge cases

#### Someone guesses a public order number

Expected behavior:

- they still cannot access order details without scoped token or ownership

#### Guest token is leaked

Expected behavior:

- tokens can expire
- sensitive actions are scope-limited

### Operations edge cases

#### Vercel envs drift from `.env.example`

Expected behavior:

- compare script detects drift before deployment

#### Undocumented DB trigger or function is added

Expected behavior:

- documentation policy blocks merge

---

## 10. Domain Invariants

These invariants must remain true in implementation.

1. An order snapshot must remain historically correct after checkout.
2. Public order number alone must never grant unauthenticated access.
3. Only one published version can exist per page at a time.
4. Payment confirmation and order status changes must stay synchronized.
5. Legal state transitions must be centralized.
6. A delivered order is required before review submission.
7. Guest flows must be claimable without exposing other customers' data.
8. Layout management must stay constrained to approved section types.
9. The same design system must power marketing, portal, and admin surfaces.
10. The repository must remain the source of truth for infra-affecting behavior.

---

## 11. Failure Recovery Paths

When something goes wrong, the system should have a defined recovery route.

### Payment not matched

Recovery:

- operator keeps payment under review
- customer can upload another proof
- support can add note

### Delivery delayed

Recovery:

- dispatcher marks issue
- customer tracking reflects delay rather than pretending normal ETA

### Layout publish mistake

Recovery:

- previous published version remains in history
- admin can republish prior stable version

### Guest lost tracking link

Recovery:

- if email exists, resend access link
- if account is later created, order becomes visible in portal

### Review abuse or low-quality spam

Recovery:

- moderation queue or hide flow

---

## 12. Planning Checklist Before Implementation

The planning phase should only be considered complete when all of this is true.

### Product structure

- public, portal, and admin route map understood
- actor ownership understood
- lifecycle stages understood

### Data model

- schema approved
- state models approved
- snapshots and audit rules approved

### Security model

- guest token model approved
- ownership checks approved
- role model approved

### Operations model

- payment review path approved
- dispatch path approved
- review moderation path approved
- layout publishing path approved

### Technical operations

- env policy approved
- Vercel workflow approved
- migration rules approved
- DB docs workflow approved

---

## 13. Locked Final Decisions

These decisions are now accepted and should be treated as implementation constraints.

### 1. Launch auth shape

- `email OTP only`

### 2. Upload path

- `direct S3 signed uploads`

### 3. Rider access model

- `tokenized courier device links` for V1

### 4. Review policy

- `pre-moderated`

### 5. Layout preview model

- `simulated preview in admin first`

---

## 14. Definition Of Planning Done

Planning is done when:

- architecture is stable
- flows are stable
- data relationships are stable
- edge cases are named
- ownership is clear
- remaining decisions are explicitly accepted

At that point, implementation can start without inventing the system while building it.
