import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { cubicEase } from '../easings'
import viewImageIcon from '../assets/ViewimageIcon.svg'

// A small badge that replaces the pointer while it is over an expandable photo.
// Follows the cursor with an eased lag, the same quickTo treatment as the
// projects list preview card.
//
// Portalled to <body> for the reason the lightbox is: the sections that use it
// sit inside ScaleLock's `transform: scale()`, and a transformed ancestor
// becomes the containing block for position:fixed — rendered in place the badge
// would be scaled and drift away from the real cursor position.
//
// Desktop only, by construction: the caller drives `active` from hover, which a
// touch device never produces.
function HoverCursor({ active, label = 'VIEW IMAGE' }) {
  const wrapRef = useRef(null)
  const xTo = useRef(null)
  const yTo = useRef(null)
  // The badge starts hidden and un-positioned; the first move of a hover jumps
  // it to the cursor rather than gliding in from wherever it was left.
  const placed = useRef(false)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    gsap.set(el, { autoAlpha: 0 })
    xTo.current = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' })
    yTo.current = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' })
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    // overwrite: 'auto' on both fades, or they fight: the 0.2s fade-out can
    // finish while a 0.25s fade-in is still running, and the older tween then
    // puts the badge back to fully visible. It kills only the conflicting
    // opacity/visibility props, leaving the quickTo x/y tweens untouched.
    if (!active) {
      placed.current = false
      gsap.to(el, { autoAlpha: 0, duration: 0.2, ease: cubicEase, overwrite: 'auto' })
      return
    }

    const onMove = (e) => {
      if (!placed.current) {
        gsap.set(el, { x: e.clientX, y: e.clientY })
        placed.current = true
        gsap.to(el, { autoAlpha: 1, duration: 0.25, ease: cubicEase, overwrite: 'auto' })
        return
      }
      xTo.current?.(e.clientX)
      yTo.current?.(e.clientY)
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [active])

  return createPortal(
    <div
      ref={wrapRef}
      className="pointer-events-none fixed left-0 top-0 z-[90] will-change-transform"
      aria-hidden="true"
    >
      {/* Centred on the cursor via its own transform — the wrapper's transform
          is owned by GSAP, so the offset cannot live there.
          Geometry and type are the portfolio DISCOVER button's desktop values
          (height, radius, px-[14px], gap-[5px], 10px Akkurat Mono, 14px icon),
          filled in the brand tokens instead of outlined. Only the desktop
          values apply — the badge is hover-driven, so it never renders on the
          tablet layout those `tablet:` sizes exist for.
          The icon is drawn as an <img> rather than ArrowIcon's currentColor
          mask: its stroke is already the navy this badge uses, and the mask
          would flatten its two separate strokes into one silhouette. */}
      <span className="inline-flex h-[46px] -translate-x-1/2 -translate-y-1/2 items-center gap-[5px] whitespace-nowrap rounded-[48px] bg-mist px-[14px] font-['Akkurat_Mono',monospace] text-[10px] font-medium uppercase leading-none text-navy">
        <span className="relative top-[1px]">{label}</span>
        <img src={viewImageIcon} alt="" width={14} height={14} className="block flex-shrink-0" />
      </span>
    </div>,
    document.body,
  )
}

export default HoverCursor
