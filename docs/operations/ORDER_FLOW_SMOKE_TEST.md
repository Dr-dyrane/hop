# Order Flow Smoke Test

This document is the manual runbook for proving that House of Prax can handle one real customer order end to end.

Use it on deployed code.

For local verification against a running dev server, use:

- `npm run flow:verify`

The goal is not exhaustive QA.

The goal is to prove that the core business loop works:

- customer can place an order
- Praxy can confirm payment
- delivery can progress
- the customer can rate the order
- a return/refund can be processed

The scripted verifier covers:

- storefront render
- guest request flow
- signed-in request flow
- admin payment and delivery flow
- delivered review submission
- signed-in return, proof, and refund flow

---

## 1. Preconditions

Before running the smoke pass, confirm all of these:

- deployed app is reachable
- Aurora migrations are up to date
- `RESEND_API_KEY` is present in Vercel
- `RESEND_FROM_EMAIL` is present in Vercel
- `ADMIN_EMAILS` includes Praxy
- bank details exist in `/admin/settings`
- at least one product is `active`, `available`, and has inventory on hand
- Mapbox token is present if tracking visuals are being checked

Optional:

- S3 upload is configured

Important:

- proof upload is optional for the payment confirmation flow
- the order should still move to admin review even if no receipt image is attached
- `CRON_SECRET` is present if cron-backed reminder checks are part of the smoke pass

---

## 2. Scenario A: Signed-In Customer Order

### Step 1: Sign in

1. Open `/auth/sign-in`
2. Enter a customer email
3. Verify the OTP email
4. Confirm the user lands in `/account`

Expected:

- account shell loads
- orders, addresses, and profile routes are visible

### Step 2: Place an order

1. Open the storefront
2. Add one available product to cart
3. Open the cart drawer
4. Fill name, phone, and delivery location
5. Submit checkout

Expected:

- a real order is created
- user lands on `/account/orders/[orderId]`
- order shows transfer amount, bank name, account name, and account number
- order status is `awaiting_transfer`
- payment status is `pending`

### Step 3: Submit payment

1. On the order page, tap `I sent the money`
2. Repeat once with no receipt file attached
3. If S3 is configured, repeat once with a receipt file attached on another order

Expected:

- payment status moves into submitted/review flow
- admin payment queue shows the order
- customer page shows payment is under review
- if no file is attached, the request still succeeds

---

## 3. Scenario B: Praxy Operations Flow

### Step 4: Confirm payment

1. Sign in as Praxy
2. Open `/admin/payments`
3. Open the submitted order or act from the queue
4. Confirm payment

Expected:

- order status moves to `payment_confirmed`
- customer order surface updates accordingly
- milestone email is sent if customer email exists

### Step 5: Move into delivery

1. Open `/admin/delivery`
2. Mark the order ready
3. Assign a rider
4. Move to `picked_up`
5. Move to `out_for_delivery`
6. Move to `delivered`

Expected:

- admin delivery board updates stage by stage
- customer tracking page updates status live
- ETA and distance appear when live coordinates are available
- delivered state creates a review request

---

## 4. Scenario C: Customer Post-Delivery Flow

### Step 6: Rate the order

1. Open the delivered order as the customer
2. Submit a rating

Expected:

- review is stored
- admin review moderation queue can see it
- order detail reflects the submitted review state

### Step 7: Request a return

1. From the same delivered order, open the return flow
2. Enter reason and refund bank details
3. Submit the return request

Expected:

- return case is created
- customer can choose specific items and quantities instead of being forced into a whole-order return
- admin order queue shows an open return
- return status appears on the customer order page

### Step 8: Upload return proof

1. Upload a return proof file if S3 is configured
2. If S3 is not configured, verify the rest of the return flow still works

Expected:

- proof appears on the admin order detail page when storage is configured
- return flow itself is not blocked by proof absence

### Step 8b: Let automation catch up

1. If you are validating reminders, leave one submitted payment or one open return case idle long enough to cross its reminder window
2. Trigger `/api/cron/order-automation` with the configured cron secret or wait for the scheduled run

Expected:

- stale payment reviews can trigger an operator reminder
- quiet open return cases can trigger an operator reminder
- customer-facing transfer and review reminders still only send once

---

## 5. Scenario D: Praxy Return/Refund Flow

### Step 9: Resolve the return

1. Open the order in `/admin/orders/[orderId]`
2. Approve the return
3. Mark it received
4. Mark it refunded

Expected:

- return timeline updates through each step
- refund state appears to the customer
- inventory is restored when the return is marked received

---

## 6. Guest Coverage

Run one additional lightweight pass as guest:

1. place an order without signing in
2. open `/checkout/orders/[orderId]?access=...`
3. submit payment
4. open `/checkout/orders/[orderId]/tracking?access=...` after dispatch starts

Expected:

- guest order page works
- guest payment submission works
- guest live tracking works
- guest rating and return flows remain accessible from the tokenized order route

---

## 7. Failure Conditions

The smoke pass fails if any of these happen:

- OTP email does not arrive
- checkout creates no order
- bank details are empty on the order page
- `I sent the money` does not create an admin-reviewable payment state
- admin cannot confirm payment
- delivery state changes do not appear on the customer side
- delivered orders cannot be rated
- return requests cannot be opened from delivered orders
- partial returns cannot target specific items and quantities
- refund completion does not reflect on the customer side

---

## 8. After The Run

If the smoke pass succeeds:

- record the date in the tracker or release note
- list any visual polish issues separately from logic failures

If the smoke pass fails:

- capture the failing route
- capture the exact state transition that broke
- capture whether it was signed-in or guest
- fix the issue before broadening scope
