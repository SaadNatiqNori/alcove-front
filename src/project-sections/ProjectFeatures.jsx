import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cubicEase } from '../easings'
import { prefersReducedMotion } from './motion'
import { ScaleLock } from '../ScaleLock'

gsap.registerPlugin(ScrollTrigger)

// Section type: "features"
// A stack of full-width groups. Each group: a big serif title on the left, and
// a list of feature rows (title + description) on the right, separated by thin
// rules. Descriptions are supplied as segments so keywords can be emphasised /
// underlined (CMS-friendly). Groups can each carry their own background.
function ProjectFeatures({ groups = [] }) {
  const rootRef = useRef(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-feat-group]').forEach((group) => {
        gsap.from(group.querySelectorAll('[data-feat-item]'), {
          opacity: 0,
          y: 36,
          duration: 1,
          ease: cubicEase,
          stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 78%' },
        })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <ScaleLock
      innerRef={rootRef}
      fill
      bg="bg-[#E6EBF0]"
      className="text-[#1C1F2A]"
      style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
    >
      {groups.map((group, gi) => (
        <div
          key={group.title ?? gi}
          data-feat-group
          // 119px gap UNDER each group in its own bg; only the first group also
          // pads its top (the section's top edge). So the gap between two groups
          // is the upper group's colour all the way down to the next group's
          // border — the colour switches at the line, not mid-gap.
          className={`w-full pb-[64px] md:pb-[119px]${gi === 0 ? ' pt-[64px] md:pt-[119px]' : ''}`}
          style={{ backgroundColor: group.bg ?? '#E6EBF0' }}
        >
          <div className="mx-auto max-w-[1440px] border-t border-[#1C1F2A] px-[16px] pt-[40px] pb-0 md:px-[38px] md:pt-[70px]">
            <div className="grid grid-cols-1 gap-[55px] md:grid-cols-[minmax(0,0.9fr)_minmax(0,2.55fr)] md:gap-16">
              {/* Title column */}
              <div data-feat-item>
                <h2
                  className="m-0 whitespace-pre-line text-[42px] md:text-[50px] font-[420] leading-[1] tracking-[-0.04em] text-[#1C1F2A]"
                  style={{
                    fontFamily: "'Season Mix VF', serif",
                    textBoxTrim: 'trim-both',
                    textBoxEdge: 'cap alphabetic',
                  }}
                >
                  {group.title}
                </h2>
                {group.subtitle && (
                  <p className="m-0 mt-5 text-[15px] leading-[1.5] text-[#5A6472]">
                    {group.subtitle}
                  </p>
                )}
              </div>

              {/* Rows column */}
              <div>
                {group.rows.map((row, ri) => (
                  <div
                    key={row.feature ?? ri}
                    data-feat-item
                    className="grid grid-cols-1 justify-between gap-2 border-b border-[#1C1F2A] pt-[28px] pb-[28px] first:pt-0 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-12 md:pt-[46px] md:pb-[46px] md:first:pt-0"
                  >
                    <h3
                      className="m-0 self-center text-[24px] md:text-[38px] font-normal leading-[1.15] tracking-[-0.02em] text-[#1C1F2A]"
                      style={{ textBoxTrim: 'trim-both', textBoxEdge: 'cap alphabetic' }}
                    >
                      {row.feature}
                    </h3>
                    <p
                      className="m-0 w-full self-center text-[13px] leading-[1.4] tracking-[0] text-[#5A6472] md:ml-auto md:max-w-[312px] md:text-[18px] md:leading-[1.2] pt-[6px] md:pt-0"
                      style={{ textBoxTrim: 'trim-both', textBoxEdge: 'cap alphabetic' }}
                    >
                      {row.description.map((seg, si) => {
                        // A segment with a URL renders as a link. Links are always
                        // underlined (a URL is only set with the underline toggle on)
                        // and pick up a hover colour to read as interactive.
                        const isLink = Boolean(seg.url)
                        const cls = [
                          seg.bold && 'font-semibold text-[#1C1F2A]',
                          (seg.underline || isLink) && 'underline underline-offset-2',
                          isLink &&
                            'text-[#5B8DBF] transition-colors duration-200 hover:text-[#1C1F2A]',
                        ]
                          .filter(Boolean)
                          .join(' ')

                        if (!isLink) {
                          return (
                            <span key={si} className={cls || undefined}>
                              {seg.text}
                            </span>
                          )
                        }

                        // Internal paths use the router (same tab, no reload);
                        // external URLs open in a new tab.
                        return seg.url.startsWith('/') ? (
                          <Link key={si} to={seg.url} className={cls}>
                            {seg.text}
                          </Link>
                        ) : (
                          <a
                            key={si}
                            href={seg.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cls}
                          >
                            {seg.text}
                          </a>
                        )
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </ScaleLock>
  )
}

export default ProjectFeatures
