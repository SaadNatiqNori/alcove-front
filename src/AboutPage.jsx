import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ContactSection from './ContactSection'
import avenueImage from './assets/AVENUE.jpg'
import { cubicEase } from './easings'
import { useRevealOnScroll } from './motion'
import { useContent } from './api'
import { useScale, useViewportPx, useIsTabletPortrait } from './useScale'

gsap.registerPlugin(ScrollTrigger)

const ABOUT_FALLBACK = {
  hero: {
    badge: 'ABOUT',
    title: 'Get to Know Us',
    subtitle: 'Integrated real estate development focused on sustainability, value, and community.',
  },
  goals: {
    badge: 'GOALS',
    paragraphs: [
      { lead: 'Alcove is a development company delivering integrated projects across construction and sales.', muted: 'We create developments that combine strong execution, commercial value, and long-term performance.' },
      { lead: 'Our approach is built on a clear understanding of the full development cycle,', muted: 'Each project is developed with a focus on quality, efficiency, and market relevance, ensuring it performs both as a built environment and as a commercial asset.' },
    ],
  },
  why: {
    title: ['Why clients should', 'choose ALCOVE'],
    paragraphs: [
      { muted: 'ALCOVE delivers development', rest: 'through an integrated structure combining construction, facility management, sales, marketing, and activation in one unified approach. This ensures projects are managed with clarity, control, and a long-term vision.' },
      { muted: 'Projects are not treated as isolated builds,', rest: 'but as complete commercial and operational environments. From early planning to post-completion, decisions are guided by function, market performance, and long-term value.' },
      { muted: 'This model creates a strong advantage,', rest: 'construction aligns with operational needs, facility management is considered early, and sales and marketing develop alongside the project. The result is a controlled, efficient, and commercially focused approach.' },
      { muted: 'ALCOVE is defined not only by building projects,', rest: 'but by understanding how they succeed after completion, shaping every stage of development.' },
    ],
  },
  strengths: {
    eyebrow: 'Our Strengths',
    title: 'ALCOVE operates across the key disciplines that define successful developments, bringing them together in one structure to ensure consistency, quality, and long-term value.',
    items: [
      { title: 'Construction', description: 'Construction at ALCOVE is driven by precision, reliability, and attention to detail. Projects are delivered with strong execution standards, careful planning, and a clear focus on quality. The goal is not only to complete a project, but to deliver a development that performs well structurally and maintains its value over time.' },
      { title: 'Facility Management', description: 'ALCOVE developments are designed to perform beyond completion. Facility Management is not treated as a separate stage but as a core part of the development process. By understanding how a project will operate after delivery, ALCOVE ensures long-term efficiency, better maintenance standards, and stronger overall performance.' },
      { title: 'Sales', description: 'Sales is integrated into the development strategy from the beginning. Each project is positioned to attract the right audience and achieve strong commercial results. The focus is on understanding the market, presenting projects clearly, and ensuring that every development connects with the right buyers and tenants.' },
      { title: 'Marketing', description: 'Marketing at ALCOVE is focused on building presence, visibility, and strong market positioning. Every project is supported by clear communication strategies that highlight its strengths and create long-term recognition in the market. The objective is not only promotion, but strategic positioning.' },
      { title: 'Activation', description: "ALCOVE developments are supported by activation strategies that bring projects to life. Events, experiences, and engagement initiatives are designed to strengthen visibility, attract visitors, and support tenant performance. Activation is treated as an essential part of a project's success, not an additional feature." },
    ],
  },
}

function Strength({ title, description, index, mobileDivider }) {
  return (
    <div data-reveal className={`relative ${mobileDivider ? "mt-[42px] pt-[42px] border-t-[0.5px] border-white md:mt-0 md:pt-0 md:border-t-0" : ''} ${index > 0 ? "md:ml-[61px] md:pl-[61px] md:before:absolute md:before:left-0 md:before:top-0 md:before:h-full md:before:w-[0.5px] md:before:bg-white md:before:content-['']" : ''}`}>
      <h3 className="m-0 text-[20px] tablet:text-[22px] md:text-[30px] font-normal leading-[1.15] tracking-[-0.6px] text-gold md:whitespace-nowrap">
        {title}
      </h3>
      <p className="mt-[20px] tablet:mt-[16px] md:mt-6 text-[14px] tablet:text-[16px] md:text-[16px] leading-5 tablet:leading-[22px] tracking-[0] text-mist md:w-[356px]">
        {description}
      </p>
    </div>
  )
}

function AboutPage() {
  const about = useContent('about', ABOUT_FALLBACK)
  const hero = about.hero ?? ABOUT_FALLBACK.hero
  const goals = about.goals ?? ABOUT_FALLBACK.goals
  const why = about.why ?? ABOUT_FALLBACK.why
  const strengths = about.strengths ?? ABOUT_FALLBACK.strengths
  const strengthItems = strengths.items ?? ABOUT_FALLBACK.strengths.items
  // Body sections reveal one by one on scroll (the hero keeps its own bespoke
  // mount animation above). Keyed on the strength titles so the reveal
  // re-initialises when CMS content replaces the fallback.
  const revealRef = useRevealOnScroll([
    strengthItems.map((s) => s.title).join('|'),
  ])
  const goalsSectionRef = useRef(null)
  const overlayRef = useRef(null)
  const heroImageRef = useRef(null)
  const heroBadgeRef = useRef(null)
  const heroTitleRef = useRef(null)
  const heroSubtitleRef = useRef(null)
  // Locked to the 1440 canvas via CSS `zoom` rather than the transform-based
  // ScaleLock: this page has two sticky mechanisms (the pinned parallax image
  // and the "why" intro column), and sticky drifts inside a scrolling transform
  // but pins correctly under zoom. zoom is 1 below 768px (mobile untouched).
  //
  // iPad portrait opts out of the zoom entirely (scale 1). The shared tablet
  // lock zooms the 430px mobile canvas by 2.38x there, which rendered this
  // page's type at ~2.4x its phone size — a 105px hero and a Goals section
  // 2.3 screens tall. Sizing it here instead with plain `tablet:` utilities
  // means every value is a true CSS px, so it needs no dividing by the zoom and
  // does not depend on Safari and Blink agreeing about `zoom`, which measured
  // ~2x apart on this wrapper. --bleed/--stage below derive from `scale`, so
  // they become the real viewport and the parallax stage is unaffected.
  const isTablet = useIsTabletPortrait()
  const zoomScale = useScale()
  const scale = isTablet ? 1 : zoomScale
  // One full viewport, expressed in the zoomed canvas's own px. Measured rather
  // than written as `calc(100vw / zoom)`: Chrome and Safari resolve viewport
  // units inside `zoom` differently, and the Safari reading collapsed every
  // full-bleed layer below to 1/zoom of the width — see useViewportPx.
  const viewport = useViewportPx()
  const bleedWidth = `${viewport.width / scale}px`
  const stageHeight = `${viewport.height / scale}px`

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(
        [heroBadgeRef.current, heroTitleRef.current, heroSubtitleRef.current],
        { y: 60, opacity: 0 }
      )
      gsap.to(
        [heroBadgeRef.current, heroTitleRef.current, heroSubtitleRef.current],
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: cubicEase,
          stagger: 0.08,
          delay: 0.2,
        }
      )

      if (heroImageRef.current) {
        // Blur-up reveal: start blurred + slightly scaled (the scale hides the
        // blurred edges so they don't expose the background) then ease to sharp.
        gsap.set(heroImageRef.current, {
          yPercent: 8,
          opacity: 0,
          scale: 1.08,
          filter: 'blur(24px)',
        })
        gsap.to(heroImageRef.current, {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.6,
          ease: cubicEase,
          delay: 0.15,
        })
      }

    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      <main className="bg-mist text-navy">
       {/* zoom locks the 1440 canvas to the viewport while keeping both sticky
           mechanisms below drift-free. --bleed/--stage carry one full viewport
           in canvas px, so the parallax stage and the full-bleed layers stay
           edge-to-edge and full-height under the zoom. */}
       <div
         ref={revealRef}
         style={{ zoom: scale, '--bleed': bleedWidth, '--stage': stageHeight }}
         className="mx-auto w-full max-w-[1440px] md:w-[1440px]"
       >
        <section className="flex flex-col items-center pt-[140px] tablet:pt-[128px] md:pt-[180px] pb-16 tablet:pb-[68px] md:pb-24 px-4 w-full max-w-[1440px] mx-auto">
          <span
            ref={heroBadgeRef}
            className="inline-flex items-center justify-center gap-[10px] rounded-[31px] border-[0.5px] border-deep px-[9px] pb-[7px] pt-[10px] font-['Akkurat_Mono',monospace] text-[14px] font-medium leading-[1.15] tracking-[-0.28px] text-center uppercase text-navy h-[24px]"
          >
            {hero.badge}
          </span>
          <h1
            ref={heroTitleRef}
            className="m-0 mt-[22px] text-center text-[44px] tablet:text-[36px] md:text-[50px] font-normal leading-[1.05] tracking-[-1px] text-navy"
            style={{ fontFamily: "'Season Mix VF', 'Season Mix-TRIAL', serif" }}
          >
            {hero.title}
          </h1>
          <p
            ref={heroSubtitleRef}
            className="m-0 mt-[22px] text-center text-[14px] tablet:text-[16px] md:text-[16px] leading-[1.15] tracking-[-0.16px] max-w-[374px] text-navy"
          >
            {hero.subtitle}
          </p>
        </section>

        <section
          ref={goalsSectionRef}
          className="relative bg-navy"
        >
          <div
            className="sticky top-0 h-[var(--stage)] overflow-hidden bg-mist"
            /* Break the pinned image out to the full viewport width (centered in
               the 1440 canvas via negative margin — no transform/inset, so the
               sticky pin and the blur-up reveal stay intact) so it stays edge-to-
               edge once the zoom locks. --bleed is one viewport in canvas px, so
               it renders as exactly one viewport after the zoom (no overflow). */
            style={{
              width: 'var(--bleed)',
              marginLeft: 'calc((100% - var(--bleed)) / 2)',
            }}
          >
            <img
              ref={heroImageRef}
              src={hero.image || avenueImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Content is pulled back over the sticky image by one stage height; the
              section then grows to 100vh + text height, so the blur overlay always
              ends at the section boundary and never bleeds into the next section. */}
          <div
            className="relative pointer-events-none"
            style={{ marginTop: 'calc(var(--stage) * -1)' }}
          >
            <div className="h-[var(--stage)]" />

            <div className="relative">
              <div
                ref={overlayRef}
                className="absolute bottom-0 pointer-events-none"
                style={{
                  // Starts 70% of a stage above the copy, as -top-[70vh] did.
                  top: 'calc(var(--stage) * -0.7)',
                  // Full-bleed to match the now edge-to-edge pinned image, so the
                  // blur/darken band covers the gutters too (no sharp seam at 1440).
                  width: 'var(--bleed)',
                  left: 'calc((100% - var(--bleed)) / 2)',
                  backdropFilter: 'blur(32px) brightness(0.55)',
                  WebkitBackdropFilter: 'blur(32px) brightness(0.55)',
                  // Smoothstep (S-curve) mask: many stops with no slope kinks so the
                  // blur/darkening eases in continuously and avoids Mach-band "lines".
                  WebkitMaskImage:
                    'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 4%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0.22) 12%, rgba(0,0,0,0.35) 16%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.65) 24%, rgba(0,0,0,0.78) 28%, rgba(0,0,0,0.9) 32%, rgba(0,0,0,0.97) 36%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 100%)',
                  maskImage:
                    'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 4%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0.22) 12%, rgba(0,0,0,0.35) 16%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.65) 24%, rgba(0,0,0,0.78) 28%, rgba(0,0,0,0.9) 32%, rgba(0,0,0,0.97) 36%, rgba(0,0,0,1) 40%, rgba(0,0,0,1) 100%)',
                }}
              />

              <div className="relative px-4 pt-40 tablet:pt-[148px] md:pt-52 pb-12 tablet:pb-[46px] md:pb-16">
                <div className="max-w-[720px] mx-auto">
                  <div data-reveal-group className="flex flex-col items-start gap-[28px] tablet:gap-[40px] md:gap-[56px]">
                    <span data-reveal className="pointer-events-auto inline-flex items-center justify-center gap-[10px] rounded-[31px] border-[0.5px] border-mist/40 px-[9px] pb-[7px] pt-[10px] font-['Akkurat_Mono',monospace] text-[14px] font-medium leading-[1.15] tracking-[-0.28px] text-center uppercase text-mist bg-transparent h-[24px]">
                      {goals.badge}
                    </span>
                    {goals.paragraphs.map((p, i) => (
                      <p
                        key={i}
                        data-reveal
                        className="m-0 text-[28px] tablet:text-[30px] md:text-[34px] font-normal leading-[1.2] tracking-[-0.84px] tablet:tracking-[-0.6px] text-white"
                      >
                        {p.lead}{' '}
                        <span className="text-white/60">{p.muted}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative isolate bg-[#D7DEE6] px-[16px] tablet:px-[32px] md:px-[38px] pt-24 tablet:pt-[139px] md:pt-[195px] pb-24 tablet:pb-[91px] md:pb-32">
          {/* Full-bleed backdrop: the 1440 canvas centers once the zoom locks, so
              this 100vw layer (behind the content via -z) keeps the section colour
              reaching both viewport edges instead of guttering. `isolate` scopes the
              -z layer to this section — CSS `zoom` (unlike transform) makes no
              stacking context, so without it the -z layer sinks behind the page bg. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 -translate-x-1/2 bg-[#D7DEE6]" style={{ width: 'var(--bleed)' }} />
          {/* tablet runs the desktop two-column shape (title beside the text,
              not above it) rather than the stacked mobile one — an iPad has the
              width for it, and this page lays out in true CSS px there, so the
              column just needs tablet-sized numbers. The wrapper drops its 720
              cap because the measure is now set by the text column alone: the
              full width minus the title column and the gap, i.e. 458–714px
              across iPad mini → Pro 12.9". */}
          <div className="flex flex-col gap-10 tablet:flex-row tablet:gap-[56px] md:flex-row md:gap-[208px] max-w-[var(--content-width)] mx-auto">
            <div className="shrink-0 tablet:sticky tablet:top-[100px] tablet:self-start tablet:w-[190px] md:sticky md:top-[140px] md:self-start md:w-[259px]">
              <h2
                  className="m-0 text-[18px] tablet:text-[20px] md:text-[28px] leading-none tracking-[-0.5px] tablet:tracking-[-0.8px] md:tracking-[-1.12px] text-navy"
                style={{ fontFamily: "'Season Sans-TRIAL', sans-serif", fontWeight: 550 }}
              >
                {why.title[0]}
                <br />
                {why.title[1]}
              </h2>
            </div>
            <div data-reveal-group className="space-y-12 tablet:flex-1 tablet:space-y-[46px] md:w-[780px] md:space-y-16">
              {why.paragraphs.map((p, i) => (
                <p
                  key={i}
                  data-reveal
                  className="m-0 text-[20px] tablet:text-[24px] md:text-[34px] font-normal leading-[110%] tracking-[-0.5px] tablet:tracking-[-0.96px] md:tracking-[-1.36px] text-navy"
                >
                  <span className="text-[#8A8FA0]">{p.muted}</span>{' '}
                  {p.rest}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate bg-navy text-mist px-[16px] tablet:px-[32px] md:px-[38px] pt-24 tablet:pt-[68px] md:pt-[95px] pb-24 tablet:pb-[91px] md:pb-32">
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 -translate-x-1/2 bg-navy" style={{ width: 'var(--bleed)' }} />
          <div data-reveal-group className="max-w-[var(--content-width)] mx-auto">
            <p
              data-reveal
              className="m-0 text-[16px] md:text-[22px] leading-none tracking-[-0.88px] text-mist"
              style={{ fontFamily: "'Season Sans-TRIAL', sans-serif", fontWeight: 550 }}
            >
              {strengths.eyebrow}
            </p>
            <h2
                data-reveal
                className="m-0 mt-[16px] md:mt-[30px] text-[24px] tablet:text-[26px] md:text-[36px] font-normal leading-[30px] md:leading-[42px] tracking-[-0.5px] tablet:tracking-[-1.04px] md:tracking-[-1.44px] text-mist tablet:max-w-[720px] md:w-[780px]"
            >
              {strengths.title}
            </h2>

            {/* The 3 + 2 split exists for the desktop rows. iPad portrait has
                the width for a 2-up grid, which nearly halves this section's
                height — but a CSS-only `grid-cols-2` on those two containers
                leaves a hole at position 4, and `tablet:contents` on them would
                zero the box useRevealOnScroll measures for their ScrollTrigger.
                So tablet branches to a single group of five; every other layout
                keeps the original markup. */}
            {isTablet ? (
              <div
                data-reveal-group
                className="mt-16 grid grid-cols-2 gap-x-[48px] gap-y-[40px]"
              >
                {strengthItems.map((s) => (
                  <Strength key={s.title} index={0} mobileDivider={false} {...s} />
                ))}
              </div>
            ) : (
              <>
                <div data-reveal-group className="mt-16 md:mt-[104px] flex flex-col md:flex-row md:gap-y-0">
                  {strengthItems.slice(0, 3).map((s, i) => (
                    <Strength key={s.title} index={i} mobileDivider={i > 0} {...s} />
                  ))}
                </div>
                <div data-reveal-group className="md:mt-[138px] flex flex-col md:flex-row md:gap-y-0">
                  {strengthItems.slice(3, 5).map((s, i) => (
                    <Strength key={s.title} index={i} mobileDivider {...s} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
       </div>
      </main>
      <ContactSection />
    </>
  )
}

export default AboutPage
