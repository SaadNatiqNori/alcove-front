import { useLayoutEffect, useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IoArrowBack, IoArrowForward } from 'react-icons/io5'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { ScaleLock } from '../ScaleLock'
import { useIsDesktop, useIsTabletPortrait } from '../useScale'
import Lightbox from './Lightbox'
import HoverCursor from './HoverCursor'

gsap.registerPlugin(ScrollTrigger)

const GAP = 20 // px between slides — kept in sync with --gap below
const TAP_SLOP = 6 // px a pointer may travel and still count as a tap, not a drag

// Section type: "gallery"
// Dark, full-bleed centered carousel: the first slide sits centred and its
// neighbours peek on either side. Every photo shares one height per breakpoint
// and is as wide as its own aspect ratio makes it, so slide widths vary and
// nothing is cropped. Free horizontal scroll — mouse drag (with inertia),
// trackpad/wheel swipe, and touch pan-x — matching the home portfolio slider.
// The prev/next buttons centre the neighbouring slide.
// `images: [{ src, alt }]` is a CMS-shaped list. Owns its own scroll reveal.
function ProjectGallery({
  eyebrow = 'Gallery',
  title = 'Explore the project',
  images = [],
}) {
  const rootRef = useRef(null)
  const scrollRef = useRef(null)
  const pressRef = useRef(null) // where a pointer went down on a slide, for the tap test
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(images.length <= 1)
  const [expanded, setExpanded] = useState(null) // index of the photo in the lightbox
  const [hovering, setHovering] = useState(false) // pointer is over a slide (drives the badge)
  // The track is the same everywhere — a centred slide with its neighbours
  // peeking. Only the gap differs: 16px on phones, where the wider GAP would eat
  // into a screen that has little room to spare. DESKTOP_QUERY, not a bare
  // min-width:768 check — the latter matches iPads, which run the mobile layout.
  const isDesktop = useIsDesktop()
  const isTablet = useIsTabletPortrait()
  const gap = isDesktop || isTablet ? GAP : 16

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

  // Slides are as wide as their photo (see the image height note below), so
  // there is no single width for a CSS `(100% - width) / 2` to centre against —
  // the end padding is measured instead. Half the leftover space beside the
  // first slide centres it at rest; the same for the last slide centres it at
  // the end of the scroll. A photo's width is unknown until it decodes, so the
  // ResizeObserver watches the slides, not just the track, and re-measures when
  // each one settles — which also covers the widths changing at a breakpoint.
  const [padX, setPadX] = useState(null)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const measure = () => {
      const slides = el.querySelectorAll('[data-gallery-slide]')
      if (!slides.length) return
      // clientWidth includes the padding we are about to set, but border-box
      // sizing keeps the element's own width fixed, so this cannot feed back.
      const room = el.clientWidth
      const left = Math.max(0, (room - slides[0].offsetWidth) / 2)
      const right = Math.max(0, (room - slides[slides.length - 1].offsetWidth) / 2)
      setPadX((prev) =>
        prev && prev.left === left && prev.right === right ? prev : { left, right },
      )
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    el.querySelectorAll('[data-gallery-slide]').forEach((slide) => ro.observe(slide))
    return () => ro.disconnect()
  }, [images.length])

  // Prev/next centre the neighbouring slide, in the element's own unscaled
  // pixels (offsetWidth/offsetLeft are layout px, not transformed). Stepping by
  // a width + gap constant would drift, because each slide is a different width.
  const scrollByOne = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const slides = [...el.querySelectorAll('[data-gallery-slide]')]
    if (!slides.length) return

    const EDGE = 4 // px slack — scroll offsets round, exact compares flap
    const viewCentre = el.scrollLeft + el.clientWidth / 2
    const centres = slides.map((s) => s.offsetLeft + s.offsetWidth / 2)
    const target =
      dir > 0
        ? centres.find((c) => c > viewCentre + EDGE)
        : centres.reverse().find((c) => c < viewCentre - EDGE)
    if (target == null) return
    el.scrollTo({ left: target - el.clientWidth / 2, behavior: 'smooth' })
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
        // `relative` makes the track the slides' offsetParent, so their
        // offsetLeft is a position inside the scroll content — which is what
        // scrollByOne compares against scrollLeft. Without it they measure from
        // the positioned section instead and the arrows land off-centre.
        className="relative mt-10 tablet:mt-12 md:mt-12 w-full overflow-x-auto overflow-y-hidden flex cursor-grab select-none [&::-webkit-scrollbar]:hidden"
        style={{
          '--gap': `${gap}px`,
          gap: 'var(--gap)',
          // Measured, not derived from a slide width — see the padX effect.
          paddingLeft: `${padX?.left ?? 0}px`,
          paddingRight: `${padX?.right ?? 0}px`,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          overscrollBehavior: 'contain',
        }}
      >
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            data-gallery-slide
            // No width: the slide shrink-wraps its photo, and shrink-0 keeps
            // flex from squeezing it back down.
            // The badge replaces the pointer on desktop, so the native cursor is
            // hidden there; touch layouts keep zoom-in as the affordance.
            className="block shrink-0 cursor-zoom-in appearance-none overflow-hidden rounded-[6px] border-0 bg-navy p-0 md:cursor-none"
            aria-label={`Expand image ${i + 1} of ${images.length}`}
            onMouseEnter={() => isDesktop && setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onPointerDown={(e) => {
              pressRef.current = { x: e.clientX, y: e.clientY }
            }}
            // Opening on pointerup, not click: the track is drag-to-scroll, and
            // a drag that happens to end over a photo still fires a click. Only
            // a pointer that barely moved counts as a tap.
            onPointerUp={(e) => {
              const start = pressRef.current
              pressRef.current = null
              if (!start) return
              if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP) return
              // The track preventDefaults pointerdown (to kill native image
              // drag), which also suppresses the click's default focus. Focus it
              // here so the lightbox has somewhere to hand focus back to.
              e.currentTarget.focus()
              setExpanded(i)
            }}
            // Keyboard activation only (`detail === 0`); pointer taps are
            // handled above, so this does not double-fire.
            onClick={(e) => {
              if (e.detail === 0) setExpanded(i)
            }}
          >
            <img
              src={img.src}
              alt={img.alt ?? ''}
              // Every photo in a breakpoint is the same height and as wide as
              // its own aspect ratio makes it — variable widths, and no crop.
              // `w-auto` is what lets the intrinsic ratio set the width.
              className="block h-[228px] tablet:h-[440px] md:h-[440px] w-auto object-contain"
              draggable="false"
            />
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <div
          data-gallery-item
          className="mt-8 md:mt-10 flex items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => scrollByOne(-1)}
            disabled={atStart}
            aria-label="Previous image"
            className="inline-flex h-[42px] w-[42px] tablet:h-[52px] tablet:w-[52px] md:h-[52px] md:w-[52px] items-center justify-center rounded-full border border-white/25 text-mist transition-colors duration-200 hover:border-white/70 disabled:opacity-30 disabled:hover:border-white/25"
          >
            <IoArrowBack className="text-[15px] tablet:text-[18px] md:text-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByOne(1)}
            disabled={atEnd}
            aria-label="Next image"
            className="inline-flex h-[42px] w-[42px] tablet:h-[52px] tablet:w-[52px] md:h-[52px] md:w-[52px] items-center justify-center rounded-full border border-white/25 text-mist transition-colors duration-200 hover:border-white/70 disabled:opacity-30 disabled:hover:border-white/25"
          >
            <IoArrowForward className="text-[15px] tablet:text-[18px] md:text-[18px]" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Suppressed while the viewer is open — the badge tracks the gallery
          underneath, which the overlay has covered. */}
      <HoverCursor active={hovering && expanded == null} />

      {expanded != null && (
        <Lightbox images={images} startIndex={expanded} onClose={() => setExpanded(null)} />
      )}
    </ScaleLock>
  )
}

export default ProjectGallery
