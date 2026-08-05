import { useLayoutEffect, useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IoArrowBack, IoArrowForward } from 'react-icons/io5'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { ScaleLock } from '../ScaleLock'
import { useIsDesktop } from '../useScale'

gsap.registerPlugin(ScrollTrigger)

const GAP = 20 // px between slides — kept in sync with --gap below

// Section type: "gallery"
// Dark, full-bleed centered carousel: the first slide sits centred and its
// neighbours peek on either side. Free horizontal scroll — mouse drag (with
// inertia), trackpad/wheel swipe, and touch pan-x — matching the home
// portfolio slider. The prev/next buttons scroll the native track by one slide.
// `images: [{ src, alt }]` is a CMS-shaped list. Owns its own scroll reveal.
function ProjectGallery({
  eyebrow = 'Gallery',
  title = 'Explore the project',
  images = [],
}) {
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(images.length <= 1)
  // Mobile uses a near-full-width card (16px gutters) instead of the centred
  // 64vw peek-carousel, so the slide width differs by breakpoint. DESKTOP_QUERY,
  // not a bare min-width:768 check — the latter matched iPads and gave them the
  // centred peek-carousel while the rest of the section rendered mobile values.
  const isDesktop = useIsDesktop()
  // Inter-slide gap: 16px on mobile (matches the 16px left gutter and lets the
  // next card peek), the wider GAP on desktop.
  const gap = isDesktop ? GAP : 16

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const items = rootRef.current?.querySelectorAll('[data-gallery-item]') ?? []
      gsap.from(items, {
        opacity: 0,
        y: 44,
        duration: 1.2,
        ease: cubicEase,
        stagger: 0.1,
        scrollTrigger: { trigger: rootRef.current, start: 'top 78%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // Free horizontal scroll — ported from the home PortfolioSlider so the gallery
  // feels identical to drag/swipe. Native scrolling drives everything; the edge
  // flags (for the arrow disabled states) are read straight off scrollLeft.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || images.length <= 1) return

    const EDGE = 2 // px tolerance for "at the start / at the end"
    let rafId = 0
    const paintEdges = () => {
      rafId = 0
      const max = el.scrollWidth - el.clientWidth
      setAtStart(el.scrollLeft <= EDGE)
      setAtEnd(el.scrollLeft >= max - EDGE)
    }
    const handleScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(paintEdges)
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    paintEdges()

    // Drag-to-scroll (mouse) with inertia. Touch/trackpad keep native scrolling.
    let isDown = false
    let dragScale = 1
    let startX = 0
    let startScrollLeft = 0
    let lastX = 0
    let lastT = 0
    let velocity = 0 // local px per ms; scrollLeft moves opposite the cursor
    let momentumId = 0

    const stopMomentum = () => {
      if (momentumId) cancelAnimationFrame(momentumId)
      momentumId = 0
    }

    const onPointerDown = (e) => {
      if (e.pointerType !== 'mouse') return
      stopMomentum()
      isDown = true
      startX = lastX = e.clientX
      startScrollLeft = el.scrollLeft
      lastT = e.timeStamp
      velocity = 0
      // The section is CSS-scaled (ScaleLock); convert cursor pixels into the
      // element's own pixels so the images track the cursor 1:1.
      dragScale = el.getBoundingClientRect().width / el.offsetWidth || 1
      el.style.cursor = 'grabbing'
      e.preventDefault() // stop the browser starting a native image drag mid-swipe
    }

    const onPointerMove = (e) => {
      if (!isDown) return
      const dxTotal = (e.clientX - startX) / dragScale
      el.scrollLeft = startScrollLeft - dxTotal
      const dt = e.timeStamp - lastT
      if (dt > 0) {
        velocity = -((e.clientX - lastX) / dragScale) / dt
        lastX = e.clientX
        lastT = e.timeStamp
      }
    }

    const endDrag = () => {
      if (!isDown) return
      isDown = false
      el.style.cursor = ''
      // Glide on release, decaying the velocity, instead of stopping dead.
      const maxScroll = el.scrollWidth - el.clientWidth
      let prev = performance.now()
      const glide = (now) => {
        const dt = now - prev
        prev = now
        velocity *= Math.pow(0.95, dt / 16) // frame-rate independent friction
        el.scrollLeft += velocity * dt
        if (el.scrollLeft <= 0 || el.scrollLeft >= maxScroll) velocity = 0
        momentumId = Math.abs(velocity) > 0.02 ? requestAnimationFrame(glide) : 0
      }
      if (Math.abs(velocity) > 0.02) momentumId = requestAnimationFrame(glide)
    }

    // Horizontal wheel / trackpad swipe: keep it a native horizontal scroll and
    // stop any parent section navigation from hijacking it.
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        stopMomentum()
        e.stopPropagation()
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    el.addEventListener('wheel', onWheel, { passive: true })

    return () => {
      stopMomentum()
      el.removeEventListener('scroll', handleScroll)
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      el.removeEventListener('wheel', onWheel)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [images.length])

  // Prev/next scroll the native track by one slide (width + gap, in the
  // element's own unscaled pixels — offsetWidth is layout px, not transformed).
  const scrollByOne = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const slide = el.querySelector('[data-gallery-slide]')
    const step = (slide ? slide.offsetWidth : el.clientWidth) + gap
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <ScaleLock
      unlockTablet
      innerRef={rootRef}
      fill
      bg="bg-[#0E0E0E]"
      className="relative flex flex-col items-center justify-center overflow-hidden text-mist pt-[84px] tablet:pt-[102px] pb-[72px] tablet:pb-[90px] md:pt-36 md:pb-10 md:min-h-[calc(100vh/var(--scale))]"
    >
      <div className="px-6 tablet:px-10 md:px-10 flex flex-col items-center text-center">
        {/* Same pill as the Contact page badge, recoloured for the dark section
            (light ink + soft light border instead of the dark-on-light ink). */}
        <span
          data-gallery-item
          className="inline-flex h-[24px] items-center justify-center gap-[10px] rounded-[31px] border-[0.5px] border-mist/40 px-[9px] pb-[7px] pt-[10px] text-center font-['Akkurat_Mono',monospace] text-[11px] tablet:text-[13px] md:text-[14px] font-medium uppercase leading-[1.15] tracking-[-0.28px] text-mist"
        >
          {eyebrow}
        </span>
        <h2
          data-gallery-item
          className="m-0 mt-[23px] tablet:mt-7 md:mt-7 text-center text-[32px] tablet:text-[42px] md:text-[50px] font-[420] leading-[1] tracking-[-0.04em] text-mist"
          style={{
            fontFamily: "'Season Mix VF', serif",
            textBoxTrim: 'trim-both',
            textBoxEdge: 'cap alphabetic',
          }}
        >
          {title}
        </h2>
      </div>

      {/* Centered free-scroll track — the first slide sits centred (via the side
          padding) and neighbours peek; drag / swipe / wheel scroll it. */}
      <div
        ref={scrollRef}
        data-gallery-item
        data-horizontal-scroll
        className="mt-10 tablet:mt-12 md:mt-12 w-full overflow-x-auto overflow-y-hidden flex cursor-grab select-none [&::-webkit-scrollbar]:hidden"
        style={{
          // Mobile: wide card aligned to a 16px start gutter, with 16px gap and
          // a 16px peek of the next card (card = 100vw − 16 − 16 − 16). Desktop
          // keeps the centred 64vw peek-carousel.
          '--slw': isDesktop
            ? 'min(1120px, calc(64vw / var(--scale)))'
            : 'calc(100vw - 48px)',
          '--gap': `${gap}px`,
          gap: 'var(--gap)',
          paddingLeft: isDesktop ? 'calc((100% - var(--slw)) / 2)' : '16px',
          paddingRight: isDesktop ? 'calc((100% - var(--slw)) / 2)' : '16px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          overscrollBehavior: 'contain',
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            data-gallery-slide
            className="shrink-0 overflow-hidden rounded-[6px] bg-navy"
            style={{ width: 'var(--slw)' }}
          >
            <img
              src={img.src}
              alt={img.alt ?? ''}
              // tablet: the mobile track is active on iPad now (isDesktop is
              // DESKTOP_QUERY), so the slide is a `100vw - 48px` card whose width
              // varies 720→976px across iPad sizes. A fixed height cannot hold
              // the phone's ~1.98:1 crop across that range — the ratio can.
              className="block w-full h-[193px] tablet:h-auto tablet:aspect-[1.98/1] md:h-[440px] object-cover"
              draggable="false"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div
          data-gallery-item
          className="mt-8 md:mt-10 flex items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={() => scrollByOne(-1)}
            disabled={atStart}
            aria-label="Previous image"
            className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/25 text-mist transition-colors duration-200 hover:border-white/70 disabled:opacity-30 disabled:hover:border-white/25"
          >
            <IoArrowBack className="text-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByOne(1)}
            disabled={atEnd}
            aria-label="Next image"
            className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/25 text-mist transition-colors duration-200 hover:border-white/70 disabled:opacity-30 disabled:hover:border-white/25"
          >
            <IoArrowForward className="text-[18px]" aria-hidden="true" />
          </button>
        </div>
      )}
    </ScaleLock>
  )
}

export default ProjectGallery
