import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import logoYellow from '../assets/LogoYellow.svg'
import { ScaleLock } from '../ScaleLock'

gsap.registerPlugin(ScrollTrigger)

// Section type: "overview"
// Full-height (100vh) dark intro block: eyebrow + a large statement pinned to the
// top, then a rule with the project logo (bottom-left) and a supporting paragraph
// (bottom-right) pinned to the bottom. Owns its own reveal.
function ProjectOverview({ eyebrow = 'Project Overview', heading, body, image }) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-ov-item]', {
        opacity: 0,
        y: 40,
        duration: 1.2,
        ease: cubicEase,
        stagger: 0.1,
        scrollTrigger: { trigger: rootRef.current, start: 'top 74%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <ScaleLock
      unlockTablet
      innerRef={rootRef}
      // Mobile (<768px, scale=1): the section is a 402-wide, ≥626px tall block
      // with 16px side padding — content flows from the top (74px in, 106px
      // below). Desktop keeps the one-viewport full-height layout, so replicate
      // ScaleLock's viewport="full" via the scaled-vh height class here.
      bg="bg-[#161A24]"
      className="text-mist px-4 tablet:px-[38px] md:px-[38px] min-h-[626px] tablet:min-h-0 md:min-h-0 tablet:h-[calc(100vh/var(--scale))] md:h-[calc(100vh/var(--scale))]"
      style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
    >
      <div className="mx-auto flex flex-col pt-[74px] pb-[106px] tablet:pt-0 tablet:pb-0 tablet:h-full tablet:justify-center tablet:py-[69px] md:h-full md:justify-center md:py-[69px]">
        <div className="mb-[50px] tablet:mb-[69px] md:mb-[69px]">
          <p
            data-ov-item
            className="m-0 text-[18px] tablet:text-[16px] md:text-[22px] font-normal leading-none tracking-[-0.04em] text-white"
          >
            {eyebrow}
          </p>

          <h2
            data-ov-item
            className="m-0 mt-6 tablet:mt-7 md:mt-8 max-w-[780px] whitespace-pre-line text-[26px] tablet:text-[40px] md:text-[56px] font-normal leading-none tracking-[-0.04em] text-white"
          >
            {heading}
          </h2>
        </div>

        <div>
          <div className="h-px w-full bg-white/20" />

          <div className="mt-[41px] tablet:mt-[69px] md:mt-[69px] grid grid-cols-1 items-start gap-10 tablet:grid-cols-2 tablet:gap-10 md:grid-cols-2 md:gap-16">
            <div data-ov-item>
              <img
                src={image || logoYellow}
                alt=""
                className="h-[24px] tablet:h-[31px] md:h-[44px] w-auto object-contain"
                draggable="false"
              />
            </div>

            {body && (
              <p
                data-ov-item
                className="m-0 max-w-[430px] text-[16px] md:text-[18px] font-normal leading-5 tablet:leading-6 md:leading-6 tracking-[-0.04em] text-white tablet:justify-self-end md:justify-self-end"
              >
                {body}
              </p>
            )}
          </div>
        </div>
      </div>
    </ScaleLock>
  )
}

export default ProjectOverview
