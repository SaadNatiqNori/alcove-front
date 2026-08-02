import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ArrowIcon from './ArrowIcon'
import { useRevealOnScroll } from './motion'
import { useProjects, useContent } from './api'
import { PROJECTS_DATA } from './projects'
import { MAX_SCALE } from './useScale'
import { useLenis } from './SmoothScroll'

gsap.registerPlugin(ScrollTrigger)

// Section-level copy only — the project cards come from the Projects CRUD
// (the `featured` ones), so this slider stays in sync with /projects.
const PORTFOLIO_FALLBACK = {
  heading: ['Portfolio', 'Overview'],
  description:
    'Our portfolio includes residential, commercial, and mixed-use properties, all designed to enhance quality of life and create long-term value for investors, residents, and communities.',
  ctaLabel: 'CHECK ALL',
}

function useScale(referenceWidth = 1440) {
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      const dpr = window.devicePixelRatio || 1
      return {
        scale: width >= 768 ? Math.min(width / referenceWidth, MAX_SCALE) : 1,
        initialDPR: dpr,
      }
    }
    return { scale: 1, initialDPR: 1 }
  })

  useEffect(() => {
    const setScale = (s) => setState((prev) => ({ ...prev, scale: s }))
    const handleResize = () => {
      const width = window.innerWidth
      const currentDPR = window.devicePixelRatio || 1
      const virtualWidth = width * (currentDPR / state.initialDPR)
      if (virtualWidth >= 768) setScale(Math.min(width / referenceWidth, MAX_SCALE))
      else setScale(1)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [referenceWidth, state.initialDPR])

  return state.scale
}

export function ProjectIllustration({ variant }) {
  const stroke = '#3A3E4A'
  const fill = '#252830'

  if (variant === 0) {
    return (
      <svg viewBox="0 0 600 180" className="w-full max-w-[520px] h-auto" aria-hidden="true">
        <path
          d="M 40 150 Q 240 30 560 80 L 560 160 L 40 160 Z"
          fill={fill}
          stroke="#4A4E5A"
          strokeWidth="0.6"
        />
        <rect x="470" y="105" width="65" height="55" fill={fill} stroke="#4A4E5A" strokeWidth="0.6" />
        <line x1="40" y1="162" x2="600" y2="162" stroke="#4A4E5A" strokeWidth="0.6" />
        <text
          x="195"
          y="125"
          fill="#9DA5B4"
          fontSize="8"
          fontFamily="'Akkurat_Mono', monospace"
          fontWeight="500"
        >
          ERBIL AVENUE
        </text>
      </svg>
    )
  }

  if (variant === 1) {
    return (
      <svg viewBox="0 0 600 180" className="w-full max-w-[540px] h-auto" aria-hidden="true">
        <line x1="0" y1="160" x2="600" y2="160" stroke="#4A4E5A" strokeWidth="0.6" />
        <line x1="0" y1="95" x2="600" y2="95" stroke="#4A4E5A" strokeWidth="0.4" />
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 30 + i * 65
          return (
            <g key={i}>
              <path
                d={`M ${x} 160 L ${x} 70 Q ${x + 20} 40 ${x + 40} 70 L ${x + 40} 160 Z`}
                fill={fill}
                stroke="#4A4E5A"
                strokeWidth="0.5"
              />
              <line x1={x + 20} y1="70" x2={x + 20} y2="160" stroke="#4A4E5A" strokeWidth="0.3" />
            </g>
          )
        })}
        <circle cx="300" cy="118" r="14" fill={fill} stroke="#7A8090" strokeWidth="0.5" />
        <text
          x="300"
          y="120"
          textAnchor="middle"
          fill="#9DA5B4"
          fontSize="5"
          fontFamily="'Akkurat_Mono', monospace"
          fontWeight="500"
        >
          2ND AVENUE
        </text>
      </svg>
    )
  }

  if (variant === 2) {
    return (
      <svg viewBox="0 0 600 180" className="w-full max-w-[520px] h-auto" aria-hidden="true">
        <path
          d="M 30 60 Q 200 20 400 50 T 580 70 L 580 160 L 30 160 Z"
          fill={fill}
          stroke="#4A4E5A"
          strokeWidth="0.6"
        />
        <line x1="0" y1="162" x2="600" y2="162" stroke="#4A4E5A" strokeWidth="0.6" />
        <g stroke="#4A4E5A" strokeWidth="0.3" fill="none">
          {Array.from({ length: 10 }).map((_, i) => {
            const y = 70 + i * 9
            return (
              <path
                key={i}
                d={`M 30 ${y + 5} Q 200 ${y - 3} 400 ${y + 2} T 580 ${y + 6}`}
              />
            )
          })}
        </g>
        <text
          x="380"
          y="100"
          fill="#9DA5B4"
          fontSize="7"
          fontFamily="'Akkurat_Mono', monospace"
          fontWeight="500"
        >
          YouthHub
        </text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 600 180" className="w-full max-w-[540px] h-auto" aria-hidden="true">
      <line x1="0" y1="160" x2="600" y2="160" stroke="#4A4E5A" strokeWidth="0.6" />
      <line x1="0" y1="105" x2="600" y2="105" stroke="#4A4E5A" strokeWidth="0.4" />
      <rect x="40" y="85" width="220" height="75" fill={fill} stroke="#4A4E5A" strokeWidth="0.5" />
      <rect x="340" y="85" width="220" height="75" fill={fill} stroke="#4A4E5A" strokeWidth="0.5" />
      <rect x="278" y="55" width="44" height="105" fill={fill} stroke="#7A8090" strokeWidth="0.6" />
      <g stroke="#4A4E5A" strokeWidth="0.25">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={`l${i}`} x1={40 + i * 16} y1="85" x2={40 + i * 16} y2="160" />
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={`r${i}`} x1={340 + i * 16} y1="85" x2={340 + i * 16} y2="160" />
        ))}
      </g>
      <text
        x="300"
        y="115"
        textAnchor="middle"
        fill="#9DA5B4"
        fontSize="5"
        fontFamily="'Akkurat_Mono', monospace"
        fontWeight="500"
      >
        AVENUE
      </text>
      <text
        x="300"
        y="123"
        textAnchor="middle"
        fill="#9DA5B4"
        fontSize="5"
        fontFamily="'Akkurat_Mono', monospace"
        fontWeight="500"
      >
        SQUARE
      </text>
    </svg>
  )
}

function PortfolioSlider() {
  const scale = useScale()
  // Below md the section stops being a scale-locked, single-viewport horizontal
  // slider and becomes a naturally-flowing vertical stack. `scale` can't tell us
  // we're on mobile (desktop at exactly 1440 also yields scale === 1), so track
  // the breakpoint directly.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const lenis = useLenis()
  const home = useContent('home', { portfolio: PORTFOLIO_FALLBACK })
  const portfolio = home.portfolio ?? PORTFOLIO_FALLBACK
  // Cards are the CRUD projects flagged "Show on home portfolio". Fall back to
  // all projects if none are flagged, so the section is never empty.
  const allProjects = useProjects(PROJECTS_DATA)
  const featured = allProjects.filter((p) => p.featured)
  const projects = featured.length ? featured : allProjects
  const sectionRef = useRef(null)
  const scrollRef = useRef(null)
  const progressFillRef = useRef(null)
  // Set by the soft-lock effect; called by the drag so grabbing the cards
  // mid-glide takes them over instead of fighting the lerp still running.
  const cancelGlideRef = useRef(null)

  // Intro + cards reveal one by one. Desktop lays the cards out as a horizontal
  // slider inside a single viewport, so they stagger off the section's trigger;
  // mobile stacks them vertically, so each card waits for its own scroll-in.
  const revealRef = useRevealOnScroll(
    [projects.map((p) => p.slug).join('|'), isMobile],
    { each: isMobile }
  )

  // Size each card to hug its own cover image: draw the image at a fixed height
  // so its width is the natural aspect, then set the card width to that image
  // width plus the horizontal padding (the "x margin"). The title/description
  // then wrap to the image width instead of stretching the card wider.
  const IMG_HEIGHT = 150
  const CARD_PAD_X = 38 // matches the card's px-[38px] (both sides = 76)
  const fitCardToImage = (img) => {
    if (!img) return
    const apply = () => {
      const card = img.closest('article')
      if (!card) return
      // On mobile the cards are full-width (w-full); clear any pixel width a
      // previous desktop fit left behind. `isMobile` is read from render scope,
      // and this ref callback re-runs on every render (fresh identity), so a
      // breakpoint change re-applies the correct width.
      if (isMobile) {
        card.style.width = ''
        return
      }
      const { naturalWidth: nw, naturalHeight: nh } = img
      if (!nw || !nh) return
      const imgW = IMG_HEIGHT * (nw / nh)
      card.style.width = `${Math.round(Math.max(imgW, 340)) + CARD_PAD_X * 2}px`
    }
    if (img.complete && img.naturalWidth) apply()
    else img.addEventListener('load', apply, { once: true })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    // Update the progress indicator off the scroll event, but write straight to
    // the DOM inside a rAF so we don't re-render the whole slider every frame
    // (that was the main source of the "glitchy" feel while dragging).
    let rafId = 0
    const paint = () => {
      rafId = 0
      const fill = progressFillRef.current
      if (!fill) return
      const max = el.scrollWidth - el.clientWidth
      const p = max > 0 ? el.scrollLeft / max : 0
      fill.style.left = `${p * 78}%`
    }
    const handleScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(paint)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    paint()

    // Drag-to-scroll (mouse). The cards stop where they are let go — no inertia
    // carrying them on past the release. Touch/trackpad keep native scrolling.
    let isDown = false
    let moved = false
    let dragScale = 1
    let startX = 0
    let startScrollLeft = 0

    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse') return
      cancelGlideRef.current?.()
      isDown = true
      moved = false
      startX = e.clientX
      startScrollLeft = el.scrollLeft
      // The section is CSS-scaled (.scale-wrapper); convert cursor pixels into
      // the element's own pixels so the cards track the cursor 1:1.
      dragScale = el.getBoundingClientRect().width / el.offsetWidth || 1
      el.style.cursor = 'grabbing'
      // Stop the browser starting a native image/text drag mid-swipe.
      e.preventDefault()
    }

    const onPointerMove = (e) => {
      if (!isDown) return
      const dxTotal = (e.clientX - startX) / dragScale
      if (Math.abs(dxTotal) > 4) moved = true
      el.scrollLeft = startScrollLeft - dxTotal
    }

    const endDrag = () => {
      if (!isDown) return
      isDown = false
      el.style.cursor = ''
    }

    // Horizontal wheel / trackpad swipe: keep it as a native horizontal scroll
    // and stop the page's full-screen section navigation from hijacking it.
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation()
    }

    // Swallow the click that ends a drag so it doesn't trigger the card's Link,
    // but let a genuine click (no movement) through so DISCOVER navigates.
    const onClickCapture = (e) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
        moved = false
      }
    }

    // Listen on window (not via pointer capture) so the drag keeps tracking
    // outside the element AND the click still reaches the Link — pointer capture
    // retargets the click to the container, which was blocking navigation.
    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    el.addEventListener('wheel', onWheel, { passive: true })
    el.addEventListener('click', onClickCapture, true)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('click', onClickCapture, true)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // Soft-lock. Once the section comes flush with the viewport, the page stops
  // moving and the scroll drives the card track sideways instead — so the
  // portfolio is always crossed end to end. It is symmetric: scrolling down runs
  // the cards left and releases at the far end, scrolling back up runs them
  // right and releases at the start. The section is only held while the track
  // still has somewhere to go in the direction being scrolled, so nothing here
  // pins or lengthens the page — the hold is just the wheel event being
  // swallowed before Lenis (which listens on window) can see it.
  useEffect(() => {
    if (isMobile) return
    const sectionEl = sectionRef.current
    const el = scrollRef.current
    if (!sectionEl || !el) return

    // scrollWidth and clientWidth are rounded integers, but the track's real
    // maximum scrollLeft is fractional — the section sits inside a scale()
    // transform, so its layout widths are not whole pixels. Their difference
    // therefore OVERSTATES the reachable end, by 2.5px at 1512px wide and by a
    // different amount at every other width. Treating it as the release
    // threshold leaves the page locked on a position the track can never reach,
    // so it is only a starting estimate: the moment the track is seen to
    // saturate, that position is recorded as the true end and used from then on.
    const estimatedMax = () => Math.max(0, el.scrollWidth - el.clientWidth)
    let knownMax = null
    let knownMaxFor = 0 // the estimate that was current when knownMax was learned
    const endOfTrack = () => {
      const estimate = estimatedMax()
      // A late-loading cover image or a window resize changes the card widths,
      // and with them the end of the track — so a learned end is only trusted
      // while the estimate it was learned against still holds.
      if (knownMax != null && knownMaxFor === estimate) return knownMax
      knownMax = null
      return estimate
    }

    let didAlign = false
    let target = el.scrollLeft
    let rafId = 0
    let lastT = 0

    // Gentle enough that the cards trail the gesture and settle rather than
    // tracking it rigidly. Roughly Lenis's own lerp, so the horizontal glide
    // and the page's vertical scroll read as the same motion.
    const LERP = 0.085

    // The wheel writes to `target` and a lerp walks scrollLeft toward it, so the
    // cards glide under the gesture rather than stepping once per wheel event.
    const step = (now) => {
      const dt = lastT ? Math.min(now - lastT, 50) : 1000 / 60
      lastT = now
      const dist = target - el.scrollLeft
      if (Math.abs(dist) < 0.5) {
        el.scrollLeft = target
        rafId = 0
        lastT = 0
        return
      }
      // Scaled by elapsed time, so the glide lasts the same on a 60Hz and a
      // 120Hz display instead of running twice as fast on the latter.
      const before = el.scrollLeft
      el.scrollLeft += dist * (1 - Math.pow(1 - LERP, dt / (1000 / 60)))
      if (el.scrollLeft === before) {
        // Nothing moved, for one of two reasons: the easing step was finer than
        // the device pixel grid can represent, or the track is against a bound.
        // Asking for the whole remaining distance tells them apart — and left
        // alone either one spins forever, since a track that cannot move fires
        // no scroll event to correct the aim.
        el.scrollLeft = target
        if (el.scrollLeft === before && dist > 0) {
          // Genuinely against the right-hand bound, so this is the real end of
          // the track — the figure that releases the page.
          knownMax = el.scrollLeft
          knownMaxFor = estimatedMax()
        }
        target = el.scrollLeft
        rafId = 0
        lastT = 0
        return
      }
      rafId = requestAnimationFrame(step)
    }

    const onWheel = (e) => {
      // Horizontal-dominant gestures are the existing swipe — the track's own
      // handler stops those before they reach here, but guard anyway.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      if (!e.deltaY) return
      const end = endOfTrack()
      if (end <= 0) return

      const down = e.deltaY > 0
      // The track has nothing left to give in the direction being scrolled, so
      // the page is free to carry on past the section. Measured on `target`
      // rather than the live scrollLeft: the lerp trails the gesture by design,
      // and waiting for it to land would hold the page for a beat after the
      // cards have already been scrolled to the end.
      if (down ? target >= end - 1 : target <= 1) {
        didAlign = false
        return
      }

      // Hold only once the section has come flush with the viewport from the
      // side being approached — going down that means its top has reached the
      // top of the screen, coming up it means it has fallen back to meet it.
      // Before that the section is still sliding in and the page should move.
      // Past half a screen it is more gone than present, and hauling it back
      // would read as the scroll jamming, so let a fast flick through win.
      const rect = sectionEl.getBoundingClientRect()
      if (down ? rect.top > 0 : rect.top < 0) {
        didAlign = false
        return
      }
      if (Math.abs(rect.top) > window.innerHeight / 2) return

      e.preventDefault()
      e.stopPropagation()

      // Lenis can carry the page past the flush point between frames; ease back
      // once per engage so the held section sits exactly in the viewport.
      if (!didAlign && Math.abs(rect.top) > 1) {
        didAlign = true
        const y = window.scrollY + rect.top
        if (lenis) lenis.scrollTo(y, { duration: 0.4 })
        else window.scrollTo({ top: y, behavior: 'smooth' })
      }

      target = Math.min(end, Math.max(0, target + e.deltaY))
      if (!rafId) rafId = requestAnimationFrame(step)
    }

    // Resync the lerp's aim after anything else moves the track (a drag, a
    // trackpad swipe), so it doesn't jump back to a stale spot on the next
    // wheel tick. Skipped mid-lerp, when this effect is the one scrolling.
    const onScroll = () => {
      if (!rafId) target = el.scrollLeft
    }

    cancelGlideRef.current = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      lastT = 0
      target = el.scrollLeft
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    sectionEl.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      cancelGlideRef.current = null
      el.removeEventListener('scroll', onScroll)
      sectionEl.removeEventListener('wheel', onWheel)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isMobile, lenis])

  // "CHECK ALL" pill — the same button in two spots: bottom of the intro column
  // on desktop, and top-right beside the heading on mobile (per the mobile
  // layout). Rendered twice via responsive visibility so neither position
  // affects the other.
  const checkAllCta = (
    <Link
      to="/projects"
      className="group inline-flex w-fit h-[46px] items-center gap-[5px] rounded-[48px] border-[0.25px] border-navy bg-navy px-[14px] font-['Akkurat_Mono',monospace] text-[10px] font-medium uppercase leading-none text-mist no-underline transition-colors duration-200 ease-out hover:bg-transparent hover:text-navy"
    >
      <span className="relative top-[1.5px]">{portfolio.ctaLabel}</span>
      <ArrowIcon size={14} className="relative top-[0.5px]" />
    </Link>
  )

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#E6EBF0] md:h-screen"
      aria-label="Portfolio overview"
    >
      <div
        className="scale-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: scale >= 1 ? '100%' : `${100 / scale}%`,
          marginLeft: scale >= 1 ? '0' : `${(100 - 100 / scale) / 2}%`,
          // Mobile: grow with the stacked content and let the page scroll.
          // Desktop: locked to one viewport so the slider fills the screen.
          height: isMobile ? 'auto' : `${100 / scale}vh`,
        }}
      >
        {/* Content stays in the centered 1440 canvas (heading/intro align with
            every other section). Only the slider track below bleeds to the right
            viewport edge so the cards aren't cut short of it. */}
        <main className="relative h-full max-w-[1440px] mx-auto flex flex-col justify-start md:justify-center bg-[#E6EBF0] pt-[88px] pb-14 text-[#1C2D4F] md:pt-[120px] md:pb-10">
          <div
            ref={(el) => {
              scrollRef.current = el
              revealRef.current = el
            }}
            data-horizontal-scroll
            className="flex flex-col md:flex-row items-stretch gap-4 md:gap-2 px-4 md:pl-[38px] md:pr-2 md:overflow-x-auto md:overflow-y-hidden md:cursor-grab select-none [&::-webkit-scrollbar]:hidden"
            style={{
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
              // Mobile stacks vertically, so let the page pan vertically; only
              // the desktop horizontal slider claims the horizontal axis.
              touchAction: isMobile ? 'auto' : 'pan-x',
              overscrollBehavior: 'contain',
              // Desktop: extend the track's right edge out to the viewport edge
              // (negative margin = the right gutter, in canvas px) so the cards
              // run/peek to the edge instead of stopping at the 1440 canvas.
              marginRight: isMobile
                ? undefined
                : `calc((100vw / ${scale} - 1440px) / -2)`,
            }}
          >
            {/* mr + the row's gap-2 (8px) = the 227.5px intro-to-cards gap */}
            <div
              data-reveal
              className="flex-shrink-0 w-full md:w-[240px] flex flex-col gap-6 md:gap-[30px] py-4 md:mr-[219.5px]"
            >
              {/* On mobile the heading and CTA share the top row; on desktop the
                  CTA is hidden here (it lives at the column's foot) and the
                  heading sits alone. */}
              <div className="flex items-start justify-between gap-4">
                <h2
                  className="m-0 text-[30px] md:text-[44px] leading-[100%] tracking-[-0.02em] text-navy"
                  style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
                >
                  {portfolio.heading[0]}
                  <br />
                  {portfolio.heading[1]}
                </h2>
                <div className="md:hidden">{checkAllCta}</div>
              </div>
              <p
                className="m-0 text-[14px] leading-5 text-navy"
                style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
              >
                {portfolio.description}
              </p>
              <div className="hidden md:block">{checkAllCta}</div>
            </div>

            {projects.map((project, i) => (
              <article
                key={project.slug}
                data-reveal
                className="flex-shrink-0 w-full md:w-[496px] bg-navy px-6 py-8 md:px-[38px] md:py-10 flex flex-col gap-10 md:gap-[70px] text-mist"
              >
                <div>
                  <h3
                    className="m-0 text-[22px] leading-[115%] tracking-[-0.02em] text-mist"
                    style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
                  >
                    {project.title}
                  </h3>
                  <p
                    className="mt-[18px] text-[12px] leading-4 text-mist line-clamp-2"
                    style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
                  >
                    {project.short || project.description}
                  </p>
                </div>

                <div className="flex justify-center">
                  {project.coverImage ? (
                    <img
                      src={project.coverImage}
                      alt={project.title}
                      draggable={false}
                      ref={fitCardToImage}
                      className="h-[102.79px] w-[317.91px] object-contain md:h-[150px] md:w-auto md:max-w-none"
                    />
                  ) : (
                    <ProjectIllustration variant={i % 4} />
                  )}
                </div>

                <Link
                  to={`/projects/${project.slug}`}
                  className="group mt-auto inline-flex w-fit h-[46px] flex-shrink-0 items-center gap-[5px] rounded-[48px] border-[0.25px] border-mist px-[14px] font-['Akkurat_Mono',monospace] text-[10px] font-medium uppercase leading-none text-mist no-underline transition-colors duration-200 ease-out hover:bg-mist hover:text-navy"
                >
                  <span className="relative top-[1px]">DISCOVER</span>
                  <ArrowIcon size={14} />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-8 mx-auto hidden md:block w-full max-w-[280px] h-[2px] bg-[#1C2D4F]/15 relative">
            <div
              ref={progressFillRef}
              className="absolute top-0 h-full bg-[#1C2D4F] transition-[left] duration-150 ease-out"
              style={{
                width: '22%',
                left: '0%',
              }}
            />
          </div>
        </main>
      </div>
    </section>
  )
}

export default PortfolioSlider
