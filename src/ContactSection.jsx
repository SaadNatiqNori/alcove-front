import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ContactFooterPanel from './ContactFooterPanel'
import { cubicEase } from './easings'
import { useContent } from './api'
import { MAX_SCALE } from './useScale'

gsap.registerPlugin(ScrollTrigger)

const CTA_FALLBACK = {
  title: "Let's talk",
  description:
    'Contact us to explore how Alcove can strengthen engagement, adherence, and between-visit support.',
  buttonLabel: 'GET IN TOUCH',
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

function ContactSection() {
  const scale = useScale()
  // The scaled-canvas math (100vh wrapper + scale transform) only applies at the
  // md+ desktop breakpoint. Below it the footer is a natural fit-content block,
  // so the wrapper must drop the forced 100vh height. Keyed off the 768px query,
  // not `scale`, because a 1440px desktop also yields scale 1 yet still needs vh.
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const footer = useContent('footer', { cta: CTA_FALLBACK })
  const cta = footer.cta ?? CTA_FALLBACK
  const sectionRef = useRef(null)
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const buttonRef = useRef(null)
  const alcoveRef = useRef(null)
  const panelRef = useRef(null)

  // Once the zoom is scaled all the way out to MAX_SCALE, the layout stops
  // growing and holding the section at 100vh only opens a dead gap above the
  // ALCOVE wordmark. Past the cap we let the section fit its content instead.
  // `fillViewport` keeps the 100vh canvas everywhere below the cap (incl. the
  // 1440 reference, which is scale 1 but must still fill the screen).
  const atMaxScale = scale >= MAX_SCALE
  const fillViewport = isDesktop && !atMaxScale

  // The scale-wrapper zooms via `transform`, which doesn't grow its layout box,
  // so a content-height (auto) wrapper would let the scaled ALCOVE overflow the
  // section's overflow-hidden edge. Reserve the *scaled* content height on the
  // section so the visual exactly fits. Only needed in the fit-content regime.
  const [panelHeight, setPanelHeight] = useState(0)
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    const update = () => setPanelHeight(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(
        [
          titleRef.current,
          descRef.current,
          buttonRef.current,
          alcoveRef.current,
        ],
        { y: 80, opacity: 0 }
      )

      gsap.to(
        [
          titleRef.current,
          descRef.current,
          buttonRef.current,
          alcoveRef.current,
        ],
        {
          y: 0,
          opacity: 1,
          duration: 1.4,
          ease: cubicEase,
          stagger: 0.12,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'restart none restart reset',
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className={`relative w-full h-auto overflow-hidden bg-navy${
        fillViewport ? ' md:h-screen' : ''
      }`}
      style={atMaxScale && panelHeight ? { height: `${panelHeight * scale}px` } : undefined}
      aria-label="Contact"
    >
      <div
        className="scale-wrapper"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: scale >= 1 ? '100%' : `${100 / scale}%`,
          marginLeft: scale >= 1 ? '0' : `${(100 - 100 / scale) / 2}%`,
          height: fillViewport ? `${100 / scale}vh` : 'auto',
        }}
      >
        <ContactFooterPanel
          cta={cta}
          fitMobile
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
