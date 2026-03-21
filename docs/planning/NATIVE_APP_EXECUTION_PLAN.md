# House of Prax Native App Execution Plan

This document turns the current UX, product, and operations audit into an execution plan.

It is not a style note.
It is the working plan for making House of Prax feel native across phone, tablet, and desktop while keeping the commerce flow simple and operationally correct.

Read this with:

- `docs/planning/RENDEZVOUS_STATUS.md`
- `docs/planning/END_TO_END_FLOWS.md`
- `docs/planning/UI_IMPLEMENTATION_DOCTRINE.md`
- `docs/ui/apple_hig_integration.md`

Dont make any changes to market page - alreaady perfect.

---

## 1. Product References

Map the platform to one Apple reference app per viewport:

- `phone / native`: Apple Store
- `tablet`: Music
- `desktop`: Mail

Why:

- Apple Store is the closest match for store, bag, order tracking, post-purchase clarity, and premium commerce presentation.
- Music on iPad is the right reference for adaptive navigation, split emphasis, sidebar behavior, and compact context layering.
- Mail is the right reference for admin operations, list-detail rhythm, clear hierarchy, and practical action density.

This repo should not copy those apps literally.
It should copy their discipline:

- obvious hierarchy
- immediate feedback
- reduced explanation
- controlled motion
- deliberate navigation

---

## 2. Current Audit Summary

### Confirmed UI drift

- the mobile shell still carries too much chrome before content
- some portal and admin screens still read like compressed desktop pages
- cart and notification flows still behave more like drawers than native phone sheets
- some token-driven accents are producing theme mismatch behavior, including the reported bottom-nav contrast issue
- long data-entry surfaces were starting to drift into stacked field slabs

### Confirmed architecture truths

- orders and payments must remain separate records
- request-first checkout is the right model for this business
- inventory should block admin acceptance, not customer request creation
- email, in-app notifications, admin notifications, payment proofs, and delivery events should all remain deterministic and milestone-based

### Current theme/token concern

The mobile bottom nav uses semantic tokens correctly, but the reported `white on beige` and `black on green` issue indicates runtime theme-token inconsistency, not a one-off nav styling mistake.

Most likely causes to fix first:

- mixed semantic-token systems
- token drift inside shared controls
- theme hydration or mounted-state inconsistency across shells

Hotspots:

- `src/app/globals.css`
- `src/components/shell/WorkspaceNav.tsx`
- `src/components/ui/ThemeToggle.tsx`

---

## 3. Native Experience Standard

The app should feel like a native app for users, even while it remains web-first.

That means:

- navigation should feel system-like
- actions should respond immediately
- motion should communicate state, not decorate it
- sound and haptic feedback should be purposeful
- push notifications should exist for important milestones
- sheets, lists, detail views, and editing flows should feel calm and touch-first

This does **not** mean:

- turning every screen into an animation demo
- adding sound to every interaction
- sending push or email for every internal state transition

---

## 4. Non-Native Elements To Fix

These are the main non-native behaviors currently visible in the app.

### Navigation

- mobile bottom navigation is a custom dock, not a true tab-bar-like experience
- mobile FAB logic is useful, but the surrounding navigation rhythm is still web-custom rather than Apple-native
- cart and notifications now use bottom-presented sheets on phone, but the surrounding task rhythm still needs refinement

### Shell chrome

- sticky top header + context panel + KPI rails can consume too much mobile height
- sticky bottom save bars plus bottom nav create stacked fixed UI on phone
- some screens open with too much title treatment before reaching the actual task

### Iconography

- Lucide is being used as the primary icon system
- the semantics are not yet mapped to SF Symbols conventions
- some icons are visually correct but not Apple-native in tone, weight, or metaphor

### Feedback

- many interactions still rely on visual state alone
- there is no formal sensory feedback system yet
- push is not yet part of the runtime plan

---

## 5. Mobile Vertical Space Rules

These are now non-negotiable.

### On phone

- do not stack header, context panel, KPI rail, and action bar unless each is essential
- do not spend the first viewport on description and summary before the user can act
- do not let sticky bottom bars fight the bottom nav
- do not render operational desktop cards as tall mobile blocks

Current correction:

- profile and address flows now use compact mobile intros instead of full context panels before the task surface
- order detail now uses a compact phone summary and simpler payment/rating controls instead of leading with desktop-weight chrome
- return request and return-proof flows now use simpler phone controls instead of desktop-style quantity steppers and upload rhythm
- payments, delivery, and portal order history now move into denser desktop layouts earlier so wide screens stop leaving dead space on the trailing edge
- admin order detail, product edit, and layout section edit now open with compact phone summaries instead of desktop-scale workspace headers
- checkout now hides pin-drop and notes behind optional phone-first controls so the primary address task lands earlier
- admin payments now uses compact phone queue cards and full-width action rows instead of a desktop-weight trailing action stack
- portal order history now uses compact phone cards with quieter stats before the open action
- guest confirmation now uses a calmer utility top bar that feels closer to a native handoff surface than a generic web header
- payment, rating, and return feedback now uses quiet inline state pills instead of floating helper copy
- admin users, taxonomy, and settings now use phone-safe composer and save rows instead of desktop-style footer controls
- admin settings and portal profile now use native-style toggle rows for boolean preferences instead of select menus or custom badge buttons
- mobile dock and FAB now honor safe-area spacing, use stronger active-state contrast, and step out cleanly during overlays
- shared context panels now collapse into a tighter phone treatment with horizontal meta strips instead of tall desktop-style grids
- redundant sticky save rails now stay desktop-only where the phone FAB or inline actions already own the primary task
- push remains a future native-web milestone, so the current settings surfaces only expose live email and in-app controls

### Preferred phone rhythm

- title
- one compact status/context strip if needed
- primary list, sheet, editor, or action surface immediately after

### Components to scrutinize

- `src/components/shell/WorkspaceShell.tsx`
- `src/components/shell/WorkspaceContextPanel.tsx`
- `src/components/admin/MetricRail.tsx`
- `src/components/ui/QuietValueStrip.tsx`
- every `sticky bottom-6` action surface across portal and admin

---

## 6. Commerce Data Model Guardrail

Keep the commerce model simple and correct.

### Correct separation

- `order`: customer request, fulfillment identity, operational record
- `payment`: bank transfer settlement record and proof-review record
- `invoice`: document or summary attached to the order lifecycle
- `payment proof`: attachment on the payment lifecycle
- `events`: timeline and audit history

### Do not collapse this incorrectly

Orders should **not** replace payments.

Even for a simple transfer-based ecommerce flow:

- order says what was bought and where it is in fulfillment
- payment says whether money was requested, sent, reviewed, confirmed, rejected, or expired

This keeps:

- reconciliation cleaner
- admin review cleaner
- customer status clearer
- email and notification logic cleaner

---

## 7. End-To-End Product Flow To Harden

This is the flow that must remain simple and fluid.

1. product selection
2. cart drawer checkout
3. guest or signed-in request created
4. admin accepts request
5. transfer details shown on the order
6. customer clicks money sent or uploads proof
7. admin confirms payment
8. admin prepares order
9. admin sends for delivery
10. admin marks delivered

While hardening this flow, always audit:

- create
- read
- update
- delete
- delete warnings
- hidden vs live visibility
- low stock vs out of stock behavior
- product image and model coverage
- notification creation
- payment record creation
- delivery assignment creation
- email handoff

---

## 8. Email Brand System And Lifecycle Design

The email system must be promoted from utility email to brand email.

Current truth:

- the repo already has local brand assets
- the logo mark and wordmark exist in the project
- product images should be obtainable when storage and public media URLs are healthy

Required direction:

- design House of Prax emails with the same visual care as marketing and OG assets
- stop treating email as plain operational text
- use the local brand mark and wordmark as first-class email header assets
- design the layout more like Apple transactional emails: branded top, calm hierarchy, one obvious action, clear supporting details
- use product image blocks when the order/catalog media has a reliable public URL
- use selective secondary prompts to lure customers into the next relevant action only when appropriate

Rules:

- not every email needs cross-sell
- cross-sell belongs only where it does not interfere with the primary task
- receipt, transfer, review, delivery, and reorder emails should each have their own calm template logic
- email should stay deterministic and milestone-based

Implementation targets:

- `src/lib/email/orders.ts`
- `src/components/ui/Logo.tsx`
- `public/images/hero/hop-mark.svg`
- `public/images/hero/hop-wordmark.svg`

Future enhancement:

- if image buckets and public media URLs are healthy, inject per-order product imagery into the email payload
- if an invoice asset is introduced later, attach or link it from the order, not the payment

---

## 9. SF Symbols Adoption Plan

The icon system should move toward SF Symbols semantics.

This does not mean blindly replacing every icon file tomorrow.

It means:

- fetch the latest official SF Symbols reference app and symbol catalog
- define a House of Prax symbol mapping registry
- map current Lucide usage to Apple-native symbol meanings
- prefer Apple-like icon metaphors and weighting in navigation, toolbars, status, and actions

Execution rules:

- use SF Symbols naming and semantic mapping as the source of truth
- use true Apple symbols wherever platform and licensing constraints make sense
- where the web app cannot use native SF Symbols directly, mirror their semantics and visual rhythm with the chosen web icon implementation
- keep icon stroke weight and meaning consistent by context

High-priority symbol surfaces:

- shell navigation
- mobile bottom nav
- top-right utility controls
- order states
- payment states
- delivery states
- admin quick actions

Reference:

- `https://developer.apple.com/sf-symbols/`
- `https://developer.apple.com/design/human-interface-guidelines/sf-symbols`

---

## 10. Native Web Ambition: Push the Web App Toward SwiftUI / React Native Quality

This web app should compete as hard as possible with a SwiftUI or React Native shell.

That means pushing the browser implementation to its practical ceiling.

### Native-web targets

- installable PWA behavior
- real web push notifications for important milestones
- immediate interaction feedback
- richer motion hierarchy
- sheet-first task presentation on phone
- list-detail adaptation on tablet
- stronger desktop workspace behavior
- touch, keyboard, and pointer polish across breakpoints

### Sensory feedback plan

Create a small, deliberate sensory system.

Feedback categories:

- `success`
- `soft confirm`
- `warning`
- `blocked`
- `payment received`
- `delivery started`
- `delivered`

Possible implementation path:

- short generated sound set using mathematical synthesis for a consistent brand tone
- web audio wrappers for deterministic playback
- vibration / haptic fallback where browser support exists
- native shell escalation later if true iOS haptics are required

Rules:

- no noisy UI
- no sound spam
- feedback should reinforce confidence, not demand attention

### Honest platform limit

A web app can become dramatically more native-feeling.
It still will not fully equal native iOS feedback, notification, and haptic behavior in every environment.

So the target is:

- make the web app good enough that a native shell is optional, not mandatory
- leave the door open for a future SwiftUI or React Native shell if the business later needs deeper platform integration

---

## 11. Execution Order

Implement in this order.

### Wave 1. Token and shell correction

1. fix theme-token inconsistency and nav contrast bugs
2. normalize shared semantic tokens across shell controls
3. remove non-native header and footer density on phone

### Wave 2. Mobile native behavior

1. convert phone task drawers into bottom-sheet behavior where appropriate
2. tighten bottom navigation rhythm
3. reduce stacked fixed UI on forms and operational pages

### Wave 3. Product and commerce hardening

Status:

- complete for the current code scope
- admin request acceptance now shows stock readiness before accept
- local guest and signed-in request-flow verification passes end to end
- deployed smoke remains a release check, not a code-completion blocker

1. complete product-management audit
2. show low-stock and blocked-acceptance signals before admin taps accept
3. finish product CRUD warnings and delete/archive safety
4. run end-to-end guest and signed-in smoke tests again

### Wave 4. Messaging and sensory layer

1. redesign lifecycle emails
2. add deterministic push plan
3. add sound, motion, and feedback system

### Wave 5. Native icon and platform polish

1. build SF Symbols mapping registry
2. replace or realign icon semantics across app surfaces
3. use what is learned from phone work to improve tablet and desktop behavior

---

## 12. Audit Checklist For Every Pass

Before shipping any UI or flow change, ask:

1. Does this feel like a native task surface or a responsive webpage?
2. Is the first mobile viewport useful immediately?
3. Is the primary action obvious?
4. Is the feedback immediate?
5. Is the state model truthful?
6. Are notifications and emails milestone-based?
7. Are product, payment, and delivery records separated correctly?
8. Is deletion safe and clearly warned?
9. Is iconography semantically consistent?
10. Does this improve phone first, then tablet, then desktop?

---

## 13. Apple References

Use only official Apple material as the design authority for this pass.

- Human Interface Guidelines: `https://developer.apple.com/design/human-interface-guidelines/`
- Managing notifications: `https://developer.apple.com/design/human-interface-guidelines/managing-notifications`
- SF Symbols: `https://developer.apple.com/sf-symbols/`
- SF Symbols guidance: `https://developer.apple.com/design/human-interface-guidelines/sf-symbols`
- Symbols framework: `https://developer.apple.com/documentation/symbols/`
- Core Haptics: `https://developer.apple.com/documentation/CoreHaptics`
- Design tips: `https://developer.apple.com/design/tips/`
- Adaptive navigation reference: `https://developer.apple.com/videos/play/wwdc2022/10001/`

This plan should be updated alongside implementation, not after it.
