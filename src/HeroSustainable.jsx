import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { IoArrowForward } from 'react-icons/io5'
import logo from './assets/Logo.svg'
import avenueViz from './assets/avenuesvg.svg'
import { HERO_INTRO, offscreenBelow } from './motion'
import { useScale, useIsDesktop } from './useScale'
import { useContent } from './api'

const HERO_FALLBACK = {
  headline: ['Shaping the Future', 'Of Sustainable Spaces'],
  description:
    'Innovative real estate developments designed with sustainability in mind, creating lasting value and vibrant communities across the Kurdistan Region.',
  featured: { eyebrow: 'RECENT PROJECTS', title: 'Second Avenue', slug: 'second-avenue' },
}

function HeroSustainable() {
  const scale = useScale(1440, 430)
  const isDesktop = useIsDesktop()
  const home = useContent('home', { hero: HERO_FALLBACK })
  const hero = home.hero ?? HERO_FALLBACK
  // Per-field merge: the API omits featured fields when no project is
  // flagged as recent, so missing ones fill in from the fallback.
  const featured = { ...HERO_FALLBACK.featured, ...(hero.featured ?? {}) }
  // The card deep-links to the recent project when the CMS provides a slug.
  const CardTag = featured.slug ? Link : 'div'
  const headlineRef = useRef(null)
  const descriptionRef = useRef(null)
  const alcoveRef = useRef(null)
  const cardRef = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Measured first, while the layout is still untransformed.
      const alcoveTravel = offscreenBelow(alcoveRef.current)

      // The wordmark is a pure slide, no fade, starting fully below the bottom
      // of the screen — the viewport edge is the only thing clipping it, so it
      // rises in from off-screen rather than out of a box.
      gsap.set(alcoveRef.current, { y: alcoveTravel })
      // The card only nudges: a 10px fade-up from where it already sits, so it
      // settles onto the wordmark instead of travelling with it.
      gsap.set(cardRef.current, { y: 60, opacity: 0 })
      // Headline and description keep the original slide-fade.
      gsap.set([headlineRef.current, descriptionRef.current], {
        y: 80,
        opacity: 0,
      })

      const { duration, ease } = HERO_INTRO
      gsap
        .timeline({ delay: HERO_INTRO.delay })
        // Position 0: in lockstep with the navbar, which runs the same values
        // in the opposite direction from the top edge.
        .to(alcoveRef.current, { y: 0, duration, ease }, 0)
        // Then the content, 0.18s apart against a 1.3s duration — they overlap
        // heavily, so it reads as one continuous rise, not separate pops.
        .to(headlineRef.current, { y: 0, opacity: 1, duration, ease }, 0.18)
        .to(descriptionRef.current, { y: 0, opacity: 1, duration, ease }, 0.36)
        .to(cardRef.current, { y: 0, opacity: 1, duration, ease }, 0.54)
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      className="relative w-full h-screen overflow-hidden bg-[#E2EAF2]"
      aria-label="Hero"
    >
      <div
        className="scale-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: isDesktop && scale >= 1 ? '100%' : `${100 / scale}%`,
          marginLeft: isDesktop && scale >= 1 ? '0' : `${(100 - 100 / scale) / 2}%`,
          height: `${100 / scale}vh`,
          // Exposed so the mobile top padding can measure the CANVAS height
          // rather than the raw viewport — see the padding rule on <main>.
          '--scale': scale,
        }}
      >
        <main
          // The navbar now scales with the same 1440 lock as this content, so the
          // top padding is a plain canvas value (75px navbar + 125.69px gap) that
          // scales uniformly with everything else — no /scale compensation.
          // Mobile top padding is min(designPx, equivalent-vh): it equals the
          // design value at the 932px reference height (so the iPhone 14 Pro Max
          // view is untouched) but shrinks on shorter viewports (e.g. iPhone SE,
          // 667px) so the top nav-clearance yields space instead of collapsing
          // the description→wordmark gap. Pairs with the width scale-lock above.
          // The vh term is divided by --scale because everything here is authored
          // in canvas px: a raw vh measures the physical viewport, so on a zoomed
          // canvas (iPad portrait, ~619 canvas px tall inside an 1180px screen)
          // the rule thought it had 1180px of room, never yielded, and pushed the
          // wordmark off the bottom. /var(--scale) converts vh into canvas px.
          // The 40px bottom pad is the shared mobile wordmark gap — it is canvas
          // px, so it renders as 40 × width/430, matching the footer's
          // min(40px, 9.3023vw) (see ContactFooterPanel). Flat, not vh-clamped:
          // the top padding is the one that yields space on short screens.
          className="relative h-full max-w-[1440px] mx-auto flex flex-col bg-[#E2EAF2] px-4 max-md:pb-[40px] max-md:[padding-top:min(196px,21.031vh)] tablet:[padding-top:min(196px,calc(21.031vh_/_var(--scale,1)))] text-[#1C2D4F] md:px-[38px] md:pb-[40px] md:pt-[200.69px]"
        >
          {/* tablet: iPad portrait's canvas is proportionally shorter than any
              phone's (573-619 canvas px vs 665-930), so the phone stack
              overflows by ~72px. The headline→description gap and the wordmark
              below give that back; phones and desktop keep their values. */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-[60px] tablet:gap-[30px] md:gap-8">
            <h1
              ref={headlineRef}
              // tablet: the headline is the largest single block in the hero
              // (233 of the mini's 573 canvas px). iPad portrait's canvas is
              // proportionally shorter than any phone's, so trimming it here
              // buys back the room instead of squeezing the wordmark into the
              // description. Phones and desktop keep their sizes.
              className="m-0 text-[56px] tablet:text-[44px] not-italic leading-[104%] tracking-[-0.02em] md:text-[48px] md:leading-[115%]"
              style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
            >
              {hero.headline[0]}
              {/* Desktop keeps the CMS two-line split; mobile lets the full
                  headline wrap naturally into a taller stack. */}
              {' '}
              <br className="hidden md:block" />
              {hero.headline[1]}
            </h1>

            <div className="w-[55%] self-end md:w-auto md:self-auto md:max-w-[233px] md:mr-[84px]">
              <p
                ref={descriptionRef}
                className="m-0 text-[15px] font-normal leading-[1.35] tracking-[0] text-[#1C2D4F] md:text-[14px] md:leading-4"
                style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
              >
                {hero.description}
              </p>
            </div>
          </div>

          {/* The wordmark stays pinned near the hero bottom (108.6px via main's
              pb); the auto top margin absorbs viewport slack, so the desc→logo
              gap is 71px at the design's reference height and grows on taller
              screens rather than leaving dead space under the wordmark. */}
          <div className="relative mt-auto">
            <div
              ref={alcoveRef}
              className="w-full aspect-[64/13] max-md:aspect-auto max-md:h-[110px] tablet:h-[86px]"
              style={{
                WebkitMaskImage: `url("${logo}")`,
                maskImage: `url("${logo}")`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                backgroundColor: '#1C2D4F',
              }}
              role="img"
              aria-label="Alcove"
            />

            <CardTag
              ref={cardRef}
              {...(featured.slug
                ? { to: `/projects/${featured.slug}`, 'aria-label': `View project: ${featured.title}` }
                : {})}
              className="hidden md:flex absolute left-4 right-[52px] bottom-[calc(100%-16px)] max-md:[@media(max-height:700px)]:bottom-4 top-auto md:left-auto md:right-[6%] md:bottom-auto md:top-[-80px] w-auto md:w-[233px] flex-col gap-4 rounded-[4px] px-3 py-[17px] bg-[#13294B]/10 backdrop-blur-[50px] group transition-[backdrop-filter,background-color] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#13294B]/20 hover:backdrop-blur-[100px]"
            >
              <div className="flex justify-between items-start relative -top-2">
               <div>
                  <p className="m-0 inline-flex items-center gap-[6px] font-['Akkurat_Mono',monospace] text-[8px] font-medium uppercase leading-none tracking-normal text-[#13294B]">
                    <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#13294B]" />
                    {/* Akkurat Mono's cap ink sits ~0.7px above the line-box center at 8px/100%;
                        nudge the label down so it optically centers with the dot. */}
                    <span className="relative top-[0.7px]">{featured.eyebrow}</span>
                  </p>
                  <h3
                    className="m-0 text-[20px] md:text-[24px] font-[420] leading-[115%] tracking-[-0.02em] text-[#13294B]"
                    style={{ fontFamily: "'Season Mix-TRIAL', serif" }}
                  >
                    {featured.title}
                  </h3>
               </div>
                <div className="w-[19px] h-[19px] relative top-1.5 gap-[5px] p-1 rounded-[35px] border-[0.5px] border-[#1C2D4F66] flex items-center justify-center shrink-0 transition-colors duration-500 ease-out group-hover:bg-[#1C2D4F] group-hover:border-[#1C2D4F]">
                  <IoArrowForward className=" text-[#1C2D4F] transition-colors duration-500 ease-out group-hover:text-[#E2EAF2]" aria-hidden="true" />
                </div>
              </div>

             

              <img
                src={featured.image || avenueViz}
                alt=""
                aria-hidden="true"
                className="w-full h-auto"
              />
            </CardTag>
          </div>
        </main>
      </div>
    </section>
  )
}

export default HeroSustainable
