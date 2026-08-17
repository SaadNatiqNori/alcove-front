import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import logoYellow from './assets/LogoYellow.svg'
import { cubicEase } from './easings'
import { useContent } from './api'
import { useScale, useIsDesktop } from './useScale'
import { DESKTOP_QUERY } from './breakpoints'

gsap.registerPlugin(ScrollTrigger)

const INTRO_FALLBACK = {
  text: 'Alcove is a forward-thinking company specializing in real estate Development management of Properties and Construction services in Erbil, Kurdistan Region. With a commitment to building modern, sustainable, and innovative spaces, Alcove is shaping the future of urban living in the region.',
  accentWords: ['Development', 'Properties', 'Construction'],
  cards: [
    {
      title: 'Construction',
      description: 'Delivering innovative and high-quality construction',
    },
    {
      title: 'Development',
      description: 'Leading large-scale development projects to transform urban spaces.',
    },
    {
      title: 'Properties',
      description: 'Managing a diverse portfolio of residential and commercial properties.',
    },
  ],
}

function CardsSection() {
  const scale = useScale(1440, 430)
  const isDesktop = useIsDesktop()
  const home = useContent('home', { intro: INTRO_FALLBACK })
  const intro = home.intro ?? INTRO_FALLBACK
  // Treat empty/blank API values as "not provided" so incomplete CMS data
  // (e.g. an unseeded intro that returns { cards: [] }) falls back to the full
  // hardcoded content instead of wiping the section and breaking its animation.
  const CARDS = intro.cards?.length ? intro.cards : INTRO_FALLBACK.cards
  const ACCENT_WORDS = new Set(
    intro.accentWords?.length ? intro.accentWords : INTRO_FALLBACK.accentWords
  )
  const HERO_TEXT = intro.text?.trim() ? intro.text : INTRO_FALLBACK.text
  // Stable, content-derived keys so the animation re-initializes (against the
  // freshly rendered DOM) whenever the CMS content changes the words or cards.
  // Identical content yields identical keys, so no needless re-runs.
  const cardsKey = CARDS.map((c) => c.title).join('|')
  const accentKey = [...ACCENT_WORDS].join('|')
  const sectionRef = useRef(null)
  const stickyRef = useRef(null)
  const wordRefs = useRef([])
  const accentWordMap = useRef({})
  const heroTextRef = useRef(null)
  const cardsContainerRef = useRef(null)
  const cardTitleRefs = useRef({})
  const cardContentRefs = useRef([])
  const cardLineRefs = useRef([])

  wordRefs.current = []
  accentWordMap.current = {}
  cardContentRefs.current = []
  cardLineRefs.current = []

  // Choreography: the paragraph's line-by-line entrance plays once as the
  // section scrolls in, so the description is readable — and its arrival
  // actually witnessed — by the time the user gets here. A tall outer
  // section then holds a `sticky top-0 h-screen` wrapper in place while the
  // rest — non-accent dissolve, accent words flying into the card titles,
  // lines/descriptions growing in — is scrubbed by scroll. Scrolling back
  // rewinds it; the flying words are absolutely-positioned clones inside the
  // sticky wrapper (which stays in the viewport, not the scrolling outer
  // section), so they can never be stranded over a neighboring section.
  useLayoutEffect(() => {
    const sectionEl = sectionRef.current
    const stickyEl = stickyRef.current
    // Deduped: the push-based ref collectors are reset during render, but React
    // can detach and re-attach refs without re-rendering (StrictMode does this
    // on mount), which appends a second copy of every node. A Set keeps the
    // first occurrence of each, in document order. Without it the paragraph's
    // 41 words arrive as 82 entries and the line grouping below sees each
    // visual line twice — two sets of entrance tweens fighting over the same
    // spans, at two different line indices.
    const unique = (els) => [...new Set(els.filter(Boolean))]
    const allWordEls = unique(wordRefs.current)
    const accentEls = Object.values(accentWordMap.current).filter(Boolean)
    const nonAccentEls = allWordEls.filter((el) => !accentEls.includes(el))
    const heroEl = heroTextRef.current
    const cardsEl = cardsContainerRef.current
    const titleEls = Object.values(cardTitleRefs.current).filter(Boolean)
    const contentEls = unique(cardContentRefs.current)
    const lineEls = unique(cardLineRefs.current)

    if (!sectionEl || !stickyEl || !allWordEls.length) return

    let cancelled = false
    let mm = null
    let resizeTimer = null

    const teardown = () => {
      if (mm) {
        mm.revert()
        mm = null
      }
    }

    const build = () => {
      teardown()
      if (cancelled) return
      mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const clones = []

        // Defensive: clear any flight clones a prior build left behind (e.g. an
        // interrupted/overlapping rebuild) so a rebuild can never stack a second
        // copy of the gold words over the first.
        stickyEl.querySelectorAll('[data-flight-clone]').forEach((c) => c.remove())

        gsap.set(cardsEl, { autoAlpha: 0 })
        gsap.set(titleEls, { opacity: 0 })
        gsap.set(contentEls, { autoAlpha: 0, y: 20 })
        gsap.set(lineEls, { scaleY: 0, transformOrigin: 'top' })

        // Group the masked word spans into visual lines by their wrapper's
        // offsetTop (words sharing a top sit on the same wrapped line). Measured
        // here, where layout is stable (fonts ready, correct scale), so it
        // re-derives whenever wrapping changes on a rebuild.
        const lines = []
        let lastTop = null
        allWordEls.forEach((el) => {
          const top = el.parentElement.offsetTop
          if (lastTop === null || Math.abs(top - lastTop) > 1) {
            lines.push([])
            lastTop = top
          }
          lines[lines.length - 1].push(el)
        })

        // Flight geometry, measured up front (fonts are loaded by now) and
        // before the entrance below applies its start state — the desktop
        // entrance transforms the overflow wrappers, whose rects this reads for
        // the words' settled positions. Offsets are relative to the sticky wrapper
        // (where the clones live), so they stay valid as it sticks — the outer
        // section scrolls past.
        const stickyRect = stickyEl.getBoundingClientRect()
        const flights = CARDS.map((card) => {
          const accentEl = accentWordMap.current[card.title]
          const targetEl = cardTitleRefs.current[card.title]
          if (!accentEl || !targetEl) return null

          const from = accentEl.parentElement.getBoundingClientRect()
          const to = targetEl.getBoundingClientRect()
          const fromStyle = window.getComputedStyle(accentEl)
          const toStyle = window.getComputedStyle(targetEl)
          const fromSize = parseFloat(fromStyle.fontSize)
          const toSize = parseFloat(toStyle.fontSize)

          // Tracking and leading are the two type properties the flight's scale
          // does NOT carry: the clone keeps whatever it was given while it grows
          // into a title authored with different values (on tablet the titles
          // are -0.04em/100% against the copy's -0.01em/110%), so it lands
          // wider and lower than the h3 it hands off to. Take off with the
          // word's own values and tween to the title's.
          //
          // Both stay font-relative (em / unitless) rather than px: the clone's
          // font-size never changes during the flight — only its transform scale
          // does — so a ratio taken against each element's own font-size lands on
          // the title's rendered value automatically. It also sidesteps
          // CSSPlugin's autoRound, which quantizes px values to whole pixels and
          // turned a -0.58px tracking into -1px. A no-op wherever the two agree.
          const px = (v, fallback) => parseFloat(v) || fallback
          const fromTracking = px(fromStyle.letterSpacing, 0) / fromSize
          const toTracking = px(toStyle.letterSpacing, 0) / toSize
          const fromLeading = px(fromStyle.lineHeight, fromSize * 1.2) / fromSize
          const toLeading = px(toStyle.lineHeight, toSize * 1.2) / toSize

          const clone = document.createElement('span')
          clone.setAttribute('data-flight-clone', '')
          clone.textContent = card.title
          Object.assign(clone.style, {
            position: 'absolute',
            left: `${from.left - stickyRect.left}px`,
            top: `${from.top - stickyRect.top}px`,
            fontFamily: "'Season Mix-TRIAL', serif",
            color: 'var(--color-gold)',
            fontSize: `${fromSize}px`,
            fontWeight: '400',
            lineHeight: `${fromLeading}`,
            letterSpacing: `${fromTracking}em`,
            whiteSpace: 'nowrap',
            zIndex: '100',
            pointerEvents: 'none',
            willChange: 'transform',
          })
          stickyEl.appendChild(clone)
          clones.push(clone)
          // The clone lives outside the scale wrapper; mirror its scale so the
          // rendered size matches the word it replaces.
          gsap.set(clone, { scale, transformOrigin: 'top left', autoAlpha: 0 })

          return {
            accentEl,
            targetEl,
            clone,
            dx: to.left - from.left,
            dy: to.top - from.top,
            scaleTo: (toSize / fromSize) * scale,
            toTracking,
            toLeading,
          }
        }).filter(Boolean)

        // The entrance is the one piece of this choreography that differs by
        // width; everything after it is shared. Kept as a single timeline
        // either way so the scrub's `entrance.progress(1)` snap-to-settled
        // keeps working.
        const wide = window.matchMedia(DESKTOP_QUERY).matches

        const entrance = gsap.timeline({
          scrollTrigger: {
            // Desktop triggers off the paragraph, not the section. The section
            // is ~2 viewports tall and the copy is centred in its sticky
            // wrapper, so any percentage measured against the section leaves
            // the paragraph parked at opacity 0 for most of its travel up the
            // screen — a blank navy field where the text plainly already is.
            // Hanging the trigger on the copy itself makes the start mean the
            // one thing that matters: fire the instant the paragraph reaches
            // the viewport, so no part of it is ever on screen unlit. That
            // holds at any viewport height, with no magic number tied to this
            // section's geometry. It lands ~50vh of scroll before the copy is
            // fully in view, which is enough for the tween to be well along by
            // the time it's centred and settled before the pin.
            //
            // Mobile stays on the section at 'top bottom' — a full viewport of
            // run-up. Its copy wraps to ~12 lines, so the entrance runs ~1.8s
            // and needs the room; anything later lets `syncToScrub` snap a
            // barely-started paragraph to visible and dissolve it in the same
            // breath, which reads as a flash.
            trigger: wide ? heroEl : sectionEl,
            start: 'top bottom',
            toggleActions: 'play none none none',
          },
        })

        if (wide) {
          // The paragraph's leading opens wide, then closes back to normal as
          // each line fades in. Line 0 already sits at its settled position, so
          // it only fades; every line below starts pushed down by a gap that
          // grows with depth and closes as the tween plays, which reads as a
          // slide-up. Expressing the collapse as a transform (rather than
          // tweening line-height) keeps it off the layout path — no per-frame
          // reflow, and the word wrapping the flight geometry above depends on
          // can never shift mid-animation.
          //
          // The tween runs on the overflow WRAPPERS, not the word spans inside
          // them: nothing clips the wrappers, so the rise reads as travel
          // rather than a reveal from behind the line. The spans stay free for
          // the scroll dissolve below, which needs the wrapper's clip.
          const GAP = parseFloat(window.getComputedStyle(allWordEls[0]).fontSize) * 0.3
          lines.forEach((line, i) => {
            entrance.fromTo(
              line.map((el) => el.parentElement),
              { opacity: 0, y: i * GAP },
              { opacity: 1, y: 0, duration: 1.15, ease: cubicEase },
              i * 0.06
            )
          })
        } else {
          // Mobile keeps the original masked word-rise. yPercent:100 drops each
          // word its own height below its overflow mask; an extra 2px covers a
          // sub-pixel/descender sliver that peeks through the clip. All lines
          // rise together — no inter-line stagger, so nothing here scales with
          // the line count.
          gsap.set(allWordEls, { yPercent: 100, y: 2 })
          lines.forEach((line) => {
            entrance.to(line, { yPercent: 0, y: 0, duration: 1.1, ease: cubicEase }, 0)
          })
        }

        // Pre-roll before the gold words fly. Kept short so the section reacts
        // almost immediately once it pins — by then the entrance has played and
        // the description has been readable, so any extra hold here just reads
        // as a dead zone.
        const FLY = 0.3

        // The white words dissolve on their own clock, not the scroll's —
        // scrubbing them shows half-clipped glyphs tracking the wheel. The
        // first scroll inside the sticky range dissolves them; returning to
        // its start brings them back. Explicit to-tweens with overwrite (rather
        // than one reversed tween) because fully reversing a from/fromTo
        // reverts to pre-tween inline values rather than the settled state.
        let dissolved = false
        const setDissolved = (on) => {
          if (on === dissolved) return
          dissolved = on
          gsap.to(nonAccentEls, {
            yPercent: on ? -100 : 0,
            // The slide-up alone leaves a faint sliver of the words' glyphs
            // peeking through the bottom of the clip (the mask doesn't fully
            // clip the line box's descender/leading region). Fade opacity to 0
            // alongside the slide so nothing can peek; reversing restores both.
            autoAlpha: on ? 0 : 1,
            duration: 0.8,
            ease: cubicEase,
            overwrite: true,
          })
        }

        // How far into the sticky range (0..1) the user scrolls before the
        // description starts to dissolve. Small on purpose: the copy has been
        // on screen since the section entered, so waiting here just makes the
        // section feel unresponsive. Past it the entrance is forced to settled
        // first — the paragraph must not still be fading in as it dissolves.
        const syncToScrub = (self) => {
          if (self.progress > 0.04) {
            entrance.progress(1)
            setDissolved(true)
          } else {
            setDissolved(false)
          }
        }

        const tl = gsap.timeline({
          defaults: { ease: cubicEase },
          scrollTrigger: {
            // The outer section is taller than the viewport, so the sticky
            // wrapper stays put from 'top top' until 'bottom bottom' — the
            // scrub spans that travel (220vh - 100vh = 120vh desktop, 80vh
            // mobile). The section height carries the desktop/mobile split.
            trigger: sectionEl,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            // Position-aware rather than an onEnter snap: merely reaching the
            // pin no longer cuts the entrance short, so a fast scroller gets to
            // watch it finish on screen. It's forced to settled only where the
            // dissolve actually starts. Also runs on refresh, so a rebuild
            // while the user is already deep in the section lands settled+
            // dissolved instead of replaying the entrance over dissolved copy.
            onRefresh: (self) => syncToScrub(self),
            onUpdate: (self) => syncToScrub(self),
          },
        })

        tl.set(cardsEl, { autoAlpha: 1 }, FLY)

        flights.forEach(({ accentEl, targetEl, clone, dx, dy, scaleTo, toTracking, toLeading }, i) => {
          const start = FLY + i * 0.08
          tl.set(accentEl, { opacity: 0 }, start)
          tl.set(clone, { autoAlpha: 1 }, start)
          tl.to(
            clone,
            {
              x: dx,
              y: dy,
              scale: scaleTo,
              letterSpacing: `${toTracking}em`,
              lineHeight: `${toLeading}`,
              duration: 1.4,
            },
            start
          )
          tl.to(targetEl, { opacity: 1, duration: 0.15 }, start + 1.3)
          tl.to(clone, { autoAlpha: 0, duration: 0.15 }, start + 1.4)
        })

        // Titles with no matching accent word (CMS mismatch) still reveal.
        const flown = new Set(flights.map((f) => f.targetEl))
        const unflown = titleEls.filter((el) => !flown.has(el))
        if (unflown.length) tl.to(unflown, { opacity: 1, duration: 0.3 }, FLY + 1.3)

        tl.to(contentEls, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, FLY + 0.9)
        tl.to(lineEls, { scaleY: 1, duration: 1.4 }, FLY + 0.9)
        // Hold the finished layout for a beat of scroll before unpinning.
        tl.to({}, { duration: 0.5 })

        return () => clones.forEach((c) => c.remove())
      })

      // Reduced motion: no pin, no flight — a plain opacity handoff.
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(allWordEls, { yPercent: 0 })
        gsap.set(cardsEl, { autoAlpha: 0 })
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top 25%',
            toggleActions: 'play none none reverse',
          },
        })
        tl.to(heroEl, { autoAlpha: 0, duration: 0.4, ease: 'none' })
        tl.to(cardsEl, { autoAlpha: 1, duration: 0.4, ease: 'none' }, '<')
      })

      // Built async (after fonts.ready), i.e. AFTER the later sections created
      // their triggers, so re-measure everything now that the clones/timeline
      // exist. The section's height is static CSS (present from first render),
      // so unlike the old pin spacer it needs no sort() to offset triggers
      // below — they already measured the tall section.
      ScrollTrigger.refresh()
    }

    // Flight geometry is measured once per build. Width changes re-run this
    // effect via `scale`; height changes move the vertically-centered cards,
    // so rebuild for those here.
    let lastWidth = window.innerWidth
    let lastHeight = window.innerHeight
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        // Width changes already re-run the whole effect via `scale`, so this
        // handler only needs to catch height changes. On iOS Safari the URL bar
        // toggling on scroll changes innerHeight by ~60-120px on nearly every
        // scroll gesture; rebuilding the timeline for that mid-scroll is what
        // duplicates the flight clones and breaks the animation. So ignore that
        // toolbar band and only rebuild for a genuine layout change (e.g.
        // orientation), which moves the vertically-centered cards enough to
        // matter. Width-driven changes are excluded here since the effect
        // re-runs for them anyway.
        if (window.innerWidth !== lastWidth) {
          lastWidth = window.innerWidth
          lastHeight = window.innerHeight
          return
        }
        if (Math.abs(window.innerHeight - lastHeight) > 150) {
          lastHeight = window.innerHeight
          build()
        }
      }, 200)
    }
    window.addEventListener('resize', onResize)

    // Rect measurements are only trustworthy once the display fonts are in.
    const fontsReady = document.fonts?.ready ?? Promise.resolve()
    fontsReady.then(() => {
      if (!cancelled) build()
    })

    return () => {
      cancelled = true
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      teardown()
    }
  }, [scale, HERO_TEXT, cardsKey, accentKey])

  const words = HERO_TEXT.split(' ')

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[180vh] md:h-[220vh] bg-navy"
      aria-label="Subsidiaries"
    >
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden bg-navy"
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
          {/* tablet: the gutter is the design's 40.48px left inset divided by the
              iPad Pro 11" zoom (834/430 = 1.9395), which the wrapper's scale
              multiplies back out. Shared by the copy and the cards below so both
              sit on the one gutter. */}
          <main className="relative h-full max-w-[1440px] mx-auto flex flex-col bg-navy px-4 pb-8 pt-[88px] tablet:px-[20.87px] tablet:pt-[30px] tablet:pb-4 text-[#d6deea] md:px-8 md:py-12">
          <div className="relative mx-auto flex flex-1 items-center max-w-[1440px] w-full">
            <section ref={heroTextRef} aria-label="Company introduction">
              {/* tablet: iPad portrait zooms the 430px mobile canvas by
                  1.79-2.38x, so the phone's 34px intro renders 61-81px. The
                  tablet trio below is the design's 630px column (÷ the 834/430
                  zoom) plus the size and tracking that reproduce its 12 lines.
                  Only the column is given; the other two are solved, because
                  each word here is an inline-block whose trailing space sits
                  INSIDE it and so counts toward line-fitting — this markup wraps
                  earlier than the same copy as plain text in Figma, and no size
                  matches at the site's usual -0.01em. At the display type's -4%
                  (the tracking the card titles use) sizes 28.5-29.4px canvas all
                  wrap to the design's exact break points; 29 sits mid-band so a
                  small metrics difference in another engine can't tip it. */}
              <p className="m-0 text-[34px] tablet:text-[29px] tablet:max-w-[324.8px] tablet:tracking-[-0.04em] font-normal not-italic leading-[110%] tracking-[-0.01em] md:text-[58px]">
                {words.map((word, i) => {
                  const cleanWord = word.replace(/[.,]/g, '')
                  const isAccent = ACCENT_WORDS.has(cleanWord)
                  return (
                    // tablet: each word is an inline-block, so baseline
                    // alignment makes every line box taller than the
                    // line-height (the strut's descent lands below the box's
                    // baseline) — the copy renders at a ~72px pitch where the
                    // design's 754px over 12 lines wants 62.8. Aligning the
                    // wrappers to the top decouples them from the baseline and
                    // the pitch collapses to the line-height exactly.
                    <span key={i} className="inline-block overflow-hidden tablet:align-top">
                      <span
                        ref={(el) => {
                          if (el) {
                            wordRefs.current.push(el)
                            if (isAccent) accentWordMap.current[cleanWord] = el
                          }
                        }}
                        className={`inline-block ${
                          isAccent
                            ? "text-gold font-['Season_Mix-TRIAL',serif] font-normal tracking-[-0.01em]"
                            : ''
                        }`}
                      >
                        {word}
                      </span>
                      {i < words.length - 1 && ' '}
                    </span>
                  )
                })}
              </p>
            </section>

            <section
              ref={cardsContainerRef}
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 grid grid-cols-1 gap-[74px] md:translate-y-[calc(-50%+48px)] md:gap-0 md:grid-cols-3"
              aria-label="Subsidiaries"
            >
              {CARDS.map((card) => (
                <div
                  key={card.title}
                  className="relative flex flex-col py-0 pl-6 md:h-[534px]"
                >
                  <div
                    ref={(el) => {
                      if (el) cardLineRefs.current.push(el)
                    }}
                    className="absolute left-0 top-0 h-full w-[0.5px] bg-gold"
                  />

                  <p
                    ref={(el) => {
                      if (el) cardContentRefs.current.push(el)
                    }}
                    className="mb-3 text-[16px] leading-none tracking-[-0.01em] text-gold md:text-[22.4px]"
                    style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
                  >
                    <img src={logoYellow} alt="Alcove" className="w-auto h-[14px] tablet:h-[13.13px] md:h-[24px]" />
                  </p>

                  <h3
                    ref={(el) => {
                      if (el) cardTitleRefs.current[card.title] = el
                    }}
                    className="m-0 text-[44px] tablet:text-[27.84px] tablet:leading-[100%] tablet:tracking-[-0.04em] font-normal tracking-[-0.01em] leading-[120%] text-gold md:text-[58px]"
                    style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
                  >
                    {card.title}
                  </h3>

                  <div
                    ref={(el) => {
                      if (el) cardContentRefs.current.push(el)
                    }}
                    // tablet: the design's 52px title-to-description gap is a
                    // CAP_HEIGHT-trimmed distance (title baseline -> description
                    // cap top), but a CSS margin joins line BOXES: pasted in raw
                    // it measured 61.89px cap-to-cap. Subtracting the title's
                    // 3.92px of below-baseline box and the description's 1.18px
                    // of above-cap box leaves 21.71px canvas (42.11 rendered),
                    // which measures 52 cap-to-cap.
                    className="mt-4 tablet:mt-[21.71px] md:mt-auto"
                  >
                    <p className=" w-[80%] pe-4 text-[14px] tablet:text-[8.25px] tablet:leading-[100%] font-normal leading-[140%] tracking-[0] text-mist md:text-[16px] md:leading-[120%]">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </main>
        </div>
      </div>
    </section>
  )
}

export default CardsSection
