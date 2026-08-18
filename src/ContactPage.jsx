import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IoArrowForward } from 'react-icons/io5'
import ContactSection from './ContactSection'
import { ScaleLock } from './ScaleLock'
import { useScale, useIsTabletPortrait } from './useScale'
import { cubicEase } from './easings'
import { useContent, useSettings, postContact } from './api'

gsap.registerPlugin(ScrollTrigger)

// Brand blue used across the light pages (About, Hero) for text on light bg.
const INK = '#1C2D4F'

// reCAPTCHA v2 ("I'm not a robot") site key — public, safe to ship in the
// client. Set VITE_RECAPTCHA_SITE_KEY to the real key; falls back to Google's
// official test key (always passes on localhost) so the form works in dev.
const RECAPTCHA_SITE_KEY =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
  '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MdD9Sxn'

const CONTACT_FALLBACK = {
  header: {
    badge: 'Contact',
    title: "Let's Talk",
    subtitle: 'Connect with ALCOVE to explore opportunities, partnerships, and more.',
  },
  form: {
    nameLabel: 'Name',
    emailLabel: 'Email',
    messageLabel: 'Message',
    submitLabel: 'Send message',
    sentLabel: 'Message sent',
  },
}

const DETAILS_FALLBACK = [
  {
    label: 'Location',
    lines: ['Erbil Avenue, Baharka', 'Road, Erbil, Kurdistan', 'Region of Iraq'],
  },
  { label: 'Working Hours', lines: ['9:00 AM – 5:00 PM'] },
  { label: 'Follow Us', lines: ['Instagram', 'Facebook'] },
  { label: 'Phone Number', lines: ['+964 750 123 4567'] },
  {
    label: 'Email Address',
    lines: ['info@alcove', 'sales@alcove', 'partnerships@alcove', 'marketing@alcove'],
  },
]

const DIVIDERS = [0, 20, 40, 60, 80, 100]

// iPad portrait runs the same dashed frame on three columns instead of five.
// Five does not fit: at 768 it leaves 114px of content per column against a
// 146px widest line, and `partnerships@alcove` has no break opportunity, so it
// spills across the dividers rather than wrapping. Three gives 198px at 768 and
// 284px at 1024 — comfortable across the whole tablet range.
const DIVIDERS_TABLET = [0, 33.3333, 66.6667, 100]

// Exact dashed stroke from the design: 1px line, 2px dash, 2px gap.
// CSS `border-dashed` can't set dash length, so paint it with a gradient.
const DASH_V =
  'repeating-linear-gradient(to bottom, #AEB8C8 0, #AEB8C8 2px, transparent 2px, transparent 4px)'
const DASH_H =
  'repeating-linear-gradient(to right, #AEB8C8 0, #AEB8C8 2px, transparent 2px, transparent 4px)'

function Field({ label, type = 'text', value, onChange, trailing, error, multiline, rows = 3 }) {
  const controlClass =
    'min-w-0 flex-1 bg-transparent text-[18px] tablet:text-[19px] md:text-[19px] text-[#1C2D4F] outline-none placeholder:text-[#1C2D4F]/45'

  return (
    <div>
      <label
        className={`group relative block border-b transition-colors ${
          // Tighter on the textarea so the resize grip below can sit on the rule.
          multiline ? 'pb-[6px]' : 'pb-3'
        } ${
          error
            ? 'border-red-500/70 focus-within:border-red-500'
            : 'border-[#1C2D4F]/25 focus-within:border-[#1C2D4F]'
        }`}
      >
        <span className="sr-only">{label}</span>
        <div className="flex items-end justify-between gap-3">
          {multiline ? (
            // The textarea is drag-resizable; the native corner grip is hidden and
            // replaced by the icon below. It straddles the field's bottom edge so it
            // rests on the rule while still overlapping the resizer corner, and it
            // lets pointer events through so the drag keeps working.
            <div className="relative min-w-0 flex-1">
              <textarea
                value={value}
                onChange={onChange}
                placeholder={label}
                rows={rows}
                aria-invalid={error ? 'true' : undefined}
                className={`${controlClass} block w-full resize-y pr-6 leading-[1.35] [&::-webkit-resizer]:hidden`}
              />
              <svg
                aria-hidden="true"
                width="11"
                height="11"
                viewBox="0 0 11 11"
                className="pointer-events-none absolute -bottom-[6px] right-0"
                fill="none"
                stroke={INK}
                strokeOpacity="0.45"
                strokeWidth="1.25"
                strokeLinecap="round"
              >
                <path d="M10 3.5L3.5 10" />
                <path d="M10 7.5L7.5 10" />
              </svg>
            </div>
          ) : (
            <input
              type={type}
              value={value}
              onChange={onChange}
              placeholder={label}
              aria-invalid={error ? 'true' : undefined}
              className={`${controlClass} leading-none`}
            />
          )}
          {trailing}
        </div>
      </label>
      {error && <p className="mt-2 text-[13px] leading-tight text-red-600">{error}</p>}
    </div>
  )
}

// Load Google's reCAPTCHA script once (explicit-render mode) and resolve when
// the API is ready. Shared across mounts so the <script> is injected only once.
let recaptchaScriptPromise = null
function loadRecaptcha() {
  if (recaptchaScriptPromise) return recaptchaScriptPromise
  recaptchaScriptPromise = new Promise((resolve) => {
    if (window.grecaptcha?.render) return resolve()
    const s = document.createElement('script')
    s.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
    s.async = true
    s.defer = true
    s.onload = () => {
      const ready = () =>
        window.grecaptcha?.render ? resolve() : setTimeout(ready, 50)
      ready()
    }
    document.head.appendChild(s)
  })
  return recaptchaScriptPromise
}

// Intrinsic size of the "normal" reCAPTCHA badge, and how far down we scale it.
const RECAPTCHA_WIDTH = 304
const RECAPTCHA_HEIGHT = 78
const RECAPTCHA_SCALE = 0.65

// "I'm not a robot" checkbox. Reports the solved token (or '' when it
// expires/errors) via onChange, and exposes reset() through resetRef. The
// render is guarded so StrictMode's double-invoke can't mount it twice.
function Recaptcha({ onChange, resetRef }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadRecaptcha().then(() => {
      if (
        cancelled ||
        !containerRef.current ||
        widgetIdRef.current !== null ||
        containerRef.current.childNodes.length > 0
      )
        return
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token) => onChange(token),
        'expired-callback': () => onChange(''),
        'error-callback': () => onChange(''),
      })
      if (resetRef) {
        resetRef.current = () => {
          if (widgetIdRef.current !== null)
            window.grecaptcha.reset(widgetIdRef.current)
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [onChange, resetRef])

  // The widget renders at a fixed 304x78; scale it down visually and shrink the
  // reserved height to match, since transform doesn't affect layout.
  return (
    <div className="flex justify-center" style={{ height: RECAPTCHA_HEIGHT * RECAPTCHA_SCALE }}>
      <div
        ref={containerRef}
        style={{
          width: RECAPTCHA_WIDTH,
          height: RECAPTCHA_HEIGHT,
          transform: `scale(${RECAPTCHA_SCALE})`,
          transformOrigin: 'top center',
        }}
      />
    </div>
  )
}

function ContactPage() {
  const content = useContent('contact', CONTACT_FALLBACK)
  const header = content.header ?? CONTACT_FALLBACK.header
  const formLabels = content.form ?? CONTACT_FALLBACK.form
  const settings = useSettings({ contact_details: DETAILS_FALLBACK })
  const details = settings.contact_details ?? DETAILS_FALLBACK

  // Kept live for the sticky-header drift compensation below (see the layout
  // effect): the header pins via position:sticky, but ScaleLock wraps the page
  // in transform:scale, and a sticky element under a scaled ancestor drifts down
  // by (scale-1)*scrollY instead of holding still.
  //
  // iPad portrait opts out of the shared tablet zoom lock, as About and
  // Subsidiaries do: ScaleLock would render the 430px mobile canvas at 2.38x,
  // which put a 105px title and a 948px-wide form on the page. Scale 1 also
  // makes the drift compensation below a no-op there — correct, because at
  // scale 1 the sticky header does not drift in the first place.
  const isTablet = useIsTabletPortrait()
  const zoomScale = useScale()
  const scale = isTablet ? 1 : zoomScale
  const scaleRef = useRef(scale)

  const headerRef = useRef(null)
  const cardRef = useRef(null)
  const footerRef = useRef(null)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const recaptchaReset = useRef(null)

  // Stable so the reCAPTCHA callback (bound once on mount) always sees it.
  const handleCaptcha = useCallback((token) => {
    setCaptchaToken(token)
    setErrors((prev) =>
      prev.recaptcha || prev.form ? { ...prev, recaptcha: undefined, form: undefined } : prev
    )
  }, [])

  // Clear a field's error (and any general error) as soon as the user edits it.
  const update = (key) => (e) => {
    const { value } = e.target
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((prev) =>
      prev[key] || prev.form ? { ...prev, [key]: undefined, form: undefined } : prev
    )
  }

  // Client-side validation — mirrors the backend rules so the user gets instant
  // feedback before a round-trip.
  const validate = (values) => {
    const next = {}
    if (!values.name.trim()) next.name = 'Please enter your name.'
    else if (values.name.trim().length < 2) next.name = 'Name is too short.'
    if (!values.email.trim()) next.email = 'Please enter your email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = 'Please enter a valid email address.'
    if (!values.message.trim()) next.message = 'Please enter a message.'
    else if (values.message.trim().length < 5) next.message = 'Message is too short.'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (sending || sent) return

    const clientErrors = validate(form)
    if (!captchaToken) clientErrors.recaptcha = 'Please confirm you are not a robot.'
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setErrors({})
    setSending(true)
    const res = await postContact({ ...form, recaptcha_token: captchaToken })
    setSending(false)

    // The token is single-use (consumed by the server's verification), so clear
    // it after every round-trip — the user re-checks the box for another try.
    recaptchaReset.current?.()
    setCaptchaToken('')

    if (res.ok) {
      setSent(true)
      setForm({ name: '', email: '', message: '' })
      return
    }

    // Surface Laravel 422 field errors; otherwise a generic failure message.
    if (res.status === 422 && res.data?.errors) {
      const mapped = {}
      for (const [key, msgs] of Object.entries(res.data.errors)) {
        mapped[key] = Array.isArray(msgs) ? msgs[0] : String(msgs)
      }
      setErrors(mapped)
    } else {
      setErrors({ form: 'Something went wrong. Please try again.' })
    }
  }

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate the header's children (not the sticky container itself) so
      // `position: sticky` keeps working.
      const headerItems = headerRef.current?.children ?? []
      gsap.from(headerItems, {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: cubicEase,
        stagger: 0.1,
        delay: 0.15,
      })

      gsap.from(cardRef.current, {
        y: 60,
        opacity: 0,
        duration: 1.3,
        ease: cubicEase,
        delay: 0.35,
      })

      gsap.from(footerRef.current?.querySelectorAll('[data-col]') ?? [], {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: cubicEase,
        stagger: 0.08,
        scrollTrigger: { trigger: footerRef.current, start: 'top 85%' },
      })

      // Cancel the sticky-header drift. Under transform:scale(k) the pinned
      // header renders (k-1)*scrollY lower than it should; translate it back up
      // by the same amount so it stays truly fixed. No-op at scale 1 (mobile),
      // and once the header scrolls past its section it is off-screen anyway.
      const setHeaderY = gsap.quickSetter(headerRef.current, 'y', 'px')
      const compensate = () => {
        const k = scaleRef.current
        setHeaderY(k > 1 ? (-window.scrollY * (k - 1)) / k : 0)
      }
      compensate()
      ScrollTrigger.create({ onUpdate: compensate, invalidateOnRefresh: true })
    })

    return () => ctx.revert()
  }, [])

  // Keep the compensation reading the current scale after a resize, and re-run
  // it once so the header snaps to the corrected offset immediately.
  useEffect(() => {
    scaleRef.current = scale
    if (headerRef.current) {
      const k = scale
      gsap.set(headerRef.current, {
        y: k > 1 ? (-window.scrollY * (k - 1)) / k : 0,
      })
    }
  }, [scale])

  return (
    <>
    <ScaleLock
      as="main"
      bg="bg-[#E6EBF0]"
      scale={scale}
      className="text-[#1C2D4F]"
      style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
    >
      {/* Form area — the header pins while the card scrolls up over it.
          The section's top padding matches the sticky offset so the header
          doesn't jump on first paint. */}
      <section className="relative px-4 pt-[128px] tablet:pt-[140px] md:pt-[140px] pb-[150px] tablet:pb-[107px]">
        <div
          ref={headerRef}
          className="sticky top-[128px] tablet:top-[140px] md:top-[140px] z-0 flex flex-col items-center text-center"
        >
          <span className="inline-flex items-center justify-center gap-[10px] rounded-[31px] border-[0.5px] border-[#1C2D4F] px-[9px] pb-[7px] pt-[10px] font-['Akkurat_Mono',monospace] text-[14px] font-medium leading-[1.15] tracking-[-0.28px] text-center uppercase text-[#1C2D4F] h-[24px]">
            {header.badge}
          </span>
          <h1
            className="m-0 mt-[22px] text-center text-[44px] tablet:text-[36px] md:text-[50px] font-normal leading-[1.05] tracking-[-1px] text-[#1C2D4F]"
            style={{ fontFamily: "'Season Mix VF', 'Season Mix-TRIAL', serif" }}
          >
            {header.title}
          </h1>
            <p className="m-0 mt-[22px] text-center text-[14px] tablet:text-[16px] md:text-[16px] leading-[1.15] tracking-[-0.16px] max-w-[352px] tablet:max-w-[374px] md:max-w-[374px] text-[#1C2D4F]">
            {header.subtitle}
          </p>
        </div>

        <form
          ref={cardRef}
          onSubmit={handleSubmit}
          noValidate
          // tablet: the card holds its 616px desktop width rather than scaling
          // with the page, so its padding and type stay at the desktop values —
          // a full-width card with page-ratio type would read half-empty.
          className="relative z-10 mx-auto mt-[72px] tablet:mt-[68px] md:mt-[96px] w-full max-w-[616px] rounded-[8px] bg-[#D7E0E8] px-6 py-10 tablet:min-h-[446px] tablet:px-[72px] tablet:pt-[68px] tablet:pb-[56px] md:min-h-[446px] md:px-[72px] md:pt-[68px] md:pb-[56px]"
        >
          <div className="flex flex-col gap-[40px]">
            <Field label={formLabels.nameLabel} value={form.name} onChange={update('name')} error={errors.name} />
            <Field label={formLabels.emailLabel} type="email" value={form.email} onChange={update('email')} error={errors.email} />
            <Field
              label={formLabels.messageLabel}
              value={form.message}
              onChange={update('message')}
              error={errors.message}
              multiline
            />
          </div>

          <p
            className="mx-auto mt-10 max-w-[274px] text-center text-[12px] tablet:text-[16px] md:text-[16px] font-normal leading-[1.15] tracking-[-0.01em] text-[#1C2D4F]/45"
            style={{ fontFamily: "'Season Sans-TRIAL', sans-serif" }}
          >
            By clicking send message, you acknowledge your data will be processed
            according to our{' '}
            <Link
              to="/privacy-policy"
              className="text-[#1C2D4F]/75 underline underline-offset-2"
            >
              Privacy Policy
            </Link>
          </p>

          <div className="mt-8 flex flex-col items-center">
            <Recaptcha onChange={handleCaptcha} resetRef={recaptchaReset} />
            {errors.recaptcha && (
              <p className="mt-2 text-center text-[13px] text-red-600">{errors.recaptcha}</p>
            )}
          </div>

          {errors.form && (
            <p className="mt-4 text-center text-[13px] text-red-600">{errors.form}</p>
          )}

          <div className="mt-7 flex justify-center">
            <button
              type="submit"
              disabled={sending || sent}
              aria-busy={sending ? 'true' : undefined}
              className={`inline-flex items-center gap-2 rounded-[28px] bg-navy px-8 py-5 font-['Akkurat_Mono',monospace] text-[12px] font-medium uppercase leading-[1] tracking-[0] text-[#E2EAF2] transition-opacity ${
                sending || sent ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90'
              }`}
            >
              <span className="relative top-[1px]">
                {sent
                  ? formLabels.sentLabel
                  : sending
                    ? 'Sending…'
                    : formLabels.submitLabel}
              </span>
              {sending ? (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <IoArrowForward className="text-sm" aria-hidden="true" />
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Footer — dashed grid framed as a clean closed rectangle (1168px span,
          ≈136px margins in a 1440 frame). Vertical dividers meet the top/bottom
          lines flush at the corners (no overshoot); first/last hug the left/right
          edges. Text is left-aligned; columns vertically centered. Dashes are an
          exact 2px-on / 2px-off, 1px stroke. */}
      {/* tablet: the same closed dashed rectangle as desktop, not the phone's
          two-column cross — but on three columns (see DIVIDERS_TABLET), with the
          frame inset dropped from desktop's 145px to 40px. Text is centered
          rather than left-aligned: three columns are wide enough that a
          left-aligned block leaves the cell looking half empty. */}
      <footer ref={footerRef} className="px-4 tablet:px-[40px] md:px-[145px] pb-[137px] tablet:pb-[97px]">
        {/* tablet: the vertical inset must stay exactly half the grid's row gap
            (py-10 = 40px against gap-y-20 = 80px). The row divider is painted in
            the middle of that gap, so any other ratio makes the band above row 1
            taller than the band below it and every cell's content reads low
            inside its dashed box even though it is centered in its grid cell. */}
        <div className="relative w-full py-12 tablet:py-10 md:py-16">
          {/* top + bottom frame lines — overshoot the outer verticals by 10px
              so the corners read as crossings, not closed joins */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-[16px] top-0 hidden h-px tablet:block md:block"
            style={{ backgroundImage: DASH_H }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-[16px] bottom-0 hidden h-px tablet:block md:block"
            style={{ backgroundImage: DASH_H }}
          />

          {/* mobile-only vertical center divider — the grid's two columns meet at
              50% (gap-x-0), so this line sits on the seam and crosses the row
              dividers. Tails run into the wrapper's py padding, matching the
              open cross grid in the design (no outer frame on mobile). */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px tablet:hidden md:hidden"
            style={{ backgroundImage: DASH_V }}
          />

          {/* vertical dividers — overshoot the top/bottom lines by 10px so each
              intersection crosses (desktop only); first/last hug the edges */}
          {DIVIDERS.map((left) => (
            <span
              key={left}
              aria-hidden="true"
              className="pointer-events-none absolute -top-[16px] -bottom-[16px] hidden w-px md:block"
              style={{
                ...(left === 100 ? { right: 0 } : { left: `${left}%` }),
                backgroundImage: DASH_V,
              }}
            />
          ))}

          {/* the same dividers on thirds, for the tablet three-column grid */}
          {DIVIDERS_TABLET.map((left) => (
            <span
              key={`t-${left}`}
              aria-hidden="true"
              className="pointer-events-none absolute -top-[16px] -bottom-[16px] hidden w-px tablet:block md:hidden"
              style={{
                ...(left === 100 ? { right: 0 } : { left: `${left}%` }),
                backgroundImage: DASH_V,
              }}
            />
          ))}

          <div className="grid grid-cols-2 gap-x-0 gap-y-14 tablet:grid-cols-3 tablet:gap-x-4 tablet:gap-y-20 md:grid-cols-5 md:gap-x-4 md:gap-y-0">
            {details.map((col, i) => {
              // Mobile draws a horizontal divider centered in the row gap below
              // every cell that isn't in the last row, so the two-column grid
              // reads as a cross with the center vertical line.
              const notLastRow =
                Math.floor(i / 2) < Math.ceil(details.length / 2) - 1
              // Same idea on the three-column tablet grid: the row gap between
              // the first three cards and the two below needs its own line, or
              // the bottom row reads as detached from the frame.
              const notLastRowTablet =
                Math.floor(i / 3) < Math.ceil(details.length / 3) - 1
              return (
                <div
                  key={col.label}
                  data-col
                  className="relative flex h-[213px] flex-col items-center justify-center px-4 text-center tablet:h-auto tablet:items-center tablet:px-[10px] tablet:text-center md:h-auto md:items-start md:px-[30px] md:text-left"
                >
                  {notLastRow && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 -bottom-7 h-px tablet:hidden md:hidden"
                      style={{ backgroundImage: DASH_H }}
                    />
                  )}
                  {notLastRowTablet && (
                    <span
                      aria-hidden="true"
                      // -inset-x-2 bridges the 16px column gap so the three
                      // segments read as one continuous line edge to edge.
                      className="pointer-events-none absolute -inset-x-2 -bottom-10 hidden h-px tablet:block md:hidden"
                      style={{ backgroundImage: DASH_H }}
                    />
                  )}
                  <p className="m-0 font-['Akkurat_Mono',monospace] text-[12px] font-medium uppercase leading-none text-[#8A8FA0]">
                    {col.label}
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {col.lines.map((line) => (
                      <p
                        key={line}
                        className="m-0 text-[16px] font-normal leading-none text-black"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </footer>
    </ScaleLock>
    <ContactSection />
    </>
  )
}

export default ContactPage
