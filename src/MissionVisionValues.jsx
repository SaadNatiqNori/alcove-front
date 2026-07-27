import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useContent } from './api'
import ContactFooterPanel from './ContactFooterPanel'
import { MAX_SCALE } from './useScale'

const CTA_FALLBACK = {
  title: "Let's talk",
  description:
    'Contact us to explore how Alcove can strengthen engagement, adherence, and between-visit support.',
  buttonLabel: 'GET IN TOUCH',
}

gsap.registerPlugin(ScrollTrigger)

const MVV_FALLBACK = {
  mission: {
    title: 'Mission',
    body: 'To deliver high-quality, sustainable, and innovative real estate solutions that meet the evolving needs of our clients and communities. We aim to create enduring value by integrating excellence in design, construction, and property management, while fostering lasting relationships with stakeholders.',
  },
  vision: {
    title: 'Vision',
    body: "To be a leading force in the real estate and construction industry in the Kurdistan Region and beyond, recognized for our commitment to quality, sustainability, and community-driven development. We envision creating spaces that not only meet today's needs but also stand the test of time, contributing to the region's growth and prosperity.",
  },
  values: {
    title: 'Values',
    intro: 'At Alcove, we are guided by:',
    items: [
      { term: 'Excellence', description: 'Delivering premium quality in every detail.' },
      { term: 'Innovation', description: 'Embracing creativity and modern solutions.' },
      { term: 'Integrity', description: 'Building trust through transparency and professionalism.' },
    ],
  },
}

function useScale(referenceWidth = 1440, mobileReferenceWidth = 430) {
  // Below 768px the mobile layout is authored for a 430px-wide reference
  // (iPhone 14 Pro Max). Scaling by width/430 — capped at 1 so 430px+ stays
  // pixel-identical to the design — shrinks the whole cover stage uniformly on
  // narrower phones so each card's title/body/illustration keep their
  // proportions instead of overflowing. The parallax uses yPercent (relative to
  // each card's own height), so it is unaffected by the scale value.
  const mobileScale = (width) => Math.min(1, width / mobileReferenceWidth)

  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      const dpr = window.devicePixelRatio || 1
      return {
        scale: width >= 768 ? Math.min(width / referenceWidth, MAX_SCALE) : mobileScale(width),
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
      else setScale(mobileScale(width))
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [referenceWidth, mobileReferenceWidth, state.initialDPR])

  return state.scale
}

function MissionIllustration({ className = 'w-[280px] h-[300px]' }) {
  const stroke = '#1C2D4F'
  return (
    <svg viewBox="0 0 360 380" className={className} aria-hidden="true">
      <g stroke={stroke} strokeWidth="0.6" fill="none" strokeDasharray="2 4" opacity="0.55">
        <line x1="40" y1="20" x2="40" y2="360" />
        <line x1="320" y1="20" x2="320" y2="360" />
        <line x1="20" y1="40" x2="340" y2="40" />
        <line x1="20" y1="350" x2="340" y2="350" />
      </g>
      <g stroke={stroke} strokeWidth="0.7" fill="none" strokeDasharray="2 3">
        <circle cx="180" cy="335" r="14" />
        <circle cx="180" cy="305" r="44" />
        <circle cx="180" cy="240" r="110" />
        <circle cx="180" cy="180" r="170" />
      </g>
      <g fill={stroke} fontSize="8" fontFamily="'Akkurat Mono', monospace">
        <text x="172" y="338">01</text>
        <text x="170" y="276">02</text>
        <text x="171" y="171">03</text>
        <text x="171" y="55">04</text>
      </g>
    </svg>
  )
}

function VisionIllustration({ className = 'w-[480px] h-[240px]' }) {
  const stroke = '#1C2D4F'
  return (
    <svg viewBox="0 0 540 280" className={className} aria-hidden="true">
      <g stroke={stroke} strokeWidth="0.7" fill="none" strokeDasharray="2 3" opacity="0.85">
        <path d="M 40 140 Q 270 30 500 140 Q 270 250 40 140 Z" />
        <ellipse cx="270" cy="140" rx="180" ry="80" />
        <ellipse cx="270" cy="140" rx="120" ry="55" />
        <ellipse cx="270" cy="140" rx="60" ry="30" />
        <ellipse cx="270" cy="140" rx="18" ry="11" />
      </g>
      <g stroke={stroke} strokeWidth="0.5" fill="none" strokeDasharray="3 4" opacity="0.5">
        <line x1="270" y1="140" x2="520" y2="140" />
        <line x1="270" y1="140" x2="500" y2="40" />
        <line x1="270" y1="140" x2="500" y2="240" />
      </g>
      <g fill={stroke} fontSize="8" fontFamily="'Akkurat Mono', monospace">
        <text x="278" y="143">01</text>
        <text x="332" y="143">02</text>
        <text x="392" y="143">03</text>
      </g>
    </svg>
  )
}

function ValuesIllustration({ className = 'w-[480px] h-[320px]' }) {
  const stroke = '#1C2D4F'
  const centers = [180, 240, 300, 360, 420]
  return (
    <svg viewBox="0 0 600 400" className={className} aria-hidden="true">
      <g stroke={stroke} strokeWidth="0.6" fill="none" strokeDasharray="2 3" opacity="0.7">
        {centers.map((cx, i) => (
          <circle key={i} cx={cx} cy="200" r="100" />
        ))}
      </g>
      <g stroke={stroke} strokeWidth="0.5" opacity="0.5">
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2
          const x1 = 300 + Math.cos(angle) * 130
          const y1 = 200 + Math.sin(angle) * 130
          const x2 = 300 + Math.cos(angle) * 150
          const y2 = 200 + Math.sin(angle) * 150
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}
      </g>
      <g stroke={stroke} strokeWidth="0.5" strokeDasharray="2 3" opacity="0.5">
        <line x1="300" y1="100" x2="300" y2="300" />
        <line x1="200" y1="200" x2="400" y2="200" />
      </g>
      <g fill={stroke} fontSize="8" fontFamily="'Akkurat Mono', monospace" textAnchor="middle">
        <text x={centers[0]} y="204">01</text>
        <text x={centers[1]} y="204">02</text>
        <text x={centers[2]} y="204">03</text>
        <text x={centers[3]} y="204">04</text>
        <text x={centers[4]} y="204">05</text>
      </g>
      <g stroke={stroke} strokeWidth="0.4" strokeDasharray="2 2" opacity="0.5">
        <line x1={centers[0] + 12} y1="200" x2={centers[1] - 12} y2="200" />
        <line x1={centers[1] + 12} y1="200" x2={centers[2] - 12} y2="200" />
        <line x1={centers[2] + 12} y1="200" x2={centers[3] - 12} y2="200" />
        <line x1={centers[3] + 12} y1="200" x2={centers[4] - 12} y2="200" />
      </g>
    </svg>
  )
}

function ValuesContent({ intro, items }) {
  return (
    <div className="text-[14px] leading-[150%] tracking-[0] max-w-[520px] text-[#1C2D4F]">
      <p className="m-0">{intro}</p>
      <ul className="mt-3 list-none p-0 m-0 space-y-1">
        {items.map((item) => (
          <li key={item.term} className="flex items-baseline gap-2">
            <span className="inline-block w-[5px] h-[5px] rounded-full bg-[#1C2D4F] translate-y-[-2px]" />
            <span>
              <strong className="font-semibold">{item.term}</strong> – {item.description}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Card({ refProp, title, description, isValues, values, illustration, zIndex }) {
  return (
    <div
      ref={refProp}
      style={{ zIndex }}
      className="absolute inset-0 flex flex-col bg-[#E6EBF0] px-4 pt-[0px] md:px-8 md:pt-[0] will-change-transform"
    >
      {/* Each card is a solid full-viewport panel, so when it rises it covers
          the card beneath it completely as a fixed layer. */}
      <div className="flex-1 flex flex-col justify-start bg-[#E6EBF0] -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="w-full h-[1px] bg-[#1C2D4F]/30" />
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[460px_1fr] gap-[14px] md:gap-16">
          <h3
            className="m-0 text-[44px] md:text-[58px] font-normal leading-none tracking-[-0.01em]"
            style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
          >
            {title}
          </h3>
          <div>
            {isValues ? (
              <ValuesContent intro={values.intro} items={values.items} />
            ) : (
              <p className="m-0 text-[14px] leading-[130%] tracking-[0] max-w-[520px] text-[#1C2D4F]">
                {description}
              </p>
            )}
            <div className="mt-10 flex justify-center md:justify-start">
              {illustration}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MissionVisionValues() {
  const scale = useScale()
  const home = useContent('home', { mvv: MVV_FALLBACK })
  const mvv = home.mvv ?? MVV_FALLBACK
  const footer = useContent('footer', { cta: CTA_FALLBACK })
  const cta = footer.cta ?? CTA_FALLBACK
  const sectionRef = useRef(null)
  const stickyRef = useRef(null)
  const missionRef = useRef(null)
  const visionRef = useRef(null)
  const valuesRef = useRef(null)
  const footerRef = useRef(null)

  // Below md the navy footer leaves the cinematic entirely: the parallax runs
  // for the three cards, Values docks as the final cover, and the footer renders
  // as a normal fit-content block after the pinned stage (see the render). So the
  // footer layer is only mounted/animated on desktop.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Synchronized scroll-through, fully scrubbed so position is a pure
      // function of scroll (reversible on scroll-up, correct after a reload
      // mid-section). The outgoing card scrolls UP and fully OUT the top at the
      // SAME rate the incoming card rises from the bottom. Because they move in
      // lockstep, the outgoing card's bottom edge stays flush against the
      // incoming card's top edge for the whole span — the outgoing tab never
      // lingers ("sticks") at the top, and no empty band ever opens between
      // them. Cards share the same opaque bg, so the seam is invisible and it
      // reads as one continuous sheet of content moving up.

      // Two-speed parallax cover, all LINEAR (no easing → nothing decelerates to
      // a freeze/pin). The incoming card rises to cover while the outgoing drifts
      // up only DRIFT%, so the incoming visibly rides UP and OVER it (the "above"
      // animation), opaque + one z-layer up so no gap ever opens, and with pt-0
      // the outgoing header leaves the top immediately so it never "sticks".
      //
      // PEEK gives the next tab a HEAD START: instead of starting fully below the
      // viewport (yPercent 100), each incoming card begins already PEEK% up, so it
      // is visible/rising sooner and the dead space before it arrives shrinks —
      // "the next tab shows a little earlier before the previous scrolls out".
      const DRIFT = -50 // outgoing lag; smaller = stronger cover, larger = gentler dock
      const PEEK = 33   // how far up (%) the next tab already is when its turn begins; bigger = less gap / earlier reveal, but shows more of the next tab at the start
      const layers = [missionRef.current, visionRef.current, valuesRef.current].filter(Boolean)
      if (!isMobile && footerRef.current) layers.push(footerRef.current)

      // Prime each layer before the first scrubbed frame so transforms begin on
      // the compositor and do not introduce a one-frame hitch at section entry.
      gsap.set(layers, { force3D: true })

      // Mission is docked. Vision starts already peeking PEEK% at the bottom.
      // Values stays fully below and is brought up to the same PEEK head-start
      // during Mission→Vision (via an early-starting, slightly-longer rise) so it
      // too is peeking in by the time Vision begins to leave. The navy footer is
      // the last layer and gets the identical treatment one beat later, so it is
      // peeking in by the time Values begins to leave.
      gsap.set(missionRef.current, { yPercent: 0 })
      gsap.set(visionRef.current, { yPercent: 100 - PEEK })
      gsap.set(valuesRef.current, { yPercent: 100 })
      if (!isMobile) gsap.set(footerRef.current, { yPercent: 100 })

      const tl = gsap.timeline({
        defaults: { ease: 'none', force3D: true },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          invalidateOnRefresh: true,
          scrub: true, // Lenis already eases position; a numeric scrub double-smooths
        },
      })

      // Rate at which a card rises the full 100% while still arriving at its PEEK
      // head-start exactly one beat before its cover turn begins.
      const riseDur = 1 / (1 - PEEK / 100)

      // T1 — Mission drifts up; Vision rises from its peek position to cover.
      tl.to(missionRef.current, { yPercent: DRIFT, duration: 1 }, 0)
      tl.to(visionRef.current, { yPercent: 0, duration: 1 }, 0)
      // Values rises from 100→0 over a slightly longer, EARLIER-starting window so
      // that by the time Vision docks (t=1) Values is already PEEK% up — same head
      // start as Vision had, and the same rise rate (100 over 1/(1-PEEK/100)).
      tl.to(valuesRef.current, { yPercent: 0, duration: riseDur }, 2 - riseDur)
      // T2 — Vision drifts up; Values (already peeking) finishes rising to cover.
      tl.to(visionRef.current, { yPercent: DRIFT, duration: 1 }, 1)

      // Desktop only: the navy footer is the final rising cover. On mobile the
      // timeline ends here with Values docked (yPercent 0) — the footer is a
      // separate block after the stage — so Values must NOT drift up.
      if (!isMobile) {
        // Footer mirrors Values' early rise, one beat later: PEEK% up by t=2.
        tl.to(footerRef.current, { yPercent: 0, duration: riseDur }, 3 - riseDur)
        // T3 — Values drifts up; the navy footer rises to cover, same as every card.
        tl.to(valuesRef.current, { yPercent: DRIFT, duration: 1 }, 2)
      }

      // Footer (last layer) settles docked; the sticky stage releases at the
      // section end, so the footer holds full-screen as the page bottom.
    })

    return () => ctx.revert()
  }, [isMobile])

  return (
    <>
      <section
        ref={sectionRef}
        className="relative w-full h-[300vh] bg-[#E6EBF0]"
        aria-label="Mission, vision, values"
      >
        <div
          ref={stickyRef}
          className="sticky top-0 h-screen w-full overflow-hidden bg-[#E6EBF0]"
        >
          <div
            className="scale-wrapper"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: scale >= 1 ? '100%' : `${100 / scale}%`,
              marginLeft: scale >= 1 ? '0' : `${(100 - 100 / scale) / 2}%`,
              height: `${100 / scale}vh`,
            }}
          >
            <div className="relative h-full  max-w-[1440px] mx-auto text-[#1C2D4F]">
              <Card
                refProp={missionRef}
                zIndex={10}
                title={mvv.mission.title}
                description={mvv.mission.body}
                illustration={
                  mvv.mission.image ? (
                    <img src={mvv.mission.image} alt="" className="w-full max-w-[313px] h-auto" />
                  ) : (
                    <MissionIllustration className="w-[280px] h-[300px] max-w-full" />
                  )
                }
              />
              <Card
                refProp={visionRef}
                zIndex={20}
                title={mvv.vision.title}
                description={mvv.vision.body}
                illustration={
                  mvv.vision.image ? (
                    <img src={mvv.vision.image} alt="" className="w-full max-w-[313px] h-auto" />
                  ) : (
                    <VisionIllustration className="w-[480px] h-[240px] max-w-full" />
                  )
                }
              />
              <Card
                refProp={valuesRef}
                zIndex={30}
                title={mvv.values.title}
                isValues
                values={mvv.values}
                illustration={
                  mvv.values.image ? (
                    <img src={mvv.values.image} alt="" className="w-full max-w-[313px] h-auto" />
                  ) : (
                    <ValuesIllustration className="w-[480px] h-[320px] max-w-full" />
                  )
                }
              />
              {/* Desktop: navy footer is the final rising cover layer — same solid
                full-panel treatment as the cards, one z-layer above Values.
                On mobile it is rendered as a normal block after the stage. */}
              {!isMobile && (
                <div
                  ref={footerRef}
                  style={{ zIndex: 40 }}
                  className="absolute inset-0 will-change-transform"
                >
                  {/* The navy backdrop breaks out to the full viewport width so the
                      footer always reads as a 100vw band — even once the scale locks
                      and the 1440 content canvas stops filling wide screens. The
                      rising cover animation stays on this wrapper; only the backdrop
                      is full-bleed, while ContactFooterPanel keeps its capped,
                      centered content. */}
                  <div className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 bg-navy" />
                  <ContactFooterPanel cta={cta} fitMobile />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: the footer is a normal fit-content block after the pinned
          cinematic, so it is 553px tall (per the design) instead of a full-screen
          cover. Desktop keeps it inside the stage as the rising cover above. */}
      {isMobile && (
        <div className="bg-navy">
          <ContactFooterPanel cta={cta} fitMobile />
        </div>
      )}
    </>
  )
}

export default MissionVisionValues