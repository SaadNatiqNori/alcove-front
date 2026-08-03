import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { ScaleLock } from '../ScaleLock'

gsap.registerPlugin(ScrollTrigger)

// Section type: "banner"
// Full-width media block with a dark overlay (premium/moody treatment).
// `image` is a resolved URL (CMS field); renders a plain dark block if absent.
// Owns its own scroll-triggered reveal.
function ProjectBanner({
  image,
  alt = '',
  aspect = '16 / 5',
  overlay = 0.72,
  locked = true,
  onDark = false,
}) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        opacity: 0,
        y: 48,
        duration: 1.3,
        ease: cubicEase,
        scrollTrigger: { trigger: rootRef.current, start: 'top 88%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // On the mobile navy hero (onDark), the box blends into the navy wrapper, so
  // drop the letterbox crop and render the whole building in-flow at its natural
  // height with a small (~16px) side margin, per the design.
  const inner = onDark ? (
    <div ref={rootRef} data-banner-box className="mx-auto w-full max-w-[1200px]">
      {image && (
        <img src={image} alt={alt} data-banner-img className="block h-auto w-full" />
      )}
    </div>
  ) : (
    <div
      ref={rootRef}
      data-banner-box
      className="relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-[8px] bg-navy"
      style={{ aspectRatio: aspect }}
    >
      {image && (
        <img
          src={image}
          alt={alt}
          data-banner-img
          // Fixed 8vw side inset so the art never runs flush to the edges
          // once the box goes full-bleed. Divided by --scale so it stays a
          // constant 8% of the real viewport inside the scaled canvas. Within
          // the resting letterbox slack so the small banner is unaffected.
          className="absolute bottom-0 left-0 h-[250px] w-full px-[calc(8vw/var(--scale))] object-contain object-bottom"
        />
      )}
    </div>
  )

  // tablet takes the desktop px-10 / mt-[68px] rather than the phone values, so
  // the opening reveal's from-values (sidePad 40, marginTop 68 — see
  // ProjectOpening) describe the real resting geometry there too. Before this
  // they did not: `md:` does not match on tablet portrait, so the CSS was
  // px-6/mt-[52px] while the timeline forced 40/68 inline at scrub 0.
  const cls = onDark
    ? 'px-[16px] mt-[72px] pb-[104px]'
    : 'px-6 tablet:px-10 md:px-10 mt-[52px] tablet:mt-[68px] md:mt-[68px]'
  if (!locked) {
    return <section className={cls}>{inner}</section>
  }
  return (
    <ScaleLock unlockTablet className={cls}>
      {inner}
    </ScaleLock>
  )
}

export default ProjectBanner
