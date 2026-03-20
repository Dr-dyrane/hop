# House of Prax State Machines

This document defines the explicit business state machines for the platform.

The goal is to prevent ad hoc state mutation in UI code, background jobs, or admin tools.

Every visible status in the product should map back to a controlled domain state.

Read with:

- [Schema Blueprint](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/SCHEMA_BLUEPRINT.md)
- [Implementation Blueprint](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/IMPLEMENTATION_BLUEPRINT.md)
- [End-To-End Flows](C:/Users/Dyrane/Documents/GitHub/hop/docs/planning/END_TO_END_FLOWS.md)

---

## 1. Modeling Rules

1. `order.status` represents the primary business lifecycle.
2. `payment.status` represents money confirmation lifecycle.
3. `delivery_assignment.status` represents dispatch lifecycle.
4. `review.status` represents trust-content lifecycle.
5. `page_version.status` represents content publishing lifecycle.
6. UI labels may be friendlier than stored statuses, but must map deterministically.
7. All transitions must go through a domain function or service.

---

## 2. Order State Machine

### States

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

### Primary meaning

- `checkout_draft`: pre-order state, not yet placed
- `awaiting_transfer`: order exists, waiting for transfer
- `payment_submitted`: customer says transfer was made
- `payment_under_review`: operator is reviewing proof or payment details
- `payment_confirmed`: operator confirmed transfer
- `preparing`: fulfillment has started
- `ready_for_dispatch`: prepared and waiting for rider assignment or pickup
- `out_for_delivery`: rider is actively delivering
- `delivered`: order fulfilled successfully
- `cancelled`: intentionally stopped
- `expired`: unpaid or otherwise expired before fulfillment

### Allowed transitions

| From | To | Initiator | Reason |
| --- | --- | --- | --- |
| `checkout_draft` | `awaiting_transfer` | system | order created successfully |
| `awaiting_transfer` | `payment_submitted` | customer | proof submitted |
| `awaiting_transfer` | `expired` | system or operator | payment deadline passed |
| `awaiting_transfer` | `cancelled` | operator or admin | order manually cancelled |
| `payment_submitted` | `payment_under_review` | operator | queued for investigation |
| `payment_submitted` | `payment_confirmed` | operator | payment confidently matched |
| `payment_submitted` | `awaiting_transfer` | operator | submission rejected but retry allowed |
| `payment_submitted` | `expired` | system or operator | stale unresolved case |
| `payment_under_review` | `payment_confirmed` | operator | payment matched |
| `payment_under_review` | `awaiting_transfer` | operator | review rejected but retry allowed |
| `payment_under_review` | `expired` | operator | stale unresolved case |
| `payment_confirmed` | `preparing` | operator | fulfillment starts |
| `payment_confirmed` | `cancelled` | admin | exceptional cancellation |
| `preparing` | `ready_for_dispatch` | operator | order packed |
| `preparing` | `cancelled` | admin | exceptional cancellation |
| `ready_for_dispatch` | `out_for_delivery` | dispatcher or system | rider pickup confirmed |
| `ready_for_dispatch` | `cancelled` | admin | exceptional cancellation |
| `out_for_delivery` | `delivered` | rider or dispatcher | completed delivery |
| `out_for_delivery` | `ready_for_dispatch` | dispatcher | reassignment or failed handoff |
| `out_for_delivery` | `cancelled` | admin | exceptional cancellation |

### Forbidden transitions

- `awaiting_transfer` -> `preparing`
- `awaiting_transfer` -> `delivered`
- `payment_confirmed` -> `delivered`
- `expired` -> any active state without explicit reopen flow
- `cancelled` -> any active state without explicit reopen flow

### Customer-facing label mapping

| Internal state | Customer label |
| --- | --- |
| `awaiting_transfer` | Awaiting Payment |
| `payment_submitted` | Payment Submitted |
| `payment_under_review` | Payment Under Review |
| `payment_confirmed` | Payment Confirmed |
| `preparing` | Preparing Order |
| `ready_for_dispatch` | Ready for Dispatch |
| `out_for_delivery` | Out for Delivery |
| `delivered` | Delivered |
| `cancelled` | Cancelled |
| `expired` | Expired |

---

## 3. Payment State Machine

### States

- `awaiting_transfer`
- `submitted`
- `under_review`
- `confirmed`
- `rejected`
- `expired`

### Allowed transitions

| From | To | Initiator | Reason |
| --- | --- | --- | --- |
| `awaiting_transfer` | `submitted` | customer | proof submitted |
| `awaiting_transfer` | `expired` | system or operator | deadline passed |
| `submitted` | `under_review` | operator | manual review started |
| `submitted` | `confirmed` | operator | clear payment match |
| `submitted` | `rejected` | operator | invalid or insufficient payment |
| `submitted` | `expired` | system or operator | stale submission |
| `under_review` | `confirmed` | operator | review completed |
| `under_review` | `rejected` | operator | review rejected |
| `under_review` | `expired` | operator | unresolved timeout |
| `rejected` | `submitted` | customer | customer retries with new proof |

### State coupling with orders

| Payment state | Expected order state |
| --- | --- |
| `awaiting_transfer` | `awaiting_transfer` |
| `submitted` | `payment_submitted` |
| `under_review` | `payment_under_review` |
| `confirmed` | `payment_confirmed` or later |
| `rejected` | `awaiting_transfer` or `expired` |
| `expired` | `expired` |

Senior-engineering rule:

- payment and order transitions should be applied transactionally where possible

---

## 4. Delivery State Machine

### States

- `unassigned`
- `assigned`
- `picked_up`
- `out_for_delivery`
- `delivered`
- `failed`
- `returned`

### Allowed transitions

| From | To | Initiator | Reason |
| --- | --- | --- | --- |
| `unassigned` | `assigned` | dispatcher | rider assigned |
| `assigned` | `picked_up` | rider or dispatcher | handoff confirmed |
| `assigned` | `unassigned` | dispatcher | rider removed or reassigned |
| `picked_up` | `out_for_delivery` | rider or system | movement begins |
| `picked_up` | `assigned` | dispatcher | issue before route start |
| `out_for_delivery` | `delivered` | rider or dispatcher | delivered successfully |
| `out_for_delivery` | `failed` | rider or dispatcher | delivery attempt failed |
| `failed` | `assigned` | dispatcher | retry assignment |
| `failed` | `returned` | dispatcher | returned to origin |

### Order coupling with delivery

| Delivery state | Expected order state |
| --- | --- |
| `unassigned` | `ready_for_dispatch` |
| `assigned` | `ready_for_dispatch` |
| `picked_up` | `out_for_delivery` |
| `out_for_delivery` | `out_for_delivery` |
| `delivered` | `delivered` |
| `failed` | `out_for_delivery` or operational exception |
| `returned` | operational exception |

---

## 5. Review State Machine

### States

- `pending`
- `approved`
- `hidden`

### Allowed transitions

| From | To | Initiator | Reason |
| --- | --- | --- | --- |
| `pending` | `approved` | operator or admin | accepted for display |
| `pending` | `hidden` | operator or admin | rejected or withheld |
| `approved` | `hidden` | operator or admin | later moderation decision |
| `hidden` | `approved` | operator or admin | restored |

### Preconditions

- order must be `delivered`
- one canonical review per order unless explicit edit support exists

---

## 6. Layout Publishing State Machine

### States

- `draft`
- `published`
- `archived`

### Allowed transitions

| From | To | Initiator | Reason |
| --- | --- | --- | --- |
| `draft` | `published` | catalog manager or admin | validation passed and publish triggered |
| `published` | `archived` | system | superseded by newly published version |
| `draft` | `archived` | catalog manager or admin | abandoned version |

### Rules

1. Only one `published` version may exist per page.
2. Publishing a draft archives the previously published version.
3. Draft validation must include section completeness and binding validity.

---

## 7. Cart State Model

Cart state is simpler than the others, but still needs rules.

### States

- `active`
- `checked_out`
- `expired`
- `abandoned`

### Rules

- only one active cart per guest token or signed-in user context
- checked-out carts become immutable historical references
- stale carts can expire by job
- carts with unavailable items remain active but require resolution before checkout

---

## 8. Notification Trigger Matrix

Notifications should be tied to state transitions, not arbitrary UI actions.

| Transition | Notification |
| --- | --- |
| order `checkout_draft` -> `awaiting_transfer` | order created + transfer instructions |
| payment `awaiting_transfer` -> `submitted` | payment submitted acknowledgement |
| payment `submitted` or `under_review` -> `confirmed` | payment confirmed |
| order `payment_confirmed` -> `preparing` | preparing update |
| order `ready_for_dispatch` -> `out_for_delivery` | out for delivery |
| order `out_for_delivery` -> `delivered` | delivered |
| order `delivered` | review request creation |
| layout `draft` -> `published` | optional admin confirmation |

---

## 9. Reopen And Exception Policy

Some states are terminal for normal users but not necessarily terminal for admins.

### Terminal for customers

- `cancelled`
- `expired`
- `delivered`

### Reopen only by admin or explicit recovery flow

- `expired` -> `awaiting_transfer`
- `cancelled` -> `payment_confirmed` or `preparing`
- `failed` delivery -> `assigned`

### Rule

Reopen paths must create:

- audit log
- status event
- operator note

---

## 10. Implementation Guardrails

1. Never mutate multiple lifecycle fields independently in UI components.
2. Never let the UI invent legal transitions.
3. Every transition should produce an event row.
4. Every transition should be testable without rendering a UI.
5. Notification creation should follow transitions, not precede them.

