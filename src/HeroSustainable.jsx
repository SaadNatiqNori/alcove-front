import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { IoArrowForward } from 'react-icons/io5'
import logo from './assets/Logo.svg'
import avenueViz from './assets/avenuesvg.svg'
import { HERO_INTRO, offscreenBelow } from './motion'
import { useScale, useIsDesktop, useIsTabletPortrait } from './useScale'
import { useContent } from './api'

// iPad Pro 11" portrait — the canvas the tablet hero is designed on. Unlike the
// rest of the site (which zooms the 430px phone canvas on tablet, see
// TABLET_REF), the hero has its own iPad design: a two-column layout with the
// description and featured card stacked to the right of the headline. Every
// `tablet:` value below is therefore a raw px measurement off that 834x1194
// artboard, and the section zooms it to whichever iPad it is on.
//
// One caveat throughout: the artboard's text frames are cap-height trimmed, so
// its numbers are cap-to-cap distances, while CSS measures line boxes (which
// include the half-leading, the ascender above the caps and the descender below
// them). Every `tablet:` gap that meets text is therefore the design value minus
// that trim, measured from the live font — e.g. the card's 16px label→title gap
// is 9.42px of CSS gap. The comments below carry the arithmetic; do not "tidy"
// them back to the round Figma numbers or the spacing grows by 4-7px a seam.
const TABLET_HERO_REF = 834

const HERO_FALLBACK = {
  headline: ['Shaping the Future', 'Of Sustainable Spaces'],
  description:
    'Innovative real estate developments designed with sustainability in mind, creating lasting value and vibrant communities across the Kurdistan Region.',
  featured: { eyebrow: 'FEATURED PROJECTS', title: 'Second Avenue', slug: 'second-avenue' },
}

function HeroSustainable() {
  const scale = useScale(1440, 430, TABLET_HERO_REF)
  const isDesktop = useIsDesktop()
  const isTabletPortrait = useIsTabletPortrait()
  const home = useContent('home', { hero: HERO_FALLBACK })
  const hero = home.hero ?? HERO_FALLBACK
  // Per-field merge: the API omits featured fields when no project is
  // flagged for the hero card, so missing ones fill in from the fallback.
  const featured = { ...HERO_FALLBACK.featured, ...(hero.featured ?? {}) }
  // The card deep-links to the featured project when the CMS provides a slug.
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

  // The featured card is the one element the tablet design MOVES: on phones and
  // desktop it floats over the wordmark (absolute, positioned against the
  // wordmark box), while on iPad it sits in flow under the description as the
  // bottom of the right-hand column. That is a different parent, not a different
  // set of offsets, so the two live at two call sites below — only the root
  // className differs, and whichever one renders owns `cardRef`.
  const featuredCard = (rootClassName) => (
    <CardTag
      ref={cardRef}
      {...(featured.slug
        ? { to: `/projects/${featured.slug}`, 'aria-label': `View project: ${featured.title}` }
        : {})}
      className={rootClassName}
    >
      <div className="flex justify-between items-start relative -top-2 tablet:top-0">
        {/* gap: the design's 16px label→title cap gap, less the 1.3px the label's
            line box hangs below its caps (2px, pulled back by the 0.7px optical
            nudge on the label span) and the 4.58px the 20px/115% title's line box
            adds above its own. */}
        <div className="tablet:flex tablet:flex-col tablet:gap-[10.12px]">
          <p className="m-0 inline-flex items-center gap-[6px] font-['Akkurat_Mono',monospace] text-[8px] tablet:text-[10px] font-medium uppercase leading-none tracking-normal text-[#13294B]">
            <span className="inline-block w-[6px] h-[6px] tablet:w-[6.8px] tablet:h-[6.8px] rounded-full bg-[#13294B]" />
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
        <div className="w-[19px] h-[19px] tablet:w-[18.13px] tablet:h-[18.13px] relative top-1.5 tablet:top-0 gap-[5px] tablet:gap-[5.66px] p-1 tablet:p-[4.53px] rounded-[35px] tablet:rounded-[39.65px] border-[0.5px] tablet:border-[0.57px] border-[#1C2D4F66] flex items-center justify-center shrink-0 transition-colors duration-500 ease-out group-hover:bg-[#1C2D4F] group-hover:border-[#1C2D4F]">
          <IoArrowForward
            className="tablet:text-[9.06px] text-[#1C2D4F] transition-colors duration-500 ease-out group-hover:text-[#E2EAF2]"
            aria-hidden="true"
          />
        </div>
      </div>

      <img
        src={featured.image || avenueViz}
        alt=""
        aria-hidden="true"
        className="w-full h-auto"
      />
    </CardTag>
  )

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
          // Exposed for consistency with the other scaled sections, which use it
          // to convert viewport units into canvas px. Nothing in this section
          // reads it any more: both the phone and the iPad top padding are flat
          // canvas px (see the padding rules on <main>).
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
          // The 40px bottom pad is the shared mobile wordmark gap — it is canvas
          // px, so it renders as 40 × width/430, matching the footer's
          // min(40px, 9.3023vw) (see ContactFooterPanel). Flat, not vh-clamped:
          // the top padding is the one that yields space on short screens.
          // tablet: canvas px off the 834x1194 artboard — 39.83px gutters, and
          // 238.88px of top pad, which is the design's 255.14px cap line less the
          // 16.26px the 77px headline's line box adds above its caps.
          // Both tablet pads are min(designPx, equivalent-vh) for the same reason
          // the mobile ones are: the tablet stack below the top pad is a fixed
          // ~810px (headline + description column + card + wordmark, none of it
          // compressible), so it only fits the full 1194px artboard. A real iPad
          // in Safari gives ~950-1060px of canvas once the address bar and tab
          // strip are out, and the overflow came off the BOTTOM — the wordmark
          // was clipped by the section's overflow-hidden. The vh terms are the
          // design px over the 1194px reference canvas (238.88/1194 = 20.007%,
          // 41.4/1194 = 3.467%), so both are exact at the artboard height and
          // yield space proportionally on anything shorter. Pairs with the
          // description→card gap, which is clamped the same way.
          className="relative h-full max-w-[1440px] mx-auto flex flex-col bg-[#E2EAF2] px-4 tablet:px-[39.83px] max-md:pb-[40px] tablet:[padding-bottom:min(41.4px,3.467vh)] max-md:[padding-top:min(196px,21.031vh)] tablet:[padding-top:min(238.88px,20.007vh)] text-[#1C2D4F] md:px-[38px] md:pb-[40px] md:pt-[200.69px]"
        >
          {/* tablet: this column takes all the leftover height (`flex-1`) and the
              description block inside it is pushed to the bottom with `mt-auto`,
              so the ONE dynamic gap in the tablet hero is headline→description:
              170px on the 1194px design canvas, ~88px on the shorter iPad mini /
              12.9" canvases. Everything from the description down is fixed and
              anchored to the wordmark at the bottom edge. */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-[60px] tablet:gap-0 tablet:flex-1 md:gap-8">
            <h1
              ref={headlineRef}
              // tablet: 77px/115% in a 618px box, which is exactly wide enough
              // to keep "Shaping the Future" on one line and wrap the rest into
              // "Of Sustainable" / "Spaces" — the design's three-line stack, from
              // the same unsplit CMS string the phone layout wraps naturally.
              className="m-0 text-[56px] tablet:text-[77px] tablet:w-[618px] not-italic leading-[104%] tablet:leading-[115%] tracking-[-0.02em] md:text-[48px] md:leading-[115%]"
              style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
            >
              {hero.headline[0]}
              {/* Desktop keeps the CMS two-line split; mobile lets the full
                  headline wrap naturally into a taller stack. */}
              {' '}
              <br className="hidden md:block" />
              {hero.headline[1]}
            </h1>

            {/* tablet: the right-hand column is the card's width (257.19px) held
                15.98px off the gutter so its right edge lands on the design's
                778.19px and its left on 521px; the description is the narrower
                207.55px block inside it. 16px/125%: the artboard reports the type
                as 16px/100%, but 100% would be 16px of leading, which stacks the
                six lines 96px tall — the artboard's own block is 112px, and 20px
                of leading is what puts it there. */}
            <div className="w-[55%] self-end tablet:w-[257.19px] tablet:mr-[15.98px] tablet:mt-auto md:w-auto md:self-auto md:max-w-[233px] md:mr-[84px]">
              <p
                ref={descriptionRef}
                className="m-0 text-[15px] tablet:text-[16px] tablet:w-[207.55px] font-normal leading-[1.35] tablet:leading-[125%] tracking-[0] text-[#1C2D4F] md:text-[14px] md:leading-4"
                style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
              >
                {hero.description}
              </p>

              {/* relative z-10: the card overlaps the wordmark, and the wordmark's
                  wrapper is `relative`, so a static card here would be painted
                  UNDER the letters — the "OVE" drew over it. The wrapper has no
                  z-index of its own, so z-10 is enough to sit the card on top.
                  mt: the design's 100px description→card gap, less the 4px the
                  16px/20px description's last line box hangs below its baseline —
                  clamped to its share of the 1194px reference canvas (96/1194 =
                  8.04%) so it gives up height on a short iPad canvas alongside
                  the two pads on <main>, rather than pushing the wordmark off
                  the bottom edge.
                  gap: the 27.19px card-title→illustration gap, less the 4px that
                  title's line box hangs below ITS baseline. pt/pb are the single
                  19.26px padding, the top one less the 1.6px the label row keeps
                  above its dot and cap line. */}
              {isTabletPortrait &&
                featuredCard(
                  'relative z-10 flex [margin-top:min(96px,8.04vh)] w-[257.19px] flex-col gap-[23.19px] rounded-[4.53px] px-[13.6px] pt-[17.66px] pb-[19.26px] bg-[#13294B]/10 backdrop-blur-[50px] group transition-[backdrop-filter,background-color] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#13294B]/20 hover:backdrop-blur-[100px]'
                )}
            </div>
          </div>

          {/* The wordmark stays pinned near the hero bottom (108.6px via main's
              pb); the auto top margin absorbs viewport slack, so the desc→logo
              gap is 71px at the design's reference height and grows on taller
              screens rather than leaving dead space under the wordmark. */}
          {/* tablet: the column above already ate the free height, so `mt-auto`
              resolves to 0 and the negative margin pulls the wordmark up under
              the card by the design's 28.79px — the overlap that lets the card
              sit over the top of "OVE". Any extra card height (CSS has no
              cap-height trim, so it runs a little taller than the artboard) is
              spent upward into the dynamic gap, leaving this overlap and the
              wordmark's bottom edge fixed. */}
          <div className="relative mt-auto tablet:mt-[-28.79px]">
            <div
              ref={alcoveRef}
              className="w-full aspect-[64/13] max-md:aspect-auto max-md:h-[110px] tablet:h-[153.84px]"
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

            {!isTabletPortrait &&
              featuredCard(
                'hidden md:flex absolute left-4 right-[52px] bottom-[calc(100%-16px)] max-md:[@media(max-height:700px)]:bottom-4 top-auto md:left-auto md:right-[6%] md:bottom-auto md:top-[-80px] w-auto md:w-[233px] flex-col gap-4 rounded-[4px] px-3 py-[17px] bg-[#13294B]/10 backdrop-blur-[50px] group transition-[backdrop-filter,background-color] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#13294B]/20 hover:backdrop-blur-[100px]'
              )}
          </div>
        </main>
      </div>
    </section>
  )
}

export default HeroSustainable
