import { useLayoutEffect, useRef, useState, useEffect, forwardRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { cubicEase } from './easings'
import { useRevealOnScroll } from './motion'
import ContactSection from './ContactSection'
import { ScaleLock } from './ScaleLock'
import { useProjects } from './api'
import { PROJECTS_DATA } from './projects'
import { ProjectIllustration } from './PortfolioSlider'
import { useLenis } from './SmoothScroll'

const CARD_WIDTH = 520

// Scroll position (px from the viewport top) the opened mobile card's top border
// is lifted to — clears the fixed navbar (~71px) with a small gap.
const MOBILE_ANCHOR_OFFSET = 100

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// CMS dates arrive as "YYYY-MM-DD" → "13 Jan 2026". Legacy rows may still
// hold a bare year ("2024"), which is shown as-is.
function formatProjectDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  if (!match) return value
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`
}

function Arrow({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.5 12h16M13 5.5l6.5 6.5-6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// The navy preview card body. Shared by the desktop mouse-follower and the mobile
// inline accordion so both render identical content.
const ProjectCardBody = forwardRef(function ProjectCardBody(
  { project, variant, className = '' },
  ref
) {
  const meta = [project.location, formatProjectDate(project.year), project.status]
    .filter(Boolean)
    .join(' · ')
  return (
    <div
      ref={ref}
      className={`rounded-[5px] border border-[#FFFFFF12] bg-navy p-9 text-mist will-change-transform ${className}`}
    >
      <h2
        className="m-0 text-[26px] md:text-[28px] font-[420] leading-[1.1] tracking-[-0.02em] text-mist"
        style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
      >
        {project.title}
      </h2>
      {meta && (
        <p className="mt-2 font-['Akkurat_Mono',monospace] text-[10px] font-medium uppercase tracking-[0.12em] text-[#A8B0BD]">
          {meta}
        </p>
      )}
      <p className="mt-[10px] max-w-[420px] text-[14px] leading-[1.55] tracking-[0] text-white">
        {project.description}
      </p>
      <div className="mt-8 flex justify-center">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt=""
            aria-hidden="true"
            className="w-[80%] h-auto opacity-90"
          />
        ) : (
          <ProjectIllustration variant={variant} />
        )}
      </div>
    </div>
  )
})

function ProjectsListPage() {
  const navigate = useNavigate()
  const lenis = useLenis()

  const headingRef = useRef(null)
  const listRef = useRef(null)

  // Preview card refs (desktop mouse-follower)
  const cardWrapRef = useRef(null) // positioned via gsap.quickTo (translate)
  const cardInnerRef = useRef(null) // fade-up animation (opacity + translateY)
  const xTo = useRef(null)
  const yTo = useRef(null)
  const hasPos = useRef(false)

  const [active, setActive] = useState(null) // hovered row index (desktop)
  const [display, setDisplay] = useState(0) // last shown project (kept during fade-out)

  // Mobile viewport → tap-to-expand accordion instead of the hover follower.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 767px)').matches
      : false
  )
  const [openIndex, setOpenIndex] = useState(null) // expanded row (mobile); null = all collapsed
  const prevOpenRef = useRef(null)

  // Per-row refs for the mobile accordion animation.
  const rowElRefs = useRef([]) // <li> — measured for the "anchor near top" lift
  const titleWrapRefs = useRef([]) // collapses to 0 when the row opens
  const titleRefs = useRef([]) // fades out when the row opens
  const cardWrapRefs = useRef([]) // grows 0 → auto when the row opens
  const cardBodyRefs = useRef([]) // fades up once the card has room

  // All published projects, straight from the CRUD (offline fallback mirrors it).
  const projects = useProjects(PROJECTS_DATA)
  // Identity of the current list. When the live data swaps in (or a project is
  // renamed / added / removed), this changes and the entrance animation
  // re-initializes against the freshly rendered rows — so a remounted row can't
  // miss the fade-in.
  const slugKey = projects.map((p) => p.slug).join('|')

  // Track the mobile breakpoint; collapse any open card when leaving mobile.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = (e) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isMobile) setOpenIndex(null)
  }, [isMobile])

  // Entrance animation for the heading. The rows below reveal one by one on
  // scroll instead (see revealRef) — animating them on mount meant every row
  // past the fold had already finished by the time it was scrolled into view.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(headingRef.current, { y: 60, opacity: 0 })
      gsap.to(headingRef.current, {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: cubicEase,
        delay: 0.15,
      })
    })
    return () => ctx.revert()
  }, [slugKey])

  const revealRef = useRevealOnScroll([slugKey])

  // Position follower setup + hidden initial state for the card (desktop only)
  useLayoutEffect(() => {
    if (isMobile || !cardInnerRef.current) return
    gsap.set(cardInnerRef.current, { autoAlpha: 0, y: 24 })
    xTo.current = gsap.quickTo(cardWrapRef.current, 'x', {
      duration: 0.5,
      ease: 'power3.out',
    })
    yTo.current = gsap.quickTo(cardWrapRef.current, 'y', {
      duration: 0.5,
      ease: 'power3.out',
    })
  }, [isMobile])

  // Fade-up in / out when the hovered row changes (desktop only)
  useEffect(() => {
    if (isMobile || !cardInnerRef.current) return
    if (active !== null) {
      setDisplay(active)
      gsap.killTweensOf(cardInnerRef.current)
      gsap.fromTo(
        cardInnerRef.current,
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.55, ease: cubicEase }
      )
    } else {
      gsap.killTweensOf(cardInnerRef.current)
      gsap.to(cardInnerRef.current, {
        y: 16,
        autoAlpha: 0,
        duration: 0.4,
        ease: cubicEase,
      })
      hasPos.current = false
    }
  }, [active, isMobile])

  // Reset the mobile accordion to its collapsed base state whenever the mode or
  // the list changes, so height/opacity tweens start from a known point.
  useLayoutEffect(() => {
    if (!isMobile) return
    prevOpenRef.current = null
    titleWrapRefs.current.forEach((el) => el && gsap.set(el, { height: 'auto' }))
    titleRefs.current.forEach((el) => el && gsap.set(el, { autoAlpha: 1, y: 0 }))
    cardWrapRefs.current.forEach((el) => el && gsap.set(el, { height: 0 }))
    cardBodyRefs.current.forEach((el) => el && gsap.set(el, { autoAlpha: 0, y: 16 }))
  }, [isMobile, slugKey])

  // Drive the open/close choreography when the expanded row changes (mobile).
  useLayoutEffect(() => {
    if (!isMobile) return
    const open = openIndex
    const prev = prevOpenRef.current
    if (prev === open) return
    prevOpenRef.current = open

    // Collapse the previously open row: title fades back in, card closes.
    if (prev !== null) {
      const tw = titleWrapRefs.current[prev]
      const t = titleRefs.current[prev]
      const cw = cardWrapRefs.current[prev]
      if (t) {
        gsap.killTweensOf(t)
        gsap.to(t, { autoAlpha: 1, y: 0, duration: 0.4, ease: cubicEase })
      }
      if (tw) {
        gsap.killTweensOf(tw)
        gsap.to(tw, { height: 'auto', duration: 0.45, ease: cubicEase })
      }
      if (cw) {
        gsap.killTweensOf(cw)
        gsap.to(cw, { height: 0, duration: 0.45, ease: cubicEase })
      }
    }

    // Expand the newly opened row.
    if (open !== null) {
      const tw = titleWrapRefs.current[open]
      const t = titleRefs.current[open]
      const cw = cardWrapRefs.current[open]
      const cb = cardBodyRefs.current[open]

      const tl = gsap.timeline()
      // 1. Title fades out first.
      if (t) {
        gsap.killTweensOf(t)
        tl.to(t, { autoAlpha: 0, y: -8, duration: 0.3, ease: cubicEase }, 0)
      }
      // Its line collapses so the card can occupy the space between the borders.
      if (tw) {
        gsap.killTweensOf(tw)
        tl.to(tw, { height: 0, duration: 0.5, ease: cubicEase }, 0.08)
      }
      // 2. Card grows in height — begins while the title is still fading.
      if (cw) {
        gsap.killTweensOf(cw)
        gsap.set(cw, { height: 0 })
        tl.to(cw, { height: 'auto', duration: 0.6, ease: cubicEase }, 0.12)
      }
      // 3. Card content settles in once it has room.
      if (cb) {
        gsap.set(cb, { autoAlpha: 0, y: 16 })
        tl.to(cb, { autoAlpha: 1, y: 0, duration: 0.45, ease: cubicEase }, 0.3)
      }

      // Parallel lift: pull the opened row up so its top border anchors just
      // under the navbar. Measured live, then corrected for a row above that is
      // simultaneously collapsing (its card height is about to vanish).
      const li = rowElRefs.current[open]
      if (li) {
        const rect = li.getBoundingClientRect()
        const currentScroll = lenis ? lenis.scroll : window.scrollY
        let target = currentScroll + rect.top - MOBILE_ANCHOR_OFFSET
        if (prev !== null && prev < open) {
          const prevCard = cardWrapRefs.current[prev]
          if (prevCard) target -= prevCard.getBoundingClientRect().height
        }
        target = Math.max(0, target)
        if (lenis) {
          lenis.scrollTo(target, { duration: 0.6 })
        } else {
          window.scrollTo({ top: target, behavior: 'smooth' })
        }
      }
    }
  }, [openIndex, isMobile, lenis])

  const handleMove = (e) => {
    const inner = cardInnerRef.current
    const wrap = cardWrapRef.current
    if (!inner || !wrap) return

    const margin = 24
    const h = inner.offsetHeight || 360
    const w = CARD_WIDTH

    let x = e.clientX + 44
    let y = e.clientY - h / 2
    x = Math.min(Math.max(x, margin), window.innerWidth - w - margin)
    y = Math.min(Math.max(y, margin), window.innerHeight - h - margin)

    if (!hasPos.current) {
      gsap.set(wrap, { x, y })
      hasPos.current = true
    } else {
      xTo.current(x)
      yTo.current(y)
    }
  }

  // Mobile tap: first tap opens the row (accordion), a second tap on the open
  // row navigates to the project.
  const handleRowTap = (i, slug) => {
    if (openIndex === i) {
      navigate(`/projects/${slug}`)
    } else {
      setOpenIndex(i)
    }
  }

  const project = projects[display] ?? {}

  return (
    <>
    <main className="relative min-h-screen bg-[#E6EBF0] overflow-hidden">
      {/* The page content is locked to the 1440 canvas. The mouse-follow preview
          card below is intentionally left OUTSIDE this wrapper: it is
          position: fixed and driven by real-viewport pointer coords, which a
          transform ancestor would break. */}
      <ScaleLock as="div" className="px-[16px] md:px-12 pb-24">
      <div className="mx-auto pt-[150px] md:pt-[190px]">
        {/* Heading */}
        <div ref={headingRef} className="md:pl-[13%]">
          <p
            className="m-0 text-[19px] md:text-[32px] font-[420] leading-[1] tracking-[-0.04em] text-[#7E8798]"
            style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
          >
            Our Projects
          </p>
          <h1
            className="mt-[19px] md:mt-6 max-w-[860px] text-[27px] md:text-[46px] font-[420] leading-[1.15] tracking-[-0.02em] text-[#1B2436]"
            style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
          >
            Building the Future of Urban Living Developments crafted to elevate
            quality of life and create sustainable value across Erbil and beyond.
          </h1>
        </div>

        {/* Project list */}
        <ul
          ref={(el) => {
            listRef.current = el
            revealRef.current = el
          }}
          onMouseMove={isMobile ? undefined : handleMove}
          onMouseLeave={isMobile ? undefined : () => setActive(null)}
          className="mt-[80px] md:mt-[110px] list-none p-0 m-0"
        >
          {projects.map((p, i) => {
            const sel = isMobile ? openIndex : active
            const dim = sel !== null && sel !== i
            // Top line of this row is dark when nothing is selected, or when this
            // row or the row directly above it is selected (shared edge).
            const topDark = sel === null || sel === i || sel === i - 1
            return (
              <li
                key={p.slug}
                ref={(el) => {
                  rowElRefs.current[i] = el
                }}
                data-reveal
                className="list-none"
              >
                <div
                  className={`h-px w-full transition-colors duration-[450ms] ease-out ${
                    topDark ? 'bg-[#1C1F2A]' : 'bg-[#AAB2C0]'
                  }`}
                />
                {isMobile ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowTap(i, p.slug)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleRowTap(i, p.slug)
                      }
                    }}
                    className="cursor-pointer select-none"
                  >
                    {/* Title line — collapses away when the row opens */}
                    <div
                      ref={(el) => (titleWrapRefs.current[i] = el)}
                      className="overflow-hidden"
                    >
                      <div
                        ref={(el) => (titleRefs.current[i] = el)}
                        className="flex items-center justify-between gap-6 py-[36px]"
                      >
                        <span
                          className={`block text-[26px] font-[420] leading-[1] tracking-[-0.04em] transition-colors duration-[450ms] ease-out ${
                            dim ? 'text-[#AAB2C0]' : 'text-[#1B2436]'
                          }`}
                          style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
                        >
                          {p.title}
                        </span>
                        <Arrow
                          className={`shrink-0 w-[20px] h-[20px] opacity-50 transition-colors duration-[450ms] ease-out ${
                            dim ? 'text-[#AAB2C0]' : 'text-[#1C1F2A]'
                          }`}
                        />
                      </div>
                    </div>
                    {/* Card — grows in between the two borders when the row opens */}
                    <div
                      ref={(el) => (cardWrapRefs.current[i] = el)}
                      className="overflow-hidden"
                      style={{ height: 0 }}
                    >
                      <div className="pt-[26px] pb-[26px]">
                        <ProjectCardBody
                          ref={(el) => (cardBodyRefs.current[i] = el)}
                          project={p}
                          variant={i % 4}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={`/projects/${p.slug}`}
                    onMouseEnter={() => setActive(i)}
                    className="group flex items-center justify-between gap-6 py-[36px] md:py-[42px] no-underline"
                  >
                    <span
                      className={`block text-[26px] md:text-[42px] font-[420] leading-[1] tracking-[-0.04em] transition-colors duration-[450ms] ease-out ${
                        dim ? 'text-[#AAB2C0]' : 'text-[#1B2436]'
                      }`}
                      style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
                    >
                      {p.title}
                    </span>
                    <Arrow
                      className={`shrink-0 w-[20px] h-[20px] opacity-50 md:opacity-100 md:w-[36px] md:h-[36px] transition-colors duration-[450ms] ease-out ${
                        dim ? 'text-[#AAB2C0]' : 'text-[#1C1F2A]'
                      }`}
                    />
                  </Link>
                )}
              </li>
            )
          })}
          {/* Closing bottom line — dark when nothing selected or the last row is selected */}
          <div
            className={`h-px w-full transition-colors duration-[450ms] ease-out ${
              (isMobile ? openIndex : active) === null ||
              (isMobile ? openIndex : active) === projects.length - 1
                ? 'bg-[#1C1F2A]'
                : 'bg-[#AAB2C0]'
            }`}
          />
        </ul>
      </div>
      </ScaleLock>

      {/* Mouse-following preview card (desktop only) */}
      {!isMobile && (
        <div
          ref={cardWrapRef}
          className="pointer-events-none fixed left-0 top-0 z-40 will-change-transform"
          style={{ width: CARD_WIDTH }}
        >
          <ProjectCardBody
            ref={cardInnerRef}
            project={project}
            variant={display % 4}
            className="shadow-[0_30px_80px_-24px_rgba(10,14,24,0.55)]"
          />
        </div>
      )}
    </main>
    <ContactSection />
    </>
  )
}

export default ProjectsListPage
