import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useContent } from './api'
import ContactFooterPanel from './ContactFooterPanel'
import { useScale, useIsDesktop } from './useScale'
import { REVEAL, prefersReducedMotion, revealFooterPanel } from './motion'
import { cubicEase } from './easings'

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
    <div className="text-[14px] tablet:text-[10px] leading-[150%] tracking-[0] max-w-[520px] text-[#1C2D4F]">
      <p className="m-0">{intro}</p>
      <ul className="mt-3 tablet:mt-2 list-none p-0 m-0 space-y-1">
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
        {/* tablet: iPad portrait zooms the 430px mobile canvas by 1.79-2.38x,
            so the phone's 44px title renders 79-105px and its 14px body 25-33px.
            The card is scaled down ~0.7x here — type, gaps and drawing together,
            so its internal proportions are unchanged. Phones and desktop keep
            their sizes. */}
        {/* Phones stack title → body → drawing in one column; desktop puts the
            title in a fixed 460px column beside the text. iPad portrait gets its
            own two-column split — title and body stacked top-aligned on the
            left, the drawing in a fixed 170px column on the right. The body and
            drawing share a wrapper for the other two layouts, so `tablet:contents`
            dissolves it there and lets both become grid items in their own right;
            explicit col/row starts then place all three. */}
        <div className="mt-6 grid grid-cols-1 tablet:grid-cols-[minmax(0,1fr)_170px] md:grid-cols-[460px_1fr] gap-[14px] tablet:gap-x-[18px] tablet:gap-y-[10px] md:gap-16 tablet:items-start">
          {/* data-card-* mark the three reveal parts; the cover effect fades and
              rises them in as the card comes into view (see revealCard). */}
          <h3
            data-card-title
            className="m-0 text-[44px] tablet:text-[32px] md:text-[58px] font-normal leading-none tracking-[-0.01em] tablet:col-start-1 tablet:row-start-1"
            style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
          >
            {title}
          </h3>
          <div className="tablet:contents">
            <div data-card-body className="tablet:col-start-1 tablet:row-start-2">
              {isValues ? (
                <ValuesContent intro={values.intro} items={values.items} />
              ) : (
                <p className="m-0 text-[14px] tablet:text-[10px] leading-[130%] tracking-[0] max-w-[520px] text-[#1C2D4F]">
                  {description}
                </p>
              )}
            </div>
            <div
              data-card-illustration
              className="mt-10 tablet:mt-0 flex justify-center md:justify-start tablet:justify-start tablet:col-start-2 tablet:row-start-1 tablet:row-span-2 tablet:self-start"
            >
              {illustration}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MissionVisionValues() {
  const scale = useScale(1440, 430)
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
  // Parts of the navy footer panel, animated in the same staggered order the
  // standalone ContactSection uses on interior pages.
  const footerTitleRef = useRef(null)
  const footerDescRef = useRef(null)
  const footerBtnRef = useRef(null)
  const footerAlcoveRef = useRef(null)

  // The navy footer is the fourth layer of the cinematic at every width — it
  // rises to cover Values exactly as Values covered Vision. Only the scale
  // wrapper's sizing still differs by breakpoint (see the render).
  const isDesktop = useIsDesktop()

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
      const layers = [
        missionRef.current,
        visionRef.current,
        valuesRef.current,
        footerRef.current,
      ].filter(Boolean)

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
      gsap.set(footerRef.current, { yPercent: 100 })

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

      // T3 — Values drifts up as the footer arrives, exactly like Mission and
      // Vision before it, so the last handover carries the same motion as the
      // two the reader has already seen.
      tl.to(valuesRef.current, { yPercent: DRIFT, duration: 1 }, 2)

      if (isDesktop) {
        // Footer mirrors Values' early rise, one beat later: PEEK% up by t=2.
        tl.to(footerRef.current, { yPercent: 0, duration: riseDur }, 3 - riseDur)
      } else {
        // Mobile: the footer is a 553px strip rather than a full panel, so it
        // rises across the last beat with no PEEK head start — its edge would
        // otherwise show while Values was still arriving. yPercent is relative
        // to the strip's own height, so 100 parks it just below the stage.
        tl.to(footerRef.current, { yPercent: 0, duration: 1 }, 2)
      }

      // Footer (last layer) settles docked; the sticky stage releases at the
      // section end, so the footer holds full-screen as the page bottom.

      // ── Layer content entrance ─────────────────────────────────────────────
      // The house fade+rise from motion.js (REVEAL), same as the About and
      // Contact pages: title and body together, then the illustration a moment
      // behind them.
      //
      // Scroll-driven, not time-based. These layers can't use useRevealOnScroll —
      // they sit stacked at inset-0 and are moved by the cover scrub, so
      // ScrollTrigger can't read "this element is 80% up the viewport" off the
      // layout. But a wall-clock tween is wrong here for a second reason: the
      // cover is a pure function of scroll, and a card's whole turn is only ~one
      // beat of scrolling, so a 1.2s entrance loses the race at any real
      // scrolling speed — flick into the section and the card docks (or is
      // covered again) while its text is still at opacity 0, a blank slab.
      // Running the entrance off the same scroll axis as the cover ties it to
      // the layer it belongs to: each part is fully in exactly when its layer
      // docks, whatever the scroll speed.
      if (prefersReducedMotion()) return

      const IN_VIEW_AT = 80 // matches REVEAL.start ('top 80%'), expressed as % of the viewport
      const beats = tl.duration()

      // Scroll offset of a beat on the cover timeline, as a ScrollTrigger
      // position. Functional so a resize re-measures instead of keeping a stale
      // pixel offset; `top+=X top` is reached once the scroll passes the
      // section's start by X — the same axis the cover timeline scrubs on.
      const atBeat = (beat) => () => {
        const range = sectionRef.current.offsetHeight - window.innerHeight
        return `top+=${(beat / beats) * range} top`
      }

      // A layer comes into view one of two ways, so its window opens
      // accordingly:
      //   • While the section itself is still scrolling up into place, the whole
      //     stage rides in. A layer parked at y0% of the stage is 80% up the
      //     viewport when the section's top is (80 - y0)% down it — Mission
      //     (y0 0) gets the plain 'top 80%', Vision (already peeking) a later
      //     one.
      //   • A layer that starts fully below the fold (Values, the footer) only
      //     appears once the stage is pinned and the scrub lifts it, so its
      //     window opens at the beat at which THIS timeline puts its top edge on
      //     the mark.
      const startFor = (y0, t0, t1) =>
        y0 < IN_VIEW_AT
          ? `top ${IN_VIEW_AT - y0}%`
          : atBeat(t0 + (1 - IN_VIEW_AT / y0) * (t1 - t0))

      // Each part takes 0.7 of its layer's entrance window, so the last one in
      // (offset 0.3) still lands exactly as the layer docks.
      const PART_SPAN = 0.7
      const revealLayer = (parts, start, end) => {
        const items = parts.filter(([el]) => el)
        if (!items.length) return
        const enter = gsap.timeline({ paused: true })
        items.forEach(([el, at]) =>
          enter.from(
            el,
            { opacity: 0, y: REVEAL.y, duration: PART_SPAN, ease: cubicEase },
            at
          )
        )

        // Ratcheted rather than scrubbed: the entrance follows the scroll on the
        // way in, but the playhead only ever moves forward. A plain scrub is
        // reversible, so coming back up from the footer would fade every card's
        // content out again — an entrance should happen once, and content the
        // reader has already arrived at should stay put.
        let peak = 0
        const advance = (self) => {
          if (self.progress > peak) enter.progress((peak = self.progress))
        }
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start,
          end,
          onUpdate: advance,
          // onUpdate only runs while the scroll is inside the window. A flick can
          // clear the whole window between two frames, and a reload can land past
          // it outright, so leaving and refreshing have to advance it too — both
          // report progress 1 from beyond the end.
          onLeave: advance,
          onRefresh: advance,
        })
      }

      const cardParts = (cardEl) =>
        cardEl
          ? [
              [cardEl.querySelector('[data-card-title]'), 0],
              [cardEl.querySelector('[data-card-body]'), 0.1],
              // The drawing trails its own title and body.
              [cardEl.querySelector('[data-card-illustration]'), 0.3],
            ]
          : []

      // Mission is docked from the section's first frame, Vision rides in
      // already peeking and docks at beat 1, Values climbs in partway through
      // its own rise and docks at beat 2.
      revealLayer(cardParts(missionRef.current), startFor(0, 0, 1), atBeat(0))
      revealLayer(cardParts(visionRef.current), startFor(100 - PEEK, 0, 1), atBeat(1))
      revealLayer(cardParts(valuesRef.current), startFor(100, 2 - riseDur, 2), atBeat(2))

      // The navy footer is not a card: it gets the shared ContactFooterPanel
      // entrance (revealFooterPanel), so the home page's footer animates exactly
      // like the one on every interior page.
      //
      // Only the trigger differs: it is an absolutely-positioned layer the scrub
      // moves, so its own rect can't say where it is — it fires instead at the
      // scroll offset where THIS timeline puts its top edge on that same 80%
      // line. Desktop's layer is as tall as the stage, so startFor covers it.
      // The mobile strip is not, so its top sits at (100 − h) + yPercent·h
      // percent of the stage; with yPercent running 100→0 across beat 2→3 that
      // crosses the line at beat 2 + (100 − IN_VIEW_AT)/h. Measured live, so a
      // different viewport or rewrapped CMS copy re-derives it on refresh.
      const stripStart = () => {
        const h = (footerRef.current.offsetHeight / stickyRef.current.offsetHeight) * 100
        return atBeat(Math.min(3, 2 + (100 - IN_VIEW_AT) / h))()
      }
      revealFooterPanel(
        [
          footerTitleRef.current,
          footerDescRef.current,
          footerBtnRef.current,
          footerAlcoveRef.current,
        ],
        sectionRef.current,
        isDesktop ? startFor(100, 3 - riseDur, 3) : stripStart
      )
    })

    return () => ctx.revert()
    // Nothing in here branches on the breakpoint any more, but the scale
    // wrapper's sizing does, so a flip changes the stage geometry underneath
    // these triggers — rebuild rather than rely on a refresh catching it.
  }, [isDesktop])

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
              width: isDesktop && scale >= 1 ? '100%' : `${100 / scale}%`,
              marginLeft: isDesktop && scale >= 1 ? '0' : `${(100 - 100 / scale) / 2}%`,
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
                    <img
                      src={mvv.mission.image}
                      alt=""
                      className="w-full max-w-[313px] tablet:max-w-[170px] h-auto"
                    />
                  ) : (
                    // tablet sizes keep each drawing's own viewBox ratio inside
                    // the 170px right-hand column, so nothing letterboxes.
                    <MissionIllustration className="w-[280px] h-[300px] tablet:w-[170px] tablet:h-[179px] max-w-full" />
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
                    <img
                      src={mvv.vision.image}
                      alt=""
                      className="w-full max-w-[313px] tablet:max-w-[170px] h-auto"
                    />
                  ) : (
                    <VisionIllustration className="w-[480px] h-[240px] tablet:w-[170px] tablet:h-[88px] max-w-full" />
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
                    <img
                      src={mvv.values.image}
                      alt=""
                      className="w-full max-w-[313px] tablet:max-w-[170px] h-auto"
                    />
                  ) : (
                    <ValuesIllustration className="w-[480px] h-[320px] tablet:w-[170px] tablet:h-[113px] max-w-full" />
                  )
                }
              />
              {/* Desktop: the navy footer is the final rising cover layer — same
                solid full-panel treatment as the cards, one z-layer above
                Values. Mobile renders its own strip outside this wrapper. */}
              {isDesktop && (
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
                  <ContactFooterPanel
                    cta={cta}
                    fitMobile
                    centerDesktop
                    titleRef={footerTitleRef}
                    descRef={footerDescRef}
                    buttonRef={footerBtnRef}
                    alcoveRef={footerAlcoveRef}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Mobile: the footer keeps the design's 553px frame and rides up over
              the docked Values card as a strip pinned to the stage bottom —
              rather than a fourth full-screen panel. It sits outside the scale
              wrapper on purpose: the 553px and the panel's other mobile values
              are authored in real pixels, and the wrapper's width/430 scale
              would shrink them. */}
          {!isDesktop && (
            <div
              ref={footerRef}
              style={{ zIndex: 40 }}
              className="absolute inset-x-0 bottom-0 h-[553px] will-change-transform"
            >
              <ContactFooterPanel
                cta={cta}
                fitMobile
                fillMobile
                centerDesktop
                titleRef={footerTitleRef}
                descRef={footerDescRef}
                buttonRef={footerBtnRef}
                alcoveRef={footerAlcoveRef}
              />
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default MissionVisionValues