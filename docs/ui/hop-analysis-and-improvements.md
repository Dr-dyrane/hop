# House of Prax Smoothness, Performance, and Experience Guide

This document defines how House of Prax should feel in use.

It is not an external analysis.
It is the internal guide for making marketing, portal, and admin feel immediate, calm, and exact.

Read this with:

- `docs/planning/README_BIBLE.md`
- `docs/planning/UI_IMPLEMENTATION_DOCTRINE.md`
- `docs/planning/SCREEN_SPECS.md`
- `docs/planning/NATIVE_APP_EXECUTION_PLAN.md`

---

## 1. Core Position

Performance is product quality.

If an interaction looks premium but feels late, it is not premium.
If a surface is visually rich but slows task completion, it is wrong for House of Prax.

Smoothness in this repo means:

- the user understands the screen fast
- the next action is obvious
- input is acknowledged immediately
- motion explains change
- loading states preserve trust
- lower-power devices still feel controlled

---

## 2. Non-Negotiables

- one primary purpose per screen
- one dominant action per moment
- immediate acknowledgement for every tap, click, drag, and submit
- state first, decoration second
- no effect earns the right to block clarity
- marketing can be expressive, portal and admin must stay operational
- mobile is not a compressed desktop
- reduced motion and lower-power fallbacks are part of the design, not cleanup work

---

## 3. House of Prax Targets

These are House of Prax targets.

- visual press, hover, and focus response starts within `100ms`
- route and sheet transitions begin immediately and usually settle within `180ms` to `320ms`
- scenic motion can extend to `700ms` only when it is off the critical task path
- interaction-triggered long tasks over `50ms` are treated as bugs
- primary commerce and account routes should target `LCP <= 2.5s` on mobile
- primary routes should target `CLS <= 0.1`
- primary routes should target `INP <= 200ms`
- scroll should feel locked to the finger or wheel; if frame rate drops visibly during normal use, the effect budget is too high

---

## 4. Order Of Priority

When choosing between improvements:

1. remove latency
2. remove confusion
3. reduce copy
4. preserve layout stability
5. simplify state changes
6. refine motion
7. add visual richness last

---

## 5. Surface Rules

### Marketing

- first impression can be cinematic, but comprehension still wins
- `3D`, parallax, and glass are allowed only when they remain smooth on mid-tier mobile
- use image fallbacks and deferred loading for heavy media
- do not stack multiple expensive effects in the same viewport without profiling

### Customer Portal

- the current order state is always the hero
- status, next step, and reassurance appear before history
- copy stays short and state-led
- mobile views should be glanceable within one scroll, not a tower of equal cards

### Admin

- the read pattern is `scan -> identify -> act`
- lists and detail views must feel stable during filters, navigation, and inline updates
- density is acceptable only when hierarchy stays obvious
- decorative motion should be rare; confidence matters more than spectacle

---

## 6. Motion Discipline

Motion exists to explain:

- entrance
- hierarchy
- ownership of focus
- state transition
- success or completion

Do:

- animate `transform` and `opacity` first
- keep standard motion in the existing `180ms / 320ms / 700ms` rhythm
- use motion to soften disclosure and preserve continuity
- honor `prefers-reduced-motion`
- degrade aggressively on touch devices if effects do not hold frame rate

Do not:

- use `transition: all`
- combine blur, scale, scroll-linked transforms, and `3D` on the same hot path by default
- animate large layout shifts when a calmer reveal will do
- make users wait for decorative motion before acting

---

## 7. Glass And Material Discipline

House of Prax already has a liquid-glass system.
Use it with restraint.

Use glass for:

- hero surfaces
- focused call-to-action surfaces
- small moments of premium emphasis
- isolated cards that benefit from depth

Do not use glass for:

- long operational lists
- dense repeated rows
- secondary surfaces that only need tone separation
- any surface that becomes unstable on lower-end devices

When in doubt:

- use surface tone
- use spacing
- use shadow
- use clearer typography
- remove the effect

---

## 8. Repo Implementation Rules

- use the existing semantic tokens and motion tokens before adding new ones
- prefer existing surface primitives and providers over one-off effect systems
- keep page-specific styling local
- heavy presentation features must ship with a fallback path
- if a section depends on pointer tracking or scroll velocity, verify that the touch and reduced-motion versions still feel complete
- if the same effect is repeated across many surfaces, reduce it before optimizing it

---

## 9. Rendering And Loading Rules

- defer `3D` until intent, visibility, or both
- preserve static fallbacks for media-heavy sections
- keep shells mounted through route changes when possible
- avoid client state for static presentation
- avoid re-rendering large trees for pointer or scroll ornament
- preserve space for media, badges, metrics, and async panels to avoid layout jump
- empty, loading, success, and error states must all have deliberate layout

---

## 10. Interaction Rules

- every interactive element must show an immediate press, hover, or focus response
- disabled states must explain whether the user must wait, fill, confirm, or retry
- sheets and drawers must open with immediate context and one obvious action
- submits must not leave the user guessing whether anything happened
- success states should confirm completion and then get out of the way
- error states should be precise, short, and recoverable

---

## 11. Copy Rules

House of Prax voice in product surfaces is:

- short
- calm
- direct
- performance-led
- confident without bragging

Prefer:

- `Awaiting approval.`
- `Proof submitted.`
- `Out for delivery.`
- `Nothing Hidden. Nothing Fake.`
- `Trusted by the Driven.`

Avoid:

- `sophisticated`
- `premium experience`
- `best-in-class`
- long explanatory paragraphs
- praising the interface inside the interface or the docs

Write like the product:

- decisive
- exact
- low-noise

---

## 12. Mobile, Tablet, Desktop

### Mobile

- one thread of attention
- fast scan
- primary action visible early
- secondary context below the fold or behind disclosure

### Tablet

- split emphasis
- list plus preview when useful
- tighter grouping than desktop

### Desktop

- broader context
- stable shell
- supporting panes that do not compete with the main task

A screen is not complete until all three compositions are intentional.

---

## 13. What To Measure Before Merge

Any change touching motion, rendering, navigation, or dense surfaces must be checked against:

- first paint and first meaningful content on mobile
- first scroll through the changed route
- first open of any drawer, sheet, modal, or cart
- first focus and first submit on touched forms
- empty, loading, success, and error states
- reduced motion
- dark and light themes
- touch and pointer input

Use:

- browser performance profiling on throttled mobile settings
- layout-shift inspection
- interaction-timing inspection
- a real phone whenever the change touches scroll, `3D`, sticky UI, or maps

If the team cannot prove a rich effect is smooth, remove or defer it.

---

## 14. Definition Of Done For Smoothness

A route or component is not done until:

- the purpose is obvious within two seconds
- the primary action is obvious without explanation
- interaction feedback feels immediate
- the layout does not jump during load or state change
- motion clarifies instead of delaying
- mobile use feels intentional, not compressed
- the fallback path is calm when motion, `3D`, or heavy effects are unavailable
- the copy is shorter than the first draft
- the route still feels like House of Prax after simplification

---

## 15. Common Failure Patterns

Treat these as regressions:

- decorative motion on the critical checkout or account path
- stacked fixed UI that steals viewport height on mobile
- equal-weight cards that hide the main task
- repeated glass or blur in operational lists
- route headers, page heroes, and helper copy all saying the same thing
- loading states that swap entire layouts after the user starts reading
- long paragraphs where a state label would do
- performance work postponed until after visual polish
- effects that only look good on a fast laptop

---

## 16. Execution Order For Perfection

To move House of Prax closer to perfection, work in this order:

1. remove visible lag from taps, route changes, drawers, and forms
2. shorten copy until state and action are obvious at a glance
3. stabilize shells, placeholders, and loading layouts so nothing jumps
4. simplify mobile compositions before adding more desktop richness
5. reduce effect load on repeated or operational surfaces
6. defer or remove heavy `3D` and scroll effects that do not survive profiling
7. polish motion and material only after the task path is fast and calm

---

## 17. Final Rule

House of Prax should feel inevitable.

The user should not have to think about the interface, wait on the interface, or admire the interface to complete the task.

Clarity, speed, and controlled depth are the product.
