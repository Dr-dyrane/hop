# Triggers Registry

This file records every trigger introduced into the database.

Update this file in the same change that introduces or modifies a trigger.

---

## Columns To Record

- trigger name
- table
- timing
- event
- backing function
- purpose
- migration introduced
- notes

---

## Entries

| Trigger Name | Table | Timing | Event | Backing Function | Purpose | Migration Introduced | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `set_users_updated_at` | `app.users` | `before` | `update` | `app.set_updated_at()` | Keep `updated_at` authoritative for user identity changes. | `0002__identity_and_access.sql` | Applies to session and admin identity writes. |
| `set_profiles_updated_at` | `app.profiles` | `before` | `update` | `app.set_updated_at()` | Keep profile edits timestamped. | `0002__identity_and_access.sql` | Covers customer-facing identity fields. |
| `set_addresses_updated_at` | `app.addresses` | `before` | `update` | `app.set_updated_at()` | Keep saved address changes timestamped. | `0002__identity_and_access.sql` | Supports address-book history and sync. |
| `set_product_categories_updated_at` | `app.product_categories` | `before` | `update` | `app.set_updated_at()` | Keep category edits timestamped. | `0003__catalog.sql` | Catalog admin support. |
| `set_products_updated_at` | `app.products` | `before` | `update` | `app.set_updated_at()` | Keep product family changes timestamped. | `0003__catalog.sql` | Supports merchandising and publish reviews. |
| `set_product_variants_updated_at` | `app.product_variants` | `before` | `update` | `app.set_updated_at()` | Keep SKU edits timestamped. | `0003__catalog.sql` | Variant pricing and availability changes. |
| `set_product_media_updated_at` | `app.product_media` | `before` | `update` | `app.set_updated_at()` | Keep media metadata changes timestamped. | `0003__catalog.sql` | Supports primary-media and alt-text changes. |
| `set_ingredients_updated_at` | `app.ingredients` | `before` | `update` | `app.set_updated_at()` | Keep ingredient storytelling changes timestamped. | `0003__catalog.sql` | Admin ingredient management. |
| `set_inventory_items_updated_at` | `app.inventory_items` | `before` | `update` | `app.set_updated_at()` | Keep stock-state changes timestamped. | `0003__catalog.sql` | Inventory operations foundation. |
| `set_pages_updated_at` | `app.pages` | `before` | `update` | `app.set_updated_at()` | Keep page metadata changes timestamped. | `0004__layout_and_settings.sql` | Stable page registry updates. |
| `set_page_versions_updated_at` | `app.page_versions` | `before` | `update` | `app.set_updated_at()` | Keep draft and publish state changes timestamped. | `0004__layout_and_settings.sql` | Layout publishing foundation. |
| `set_page_sections_updated_at` | `app.page_sections` | `before` | `update` | `app.set_updated_at()` | Keep section edits timestamped. | `0004__layout_and_settings.sql` | Ordered modular layout management. |
| `set_page_section_presentations_updated_at` | `app.page_section_presentations` | `before` | `update` | `app.set_updated_at()` | Keep breakpoint presentation changes timestamped. | `0004__layout_and_settings.sql` | Supports mobile, tablet, and desktop presentation variants. |
| `set_page_section_bindings_updated_at` | `app.page_section_bindings` | `before` | `update` | `app.set_updated_at()` | Keep section binding changes timestamped. | `0004__layout_and_settings.sql` | Tracks featured-product and setting attachments. |
| `set_site_settings_updated_at` | `app.site_settings` | `before` | `update` | `app.set_updated_at()` | Keep operational setting changes timestamped. | `0004__layout_and_settings.sql` | Foundation for bank, delivery, and preview settings. |
| `set_bank_accounts_updated_at` | `app.bank_accounts` | `before` | `update` | `app.set_updated_at()` | Keep bank account metadata current. | `0006__orders_and_payments.sql` | Ensures bank accounts track their `updated_at`. |
| `set_orders_updated_at` | `app.orders` | `before` | `update` | `app.set_updated_at()` | Keep order state transitions timestamped. | `0006__orders_and_payments.sql` | Applies to the order lifecycle tables. |
| `set_payments_updated_at` | `app.payments` | `before` | `update` | `app.set_updated_at()` | Tracks payment state changes for manual review. | `0006__orders_and_payments.sql` | Works with payment queue and proofs. |
| `set_carts_updated_at` | `app.carts` | `before` | `update` | `app.set_updated_at()` | Keeps active-cart state and interaction timestamps authoritative. | `0007__carts.sql` | Supports persistent cart lifecycle without client-only storage. |
| `set_cart_items_updated_at` | `app.cart_items` | `before` | `update` | `app.set_updated_at()` | Keeps quantity mutations timestamped for active carts. | `0007__carts.sql` | Supports cart sync and checkout conversion flows. |
| `set_riders_updated_at` | `app.riders` | `before` | `update` | `app.set_updated_at()` | Keeps rider roster edits timestamped. | `0008__delivery_operations.sql` | Supports assignment-ready rider management. |
| `set_delivery_assignments_updated_at` | `app.delivery_assignments` | `before` | `update` | `app.set_updated_at()` | Keeps dispatch and delivery state changes timestamped. | `0008__delivery_operations.sql` | Supports assignment-aware delivery operations. |
| `set_reviews_updated_at` | `app.reviews` | `before` | `update` | `app.set_updated_at()` | Keeps moderation and featured state changes timestamped. | `0009__reviews.sql` | Supports review queue history and merchandising changes. |
| `set_order_return_cases_updated_at` | `app.order_return_cases` | `before` | `update` | `app.set_updated_at()` | Keeps return/refund case state changes timestamped. | `0014__order_returns.sql` | Covers request, approval, receipt, and refund progression. |
| `audit_profiles_change` | `app.profiles` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records customer profile mutations in the audit ledger. | `0010__audit_and_rls_helpers.sql` | Uses `user_id` as the tracked record key. |
| `audit_addresses_change` | `app.addresses` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records address-book mutations in the audit ledger. | `0010__audit_and_rls_helpers.sql` | Supports customer-address investigations and rollback analysis. |
| `audit_products_change` | `app.products` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records catalog product mutations in the audit ledger. | `0010__audit_and_rls_helpers.sql` | Covers product availability, merchandising, and copy updates. |
| `audit_product_variants_change` | `app.product_variants` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records SKU-level pricing and variant-state mutations. | `0010__audit_and_rls_helpers.sql` | Tracks the default merchandising SKU as well as variant pricing changes. |
| `audit_product_media_change` | `app.product_media` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records catalog media uploads, primary-asset swaps, metadata edits, and removals. | `0013__product_media_admin_support.sql` | Completes audit coverage for admin media management. |
| `audit_inventory_items_change` | `app.inventory_items` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records inventory on-hand and threshold mutations. | `0010__audit_and_rls_helpers.sql` | Uses `variant_id` as the tracked record key. |
| `audit_page_versions_change` | `app.page_versions` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records layout draft/publish lifecycle changes. | `0010__audit_and_rls_helpers.sql` | Captures draft creation and publish/archive transitions. |
| `audit_page_sections_change` | `app.page_sections` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records homepage section copy and state mutations. | `0010__audit_and_rls_helpers.sql` | Supports operational traceability for layout editing. |
| `audit_page_section_presentations_change` | `app.page_section_presentations` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records breakpoint-level layout presentation mutations. | `0012__audit_secondary_mutations.sql` | Covers mobile, tablet, and desktop presentation edits without auditing high-volume runtime tables. |
| `audit_page_section_bindings_change` | `app.page_section_bindings` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records section-to-entity binding changes for featured products and attached content. | `0012__audit_secondary_mutations.sql` | Completes traceability for the layout authoring surface. |
| `audit_site_settings_change` | `app.site_settings` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records site-setting mutations in the audit ledger. | `0010__audit_and_rls_helpers.sql` | Uses `key` as the tracked record key. |
| `audit_bank_accounts_change` | `app.bank_accounts` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records bank transfer configuration changes. | `0010__audit_and_rls_helpers.sql` | Helps trace payment-instruction changes. |
| `audit_orders_change` | `app.orders` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records order-lifecycle mutations in the audit ledger. | `0010__audit_and_rls_helpers.sql` | Complements `order_status_events` with full row snapshots. |
| `audit_payments_change` | `app.payments` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records payment-review and payment-state mutations. | `0010__audit_and_rls_helpers.sql` | Complements `payment_review_events` with full row snapshots. |
| `audit_payment_proofs_change` | `app.payment_proofs` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records payment-proof ingestion and cleanup mutations. | `0010__audit_and_rls_helpers.sql` | Tracks proof uploads and later removals. |
| `audit_riders_change` | `app.riders` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records rider roster mutations. | `0010__audit_and_rls_helpers.sql` | Supports delivery-operations accountability. |
| `audit_delivery_assignments_change` | `app.delivery_assignments` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records assignment, reassignment, and delivery-state mutations. | `0010__audit_and_rls_helpers.sql` | Complements `delivery_events` with row snapshots. |
| `audit_order_return_cases_change` | `app.order_return_cases` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records return/refund case mutations in the audit ledger. | `0014__order_returns.sql` | Keeps return decisions traceable without auditing every event row. |
| `audit_order_return_proofs_change` | `app.order_return_proofs` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records return-proof uploads and removals in the audit ledger. | `0016__order_return_proofs.sql` | Extends the return flow with evidence tracking without overloading event rows. |
| `audit_order_return_case_items_change` | `app.order_return_case_items` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records returned line-item mutations in the audit ledger. | `0018__partial_order_returns.sql` | Keeps full-order and partial-return item selection traceable without relying only on case totals. |
| `audit_review_requests_change` | `app.review_requests` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records review-request creation and completion state changes. | `0012__audit_secondary_mutations.sql` | Keeps the moderation funnel traceable without duplicating the review row itself. |
| `audit_reviews_change` | `app.reviews` | `after` | `insert, update, delete` | `audit.log_row_change()` | Records customer review creation and moderation changes. | `0010__audit_and_rls_helpers.sql` | Complements moderation metadata on the review row. |
