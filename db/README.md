# Database Repository Guide

This directory will hold the executable database layer for House of Prax.

The intent is to keep schema, policies, functions, triggers, and seeds under version control so the repository remains the primary source of truth.

---

## Intended Structure

```text
db/
  migrations/
  seeds/
  docs/
```

### `migrations/`

Forward-only SQL migrations.

### `seeds/`

Deterministic seed scripts for reference data and initial platform state.

### `docs/`

Implementation registries for:

- row-level security
- database functions
- triggers

---

## Documentation Contract

When a migration introduces:

- a new function: update `db/docs/functions.md`
- a new trigger: update `db/docs/triggers.md`
- a new or changed policy: update `db/docs/rls.md`

For logical model changes, also update:

- `docs/planning/SCHEMA_BLUEPRINT.md`

---

## Operating Rule

The database is not to be reverse-engineered later from AWS.

If it exists in production, it should be represented here:

- schema
- policies
- functions
- triggers
- seeds
- documentation
