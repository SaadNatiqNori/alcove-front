import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ContactFooterPanel from './ContactFooterPanel'
import { revealFooterPanel } from './motion'
import { useContent } from './api'
import { useScale, useIsDesktop, useScaledHeight } from './useScale'

gsap.registerPlugin(ScrollTrigger)

const CTA_FALLBACK = {
  title: "Let's talk",
  description:
    'Contact us to explore how Alcove can strengthen engagement, adherence, and between-visit support.',
  buttonLabel: 'GET IN TOUCH',
}

function ContactSection() {
  const scale = useScale()
  // The scaled-canvas math (100vh wrapper + scale transform) only applies to the
  // desktop layout. Below it the footer is a natural fit-content block, so the
  // wrapper must drop the forced 100vh height. Keyed off the layout predicate,
  // not `scale`, because a 1440px desktop also yields scale 1 yet still needs vh
  // — and tablet portrait yields a scale above 1 while needing the mobile form.
  const isDesktop = useIsDesktop()
  const footer = useContent('footer', { cta: CTA_FALLBACK })
  const cta = footer.cta ?? CTA_FALLBACK
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const buttonRef = useRef(null)
  const alcoveRef = useRef(null)
  const panelRef = useRef(null)

  // The panel centres the "Let's talk" block between the container top and the
  // ALCOVE logo, so the section must fill the viewport at every desktop scale —
  // including at the MAX_SCALE cap, where it previously collapsed to fit-content
  // (there is no dead gap to avoid any more; the spacers just centre the block).
  // The content at max scale is a fixed ~801px (the panel is capped at 1440px
  // wide), which fits any viewport wide enough to reach the cap.
  const fillViewport = isDesktop
  const wrapperRef = useRef(null)
  // Only the fit-content (non-desktop) form needs it; `fillViewport` already
  // locks the desktop section to one viewport.
  const reservedHeight = useScaledHeight(wrapperRef, scale, !fillViewport && scale !== 1)
  // See PortfolioSlider: reserving the height lengthens the document after
  // first paint, so every trigger measured before it is stale.
  useLayoutEffect(() => {
    if (reservedHeight == null) return
    ScrollTrigger.refresh()
  }, [reservedHeight])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      revealFooterPanel(
        [titleRef.current, descRef.current, buttonRef.current, alcoveRef.current],
        sectionRef.current
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      // -mt-px: the page above ends in a scaled wrapper whose reserved height is
      // fractional (offsetHeight * scale), so on a 2x screen the seam between it
      // and this section lands mid-device-pixel and WebKit leaves that row
      // unpainted — the mist document background shows through as a hairline
      // across the width, most visibly on an iPad. A 1px overlap covers the seam
      // whichever way the rounding falls. It is invisible on the light pages too:
      // there the navy footer simply starts one pixel higher.
      className={`relative -mt-px w-full h-auto overflow-hidden bg-navy${
        fillViewport ? ' md:h-screen' : ''
      }`}
      // Tablet zoom: the fit-content footer renders `scale` times taller than
      // it lays out, so without a reserved height overflow-hidden cuts off its
      // bottom on every page.
      style={reservedHeight != null ? { height: `${reservedHeight}px` } : undefined}
      aria-label="Contact"
    >
      <div
        ref={wrapperRef}
        className="scale-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: isDesktop && scale >= 1 ? '100%' : `${100 / scale}%`,
          marginLeft: isDesktop && scale >= 1 ? '0' : `${(100 - 100 / scale) / 2}%`,
          height: fillViewport ? `${100 / scale}vh` : 'auto',
        }}
      >
        <ContactFooterPanel
          cta={cta}
          fitMobile
          centerDesktop
          scale={scale}
          rootRef={panelRef}
          titleRef={titleRef}
          descRef={descRef}
          buttonRef={buttonRef}
          alcoveRef={alcoveRef}
        />
      </div>
    </section>
  )
}

export default ContactSection
