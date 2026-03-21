# RLS Registry

This file records every row-level security policy introduced into the database.

Update this file in the same change that introduces or modifies a policy.

---

## Columns To Record

- table
- policy name
- command
- actor scope
- policy summary
- helper functions used
- migration introduced
- notes

---

## Entries

All policies below were introduced in `0011__rls_policies.sql`.

Verification:

- Aurora currently reports `row_security = true` and `force_row_security = true` on all protected tables below.
- The runtime role does not have `rolsuper` or `rolbypassrls`, so these policies are materially enforced.

| Table | Policy Name | Command | Actor Scope | Policy Summary | Helper Functions Used | Migration Introduced | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `app.profiles` | `profiles_admin_all` | `all` | `admin` | Admin can read and write any profile row. | `app.has_role` | `0011__rls_policies.sql` | Admin bypass for support and operations. |
| `app.profiles` | `profiles_customer_select` | `select` | `customer` | Customer can read only their own profile. | `app.current_actor_user_id` | `0011__rls_policies.sql` | Owner match by `user_id`. |
| `app.profiles` | `profiles_customer_insert` | `insert` | `customer` | Customer can create only their own profile row. | `app.current_actor_user_id` | `0011__rls_policies.sql` | Prevents cross-user profile creation. |
| `app.profiles` | `profiles_customer_update` | `update` | `customer` | Customer can update only their own profile row. | `app.current_actor_user_id` | `0011__rls_policies.sql` | Keeps profile ownership stable through `WITH CHECK`. |
| `app.addresses` | `addresses_admin_all` | `all` | `admin` | Admin can read and write any saved address. | `app.has_role` | `0011__rls_policies.sql` | Supports customer-service intervention. |
| `app.addresses` | `addresses_customer_select` | `select` | `customer` | Customer can read only their own saved addresses. | `app.current_actor_user_id` | `0011__rls_policies.sql` | Owner match by `user_id`. |
| `app.addresses` | `addresses_customer_insert` | `insert` | `customer` | Customer can create addresses only for their own account. | `app.current_actor_user_id` | `0011__rls_policies.sql` | Blocks cross-account inserts. |
| `app.addresses` | `addresses_customer_update` | `update` | `customer` | Customer can update only their own addresses. | `app.current_actor_user_id` | `0011__rls_policies.sql` | Uses owner match in `USING` and `WITH CHECK`. |
| `app.addresses` | `addresses_customer_delete` | `delete` | `customer` | Customer can delete only their own addresses. | `app.current_actor_user_id` | `0011__rls_policies.sql` | Keeps address book private. |
| `app.orders` | `orders_admin_all` | `all` | `admin` | Admin can read and write any order. | `app.has_role` | `0011__rls_policies.sql` | Needed for operations, payments, and delivery. |
| `app.orders` | `orders_customer_select` | `select` | `customer` / guest | Customer can read their own orders; guest can read only the scoped guest order. | `app.can_access_order_row`, `app.current_actor_email`, `app.current_actor_user_id`, `app.current_guest_order_id` | `0011__rls_policies.sql` | Covers signed-in and guest confirmation flows. |
| `app.orders` | `orders_customer_insert` | `insert` | `customer` / guest | Checkout can create orders only for the current customer identity or guest scope. | `app.has_role`, `app.current_actor_email`, `app.current_actor_user_id` | `0011__rls_policies.sql` | Allows guest checkout when `customer_email` is null. |
| `app.order_items` | `order_items_admin_all` | `all` | `admin` | Admin can read and write any order line. | `app.has_role` | `0011__rls_policies.sql` | Supports order repair and support. |
| `app.order_items` | `order_items_customer_select` | `select` | `customer` / guest | Customer can read line items only for accessible orders. | `app.can_access_order_id` | `0011__rls_policies.sql` | Child-table protection via parent order scope. |
| `app.order_items` | `order_items_customer_insert` | `insert` | `customer` / guest | Checkout can insert lines only for accessible orders. | `app.has_role`, `app.can_access_order_id` | `0011__rls_policies.sql` | Keeps order creation inside current order scope. |
| `app.payments` | `payments_admin_all` | `all` | `admin` | Admin can read and write any payment row. | `app.has_role` | `0011__rls_policies.sql` | Needed for transfer review queue. |
| `app.payments` | `payments_customer_select` | `select` | `customer` / guest | Customer can read payment details only for accessible orders. | `app.can_access_order_id` | `0011__rls_policies.sql` | Covers portal order detail and guest confirmation. |
| `app.payments` | `payments_customer_insert` | `insert` | `customer` / guest | Checkout can insert the initial payment row only for the current order. | `app.has_role`, `app.can_access_order_id` | `0011__rls_policies.sql` | Used during order creation transaction. |
| `app.payment_proofs` | `payment_proofs_admin_all` | `all` | `admin` | Admin can read and manage all payment proofs. | `app.has_role` | `0011__rls_policies.sql` | Enables proof review in admin. |
| `app.payment_proofs` | `payment_proofs_customer_select` | `select` | `customer` / guest | Customer can read proofs only for accessible orders. | `app.can_access_order_id` | `0011__rls_policies.sql` | Proof visibility follows payment ownership. |
| `app.payment_proofs` | `payment_proofs_customer_insert` | `insert` | `customer` / guest | Portal and guest confirmation can upload proofs only for accessible orders. | `app.has_role`, `app.can_access_order_id` | `0011__rls_policies.sql` | Supports guest proof upload through `guest_order_id`. |
| `app.order_status_events` | `order_status_events_admin_all` | `all` | `admin` | Admin can read and write all order timeline events. | `app.has_role` | `0011__rls_policies.sql` | Supports operations timeline and state correction. |
| `app.order_status_events` | `order_status_events_customer_select` | `select` | `customer` / guest | Customer can read timeline events only for accessible orders. | `app.can_access_order_id` | `0011__rls_policies.sql` | Drives order detail timelines. |
| `app.order_status_events` | `order_status_events_customer_insert` | `insert` | `customer` / guest | Customer-originated timeline events must stay inside the current order scope. | `app.has_role`, `app.can_access_order_id` | `0011__rls_policies.sql` | Restricted to rows with `actor_type = 'customer'`. |
| `app.payment_review_events` | `payment_review_events_admin_all` | `all` | `admin` | Only admin can read and write payment review history. | `app.has_role` | `0011__rls_policies.sql` | Customer-facing surfaces never read this table. |
| `app.order_return_cases` | `order_return_cases_admin_all` | `all` | `admin` | Admin can read and write all return/refund cases. | `app.has_role` | `0014__order_returns.sql` | Supports review, receipt, and refund actions from the console. |
| `app.order_return_cases` | `order_return_cases_customer_select` | `select` | `customer` / guest | Customer can read return/refund cases only for accessible orders. | `app.can_access_order_id` | `0014__order_returns.sql` | Covers signed-in and guest order detail surfaces. |
| `app.order_return_cases` | `order_return_cases_customer_insert` | `insert` | `customer` / guest | Customer can create a return request only inside the current order scope. | `app.has_role`, `app.can_access_order_id`, `app.current_actor_user_id`, `app.current_actor_email` | `0014__order_returns.sql` | Keeps guest and signed-in return requests scoped to the same accessible order model as proof upload. |
| `app.order_return_events` | `order_return_events_admin_all` | `all` | `admin` | Admin can read and write all return/refund events. | `app.has_role` | `0014__order_returns.sql` | Supports operational timelines and status progression. |
| `app.order_return_events` | `order_return_events_customer_select` | `select` | `customer` / guest | Customer can read return/refund events only for accessible orders. | `app.can_access_order_id` | `0014__order_returns.sql` | Drives the customer-facing return timeline. |
| `app.order_return_events` | `order_return_events_customer_insert` | `insert` | `customer` / guest | Customer can create only the initial `requested` return event inside the current order scope. | `app.has_role`, `app.can_access_order_id` | `0014__order_returns.sql` | Prevents customer-written approval or refund events. |
| `app.order_return_proofs` | `order_return_proofs_admin_all` | `all` | `admin` | Admin can read and manage all return proofs. | `app.has_role` | `0016__order_return_proofs.sql` | Lets Praxy review supporting return evidence from the console. |
| `app.order_return_proofs` | `order_return_proofs_customer_select` | `select` | `customer` / guest | Customer can read return proofs only for accessible orders. | `app.can_access_order_id` | `0016__order_return_proofs.sql` | Keeps signed-in and guest return evidence inside the same order-access scope. |
| `app.order_return_proofs` | `order_return_proofs_customer_insert` | `insert` | `customer` / guest | Customer can upload return proofs only for the current accessible order scope. | `app.has_role`, `app.can_access_order_id` | `0016__order_return_proofs.sql` | Supports direct S3 return-proof upload without expanding admin-only write access. |
| `app.order_return_case_items` | `order_return_case_items_admin_all` | `all` | `admin` | Admin can read and write all returned line items. | `app.has_role` | `0018__partial_order_returns.sql` | Supports approval, receipt, refund review, and partial-return visibility in the console. |
| `app.order_return_case_items` | `order_return_case_items_customer_select` | `select` | `customer` / guest | Customer can read returned line items only for accessible orders. | `app.can_access_order_id` | `0018__partial_order_returns.sql` | Keeps signed-in and guest return detail scoped to the same accessible order model as the parent return case. |
| `app.order_return_case_items` | `order_return_case_items_customer_insert` | `insert` | `customer` / guest | Customer can create returned line items only inside the current accessible order scope. | `app.has_role`, `app.can_access_order_id` | `0018__partial_order_returns.sql` | Allows full-order and partial-return requests without granting wider write access. |
| `app.review_requests` | `review_requests_admin_all` | `all` | `admin` | Admin can read and write all review requests. | `app.has_role` | `0011__rls_policies.sql` | Supports moderation and support operations. |
| `app.review_requests` | `review_requests_customer_select` | `select` | `customer` / guest | Customer can read review requests tied to their account or accessible order. | `app.current_actor_user_id`, `app.can_access_order_id` | `0011__rls_policies.sql` | Signed-in and guest-delivered orders both work. |
| `app.review_requests` | `review_requests_customer_update` | `update` | `customer` / guest | Customer can complete only their own review request scope. | `app.current_actor_user_id`, `app.can_access_order_id` | `0011__rls_policies.sql` | Used when a review request moves to `completed`. |
| `app.reviews` | `reviews_admin_all` | `all` | `admin` | Admin can read and moderate all reviews. | `app.has_role` | `0011__rls_policies.sql` | Supports approve/hide/feature actions. |
| `app.reviews` | `reviews_customer_select` | `select` | `customer` / guest | Customer can read reviews tied to their account or accessible order. | `app.current_actor_user_id`, `app.can_access_order_id` | `0011__rls_policies.sql` | Keeps personal review history private. |
| `app.reviews` | `reviews_customer_insert` | `insert` | `customer` / guest | Customer can create a review only within their own accessible order scope. | `app.has_role`, `app.current_actor_user_id`, `app.can_access_order_id` | `0011__rls_policies.sql` | Prevents review creation against other orders. |
