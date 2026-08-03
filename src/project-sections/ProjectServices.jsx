import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { ServiceIcon } from './ServiceIcons'
import { useScale, useIsTabletPortrait } from "../useScale"

gsap.registerPlugin(ScrollTrigger)

// Section type: "services"
// Light section: a sticky intro on the left (same behaviour as the About page's
// "Why choose ALCOVE") while the service items scroll past on the right. Each
// item: icon, serif title, and a segmented description (keywords bolded).
function ProjectServices({
  eyebrow = 'Services and Amenities',
  heading,
  headingBold,
  items = [],
}) {
  const rootRef = useRef(null)
  // This section is locked to the 1440 canvas via CSS `zoom` (a layout-level
  // scale) instead of the transform-based ScaleLock the other sections use.
  // Its intro column is `md:sticky`, and sticky drifts inside a scrolling
  // transform; under `zoom` it pins correctly. zoom is 1 below 768px, and on
  // iPad portrait — which lays out 1:1 on the real viewport like the rest of
  // the project sections, sized by the `tablet:` utilities below.
  const isTablet = useIsTabletPortrait()
  const zoomScale = useScale()
  const scale = isTablet ? 1 : zoomScale

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-svc-item]', {
        opacity: 0,
        y: 40,
        duration: 1.1,
        ease: cubicEase,
        stagger: 0.12,
        scrollTrigger: { trigger: rootRef.current, start: 'top 70%' },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      className="bg-[#E6EBF0] text-[#1C2D4F]"
      style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
    >
      {/* zoom locks the 1440 canvas to the viewport while keeping the sticky
          intro drift-free (see note above). w-[1440px] is the canvas; zoom
          scales it to fill. Mobile (<768, zoom 1) stays fluid. */}
      <div
        style={{ zoom: scale }}
        className="mx-auto w-full max-w-[1440px] px-[16px] tablet:px-[38px] py-24 tablet:py-[91px] md:w-[1440px] md:px-[38px] md:py-32"
      >
      <div className="mx-auto grid grid-cols-1 gap-12 tablet:gap-10 tablet:grid-cols-[1fr_388px] md:grid-cols-2 md:gap-16 lg:grid-cols-[1fr_546px] lg:gap-24">
        {/* Sticky intro */}
        <div className="tablet:sticky tablet:top-[100px] tablet:self-start md:sticky md:top-[120px] md:self-start">
          <p
            className="m-0 text-[18px] tablet:text-[16px] md:text-[22px] leading-none tracking-[-0.04em] text-[#1C2D4F]"
            style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 580 }}
          >
            {eyebrow}
          </p>
          {heading && (
            <h2
              className="m-0 mt-6 max-w-[664px] text-[24px] tablet:text-[24px] md:text-[34px] font-normal leading-none tracking-normal text-[#1C2D4F]"
              style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
            >
              {heading}
              {headingBold && (
                <>
                  {' '}
                  <span style={{ fontWeight: 550 }}>{headingBold}</span>
                </>
              )}
            </h2>
          )}
        </div>

        {/* Items */}
        <div>
          {items.map((item, i) => (
            <div
              key={item.title ?? i}
              data-svc-item
              className="border-t border-[#1C2D4F] py-12 tablet:py-[46px] md:py-16"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  aria-hidden="true"
                  className="h-[24px] tablet:h-[27px] md:h-[38px] w-[22px] tablet:w-[24px] md:w-[34px] object-contain"
                  draggable="false"
                />
              ) : (
                <ServiceIcon name={item.icon} className="h-[38px] w-[34px] text-[#1C2D4F]" />
              )}
              <h3
                className="m-0 mt-[26px] tablet:mt-7 md:mt-8 text-[24px] tablet:text-[23px] md:text-[32px] font-normal leading-none tracking-[-0.04em] text-[#1C2D4F]"
                style={{ fontFamily: "'Season Mix VF', serif", fontWeight: 420 }}
              >
                {item.title}
              </h3>
              <p className="m-0 mt-[18px] tablet:mt-5 md:mt-5 text-[16px] md:text-[18px] font-normal leading-5 tracking-normal text-[#5A6472] max-w-[429px]">
                {(item.description ?? []).map((seg, si) => (
                  <span
                    key={si}
                    className={seg.bold ? 'text-[#1C2D4F]' : undefined}
                    style={seg.bold ? { fontWeight: 550 } : undefined}
                  >
                    {seg.text}
                  </span>
                ))}
              </p>
            </div>
          ))}
          <div className="border-t border-[#1C2D4F]/25" />
        </div>
      </div>
      </div>
    </section>
  )
}

export default ProjectServices
