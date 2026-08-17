import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ArrowIcon from '../ArrowIcon'
import { cubicBezier, cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { ScaleLock } from '../ScaleLock'
import { useIsDesktop } from '../useScale'

gsap.registerPlugin(ScrollTrigger)

// Built-in line-art (front view) shown when a slide has no uploaded illustration.
// Stroke uses currentColor so the section's text colour drives it.
function CarIllustration({ className }) {
  return (
    <svg
      viewBox="0 0 520 340"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M170 150 Q178 96 230 92 L290 92 Q342 96 350 150" />
      <path
        d="M192 150 Q200 110 236 107 L284 107 Q320 110 328 150"
        strokeDasharray="2.5 3"
        opacity="0.55"
      />
      <path d="M70 250 Q70 175 120 165 L170 150 L350 150 L400 165 Q450 175 450 250" />
      <line x1="72" y1="206" x2="448" y2="206" opacity="0.45" />
      <path d="M92 180 Q110 176 130 183" />
      <path d="M390 183 Q410 176 428 180" />
      <g strokeDasharray="2.5 3" opacity="0.55">
        <line x1="236" y1="186" x2="236" y2="236" />
        <line x1="249" y1="186" x2="249" y2="236" />
        <line x1="262" y1="186" x2="262" y2="236" />
        <line x1="275" y1="186" x2="275" y2="236" />
        <line x1="288" y1="186" x2="288" y2="236" />
      </g>
      <path d="M170 150 L150 158" />
      <path d="M350 150 L370 158" />
      <line x1="70" y1="250" x2="450" y2="250" />
      <path d="M95 250 L95 286 Q95 293 102 293 L150 293 Q157 293 157 286 L157 250" />
      <path d="M363 250 L363 286 Q363 293 370 293 L418 293 Q425 293 425 286 L425 250" />
      <path
        d="M101 250 L101 283 Q101 288 106 288 L146 288 Q151 288 151 283 L151 250"
        strokeDasharray="2.5 3"
        opacity="0.45"
      />
      <path
        d="M369 250 L369 283 Q369 288 374 288 L414 288 Q419 288 419 283 L419 250"
        strokeDasharray="2.5 3"
        opacity="0.45"
      />
    </svg>
  )
}

// Every animatable piece carries `data-anim` and moves freely — no per-element
// clipping boxes, so nothing gets visibly cut mid-motion. The copy column is
// anchored to the top of the stage (whose height is equalized across slides),
// so the heading sits at the same y on every slide; the illustration column is
// vertically centered on the stage's center line, which is also constant.
function Slide({ heading, bodyLeft, bodyRight, image }) {
  return (
    <div className="h-full w-full px-[16px] tablet:px-[38px] md:px-24">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 tablet:gap-[60px] md:h-full md:grid-cols-2 md:gap-16">
        {/* Copy — flows from the stage top so the title position never shifts */}
        <div>
          <div className="relative pt-[6px] pb-1 md:pt-[9px]">
            {/* The accent line rides a black backdrop that extends past it on
                both sides and is layered ABOVE the heading. On a slide change
                the heading slides horizontally UNDER this backdrop, so it's
                occluded at the line instead of visibly passing across it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 -translate-x-10 bg-black md:w-14 md:-translate-x-12"
            >
              <span className="absolute inset-y-0 left-10 w-px bg-white/40 md:left-12" />
            </div>
            <h2
              data-anim
              className="m-0 whitespace-pre-line pl-6 tablet:pl-8 md:pl-8 text-[34px] tablet:text-[46px] md:text-[52px] font-normal leading-[1.05] tracking-[-0.01em] text-mist"
              style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
            >
              {heading}
            </h2>
          </div>

          {(bodyLeft || bodyRight) && (
            <div className="mt-10 tablet:mt-12 md:mt-14 grid max-w-[580px] grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10 pl-0 tablet:pl-8 md:pl-8">
              {bodyLeft && (
                <p
                  data-anim
                  data-anim-speed="1.2"
                  className="m-0 text-[15px] tablet:text-[19px] md:text-[15px] leading-[1.2] tracking-[0] text-[#E2EAF2]"
                >
                  {bodyLeft}
                </p>
              )}
              {bodyRight && (
                <p
                  data-anim
                  data-anim-speed="1.2"
                  data-anim-shift="1.5"
                  className="m-0 text-[15px] tablet:text-[19px] md:text-[15px] leading-[1.2] tracking-[0] text-[#E2EAF2]"
                >
                  {bodyRight}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Illustration — centered on the stage's fixed center line. iPad runs
            this section unlocked (1:1 CSS px), so it gets its own width rather
            than the phone canvas's 187. */}
        <div className="flex items-center justify-center md:justify-end">
          <div
            data-anim
            data-anim-speed="1.1"
            className="w-full max-w-[187px] tablet:max-w-[290px] md:max-w-[273px]"
          >
            {image ? (
              <img
                src={image}
                alt=""
                aria-hidden="true"
                className="w-full select-none"
                draggable="false"
              />
            ) : (
              <CarIllustration className="w-full text-mist" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


const SHIFT = 80 // px each element travels (within its own box) on a slide change
const EXIT_EASE = cubicBezier(0.55, 0, 1, 0.54) // level 1: accelerating exit (quicker take on Figma's 0.66, 0, 1, 0.54)
const ENTER_EASE = cubicBezier(0, 0.51, 0.39, 1) // level 3: decelerating entrance
const CUT_HOLD = 0.001 // level 2: Figma's "After delay 1ms" before the instant cut
const BASE_DUR = 0.5 // s — Figma's 500ms; each element multiplies it by its own speed

// Per-element motion control on [data-anim] elements:
// `data-anim-speed` scales the base 500ms (1 = base, 1.4 = 40% slower);
// `data-anim-shift` scales the base 80px travel (1 = base, 1.5 = 120px), so
// two elements with equal timing can cover different distances.
const speedOf = (el) => Number(el.dataset.animSpeed) || 1
const shiftOf = (el) => Number(el.dataset.animShift) || 1

// Section type: "showcase"
// Full-bleed black slider. Manual only (drag + dots). Slide changes replay the
// Figma match-cut prototype: (1) the outgoing slide smart-animates out — 500ms,
// bezier(0.66, 0, 1, 0.54); (2) after a 1ms delay an instant variant change
// swaps to the incoming slide at its entrance offset (the cut); (3) the
// incoming slide smart-animates into place — 500ms, bezier(0, 0.51, 0.39, 1).
// The exit ends at full speed and the entrance starts at full speed, so motion
// reads as continuous across the cut. Elements move freely (no per-element
// clipping). All slides stay mounted, stacked in one grid cell, so the stage
// height is always the tallest slide's — nothing shifts vertically on a swap.
function ProjectShowcase({ slides = [] }) {
  const rootRef = useRef(null)
  const stageRef = useRef(null) // the drag/wheel surface holding the slide stack
  const layersRef = useRef([]) // one wrapper per slide, all stacked in one grid cell
  const drag = useRef({ x: 0, active: false })
  const dir = useRef(1) // 1 = forward (out-left / in-right), -1 = backward
  const [current, setCurrent] = useState(0) // stable slide when idle
  const [transition, setTransition] = useState(null) // { from, to } while animating
  const count = slides.length

  // On anything but desktop the section drops the 100vh floor and sizes to its
  // content, so there's no large empty gap above/below the centered slide.
  // DESKTOP_QUERY, not a bare max-width:767 check — the latter left iPads on the
  // desktop floor while their layout was already stacked.
  const isMobile = !useIsDesktop()

  // Latest-value refs so the native wheel listener (bound once) reads live state
  // instead of the values captured when it was attached.
  const currentRef = useRef(0)
  const transitionRef = useRef(null)
  useEffect(() => {
    currentRef.current = current
    transitionRef.current = transition
  })

  // One-time scroll-in reveal for the whole section.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-showcase-reveal]', {
        opacity: 0,
        y: 40,
        duration: 1.2,
        ease: cubicEase,
        scrollTrigger: { trigger: rootRef.current, start: 'top 72%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // Drive a slide change as a match cut: the outgoing elements accelerate out
  // (level 1), the incoming slide cuts in instantly at its entrance offset
  // after a 1ms hold (level 2), then decelerates into place (level 3). State
  // resets from the timeline's onComplete.
  useLayoutEffect(() => {
    if (!transition) return
    const toLayer = layersRef.current[transition.to]
    const fromLayer = layersRef.current[transition.from]
    if (!toLayer) return
    const { to } = transition
    const reduce = prefersReducedMotion()
    const d = dir.current

    const inEls = gsap.utils.toArray('[data-anim]', toLayer)
    const outEls = fromLayer ? gsap.utils.toArray('[data-anim]', fromLayer) : []

    // The incoming slide waits hidden at its entrance offset (per-element
    // travel distance) — set before paint so it can't flash under the outgoing
    // layer. The instant cut (level 2) is the moment the entrance tween below
    // begins.
    gsap.set(
      inEls,
      reduce
        ? { x: 0, autoAlpha: 1 }
        : { x: (i, el) => SHIFT * shiftOf(el) * d, autoAlpha: 0 }
    )

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrent(to)
        setTransition(null)
      },
    })
    // Level 1 — smart animate, bezier(0.66, 0, 1, 0.54): outgoing exits. All
    // elements start together; each runs at its own speed (data-anim-speed)
    // over its own distance (data-anim-shift).
    outEls.forEach((el) => {
      tl.to(
        el,
        {
          x: -SHIFT * shiftOf(el) * d,
          autoAlpha: 0,
          duration: reduce ? 0 : BASE_DUR * speedOf(el),
          ease: EXIT_EASE,
        },
        0
      )
    })
    // Level 2 — the cut: 1ms after the slowest exit finishes.
    const cutAt = reduce ? 0 : BASE_DUR * Math.max(1, ...outEls.map(speedOf)) + CUT_HOLD
    // Level 3 — from the cut, incoming elements settle into place with
    // bezier(0, 0.51, 0.39, 1), again each at its own speed.
    inEls.forEach((el) => {
      tl.to(
        el,
        {
          x: 0,
          autoAlpha: 1,
          duration: reduce ? 0 : BASE_DUR * speedOf(el),
          ease: ENTER_EASE,
        },
        cutAt
      )
    })
    return () => tl.kill()
  }, [transition])

  // Horizontal wheel / trackpad swipe advances one slide, matching the home
  // portfolio's "swipe with horizontal scroll" feel. Only horizontal-dominant
  // gestures are consumed — vertical wheel falls through so the page keeps
  // scrolling. A single flick fires once: the accumulator is locked after a
  // step and only releases once wheel events pause (the momentum tail settles).
  useEffect(() => {
    const el = stageRef.current
    if (!el || count <= 1) return

    const THRESHOLD = 40 // px of horizontal delta to commit a slide change
    let accum = 0
    let locked = false
    let settleTimer = 0

    const release = () => {
      locked = false
      accum = 0
    }

    const stepBy = (d) => {
      const cur = currentRef.current
      const next = Math.min(count - 1, Math.max(0, cur + d))
      if (transitionRef.current || next === cur) return
      dir.current = d
      setTransition({ from: cur, to: next })
    }

    const onWheel = (e) => {
      // Let vertical scrolling reach the page (Lenis); only steal horizontal.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault() // stop the browser's horizontal back/forward gesture
      e.stopPropagation()
      if (transitionRef.current) return

      clearTimeout(settleTimer)
      settleTimer = setTimeout(release, 140)
      if (locked) return

      accum += e.deltaX
      if (Math.abs(accum) >= THRESHOLD) {
        locked = true
        stepBy(accum > 0 ? 1 : -1)
        accum = 0
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      clearTimeout(settleTimer)
    }
  }, [count])

  if (!count) return null

  const active = transition ? transition.to : current
  const shown = Math.max(0, Math.min(active, count - 1))

  const goTo = (i) => {
    const cur = currentRef.current
    const next = Math.min(count - 1, Math.max(0, i))
    if (transitionRef.current || next === cur) return
    dir.current = next > cur ? 1 : -1
    setTransition({ from: cur, to: next })
  }

  // Pointer drag to change slides.
  const onDown = (e) => {
    drag.current = { x: e.clientX, active: true }
  }
  const onUp = (e) => {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.x
    drag.current.active = false
    if (Math.abs(dx) > 60) goTo(current + (dx < 0 ? 1 : -1))
  }

  return (
    <ScaleLock
      unlockTablet
      viewport={isMobile ? undefined : 'min'}
      innerRef={rootRef}
      bg="bg-black"
      className="relative flex flex-col items-center justify-center overflow-hidden text-mist"
    >
      {/* iPad opens with a deep top gap (3x the phone's) so the heading sits
          well clear of the section's top edge, per the tablet design. */}
      <div
        ref={stageRef}
        data-showcase-reveal
        className="w-full pb-4 tablet:pb-6 pt-8 tablet:pt-[132px] md:py-0"
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        style={{ touchAction: 'pan-y', cursor: count > 1 ? 'grab' : 'default' }}
      >
        {/* All slides stay mounted, stacked in the same grid cell, so the
            stage always measures the tallest slide — no height jumps on a
            swap. Only the current slide (plus the outgoing one while a
            transition runs) is visible. */}
        <div className="grid">
          {slides.map((slide, i) => {
            const visible = i === shown || (transition && i === transition.from)
            return (
              <div
                key={i}
                ref={(el) => {
                  layersRef.current[i] = el
                }}
                className="col-start-1 row-start-1"
                style={{ visibility: visible ? 'visible' : 'hidden' }}
                aria-hidden={i !== active}
              >
                <Slide {...slide} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination mirrors the slide grid so the dots sit centered directly
          under the illustration column (right on desktop, centered when stacked). */}
      {count > 1 && (
        <div className="w-full px-[16px] tablet:px-[38px] md:px-24 pb-16 tablet:pb-[76px] md:pb-0">
          <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 tablet:gap-10 md:grid-cols-2 md:gap-16">
            <div className="hidden md:block" aria-hidden="true" />
            <div className="flex justify-center md:justify-end">
              {/* max-w mirrors the illustration's, so the dots and arrows share
                  its centre line instead of the wider column's. */}
              <div className="mt-10 flex w-full max-w-[187px] tablet:max-w-[290px] md:max-w-[273px] flex-col items-center gap-8 md:mt-14">
                <div className="flex items-center justify-center gap-2.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      aria-current={i === active}
                      className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${i === active ? 'bg-mist' : 'bg-white/30'
                        }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => goTo(current - 1)}
                    disabled={active === 0}
                    aria-label="Previous slide"
                    // opacity fades (450ms) so the enabled/disabled swap eases
                    // in alongside the slide's match-cut; border stays snappy on hover.
                    className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/25 text-mist hover:border-white/70 disabled:opacity-30 disabled:hover:border-white/25"
                    style={{ transition: 'opacity 450ms ease, border-color 200ms ease' }}
                  >
                    <ArrowIcon size={16} className="rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(current + 1)}
                    disabled={active === count - 1}
                    aria-label="Next slide"
                    className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/25 text-mist hover:border-white/70 disabled:opacity-30 disabled:hover:border-white/25"
                    style={{ transition: 'opacity 450ms ease, border-color 200ms ease' }}
                  >
                    <ArrowIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ScaleLock>
  )
}

export default ProjectShowcase
