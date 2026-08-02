// Single source of truth for the layout breakpoints. Imported by both
// tailwind.config.js (which turns these into the `md:`/`lg:` variants) and the
// JS scale/branch logic, so CSS and JS can never disagree about which layout a
// given viewport is showing.

// Tailwind's historical `md:` value. Still the phone/desktop divider.
export const DESKTOP_MIN = 768

// Locked design-canvas width for tablet portrait. The mobile layout lays out
// against this width and is then zoomed to fill the physical viewport, so the
// proportions are fixed by design instead of by the device's width. Lower =
// more zoom, narrower effective content column. This is the tuning knob.
//
// It is deliberately identical to the mobile design canvas (the 430px iPhone
// 14 Pro Max reference the mobile layout is authored against). Anything else
// silently rescales every hard-coded value: at 560 the footer's 553px strip
// covered only 69% of the stage, fixed illustrations left slack, and the type
// read ~23% small — all of it the 430:560 ratio showing through. Keeping the
// two equal means an iPad renders the phone design exactly, just larger, and
// future mobile work needs no tablet counterpart.
export const TABLET_REF = 430

// iPad mini (768), Air (820), Pro 11" (834) and Pro 12.9" (1024) in portrait.
// `orientation` is load-bearing: width alone cannot separate iPad mini
// LANDSCAPE (1024x768) from iPad Pro 12.9" PORTRAIT (1024x1366) — both are
// 1024px wide. `pointer: coarse` keeps every laptop and desktop out, however
// the user resizes their window.
export const TABLET_PORTRAIT_QUERY =
  `(min-width: ${DESKTOP_MIN}px) and (max-width: 1024px) and (orientation: portrait) and (pointer: coarse)`

// "Show the desktop layout." Deliberately a comma-separated OR list rather than
// `(min-width: 768px) and (not (...))`: if an older iPadOS Safari rejected the
// Level 4 `not()`, the entire query would be invalid, `md:` would never match,
// and EVERY screen would fall back to the mobile layout. This form uses only
// universally supported syntax, so its worst case is a wrong breakpoint on one
// device rather than a broken site everywhere.
export const DESKTOP_QUERY =
  `(min-width: 1025px), (min-width: ${DESKTOP_MIN}px) and (orientation: landscape), (min-width: ${DESKTOP_MIN}px) and (pointer: fine)`

// The exact complement of DESKTOP_QUERY — "show the mobile layout" — written as
// the union of its two disjoint cases (phones, then tablet portrait) so it needs
// no `not()` either. Tailwind cannot derive a `max-md:` variant from a `raw`
// screen, because there is no min-width for it to invert: without this the
// `max-md:` utilities silently vanish from the stylesheet. Registered as an
// explicit variant by the plugin in tailwind.config.js.
export const MOBILE_QUERY =
  `(max-width: ${DESKTOP_MIN - 1}px), ${TABLET_PORTRAIT_QUERY}`

// Tailwind's `lg:` (min-width: 1024px) ANDed with DESKTOP_QUERY, distributed
// over the OR list. Without this, iPad Pro 12.9" portrait (1024px wide) would
// match `lg:` while failing `md:` — a layout that exists nowhere in the design.
export const LG_QUERY =
  `(min-width: 1025px), (min-width: 1024px) and (orientation: landscape), (min-width: 1024px) and (pointer: fine)`
