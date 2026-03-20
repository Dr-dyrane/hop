# House of Prax Docs Index

This index keeps the documentation set intentional and discoverable.

The goal is that product, engineering, operations, and database rules are all readable from the repository without needing to reconstruct decisions from cloud consoles or chat history.

---

## Core Planning

- [Platform Bible](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/README_BIBLE.md)
- [Schema Blueprint](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/SCHEMA_BLUEPRINT.md)
- [Implementation Blueprint](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/IMPLEMENTATION_BLUEPRINT.md)
- [End-To-End Flows](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/END_TO_END_FLOWS.md)
- [State Machines](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/STATE_MACHINES.md)
- [Screen Specifications](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/SCREEN_SPECS.md)

## Operations

- [Environment and Vercel](C:/Users/Dyrane/Documents/GitHub/hop/docs/operations/ENVIRONMENT_AND_VERCEL.md)
- [Database Operations](C:/Users/Dyrane/Documents/GitHub/hop/docs/operations/DATABASE_OPERATIONS.md)

## Database Repository Structure

- [Database Readme](C:/Users/Dyrane/Documents/GitHub/hop/db/README.md)
- [RLS Registry](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/rls.md)
- [Functions Registry](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/functions.md)
- [Triggers Registry](C:/Users/Dyrane/Documents/GitHub/hop/db/docs/triggers.md)

## Design Reference

- [Apple HIG Integration Notes](C:/Users/Dyrane/Documents/GitHub/hop/docs/ui/apple_hig_integration.md)

## Historical Feature Notes

- `docs/features/*`
- `docs/fixes/*`
- `docs/bugs/*`

---

## Reading Order

1. Read the Platform Bible for the product and architecture direction.
2. Read the Schema Blueprint for the relational model and domain boundaries.
3. Read the Implementation Blueprint for the migration plan, route contracts, APIs, and permissions.
4. Read the Environment and Vercel document before touching secrets or deployment configuration.
5. Read the Database Operations document before adding any migrations, triggers, functions, or policies.

---

## Maintenance Rules

1. When a new major subsystem is introduced, add it to this index.
2. When a migration introduces a new function, trigger, or RLS policy, update the relevant database registry doc in the same change.
3. The repository is the source of truth. Cloud consoles are deployment surfaces, not documentation systems.
