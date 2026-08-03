import { useState, useEffect, useLayoutEffect } from 'react'
import { DESKTOP_MIN, DESKTOP_QUERY, TABLET_PORTRAIT_QUERY, TABLET_REF } from './breakpoints'

// The layout stops zooming once it is 80% larger than the design canvas, then
// locks: on viewports wider than referenceWidth * MAX_SCALE the scale holds at
// MAX_SCALE and the content centers with side gutters instead of growing forever.
export const MAX_SCALE = 1.3

// Three regimes, checked in this order:
//
//   tablet portrait  scale = width / TABLET_REF. The mobile layout lays out on a
//                    locked 560px canvas and zooms to fill the width, so an iPad
//                    gets the phone design's proportions rather than the same
//                    layout stretched thin. Checked FIRST because these
//                    viewports are all >= 768 and would otherwise be read as
//                    desktop.
//   desktop          scale = width / referenceWidth, capped at MAX_SCALE.
//                    Unchanged, DPR guard included.
//   mobile           width / mobileReferenceWidth capped at 1, or a flat 1 for
//                    the sections that never had a mobile reference. Unchanged.
//
// The DPR ratio keeps browser zoom from being double-counted at the desktop
// threshold: window.innerWidth already shrinks under zoom, so comparing the
// raw value against 768 would flip a zoomed-in desktop into the mobile branch.
function computeScale(referenceWidth, mobileReferenceWidth, initialDPR) {
  const width = window.innerWidth

  if (window.matchMedia(TABLET_PORTRAIT_QUERY).matches) return width / TABLET_REF

  const currentDPR = window.devicePixelRatio || 1
  const virtualWidth = width * (currentDPR / initialDPR)
  if (virtualWidth >= DESKTOP_MIN) return Math.min(width / referenceWidth, MAX_SCALE)

  return mobileReferenceWidth ? Math.min(1, width / mobileReferenceWidth) : 1
}

// Locks a design to a `referenceWidth` canvas so the layout zooms uniformly
// instead of reflowing. `mobileReferenceWidth` opts a section into the scaled
// mobile canvas (430 = iPhone 14 Pro Max); omit it to keep a flat scale of 1
// below the desktop breakpoint.
export function useScale(referenceWidth = 1440, mobileReferenceWidth = null) {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return { scale: 1, initialDPR: 1 }
    const dpr = window.devicePixelRatio || 1
    return { scale: computeScale(referenceWidth, mobileReferenceWidth, dpr), initialDPR: dpr }
  })

  useEffect(() => {
    const recompute = () =>
      setState((prev) => ({
        ...prev,
        scale: computeScale(referenceWidth, mobileReferenceWidth, prev.initialDPR),
      }))
    // The media-query listener is not redundant with `resize`: it guarantees a
    // recompute the moment the regime flips, without depending on resize
    // ordering during an iPad rotation.
    const mq = window.matchMedia(TABLET_PORTRAIT_QUERY)
    window.addEventListener('resize', recompute)
    mq.addEventListener('change', recompute)
    return () => {
      window.removeEventListener('resize', recompute)
      mq.removeEventListener('change', recompute)
    }
  }, [referenceWidth, mobileReferenceWidth])

  return state.scale
}

// A CSS transform does not change layout size: a scaled wrapper still occupies
// its *unscaled* height in flow. Sections that size to their content therefore
// reserve ~1/scale of what they actually render, and `overflow: hidden` clips
// the remainder — at tablet zoom that silently ate the last portfolio cards and
// the bottom of the site footer. This measures the wrapper and returns the
// height its parent must reserve. Returns null when disabled (desktop, or scale
// 1) so the caller keeps its CSS height. No feedback loop: the wrapper's width
// is a percentage of the parent's width, which this never touches.
//
// The equivalent logic lives inline in ScaleLock for the sections that use it.
export function useScaledHeight(ref, scale, enabled) {
  const [height, setHeight] = useState(null)

  useLayoutEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return
    const measure = () => setHeight(el.offsetHeight * scale)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, scale, enabled])

  // Derived rather than cleared in the effect: a stale measurement is simply
  // not returned while disabled, which avoids a setState in the effect body.
  return enabled ? height : null
}

// The viewport in px, kept in sync with resize and rotation.
//
// Viewport units are unusable inside a CSS `zoom`ed subtree because the engines
// disagree about them: Blink resolves `100vw` against the raw viewport (so it
// has to be divided by the zoom to come back out at exactly one viewport),
// while WebKit already divides it by the zoom itself. The same
// `calc(100vw / zoom)` therefore renders full-bleed in Chrome and exactly
// 1/zoom of the width in Safari — on an iPad that collapsed the About page's
// full-bleed image into a 430px column. Plain px are canvas-local units in both
// engines, so measuring the viewport here and dividing by the scale in JS is
// the only expression the two agree on.
//
// innerWidth is what `100vw` resolves to (scrollbar included);
// documentElement.clientHeight is what `100vh` resolves to (the large viewport
// on iOS, so it does not jitter as the toolbar collapses).
export function useViewportPx() {
  const [size, setSize] = useState(() =>
    typeof window === 'undefined'
      ? { width: 0, height: 0 }
      : { width: window.innerWidth, height: document.documentElement.clientHeight }
  )

  useEffect(() => {
    const measure = () =>
      setSize({ width: window.innerWidth, height: document.documentElement.clientHeight })
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  return size
}

// True when the desktop layout is showing — the exact complement of the CSS
// `md:` variant, so a component's animation branch (and its scale-wrapper
// geometry) can never disagree with the layout it is applied to. Defaults to
// true during SSR, matching the previous per-component defaults.
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_QUERY).matches : true
  )
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}
