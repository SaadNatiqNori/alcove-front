import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { ScaleLock } from '../ScaleLock'

gsap.registerPlugin(ScrollTrigger)

// Section type: "statement"
// Large display paragraph where key phrases are emphasised. Copy is supplied
// as `segments: [{ text, emphasis? }]` (CMS-friendly rich-text marks) so the
// dim/emphasis colouring is data-driven, not hard-coded per project.
// Owns its own scroll-triggered fade-up.
function ProjectStatement({ segments = [] }) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        opacity: 0,
        y: 40,
        duration: 1.3,
        ease: cubicEase,
        scrollTrigger: { trigger: rootRef.current, start: 'top 82%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <ScaleLock unlockTablet className="flex items-center px-[16px] tablet:px-10 md:px-10 py-[122px] tablet:py-0 md:py-0 tablet:min-h-[calc(100vh/var(--scale))] md:min-h-[calc(100vh/var(--scale))]">
      <p
        ref={rootRef}
        className="m-0 max-w-[1128px] text-[35px] tablet:text-[43px] md:text-[60px] font-[420] leading-[1.15] tracking-[-0.02em] text-[#AAB2C0]"
        style={{
          fontFamily: "'Season Mix VF', serif",
          textBoxTrim: 'trim-both',
          textBoxEdge: 'cap alphabetic',
        }}
      >
        {segments.map((seg, i) => (
          <span
            key={i}
            className={seg.emphasis ? 'text-[#1C1F2A]' : undefined}
            style={{ fontFamily: 'inherit' }}
          >
            {seg.text}
          </span>
        ))}
      </p>
    </ScaleLock>
  )
}

export default ProjectStatement
