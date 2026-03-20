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
