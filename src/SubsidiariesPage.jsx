import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IoArrowBack } from 'react-icons/io5'
import ContactSection from './ContactSection'
import { ScaleLock } from './ScaleLock'
import logoYellow from './assets/LogoYellow.svg'
import { cubicEase } from './easings'
import { useRevealOnScroll, prefersReducedMotion, REVEAL } from './motion'
import { useContent } from './api'
import { DESKTOP_MIN } from './breakpoints'
import { useIsTabletPortrait } from './useScale'

const SUBS_FALLBACK = {
  title: 'Subsidiaries',
  intro: 'Alcove operates through three distinct subsidiaries:',
  items: [
    { icon: 'construction', title: 'Construction', description: 'Delivering innovative and high-quality construction' },
    { icon: 'development', title: 'Development', description: 'Leading large-scale development projects to transform urban spaces.' },
    { icon: 'properties', title: 'Properties', description: 'Managing a diverse portfolio of residential and commercial properties.' },
  ],
  what: {
    title: ['What', 'ALCOVE does'],
    left: [
      { text: 'ALCOVE is a development company focused on construction and sales. We work on creating projects that are carefully planned, well executed, and positioned to meet both practical and commercial goals. Our role is to turn ideas into developed spaces that offer ' },
      { text: 'quality, function, and value.', variant: 'gold' },
      { text: ' Our work is built on a combination of development expertise and market understanding.' },
    ],
    right: 'On the construction side, we focus on delivering strong, reliable, and high-standard projects. On the sales side, we work to ensure that each development is presented in a way that connects with the market and attracts the right audience. This balanced approach allows us to support the success of a project from the beginning of construction through to final delivery and beyond.',
  },
}

gsap.registerPlugin(ScrollTrigger)

function ConstructionIcon() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-[28px] w-auto"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 54 Q12 32 40 32 Q68 32 68 54" />
      <line x1="8" y1="54" x2="72" y2="54" />
      <path d="M12 54 L12 60 L68 60 L68 54" />
      <rect x="34" y="20" width="12" height="14" />
      <line x1="40" y1="20" x2="40" y2="32" strokeDasharray="2 2" opacity="0.6" />
      <line x1="22" y1="54" x2="22" y2="60" />
      <line x1="58" y1="54" x2="58" y2="60" />
    </svg>
  )
}

function DevelopmentIcon() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-[28px] w-auto"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="18" y="14" width="28" height="56" />
      <rect x="46" y="30" width="20" height="40" />
      <rect x="23" y="22" width="4" height="4" />
      <rect x="30" y="22" width="4" height="4" />
      <rect x="37" y="22" width="4" height="4" />
      <rect x="23" y="32" width="4" height="4" />
      <rect x="30" y="32" width="4" height="4" />
      <rect x="37" y="32" width="4" height="4" />
      <rect x="23" y="42" width="4" height="4" />
      <rect x="30" y="42" width="4" height="4" />
      <rect x="37" y="42" width="4" height="4" />
      <rect x="23" y="52" width="4" height="4" />
      <rect x="30" y="52" width="4" height="4" />
      <rect x="37" y="52" width="4" height="4" />
      <rect x="50" y="38" width="4" height="4" />
      <rect x="57" y="38" width="4" height="4" />
      <rect x="50" y="48" width="4" height="4" />
      <rect x="57" y="48" width="4" height="4" />
      <rect x="50" y="58" width="4" height="4" />
      <rect x="57" y="58" width="4" height="4" />
    </svg>
  )
}

function PropertiesIcon() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-[28px] w-auto"
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 22 L60 22" />
      <path d="M22 28 L58 28" />
      <line x1="26" y1="28" x2="26" y2="62" />
      <line x1="33" y1="28" x2="33" y2="62" />
      <line x1="40" y1="28" x2="40" y2="62" />
      <line x1="47" y1="28" x2="47" y2="62" />
      <line x1="54" y1="28" x2="54" y2="62" />
      <path d="M18 62 L62 62" />
    </svg>
  )
}

function SubsidiaryCard({ icon, title, description }) {
  return (
    <div
      // mx-auto centres the card whenever its cell is wider than the 429px cap.
      // A no-op on phones (the cell is narrower than the cap) and on desktop,
      // where the zigzag cell is exactly 429px.
      //
      // tablet: the card is as wide as its zigzag column allows, up to the
      // tighter 360px cap the column sets — 360 on a 1024 iPad, 310 on a 768
      // one. Because it holds near-desktop width rather than scaling with the
      // page, its contents sit at near-desktop sizes rather than the 0.711 page
      // ratio; a 429px card with 27px type would read half-empty.
      className="flex flex-col rounded-[4px] p-[24px] tablet:p-[32px] md:p-[38px] w-full max-w-[429px] mx-auto"
      style={{ background: '#FFFFFF05' }}
    >
      <div className="h-[19px] tablet:h-[28px] md:h-[28px] flex items-center">{icon}</div>
      <img
        src={logoYellow}
        alt="Alcove"
        className="mt-[16px] tablet:mt-[21px] md:mt-[21px] h-[11px] tablet:h-[15px] md:h-[15px] w-[58px] tablet:w-[74px] md:w-[74px]"
      />
      <h3
        className="m-0 mt-[7px] tablet:mt-[14px] md:mt-[14px] text-[26px] tablet:text-[30px] md:text-[38px] font-normal leading-none tracking-[-0.04em] text-gold"
        style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
      >
        {title}
      </h3>
      <p
        className="m-0 mt-[24px] tablet:mt-[28px] md:mt-[32px] text-[14px] tablet:text-[16px] md:text-[16px] leading-[1.15] tracking-[0] max-w-[257px] text-mist"
        style={{ fontFamily: "'Season Sans-TRIAL', sans-serif", fontWeight: 400 }}
      >
        {description}
      </p>
    </div>
  )
}

const ICON_COMPONENTS = {
  construction: ConstructionIcon,
  development: DevelopmentIcon,
  properties: PropertiesIcon,
}

function SubsidiariesPage() {
  const subs = useContent('subsidiaries', SUBS_FALLBACK)
  const items = subs.items ?? SUBS_FALLBACK.items
  const what = subs.what ?? SUBS_FALLBACK.what
  // Guard against a non-string intro (see the documented data.intro collision)
  // so it can never render as [object Object].
  const intro = typeof subs.intro === 'string' ? subs.intro : SUBS_FALLBACK.intro
  const iconFor = (item) => {
    if (item.image) {
      return (
        <img
          src={item.image}
          alt=""
          className="w-[27px] h-[26px] tablet:w-[52px] tablet:h-[52px] md:w-[52px] md:h-[52px] object-contain"
        />
      )
    }
    const Icon = ICON_COMPONENTS[item.icon] ?? ConstructionIcon
    return <Icon />
  }
  const titleRef = useRef(null)
  const introRef = useRef(null)
  // Cards and the "what we do" panel reveal one by one on scroll. Keyed on the
  // item titles so the reveal re-initialises once CMS content replaces the
  // fallback — otherwise the real cards would inherit a stuck opacity: 0.
  // `each`: the zigzag puts every card in its own vertical band, so each one
  // rises off its own trigger as it enters view (same entrance as the on-load
  // title/intro) instead of the whole grid firing off a shared trigger.
  const revealRef = useRevealOnScroll([items.map((i) => i.title).join('|')], {
    each: true,
  })
  // iPad portrait opts out of the shared tablet zoom lock, exactly as AboutPage
  // does: ScaleLock would otherwise render the 430px mobile canvas at 2.38x,
  // which put a 62px card title on a card ~950px wide. At scale 1 the page lays
  // out 1:1 on the real viewport and every `tablet:` utility below is a true CSS
  // px value — no dividing by the zoom, and no dependence on Safari and Blink
  // agreeing about a scaled canvas.
  const isTablet = useIsTabletPortrait()

  // The centre spine was the one static element among the reveals. It runs the
  // house fade+rise once, on the same trigger and timing as the connector dashes
  // that meet it, so the whole diagram arrives as one piece — no scrub, the line
  // is not a scroll indicator.
  const spineRef = useRef(null)
  useLayoutEffect(() => {
    if (!spineRef.current || prefersReducedMotion()) return
    const mm = gsap.matchMedia()
    mm.add(`(min-width: ${DESKTOP_MIN}px)`, () => {
      gsap.from(spineRef.current, {
        opacity: 0,
        y: REVEAL.y,
        // A touch slower than the house 1.2s: the spine spans the whole grid,
        // so the same duration reads faster on it than on a card.
        duration: REVEAL.duration * 1.4,
        ease: cubicEase,
        scrollTrigger: {
          trigger: spineRef.current,
          start: REVEAL.start,
          once: true,
        },
      })
    })
    return () => mm.revert()
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([titleRef.current, introRef.current], { y: 60, opacity: 0 })
      gsap.to([titleRef.current, introRef.current], {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: cubicEase,
        stagger: 0.08,
        delay: 0.2,
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      <ScaleLock
        as="main"
        viewport="min"
        bg="bg-navy"
        scale={isTablet ? 1 : undefined}
        className="relative text-mist px-4 tablet:px-[24px] pt-[140px] tablet:pt-[128px] pb-24 tablet:pb-[91px] md:px-8 md:pt-[180px] md:pb-32"
      >
        <div ref={revealRef} className="max-w-[1440px] mx-auto">
          <div className="text-center max-w-[356px] tablet:max-w-[500px] md:max-w-[695px] mx-auto">
            <h1
              ref={titleRef}
              className="m-0 text-[36px] tablet:text-[33px] md:text-[46px] font-normal leading-none tracking-[-0.04em] text-gold"
              style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
            >
              {subs.title}
            </h1>
            <p
              ref={introRef}
              className="m-0 mt-2 tablet:mt-1 md:mt-0 text-[17px] tablet:text-[23px] md:text-[32px] leading-[1.15] tracking-[0] text-mist"
              style={{ fontFamily: "'Season Sans-TRIAL', sans-serif", fontWeight: 400 }}
            >
              {intro}
            </p>
          </div>

          <div className="relative mt-24 tablet:mt-[91px] md:mt-32">
            <div
              ref={spineRef}
              aria-hidden="true"
              className="hidden tablet:block md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, #FFFFFF40 0, #FFFFFF40 6px, transparent 6px, transparent 12px)',
              }}
            />

            {/* tablet: the same zigzag as desktop, retuned to 1024 — a 48px
                gutter rather than desktop's 260, so the spine sits 24px off
                each card's inner edge (half the gutter). The cards are capped
                at 360px here rather than desktop's 429 and so no longer span
                the full 976 content width; because they are justified to their
                column's inner edge, all of that slack falls on the outer edges
                and the spine gap stays put at 24px. Keep the
                connectors' `tablet:w-[24px]` in step with half this value. */}
            <div className="relative grid grid-cols-1 tablet:grid-cols-2 md:grid-cols-2 gap-x-[260px] tablet:gap-x-[48px] gap-y-[38px] tablet:gap-y-[57px] md:gap-y-[80px]">
              <div
                data-reveal
                className="relative tablet:w-full tablet:max-w-[360px] tablet:justify-self-end tablet:col-start-1 tablet:row-start-1 md:w-[429px] md:justify-self-end md:col-start-1 md:row-start-1"
              >
                <SubsidiaryCard
                  icon={iconFor(items[0])}
                  title={items[0].title}
                  description={items[0].description}
                />
                <div
                  aria-hidden="true"
                  className="tablet:hidden md:hidden absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-[38px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to bottom, #FFFFFF40 0, #FFFFFF40 6px, transparent 6px, transparent 12px)',
                  }}
                />
                <div
                  aria-hidden="true"
                  className="hidden tablet:block md:block absolute top-1/2 left-full w-[130px] tablet:w-[24px] h-[1px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to right, #FFFFFF40 0, #FFFFFF40 6px, transparent 6px, transparent 12px)',
                  }}
                />
              </div>

              <div
                data-reveal
                className="relative tablet:w-full tablet:max-w-[360px] tablet:justify-self-start tablet:col-start-2 tablet:row-start-2 md:w-[429px] md:justify-self-start md:col-start-2 md:row-start-2"
              >
                <SubsidiaryCard
                  icon={iconFor(items[1])}
                  title={items[1].title}
                  description={items[1].description}
                />
                <div
                  aria-hidden="true"
                  className="tablet:hidden md:hidden absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-[38px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to bottom, #FFFFFF40 0, #FFFFFF40 6px, transparent 6px, transparent 12px)',
                  }}
                />
                <div
                  aria-hidden="true"
                  className="hidden tablet:block md:block absolute top-1/2 right-full w-[130px] tablet:w-[24px] h-[1px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to right, #FFFFFF40 0, #FFFFFF40 6px, transparent 6px, transparent 12px)',
                  }}
                />
              </div>

              <div
                data-reveal
                className="relative tablet:w-full tablet:max-w-[360px] tablet:justify-self-end tablet:col-start-1 tablet:row-start-3 md:w-[429px] md:justify-self-end md:col-start-1 md:row-start-3"
              >
                <SubsidiaryCard
                  icon={iconFor(items[2])}
                  title={items[2].title}
                  description={items[2].description}
                />
                <div
                  aria-hidden="true"
                  className="hidden tablet:block md:block absolute top-1/2 left-full w-[130px] tablet:w-[24px] h-[1px]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(to right, #FFFFFF40 0, #FFFFFF40 6px, transparent 6px, transparent 12px)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Revealed as one block, like the cards above — the panel reads as a
              single card, so staggering its parts would fight that.

              tablet: 768 = 2x360 + the 48px gutter, i.e. exactly the zigzag
              pair's outer edges, so the panel's sides line up with the left
              cards' left edge and the right card's right edge. The 1130px cap
              does that job on desktop but is wider than the 976px tablet
              content box, which would leave the panel full-bleed and the cards
              inset from it. Retune it with the card cap and the gutter. */}
          <div data-reveal className="mt-24 tablet:mt-[165px] md:mt-[232px] max-w-[1130px] tablet:max-w-[768px] mx-auto bg-[#FFFFFF05] rounded-[6px] px-[16px] tablet:px-[50px] py-[54px] tablet:py-[57px] md:px-[70px] md:py-[80px] flex flex-col gap-12 tablet:gap-[50px] md:gap-[70px]">
            <div className="flex gap-[28px]">
              <div
                aria-hidden="true"
                className="w-[1px] shrink-0 self-stretch bg-gold"
              />
              <h2
                className="m-0 text-[28px] tablet:text-[31px] md:text-[44px] font-normal leading-[1.2] tracking-[-0.04em] text-gold"
                style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
              >
                {what.title[0]}
                <br />
                {what.title[1]}
              </h2>
            </div>
            <div className="grid grid-cols-1 tablet:grid-cols-2 md:grid-cols-2 gap-10 tablet:gap-[36px] md:gap-[50px] max-w-[990px]">
              <p
                className="m-0 text-[16px] tablet:text-[18px] md:text-[22px] leading-[1.25] tracking-[0] text-mist max-w-[470px]"
              >
                <span className="opacity-80">
                  {(what.left ?? []).map((seg, i) =>
                    seg.variant === 'gold' ? (
                      <span key={i} className="text-gold">{seg.text}</span>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    )
                  )}
                </span>
              </p>
              <p className="m-0 text-[16px] tablet:text-[18px] md:text-[22px] leading-[1.25] tracking-[0] text-mist max-w-[470px]">
                <span className="opacity-80">{what.right}</span>
              </p>
            </div>
          </div>
        </div>
      </ScaleLock>
      <ContactSection />
    </>
  )
}

export default SubsidiariesPage
