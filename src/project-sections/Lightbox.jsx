import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { IoArrowBack, IoArrowForward, IoClose } from 'react-icons/io5'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { useLenis } from '../SmoothScroll'

const SWIPE_MIN = 40 // px of horizontal travel that counts as a swipe

// Full-screen image viewer for the project sections. Mounted only while open —
// the caller renders it conditionally and `onClose` unmounts it, which happens
// after the exit tween has run.
//
// Portalled to <body> on purpose: every project section sits inside ScaleLock's
// `transform: scale()`, and a transformed ancestor becomes the containing block
// for position:fixed. Rendered in place, this overlay would be scaled and
// anchored to the section instead of the viewport.
//
// `images: [{ src, alt }]` is the same CMS-shaped list the gallery renders; the
// arrows step through it and hide when there is only one photo.
function Lightbox({ images = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const rootRef = useRef(null)
  const frameRef = useRef(null)
  const imgRef = useRef(null)
  const closeRef = useRef(null)
  const closingRef = useRef(false)

  const count = images.length
  const go = useCallback(
    (dir) => setIndex((prev) => Math.min(count - 1, Math.max(0, prev + dir))),
    [count],
  )

  // Fade out first, then hand back to the caller, which unmounts us. Guarded so
  // a second Escape / click mid-tween cannot start the timeline again.
  const close = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    if (prefersReducedMotion() || !rootRef.current) {
      onClose()
      return
    }
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: cubicEase,
      onComplete: onClose,
    })
  }, [onClose])

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, { opacity: 0, duration: 0.3, ease: cubicEase })
      gsap.from(frameRef.current, { scale: 0.94, duration: 0.45, ease: cubicEase })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  // Cross-fade when stepping between photos. Skipped on the opening frame — the
  // root fade above already covers it.
  const firstPaint = useRef(true)
  useLayoutEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false
      return
    }
    if (prefersReducedMotion()) return
    const tween = gsap.fromTo(
      imgRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.28, ease: cubicEase },
    )
    return () => tween.kill()
  }, [index])

  // Lock the page behind the overlay. `overflow: hidden` alone is NOT enough
  // here: Lenis drives the document with programmatic scrolls, which overflow
  // does not block — the page kept gliding behind the overlay until Lenis was
  // stopped explicitly. The overflow lock stays for pages running native scroll,
  // where `lenis` is null.
  const lenis = useLenis()
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    lenis?.stop()
    return () => {
      document.body.style.overflow = prev
      lenis?.start()
    }
  }, [lenis])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'ArrowRight') {
        go(1)
      } else if (e.key === 'ArrowLeft') {
        go(-1)
      } else if (e.key === 'Tab') {
        // Keep Tab inside the overlay. aria-modal hides the page behind from
        // assistive tech, but it does not stop the tab order walking into the
        // gallery buttons underneath.
        const stops = rootRef.current?.querySelectorAll('button:not([disabled])')
        if (!stops?.length) return
        const first = stops[0]
        const last = stops[stops.length - 1]
        const onEdge = e.shiftKey ? document.activeElement === first : document.activeElement === last
        if (onEdge || !rootRef.current.contains(document.activeElement)) {
          e.preventDefault()
          ;(e.shiftKey ? last : first).focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, go])

  // Move focus into the overlay, and put it back where it came from on close so
  // keyboard users return to the thumbnail they opened.
  useEffect(() => {
    const previous = document.activeElement
    closeRef.current?.focus()
    return () => {
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  // Swipe / drag to change photo. Every pointer type counts, mouse included —
  // a trackpad drag and DevTools' device mode both report `mouse`, so limiting
  // this to touch made the gesture look broken anywhere but a real phone.
  //
  // The travel is accumulated on move rather than measured from the up event,
  // so a gesture the browser ends with `pointercancel` (WebKit does this when
  // it claims a gesture mid-swipe) still resolves instead of being dropped.
  const swipeRef = useRef(null)
  const swipedRef = useRef(false)
  const onPointerDown = (e) => {
    // Cleared per gesture, not in the click handler: a touch swipe fires no
    // trailing click, so a flag left standing would swallow the next tap.
    swipedRef.current = false
    swipeRef.current = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 }
  }
  const onPointerMove = (e) => {
    const s = swipeRef.current
    if (!s) return
    s.dx = e.clientX - s.x
    s.dy = e.clientY - s.y
  }
  const endSwipe = () => {
    const s = swipeRef.current
    swipeRef.current = null
    if (!s) return
    if (Math.abs(s.dx) < SWIPE_MIN || Math.abs(s.dx) < Math.abs(s.dy)) return
    // A drag that ends on the backdrop also fires a click; flag it so the
    // backdrop handler does not read the swipe as a request to close.
    swipedRef.current = true
    go(s.dx < 0 ? 1 : -1)
  }

  const image = images[index]
  if (!image) return null

  // z-10 is load-bearing: the frame below keeps an inline transform from the
  // enter tween, which makes it a stacking context painted after these buttons
  // in DOM order. Without it the arrows hide behind the photo on phones, where
  // the image spans nearly the full width (on desktop it clears them).
  const btn =
    'z-10 inline-flex h-[42px] w-[42px] tablet:h-[52px] tablet:w-[52px] md:h-[52px] md:w-[52px] items-center justify-center rounded-full border border-white/25 bg-black/40 text-mist backdrop-blur-sm transition-colors duration-200 hover:border-white/70 disabled:opacity-30 disabled:hover:border-white/25'

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      // Clicks that land on the backdrop itself close; clicks on the photo or
      // the controls do not.
      onClick={(e) => {
        if (swipedRef.current) return
        if (e.target === e.currentTarget) close()
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
      // /95, and it must be a value on Tailwind's opacity scale: an off-scale
      // modifier (bg-black/92) silently compiles to a fully transparent
      // background, leaving the navbar and the next slide showing through.
      // pb-28 reserves the band the arrow row occupies on mobile, so the photo
      // sits above the buttons instead of behind them; desktop puts the arrows
      // at the sides and needs no extra bottom room.
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 px-4 pt-16 pb-28 md:px-20 md:py-12"
      // Keeps horizontal swipes ours while leaving pinch-to-zoom to the browser.
      style={{ touchAction: 'pinch-zoom' }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        aria-label="Close image viewer"
        className={`absolute right-4 top-4 md:right-8 md:top-8 ${btn}`}
      >
        <IoClose className="text-[18px] tablet:text-[22px] md:text-[22px]" aria-hidden="true" />
      </button>

      {/* One pair of arrows, repositioned by breakpoint rather than duplicated:
          a centred row below the photo on phones and tablets (where the image
          spans nearly the full width and side arrows would sit on top of it),
          and split to the left/right edges at the vertical centre on desktop.
          The row itself is click-through so the backdrop underneath still
          closes; only the buttons take pointer events. */}
      {count > 1 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2 md:inset-x-8 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:justify-between">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label="Previous image"
            className={`pointer-events-auto ${btn}`}
          >
            <IoArrowBack className="text-[15px] tablet:text-[18px] md:text-[18px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === count - 1}
            aria-label="Next image"
            className={`pointer-events-auto ${btn}`}
          >
            <IoArrowForward className="text-[15px] tablet:text-[18px] md:text-[18px]" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Shrink-wraps the photo so the backdrop-click test above only sees the
          area outside it. object-contain + the max bounds show the whole frame,
          never a crop. */}
      <div ref={frameRef} className="flex max-h-full max-w-full items-center justify-center">
        <img
          ref={imgRef}
          src={image.src}
          alt={image.alt ?? ''}
          className="block max-h-[80vh] md:max-h-[86vh] max-w-full h-auto w-auto select-none object-contain"
          draggable="false"
        />
      </div>
    </div>,
    document.body,
  )
}

export default Lightbox
