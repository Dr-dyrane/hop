# Database Operations

This document defines how the Aurora PostgreSQL database is managed from this repository.

The goal is that the repository, not the AWS console, becomes the operating manual for the data layer.

This applies to:

- schema design
- migrations
- indexes
- functions
- triggers
- RLS policies
- seed data
- retention controls

---

## 1. Source Of Truth

The database source of truth is the repository.

That means:

- schema changes are introduced by migrations
- functions are introduced by migrations
- triggers are introduced by migrations
- RLS policies are introduced by migrations
- documentation is updated in the same change as the migration

The AWS console is for infrastructure visibility, not schema authoring.

---

## 2. Repository Layout

The database layer should live under:

```text
db/
  migrations/
  seeds/
  docs/
```

### Expected purpose

- `db/migrations/`: forward-only SQL migrations
- `db/seeds/`: deterministic reference and seed data
- `db/docs/`: implementation-level database registries

Supporting documentation lives in:

- [db/README.md](C:/Users/Dyrane/Documents/GitHub/hop/db/README.md)
- [db/docs/rls.md](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/rls.md)
- [db/docs/functions.md](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/functions.md)
- [db/docs/triggers.md](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/triggers.md)

---

## 3. Migration Rules

### Core rules

1. Migrations are forward-only.
2. Never edit an already-applied migration.
3. One migration should change one coherent concern.
4. Every migration must be idempotent where practical for safety checks.
5. Every migration must have a clear name and ordering prefix.

### Naming format

Recommended format:

```text
0001__enable_extensions.sql
0002__create_identity_tables.sql
0003__create_catalog_tables.sql
0004__create_layout_tables.sql
0005__create_cart_tables.sql
0006__create_order_tables.sql
0007__create_payment_tables.sql
0008__create_delivery_tables.sql
0009__create_review_tables.sql
0010__create_rls_helpers.sql
0011__add_rls_policies.sql
0012__seed_initial_catalog.sql
```

### Review rule

Every migration PR must answer:

- what changed
- why it changed
- what data it impacts
- what docs were updated

---

## 4. RLS Strategy

Aurora PostgreSQL supports native PostgreSQL row-level security, and we should use it intentionally.

### Where RLS should be used

User-owned or user-scoped data:

- `profiles`
- `addresses`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `payments`
- `payment_proofs`
- `review_requests`
- `reviews`

### Where RLS should be considered carefully

Operational tables:

- `delivery_assignments`
- `delivery_events`
- `tracking_points`

These may require role-based admin or rider access patterns rather than simple owner access.

### Policy design rule

RLS policies must be driven by helper functions and request-scoped session values, not copy-pasted raw conditions everywhere.

Recommended session variables:

- `app.user_id`
- `app.role_keys`
- `app.is_guest`

Recommended helper functions:

- `fn__auth__current_user_id()`
- `fn__auth__has_role(role_key text)`

### Documentation rule

Every new RLS policy must be recorded in:

- [db/docs/rls.md](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/rls.md)

---

## 5. Functions And RPCs

In this project, RPCs mean callable database functions where that approach is justified.

### Function policy

Use SQL or PL/pgSQL functions only when they provide one of these:

- transaction-safe domain transitions
- reusable permission helpers
- trigger support
- compact reporting or aggregation

Do not move general application orchestration into database functions without a strong reason.

### Naming format

Recommended:

- `fn__auth__current_user_id`
- `fn__orders__transition_status`
- `fn__payments__expire_stale`
- `fn__layout__publish_version`

### Documentation rule

Every function must be documented in:

- [db/docs/functions.md](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/functions.md)

Document:

- signature
- purpose
- side effects
- caller
- migration that introduced it

---

## 6. Trigger Strategy

Triggers are allowed, but they must stay rare and obvious.

### Good trigger uses

- `updated_at` maintenance
- audit trail insertion
- denormalized counter sync if truly needed
- inventory reservation side effects if fully documented

### Bad trigger uses

- hidden business workflows
- surprising network-style side effects
- large chained logic that should live in application services

### Naming format

Recommended:

- `trg__products__set_updated_at`
- `trg__orders__append_audit_log`

### Documentation rule

Every trigger must be documented in:

- [db/docs/triggers.md](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/triggers.md)

---

## 7. Retention And Anti-Bloat Rules

Remote database bloat must be treated as a design problem, not as something to clean up later.

### Data that should be retained carefully

- `tracking_points`
- `notifications`
- expired `carts`
- expired `order_access_tokens`
- old upload metadata for rejected or abandoned payment proofs

### Proposed retention policy

- expired carts: purge after `30 days`
- expired order access tokens: purge after `30 days`
- high-frequency tracking points: keep full fidelity for `30 days`, then archive or downsample
- notification logs: keep operational history for `90 to 180 days`

### Design rule

If a table is expected to grow quickly, define its retention plan when the table is created.

---

## 8. Seed Data Rules

Seeds must be deterministic and safe to re-run in controlled environments.

### Seed categories

- reference data
- initial roles
- initial catalog
- initial home page version
- initial bank account configuration

### Seed rule

Seed scripts should never contain production secrets.

---

## 9. Database Documentation Workflow

Every data-layer change must update the relevant doc in the same change set.

### Required documentation updates

If you add a function:

- update `db/docs/functions.md`

If you add a trigger:

- update `db/docs/triggers.md`

If you add or change RLS:

- update `db/docs/rls.md`

If you add a new table or major domain:

- update `docs/planning/SCHEMA_BLUEPRINT.md` if the logical model changed

---

## 10. Engineering Checklist

Before merging a migration:

1. Migration name is clear and correctly ordered.
2. The change is modular and domain-scoped.
3. New indexes are justified.
4. Any new function is documented.
5. Any new trigger is documented.
6. Any new RLS policy is documented.
7. Any retention impact is considered.
8. Seed and migration ordering still makes sense.

---

## 11. Non-Negotiable Rules

1. No manual schema changes in AWS as the primary workflow.
2. No undocumented triggers.
3. No undocumented functions.
4. No undocumented RLS policies.
5. No giant catch-all migration files.
6. No JSON blobs standing in for real relational structure.
7. No hidden retention costs.
8. No duplicate schema truth outside the repository.
