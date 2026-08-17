import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { OrbitSVG, ShieldSVG, CirclesSVG } from './LocationIllustrations'
import { useScale, useIsTabletPortrait, useIsDesktop } from '../useScale'
import { ScaleLock } from '../ScaleLock'

gsap.registerPlugin(ScrollTrigger)

// Shared transition for the accordion body + the +/× icon (same feel).
const EASE = 'cubic-bezier(0.66, 0, 0.34, 1)'
const DURATION = '650ms'
const TRANSITION = (prop) => `${prop} ${DURATION} ${EASE}`

const ILLUSTRATIONS = { orbit: OrbitSVG, shield: ShieldSVG, circles: CirclesSVG }
// Built-in line-art used when an item has no uploaded image; cycles by position.
const ILLUSTRATION_KEYS = ['orbit', 'shield', 'circles']

// Section type: "location"
// Split layout: gold title · per-tab image (slides through the section
// height, fading near the endpoints) · accordion.
function ProjectLocation({ title = 'Location', items = [] }) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(0)
  const didInit = useRef(false)
  const isTablet = useIsTabletPortrait()
  const zoomScale = useScale()
  const scale = isTablet ? 1 : zoomScale

  // Phones collapse the section into a single stacked column: the centre
  // illustration stage is dropped and each item's illustration is shown inline
  // inside its own accordion body instead, with every body open.
  //
  // Tablet portrait is its own third layout (see the `tablet:` rules below) —
  // stacked like the phone, but it keeps the desktop accordion behaviour (one
  // body open at a time, driving a single shared illustration stage that sits
  // under the accordion), so it is excluded here.
  const isPhone = !useIsDesktop() && !isTablet

  // Entrance
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-loc-item]', {
        opacity: 0,
        y: 40,
        duration: 1.1,
        ease: cubicEase,
        stagger: 0.1,
        scrollTrigger: { trigger: rootRef.current, start: 'top 70%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // Shared stage: the active image rests at 0; the others wait far off along
  // the travel axis and fade only as they approach the hide point (delayed
  // fade-out) or the show point (fade-in).
  //
  // Desktop travels vertically — the stage sits beside the accordion, so the
  // deck has the section's full height to move through. Tablet stacks the stage
  // UNDER the accordion in a full-width column, where a vertical slide would
  // run the images up through the copy; there the deck moves sideways instead,
  // across the width it now has to spare. `* 0.8` of the viewport clears the
  // 385px stage from its centred position in both directions, so a waiting
  // image is fully outside the section (which clips) rather than peeking in.
  useLayoutEffect(() => {
    const slides = gsap.utils.toArray('[data-loc-slide]', rootRef.current)
    if (!slides.length) return
    const reduce = prefersReducedMotion()
    const axis = isTablet ? 'x' : 'y'
    const cross = isTablet ? 'y' : 'x'
    const viewport =
      typeof window === 'undefined' ? 900 : isTablet ? window.innerWidth : window.innerHeight
    const travel = (viewport * (isTablet ? 0.8 : 0.6)) / scale
    slides.forEach((el, i) => {
      const offset = (i - open) * travel
      const opacity = i === open ? 1 : 0
      if (reduce || !didInit.current) {
        gsap.set(el, { x: 0, y: 0, [axis]: offset, opacity })
      } else {
        gsap.killTweensOf(el)
        // Zero the other axis so a rotation into or out of tablet portrait
        // leaves no stale offset from the axis that is no longer driven.
        gsap.set(el, { [cross]: 0 })
        gsap.to(el, { [axis]: offset, duration: 0.9, ease: cubicEase })
        // Symmetric fade: the outgoing image fades out as it leaves and the
        // incoming one fades in as it arrives (same delayed feel), so it no
        // longer pops in suddenly while still low in the section.
        gsap.to(el, {
          opacity,
          duration: 0.5,
          delay: 0.3,
          ease: 'power2.out',
        })
      }
    })
    didInit.current = true
  }, [open, scale, isTablet])

  return (
    <ScaleLock
      viewport="min"
      scale={scale}
      innerRef={rootRef}
      bg="bg-[#161A24]"
      className="relative flex items-center overflow-hidden text-mist"
    >
      {/* Tablet uses explicit margins rather than the column `gap`, because its
          two vertical rhythms differ: 40px title→accordion, 170px
          accordion→illustration. */}
      <div className="mx-auto flex w-full max-w-[1720px] flex-col items-start gap-12 tablet:gap-0 px-[16px] tablet:px-[44px] py-[65px] tablet:py-[80px] md:flex-row md:items-center md:justify-between md:gap-0 md:px-[38px] md:py-0">
        {/* Title */}
        <h2
          data-loc-item
          className="m-0 shrink-0 text-[44px] tablet:mb-[40px] md:text-[52px] font-normal leading-[1] tracking-[-0.01em] tablet:tracking-[0] text-[#ECD898]"
          style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
        >
          {title}
        </h2>

        {/* Shared illustration stage — 339×339 on desktop, 385×385 on tablet;
            one line-art illustration per tab slides through it (the section
            clips). `order-1` drops it below the accordion on tablet, where the
            column reads title → accordion → illustration. */}
        <div
          data-loc-item
          className="relative hidden aspect-square w-[300px] shrink-0 tablet:order-1 tablet:mx-auto tablet:mt-[170px] tablet:block tablet:h-[385px] tablet:w-[385px] md:ml-[214px] md:block md:h-[339px] md:w-[339px]"
          aria-hidden="true"
        >
          {items.map((item, i) => {
            const Illustration =
              ILLUSTRATIONS[item.illustration ?? ILLUSTRATION_KEYS[i % 3]]
            return (
              <div
                key={i}
                data-loc-slide
                className="absolute inset-0 flex items-center justify-center will-change-transform"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  Illustration && <Illustration className="h-full w-full" />
                )}
              </div>
            )
          })}
        </div>

        {/* Accordion — 455px cards; the open tab drives the centre illustration */}
        <div className="w-full shrink-0 border-t border-white/12 md:ml-[173px] md:w-[455px]">
          {items.map((item, i) => {
            const isOpen = open === i
            const Illustration =
              ILLUSTRATIONS[item.illustration ?? ILLUSTRATION_KEYS[i % 3]]
            return (
              <div key={item.label} data-loc-item className="border-b border-white/12">
                {/* One item is always open — clicking the open tab is a no-op. */}
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 pt-5 pb-5 text-left"
                >
                  <span
                    className="text-[22px] tablet:text-[24px] md:text-[26px] font-normal leading-[1.15] tracking-[-0.02em] text-[#E8ECF1]"
                    style={{ textBoxTrim: 'trim-both', textBoxEdge: 'cap alphabetic' }}
                  >
                    {item.label}
                  </span>
                  {/* Plus that rotates 45° into a cross — same transition as the tab */}
                  <span
                    className="relative block h-[16.5px] w-[16.5px] shrink-0 text-[#E2EAF2]"
                    style={{
                      transform: `rotate(${isOpen ? 45 : 0}deg)`,
                      transition: TRANSITION('transform'),
                    }}
                  >
                    <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-current" />
                    <span className="absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 bg-current" />
                  </span>
                </button>
                {/* Body copy, plus the per-item illustration that phones show
                    inline. Tablet and desktop both hide the inline copy of the
                    illustration because the shared stage takes over — on
                    desktop beside the accordion, on tablet below it. */}
                <div>
                  <div
                    className="grid"
                    style={{
                      // On a phone every body stays open; tablet and desktop toggle.
                      gridTemplateRows: isPhone || isOpen ? '1fr' : '0fr',
                      transition: TRANSITION('grid-template-rows'),
                    }}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="m-0 max-w-[349px] tablet:max-w-[472px] pt-6 tablet:pt-[13px] pb-7 text-[14px] leading-[1] tablet:leading-[1.25] tracking-[0] text-[#E2EAF2]"
                        style={{ textBoxTrim: 'trim-both', textBoxEdge: 'cap alphabetic' }}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                  <div
                    className="grid tablet:hidden md:hidden"
                    aria-hidden="true"
                    style={{
                      gridTemplateRows: isOpen ? '1fr' : '0fr',
                      transition: TRANSITION('grid-template-rows'),
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="mx-auto flex aspect-square w-[174px] md:w-[300px] max-w-full items-center justify-center pb-8">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          Illustration && <Illustration className="h-full w-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ScaleLock>
  )
}

export default ProjectLocation
