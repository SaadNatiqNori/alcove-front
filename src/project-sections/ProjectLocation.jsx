import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { OrbitSVG, ShieldSVG, CirclesSVG } from './LocationIllustrations'
import { useScale, useIsTabletPortrait } from '../useScale'
import { ScaleLock } from '../ScaleLock'
import { DESKTOP_MIN } from '../breakpoints'

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

  // Below 768px the layout collapses into a single stacked column: the centre
  // illustration stage is dropped and each item's illustration is shown inline
  // inside its own accordion body instead.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && !window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`)
    const update = () => setIsMobile(!mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

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

  // Centre image: the active image rests at y:0; the others wait far above /
  // below — travelling across the whole section height — and fade only as they
  // approach the hide point (delayed fade-out) or the show point (fade-in).
  useLayoutEffect(() => {
    const slides = gsap.utils.toArray('[data-loc-slide]', rootRef.current)
    if (!slides.length) return
    const reduce = prefersReducedMotion()
    const travel = ((typeof window !== 'undefined' ? window.innerHeight : 900) * 0.6) / scale
    slides.forEach((el, i) => {
      const y = (i - open) * travel
      const opacity = i === open ? 1 : 0
      if (reduce || !didInit.current) {
        gsap.set(el, { y, opacity })
      } else {
        gsap.killTweensOf(el)
        gsap.to(el, { y, duration: 0.9, ease: cubicEase })
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
  }, [open, scale])

  return (
    <ScaleLock
      viewport="min"
      scale={scale}
      innerRef={rootRef}
      bg="bg-[#161A24]"
      className="relative flex items-center overflow-hidden text-mist"
    >
      <div className="mx-auto flex w-full max-w-[1720px] flex-col items-start gap-12 tablet:gap-10 px-[16px] tablet:px-[38px] py-[65px] tablet:py-[80px] md:flex-row md:items-center md:justify-between md:gap-0 md:px-[38px] md:py-0">
        {/* Title */}
        <h2
          data-loc-item
          className="m-0 shrink-0 text-[44px] tablet:text-[37px] md:text-[52px] font-normal leading-[1] tracking-[-0.01em] text-[#ECD898]"
          style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
        >
          {title}
        </h2>

        {/* Centre illustration stage — 339×339; one line-art illustration
            per tab slides through it (the section clips). */}
        <div
          data-loc-item
          className="relative hidden aspect-square w-[300px] shrink-0 md:ml-[214px] md:block md:h-[339px] md:w-[339px]"
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
                    className="text-[22px] tablet:text-[19px] md:text-[26px] font-normal leading-[1.15] tracking-[-0.02em] text-[#E8ECF1]"
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
                <div
                  className="grid"
                  style={{
                    // On mobile every body stays open; on desktop it toggles.
                    gridTemplateRows: isMobile || isOpen ? '1fr' : '0fr',
                    transition: TRANSITION('grid-template-rows'),
                  }}
                >
                  <div className="overflow-hidden">
                    <p
                      className="m-0 max-w-[349px] tablet:max-w-[560px] pt-6 pb-7 text-[14px] tablet:text-[16px] leading-[1] tablet:leading-[1.35] tracking-[0] text-[#E2EAF2]"
                      style={{ textBoxTrim: 'trim-both', textBoxEdge: 'cap alphabetic' }}
                    >
                      {item.body}
                    </p>
                  </div>
                </div>
                {/* Mobile-only: the illustration lives inside the open item's
                    body (the centre stage is hidden below 768px). */}
                <div
                  className="grid md:hidden"
                  aria-hidden="true"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: TRANSITION('grid-template-rows'),
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="mx-auto flex aspect-square w-[174px] tablet:w-[241px] md:w-[300px] max-w-full items-center justify-center pb-8">
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
            )
          })}
        </div>
      </div>
    </ScaleLock>
  )
}

export default ProjectLocation
