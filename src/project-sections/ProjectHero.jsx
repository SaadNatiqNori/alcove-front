import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import ornamentSrc from '../assets/projectpagebreak.svg'
import { ScaleLock } from '../ScaleLock'

// Section type: "hero"
// Ornament page-break + serif title + centered lead paragraph.
// Owns its own on-mount entrance animation (above the fold, so no ScrollTrigger).
function ProjectHero({ title, description, ornament = true, project, locked = true, onDark = false }) {
  const rootRef = useRef(null)
  // Use the project's uploaded icon (from the CMS) when set; otherwise the
  // built-in ornament page-break.
  const icon = project?.icon

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const items = rootRef.current?.querySelectorAll('[data-hero-item]') ?? []
      gsap.set(items, { y: 40, opacity: 0 })
      gsap.to(items, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: cubicEase,
        stagger: 0.12,
        delay: 0.15,
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // Top padding rests at the designed 188px on tall screens, then eases up as
  // the viewport shortens (or the browser is zoomed in) so the copy clears the
  // fold-pinned banner box below. clamp floor keeps the logo clear of the fixed
  // navbar at extreme zoom. 100vh is divided by --scale so it stays one real
  // viewport inside the scaled canvas (--scale is set by the wrapping ScaleLock,
  // or by ProjectOpening's scale-wrapper when this hero feeds the opening).
  // tablet: a flat value, not the desktop clamp. iPad renders the mobile
  // composition — copy on top, illustration flowing below — so there is no
  // fold-pinned banner to clear, and no ScaleLock on this path (`locked` is
  // false inside the opening), which would leave `var(--scale)` undefined and
  // silently drop the whole declaration. 176px clears the navbar, which keeps
  // its desktop pill form on an iPad via NAV_DESKTOP_QUERY.
  const cls =
    'px-6 tablet:px-10 md:px-10 pt-[150px] tablet:pt-[176px] md:pt-[clamp(110px,calc(100vh/var(--scale)-668px),188px)]'
  const inner = (
    <div className="mx-auto flex max-w-[900px] flex-col items-center text-center">
        {/* Plain wrapper so the opening scale-reveal can drift the logo +
            title together, independently of the rest of the copy (its own
            transform channel — the children's y belongs to the entrance
            animation above). */}
        <div data-hero-title-wrap>
          {(ornament || icon) && (
            <img
              data-hero-item
              src={icon || ornamentSrc}
              alt=""
              aria-hidden="true"
              className={[
                icon
                  ? 'mx-auto h-[26px] tablet:h-[36px] md:h-[46px] w-auto select-none object-contain'
                  : 'mx-auto h-[46px] w-[88px] select-none',
                // The emblem SVGs use a fixed dark fill (#1C1F2A); on the mobile
                // navy hero, lighten them to mist so they read as the light
                // emblem in the design.
                onDark ? 'brightness-0 invert' : '',
              ].join(' ')}
              draggable="false"
            />
          )}
          <h1
            data-hero-item
          className={`m-0 mt-[20px] tablet:mt-7 md:mt-5 text-[44px] tablet:text-[62px] md:text-[88px] font-normal leading-[1.15] tracking-[-0.03em] ${
              onDark ? 'text-mist' : 'text-[#1C1F2A]'
            }`}
            style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
          >
            {title}
          </h1>
        </div>
        {description && (
          <p
            data-hero-item
            className={`m-0 mt-[20px] tablet:mt-[26px] md:mt-3 max-w-[328px] tablet:max-w-[560px] md:max-w-[631px] text-[13px] tablet:text-[18px] md:text-[16px] leading-[1.25] tracking-[0] ${
              onDark ? 'text-[#E2EAF2]' : 'text-[#black]'
            }`}
          >
            {description}
          </p>
        )}
      </div>
  )

  if (!locked) {
    return (
      <section ref={rootRef} className={cls} aria-label={title}>
        {inner}
      </section>
    )
  }
  return (
    <ScaleLock unlockTablet innerRef={rootRef} className={cls} aria-label={title}>
      {inner}
    </ScaleLock>
  )
}

export default ProjectHero
