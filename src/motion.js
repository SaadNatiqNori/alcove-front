import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cubicEase } from './easings'

gsap.registerPlugin(ScrollTrigger)

// Returns true when the user (or environment) requests reduced motion.
// Section entrance animations early-return on this so content renders
// immediately — an accessibility win, and it keeps static rendering correct.
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

// Shared timing for the page's on-load entrance. The navbar (sliding down from
// above the top edge) and the hero wordmark (sliding up from below the bottom
// edge) both run these values from their own useLayoutEffect. Both components
// mount in the same React commit, so the tweens are created on the same GSAP
// tick and travel in lockstep — one motion, opening from both edges at once.
export const HERO_INTRO = { duration: 1.3, delay: 0.2, ease: cubicEase }

// Travel distance needed to park an element just outside a viewport edge, so it
// slides in from off-screen instead of out of a clipping box.
//
// The value is returned in the element's own untransformed coordinate space: a
// CSS scale on an ancestor multiplies whatever a transform translates, and both
// the header and the hero sit inside scale-locked wrappers. Dividing by the
// measured-vs-layout height ratio cancels that cumulative scale back out, so the
// element lands exactly at the edge whatever the current zoom lock is.
//
// Measure before applying any transform — these read live layout geometry.
const cumulativeScale = (el) => {
  const laidOut = el.offsetHeight
  return laidOut ? el.getBoundingClientRect().height / laidOut : 1
}

// Positive y: pushes the element down until its top edge clears the bottom.
export const offscreenBelow = (el, buffer = 8) =>
  (window.innerHeight - el.getBoundingClientRect().top + buffer) /
  cumulativeScale(el)

// Negative y: pulls the element up until its bottom edge clears the top.
export const offscreenAbove = (el, buffer = 8) =>
  -(el.getBoundingClientRect().bottom + buffer) / cumulativeScale(el)

// House reveal values, matching the on-load entrances on the About and Contact
// pages. Keep these in sync if the site's motion language changes.
export const REVEAL = {
  y: 40,
  duration: 1.2,
  stagger: 0.1,
  start: 'top 80%',
  // Applied only to the batch already on screen at load, so a page opens the
  // same way About and Contact do. Reveals reached by scrolling stay immediate
  // — a delay there would read as lag, not composure.
  loadDelay: 0.2,
}

/**
 * Staggered "one by one" scroll reveal.
 *
 * Returns a ref to attach to the section root. Inside it, mark each element
 * that should fade+rise into place with `data-reveal`. Wrapping a subset in a
 * `data-reveal-group` container gives that group its own trigger, so a tall
 * section doesn't fire every item the moment its top edge crosses.
 *
 *   const rootRef = useRevealOnScroll([items.length])
 *   <section ref={rootRef}>
 *     <div data-reveal>…</div>
 *     <div data-reveal>…</div>
 *   </section>
 *
 * `deps` must include whatever makes the marked elements appear — CMS content
 * arrives after the first paint, and a reveal that initialises against an empty
 * subtree would leave the real content stuck at opacity 0.
 *
 * Pass `{ each: true }` when items are tall enough to each own a screenful (a
 * stacked mobile layout): every item then triggers off itself as it scrolls in,
 * rather than the group firing together off a shared trigger.
 */
export function useRevealOnScroll(deps = [], options = {}) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return

    const { y, duration, stagger, start, loadDelay, each } = {
      ...REVEAL,
      ...options,
    }

    // A trigger already inside the start threshold when the page mounts will
    // fire straight away — that batch is the page's on-load entrance and takes
    // the delay. Measured once here, before any tween shifts the layout.
    const onScreenAtLoad = (el) =>
      el.getBoundingClientRect().top < window.innerHeight * 0.8

    const ctx = gsap.context(() => {
      // Each item belongs to its nearest enclosing group, which supplies the
      // trigger; items outside every group trigger off the section root. Going
      // by nearest (rather than any) ancestor keeps nested groups from
      // animating the same item twice.
      const groups = gsap.utils.toArray('[data-reveal-group]', root)
      const owner = (el) => {
        const group = el.parentElement?.closest('[data-reveal-group]')
        return group && root.contains(group) ? group : root
      }
      const byOwner = new Map([[root, []], ...groups.map((g) => [g, []])])
      gsap.utils
        .toArray('[data-reveal]', root)
        // A re-run (CMS content replacing the fallback) must not pull already
        // revealed elements back to invisible. The flag lives on the DOM node,
        // so nodes React genuinely recreates for the new content still animate.
        .filter((el) => !el.dataset.revealed)
        .forEach((el) => byOwner.get(owner(el))?.push(el))

      const reveal = (items, trigger) => {
        if (!items.length) return
        // In `each` mode the scroll position itself supplies the rhythm, so the
        // items animate identically off their own triggers with no stagger.
        const targets = each ? items.map((el) => [el, el]) : [[items, trigger]]
        targets.forEach(([target, ownTrigger]) => {
          gsap.from(target, {
            opacity: 0,
            y,
            duration,
            delay: onScreenAtLoad(ownTrigger) ? loadDelay : 0,
            stagger: each ? 0 : stagger,
            ease: cubicEase,
            // Flag on completion, not on trigger-enter: an effect torn down
            // mid-flight (StrictMode's double mount, a fast CMS response) must
            // leave no flag behind, or the re-run would skip the animation and
            // the content would simply appear.
            onComplete: () =>
              (each ? [ownTrigger] : items).forEach(
                (el) => (el.dataset.revealed = '1')
              ),
            scrollTrigger: { trigger: ownTrigger, start, once: true },
          })
        })
      }

      byOwner.forEach((items, trigger) => reveal(items, trigger))
    }, root)

    // Content that lands after mount (CMS fetches, images) shifts every
    // trigger's start position; recompute once the new markup is measured.
    ScrollTrigger.refresh()

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return rootRef
}
