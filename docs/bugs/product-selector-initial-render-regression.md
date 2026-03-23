# Product Selector Initial Render Regression

## Summary

In the `shop` section, the 3D model sometimes did not render when the section first entered view. Users had to click a product/category toggle before the model appeared.

## Symptoms

- Entering the `shop` section could show only fallback imagery.
- 3D rendering often appeared only after an interaction (toggle click).
- Console could include `THREE.WebGLRenderer: Context Lost.` during section transitions.

## Root Cause

The issue was a lock/lifecycle mismatch in 3D activation:

1. `ProductSelector` forced `scrollActive = true` instead of using shared scroll state.
2. `ProductSelector` passed a changing `sectionId` (`shop-${productId}`), so every product change looked like a new section owner.
3. In `Product3DViewer`, active cleanup did not release `globalSectionLock` when the active instance unmounted or ownership changed.

This could leave the next viewer blocked by a stale lock until another interaction remounted state.

## Fix Implemented

1. Wired `ProductSelector` to centralized scroll awareness from `HomeClient`.
2. Switched `ProductSelector` to use a stable section id: `sectionId="shop"`.
3. Updated `Product3DViewer` active cleanup to always clear the lock/context ownership on unmount or handoff.

## Files Changed

- `src/components/HomeClient.tsx`
- `src/components/sections/ProductSelector.tsx`
- `src/components/3d/Product3DViewer.tsx`

## Validation

- Lint passed for touched files:
  - `npm run lint -- src/components/HomeClient.tsx src/components/sections/ProductSelector.tsx src/components/3d/Product3DViewer.tsx`
- Behavior check:
  - Scrolling into `shop` renders 3D without requiring toggle clicks.
  - Product toggles continue to switch variants without lock-related stalls.

## Notes

- The `THREE.THREE.Clock` deprecation warnings are separate from this regression and come from dependency internals. They are not the trigger for the render lock behavior fixed above.
