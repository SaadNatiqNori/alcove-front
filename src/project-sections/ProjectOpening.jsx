import { cloneElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from './motion'
import { useScale, useIsTabletPortrait } from '../useScale'
import { DESKTOP_MIN } from '../breakpoints'

gsap.registerPlugin(ScrollTrigger)

// Opening screen for hero → banner layouts: a 300vh section whose sticky
// 100vh stage plays a scrubbed scale-reveal — the banner box grows upward
// from its resting size until it fills the viewport (radius → 0) while the
// building image scales up and slides to the vertical center, covering the
// hero copy on the way. The scrub is driven by the page's normal Lenis
// smooth scroll, so the reveal progresses continuously, in parallel with
// the browser scroll.
//
// On small screens or with reduced motion, renders the static composition
// (hero on top, banner pinned to the fold) with no scroll stage.
function ProjectOpening({ hero, banner }) {
  const rootRef = useRef(null)
  const heroWrapRef = useRef(null)
  // iPad portrait renders the stage 1:1, matching the hero and banner inside it
  // (both pass ScaleLock's `unlockTablet`). The reveal geometry below is all
  // derived from `scale`, so the whole scrub follows without further changes.
  const isTablet = useIsTabletPortrait()
  const zoomScale = useScale()
  const scale = isTablet ? 1 : zoomScale

  const [cinematic, setCinematic] = useState(
    () => window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches && !prefersReducedMotion()
  )
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`)
    const update = () => setCinematic(mq.matches && !prefersReducedMotion())
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useLayoutEffect(() => {
    if (!cinematic) return
    const ctx = gsap.context(() => {
      const root = rootRef.current
      const box = root.querySelector('[data-banner-box]')
      const img = root.querySelector('[data-banner-img]')
      if (!box) return
      const bannerSection = box.closest('section')

      // The reveal geometry lives inside the scale-wrapper (canvas units), so
      // "viewport" for it is the real viewport divided by scale. Redefining these
      // two helpers makes every downstream use (restBoxH, imgH, the box
      // maxWidth/height targets, the image bottom) reach true full-bleed once
      // scaled back up — no other timeline edits needed.
      const vw = () => window.innerWidth / scale
      const vh = () => window.innerHeight / scale
      // Target image size: large but still contained (art aspect from the
      // loaded file; falls back to the banner's 16/5-ish shape until then).
      const artAspect = () =>
        img && img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : 3.2
      const imgH = () => Math.min(vh() * 0.6, (vw() * 0.9) / artAspect())
      // Resting geometry, derived from the CSS rather than sampled from the
      // DOM: sampling would bake in mid-scrub inline values whenever a
      // ScrollTrigger refresh (resize, late image load) lands while the
      // page is part-way through the animation. Cinematic mode runs ≥768px,
      // which includes iPad portrait — where `md:` does NOT match. The banner
      // therefore carries `tablet:px-10 tablet:mt-[68px]` alongside its md:
      // variants, so these two constants describe the resting CSS in both.
      const sidePad = 40
      const restBoxH = () => (Math.min(1200, vw() - sidePad * 2) * 5) / 16

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      // Choreography (timeline 0 → 1, scrubbed continuously). Width and
      // height grow together over the whole scroll, so the box scales
      // uniformly and reaches full-bleed at the same moment — at the end of
      // the scroll (scrub 1). Padding/margin and corners ease out over the
      // same window so the box can actually reach the viewport edges.
      // The box is w-full clamped by max-width; raising the clamp (rather
      // than setting an explicit width) grows it while keeping the resting
      // 1200px clamp intact when the scrub returns to 0. Every tween uses
      // fromTo with deterministic from-values (see note above).
      tl.fromTo(box, { maxWidth: 1200 }, { maxWidth: vw, duration: 1 }, 0)
      tl.fromTo(box, { height: restBoxH }, { height: vh, duration: 1 }, 0)
      tl.fromTo(
        bannerSection,
        { paddingLeft: sidePad, paddingRight: sidePad, marginTop: 68 },
        { paddingLeft: 0, paddingRight: 0, marginTop: 0, duration: 1 },
        0
      )
      tl.fromTo(box, { borderRadius: 8 }, { borderRadius: 0, duration: 1 }, 0)
      // The hero copy (emblem, title, description) stays completely fixed —
      // no scale, slide, or fade. The opaque banner simply rises over it and
      // covers it. Collapsing the hero wrapper's layout footprint (its content
      // keeps painting through the collapsed box via overflow-visible) is what
      // lets the bottom-pinned banner rise through the stage.
      const heroWrap = heroWrapRef.current
      tl.fromTo(
        heroWrap,
        { height: () => heroWrap.scrollHeight },
        { height: 0, duration: 1 },
        0
      )
      if (img) {
        // The art grows and lifts to the vertical center over the same whole
        // window as the box, so it rides up in step with the uniform scale
        // instead of handing off at a mid-point.
        tl.fromTo(img, { height: 250 }, { height: imgH, duration: 1 }, 0)
        tl.fromTo(
          img,
          { bottom: 0 },
          { bottom: () => (vh() - imgH()) / 2, duration: 1 },
          0
        )
      }

      // The art's natural size feeds the target math — refresh once loaded.
      if (img && !img.complete) {
        img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
      }
    }, rootRef)
    return () => ctx.revert()
  }, [cinematic, scale])

  if (!cinematic) {
    // Mobile/reduced-motion: a compact dark-navy hero — light copy on top with
    // the building illustration flowing directly below it (no scroll stage, and
    // no scale wrapper since scale is 1 below 768px). onDark flips the hero copy
    // and banner to their light-on-navy treatment.
    return (
      <div className="bg-navy">
        {cloneElement(hero, { onDark: true })}
        {cloneElement(banner, { onDark: true })}
      </div>
    )
  }

  return (
    <section ref={rootRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Only the stage content is scaled; the tall outer section and this
            sticky stage stay unscaled so they drive the scroll/pin unchanged.
            The wrapper is one real viewport tall (100/scale vh), and — being a
            transform — it becomes the containing block for the absolutely
            positioned banner, so the banner still pins to the fold. */}
        <div
          className="scale-wrapper"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: `${100 / scale}%`,
            marginLeft: `${(100 - 100 / scale) / 2}%`,
            height: `${100 / scale}vh`,
            '--scale': scale,
          }}
        >
          <div ref={heroWrapRef} className="overflow-visible">
            {hero}
          </div>
          {/* Pinned to the stage bottom (not stacked via mt-auto): the banner box
              grows upward from here, and its bottom — where the illustration's
              ground line sits — stays on the fold at any viewport height or zoom. */}
          <div className="absolute inset-x-0 bottom-0">{banner}</div>
        </div>
      </div>
    </section>
  )
}

export default ProjectOpening
